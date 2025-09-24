
'use server';
import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { getFirebaseAdmin } from './lib/firebase-admin';
import ical from 'ical-generator';
import type { Booking, Unit, Agent, Investor } from './lib/types';
import { addNotification } from './services/notifications';
import { sendDiscordNotificationFlow } from './ai/flows/send-discord-notification';


config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// This will lazy-load and run the flow.
// It's a placeholder for a more robust flow handling system.
const runFlow = (flowName: string) => async (req: express.Request, res: express.Response) => {
    try {
        // Assume flow is exported from a file with its name kebab-cased
        const modulePath = `./ai/flows/${flowName.replace(/([A-Z])/g, "-$1").toLowerCase().substring(1)}`;
        const module = await import(modulePath);
        const flow = module[flowName];
        if (typeof flow !== 'function') {
            return res.status(404).json({ error: `Flow '${flowName}' not found.` });
        }
        const result = await flow(req.body);
        res.json(result);
    } catch (error: any) {
        console.error(`Error running flow ${flowName}:`, error);
        res.status(500).json({ error: 'Something went wrong!' });
    }
};

app.post('/sendDiscordNotification', runFlow('sendDiscordNotificationFlow'));


// Booking Creation Endpoint with Conflict Check
app.post('/booking', async (req, res) => {
    try {
        const { adminDb } = await getFirebaseAdmin();
        const newBooking = req.body as Omit<Booking, 'id'>;

        // --- Conflict Detection Logic ---
        const bookingsRef = adminDb.collection('bookings');
        const q = await bookingsRef.where('unitId', '==', newBooking.unitId).get();
        
        const existingBookings = q.docs.map(doc => doc.data() as Booking);
        const newStart = new Date(newBooking.checkinDate);
        const newEnd = new Date(newBooking.checkoutDate);

        for (const existing of existingBookings) {
            const existingStart = new Date(existing.checkinDate);
            const existingEnd = new Date(existing.checkoutDate);
            if (newStart < existingEnd && newEnd > existingStart) {
                return res.status(409).json({
                    error: 'Booking conflict',
                    message: 'The selected dates overlap with an existing booking.',
                    existingBooking: existing,
                });
            }
        }
        // --- End of Conflict Detection ---

        const docRef = await adminDb.collection('bookings').add(newBooking);
        const bookingId = docRef.id;

        // --- Notifications ---
        if (newBooking.uid) { // uid is only present for logged-in users who should get notifications
            await addNotification({
                userId: newBooking.uid,
                type: 'booking',
                title: 'New Booking Created',
                description: `Booking for ${newBooking.guestFirstName} ${newBooking.guestLastName} was successfully created.`,
                isRead: false,
                createdAt: new Date().toISOString(),
                data: { bookingId }
            });
        }
        
        await sendDiscordNotificationFlow({
            content: `📅 **New Booking!**\n\n**Guest:** ${newBooking.guestFirstName} ${newBooking.guestLastName}\n**Check-in:** ${newBooking.checkinDate}\n**Check-out:** ${newBooking.checkoutDate}\n**Amount:** ₱${newBooking.totalAmount.toLocaleString()}`
        }).catch(e => console.error("Discord notification failed for new booking:", e));

        res.status(201).json({ id: bookingId });

    } catch (error: any) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});


// Unit Creation Endpoint
app.post('/unit', async (req, res) => {
    try {
        const { adminDb } = await getFirebaseAdmin();
        const newUnit = req.body as Omit<Unit, 'id'>;
        const docRef = await adminDb.collection('units').add(newUnit);

        // --- Notifications ---
        await sendDiscordNotificationFlow({
            content: `🎉 **New Unit Added!** 🎉\n\n**Name:** ${newUnit.name}\n**Type:** ${newUnit.type}\n**Rate:** ₱${newUnit.rate.toLocaleString()}`
        }).catch(e => console.error("Discord notification failed for new unit:", e));
        
        res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating unit:', error);
        res.status(500).json({ error: 'Failed to create unit' });
    }
});

// Agent Creation Endpoint
app.post('/agent', async (req, res) => {
    try {
        const { adminDb } = await getFirebaseAdmin();
        const newAgent = req.body as Omit<Agent, 'id'>;
        const docRef = await adminDb.collection('agents').add(newAgent);
        res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating agent:', error);
        res.status(500).json({ error: 'Failed to create agent' });
    }
});

// Investor Creation Endpoint
app.post('/investor', async (req, res) => {
    try {
        const { adminDb } = await getFirebaseAdmin();
        const newInvestor = req.body as Omit<Investor, 'id'>;
        const docRef = await adminDb.collection('investors').add(newInvestor);
        res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating investor:', error);
        res.status(500).json({ error: 'Failed to create investor' });
    }
});


// Master iCal Generation Endpoint (All Units)
app.get('/ical/all', async (req, res) => {
    try {
        const { adminDb } = await getFirebaseAdmin();
        
        const unitsSnapshot = await adminDb.collection('units').get();
        const units = unitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
        const unitMap = new Map(units.map(unit => [unit.id, unit.name]));

        const bookingsSnapshot = await adminDb.collection('bookings').get();
        const bookings = bookingsSnapshot.docs.map(doc => doc.data() as Booking);

        const calendar = ical({ name: 'All Bookings - Manila Prime' });

        bookings.forEach(booking => {
            const unitName = unitMap.get(booking.unitId) || 'Unknown Unit';
            calendar.createEvent({
                start: new Date(booking.checkinDate),
                end: new Date(booking.checkoutDate),
                summary: `${unitName}: ${booking.guestFirstName} ${booking.guestLastName}`,
                description: `Guests: ${booking.adults} adults, ${booking.children} children. Status: ${booking.paymentStatus}`,
            });
        });
        
        res.setHeader('Content-Type', 'text/calendar;charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="master_calendar.ics"`);
        res.send(calendar.toString());

    } catch (error: any) {
        console.error("Failed to generate master iCal feed:", error);
        res.status(500).send("Error generating master iCal feed.");
    }
});


// iCal Generation Endpoint (Per Unit)
app.get('/ical/:unitId', async (req, res) => {
    try {
        const { unitId } = req.params;
        const { adminDb } = await getFirebaseAdmin();

        const unitDoc = await adminDb.collection('units').doc(unitId).get();
        if (!unitDoc.exists) {
            return res.status(404).send('Unit not found');
        }
        const unit = unitDoc.data() as Unit;

        const bookingsSnapshot = await adminDb.collection('bookings').where('unitId', '==', unitId).get();
        const bookings = bookingsSnapshot.docs.map(doc => doc.data() as Booking);

        const calendar = ical({ name: `${unit.name} Bookings` });

        bookings.forEach(booking => {
            calendar.createEvent({
                start: new Date(booking.checkinDate),
                end: new Date(booking.checkoutDate),
                summary: `Booking for ${booking.guestFirstName} ${booking.guestLastName}`,
                description: `Guests: ${booking.adults} adults, ${booking.children} children. Status: ${booking.paymentStatus}`,
            });
        });

        res.setHeader('Content-Type', 'text/calendar;charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="calendar.ics"`);
        res.send(calendar.toString());

    } catch (error: any) {
        console.error("Failed to generate iCal feed:", error);
        res.status(500).send("Error generating iCal feed.");
    }
});


app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

export const api = functions.region('asia-southeast1').https.onRequest(app);
