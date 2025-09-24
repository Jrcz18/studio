
'use server';
import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { sendDiscordNotificationFlow } from './ai/flows/send-discord-notification';
import { getFirebaseAdmin } from './lib/firebase-admin';
import { CollectionReference } from 'firebase-admin/firestore';
import type { Booking, Unit, AppNotification, Agent, Investor, Expense } from './lib/types';


config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Firebase Admin SDK
let adminDb: FirebaseFirestore.Firestore;
getFirebaseAdmin().then(admin => {
    adminDb = admin.adminDb;
    console.log('Firebase Admin initialized for endpoints.');
}).catch(error => {
    console.error('Failed to initialize Firebase Admin:', error);
});


// Helper function to check for booking conflicts
async function findBookingConflict(newBooking: Omit<Booking, 'id'>): Promise<Booking | null> {
    const bookingsCollection = adminDb.collection('bookings') as CollectionReference<Booking>;
    const q = bookingsCollection
        .where('unitId', '==', newBooking.unitId)
        .where('checkoutDate', '>', newBooking.checkinDate);

    const snapshot = await q.get();
    if (snapshot.empty) {
        return null; // No potential conflicts
    }

    // Now check the remaining condition in memory
    const conflictingBooking = snapshot.docs
        .map(doc => doc.data())
        .find(booking => booking.checkinDate < newBooking.checkoutDate);

    return conflictingBooking || null;
}

// Add a notification helper
async function createNotification(notificationData: Omit<AppNotification, 'id'>): Promise<string> {
    const docRef = await adminDb.collection('notifications').add({
        ...notificationData,
    });
    return docRef.id;
}


// Handle Discord Notification Flow
app.post('/sendDiscordNotification', async (req, res) => {
    if (!adminDb) {
        return res.status(500).json({ error: 'Database not initialized.' });
    }
    try {
        const result = await sendDiscordNotificationFlow(req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Error running sendDiscordNotificationFlow:', error);
        res.status(500).json({ error: 'Something went wrong!' });
    }
});


// Handle Unit Creation
app.post('/unit', async (req, res) => {
    if (!adminDb) {
        return res.status(500).json({ error: 'Database not initialized.' });
    }
    try {
        const newUnit: Omit<Unit, 'id'> = req.body;
        const unitsCollection = adminDb.collection('units');
        const docRef = await unitsCollection.add(newUnit);
        res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating unit:', error);
        res.status(500).json({ error: 'Failed to create unit' });
    }
});

// Handle Agent Creation
app.post('/agent', async (req, res) => {
    if (!adminDb) {
        return res.status(500).json({ error: 'Database not initialized.' });
    }
    try {
        const newAgent: Omit<Agent, 'id'> = req.body;
        const agentsCollection = adminDb.collection('agents');
        const docRef = await agentsCollection.add(newAgent);
        res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating agent:', error);
        res.status(500).json({ error: 'Failed to create agent' });
    }
});


// Handle Investor Creation
app.post('/investor', async (req, res) => {
    if (!adminDb) {
        return res.status(500).json({ error: 'Database not initialized.' });
    }
    try {
        const newInvestor: Omit<Investor, 'id'> = req.body;
        const investorsCollection = adminDb.collection('investors');
        const docRef = await investorsCollection.add(newInvestor);
        res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating investor:', error);
        res.status(500).json({ error: 'Failed to create investor' });
    }
});


// Handle Booking Creation
app.post('/booking', async (req, res) => {
    if (!adminDb) {
        return res.status(500).json({ error: 'Database not initialized.' });
    }
    try {
        const newBooking: Omit<Booking, 'id'> = req.body;

        const conflict = await findBookingConflict(newBooking);
        if (conflict) {
            return res.status(409).json({
                error: 'Booking conflict detected.',
                existingBooking: conflict,
            });
        }

        const bookingsCollection = adminDb.collection('bookings');
        const docRef = await bookingsCollection.add(newBooking);
        
        // Create a notification for the user who made the booking
        if (newBooking.uid) {
            const unitDoc = await adminDb.collection('units').doc(newBooking.unitId).get();
            const unitName = unitDoc.data()?.name || 'the unit';
            
            await createNotification({
                userId: newBooking.uid,
                type: 'booking',
                title: 'Booking Confirmed!',
                description: `Your booking for ${unitName} from ${newBooking.checkinDate} to ${newBooking.checkoutDate} is confirmed.`,
                createdAt: new Date().toISOString(),
                isRead: false,
                data: { bookingId: docRef.id, unitId: newBooking.unitId }
            });
        }
        
        res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Handle Expense Creation
app.post('/expense', async (req, res) => {
    if (!adminDb) {
        return res.status(500).json({ error: 'Database not initialized.' });
    }
    try {
        const newExpense: Omit<Expense, 'id'> = req.body;
        const expensesCollection = adminDb.collection('expenses');
        const docRef = await expensesCollection.add(newExpense);
        res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating expense:', error);
        res.status(500).json({ error: 'Failed to create expense' });
    }
});


app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

const functionsV1 = functions.region('asia-southeast1');
export const api = functionsV1.https.onRequest(app);
