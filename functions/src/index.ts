
'use server';
import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { getFirebaseAdmin } from './lib/firebase-admin';
import ical from 'ical-generator';
import type { Booking, Unit } from './lib/types';


config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Helper to dynamically import and handle flows
const handleFlow = (flowName: string, modulePath: string) => async (req: express.Request, res: express.Response) => {
    try {
        const module = await import(modulePath);
        const flow = module[flowName];
        if (typeof flow !== 'function') {
            throw new Error(`Flow '${flowName}' not found or not a function in module '${modulePath}'.`);
        }
        const result = await flow(req.body);
        res.json(result);
    } catch (error: any) {
        console.error(`Error handling flow '${flowName}':`, error);
        res.status(500).json({ error: 'Something went wrong!', message: error.message });
    }
};

// Define endpoints using the lazy-loading helper
app.post('/chat', handleFlow('chatFlow', './ai/flows/chat'));
app.post('/analyzeExpense', handleFlow('expenseAnalysisFlow', './ai/flows/expense-analyzer'));
app.post('/resolveConflict', handleFlow('resolveConflictFlow', './ai/flows/resolve-conflict'));
app.post('/generateReportSummary', handleFlow('generateReportSummaryFlow', './ai/flows/report-summary'));
app.post('/generateAgentReportSummary', handleFlow('generateAgentReportSummaryFlow', './ai/flows/agent-report-summary'));
app.post('/generateInvestorReportSummary', handleFlow('generateInvestorReportSummaryFlow', './ai/flows/investor-report-summary'));
app.post('/generateUnitHealthReport', handleFlow('generateUnitHealthReportFlow', './ai/flows/generate-unit-health-report'));
app.post('/sendAdminBookingNotification', handleFlow('sendAdminNotificationFlow', './ai/flows/send-admin-notification'));
app.post('/sendDiscordNotification', handleFlow('sendDiscordNotificationFlow', './ai/flows/send-discord-notification'));


// Unit Creation Endpoint
app.post('/unit', async (req, res) => {
    try {
        const { adminDb } = await getFirebaseAdmin();
        const newUnit = req.body;
        const docRef = await adminDb.collection('units').add(newUnit);
        res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating unit:', error);
        res.status(500).json({ error: 'Failed to create unit' });
    }
});


// iCal Generation Endpoint
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

