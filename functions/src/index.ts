
'use server';
import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { sendDiscordNotificationFlow } from './ai/flows/send-discord-notification';
import { getFirebaseAdmin } from './lib/firebase-admin';
import type { CollectionReference } from 'firebase-admin/firestore';
import type { Booking, Unit, AppNotification, Agent, Investor, Expense } from './lib/types';


config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- Firebase Admin SDK Initialization ---
let adminDb: FirebaseFirestore.Firestore;
// This promise will be awaited by middleware to ensure the DB is ready.
const adminInitPromise = getFirebaseAdmin().then(admin => {
    adminDb = admin.adminDb;
    console.log('Firebase Admin initialized successfully for all endpoints.');
}).catch(error => {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK:', error);
    // This will cause the function to fail deployment or execution if the admin SDK is not configured, which is a safe failure mode.
    process.exit(1); 
});

// --- Middleware to ensure DB is initialized before any request ---
const ensureDbInitialized = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
        if (!adminDb) {
            await adminInitPromise; // Wait for the initialization promise to resolve
        }
        next(); // Proceed to the actual route handler
    } catch (error) {
         console.error('Database initialization check failed:', error);
         return res.status(500).json({ error: 'Failed to initialize database connection.' });
    }
};

// Apply the middleware to all routes in the Express app
app.use(ensureDbInitialized);


// Helper function to check for booking conflicts
async function findBookingConflict(newBooking: Omit<Booking, 'id'>): Promise<Booking | null> {
    const bookingsCollection = adminDb.collection('bookings') as CollectionReference<Booking>;
    
    // Find bookings for the same unit where the existing one's checkout is after the new one's check-in
    const query1 = bookingsCollection
        .where('unitId', '==', newBooking.unitId)
        .where('checkoutDate', '>', newBooking.checkinDate);
    
    const snapshot = await query1.get();

    if (snapshot.empty) {
        return null; // No potential conflicts
    }

    // Now, among the potential conflicts, find one where the existing one's check-in is before the new one's checkout
    // This covers all overlap scenarios.
    const conflictingBooking = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Booking))
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


// --- API ENDPOINTS ---

// Handle Discord Notification Flow
app.post('/sendDiscordNotification', async (req, res) => {
    try {
        const result = await sendDiscordNotificationFlow(req.body);
        return res.json(result);
    } catch (error: any) {
        console.error('Error running sendDiscordNotificationFlow:', error);
        return res.status(500).json({ error: 'Something went wrong!' });
    }
});


// Handle Unit Creation
app.post('/unit', async (req, res) => {
    try {
        const newUnit: Omit<Unit, 'id'> = req.body;
        const unitsCollection = adminDb.collection('units');
        const docRef = await unitsCollection.add(newUnit);
        return res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating unit:', error);
        return res.status(500).json({ error: 'Failed to create unit' });
    }
});

// Handle Agent Creation
app.post('/agent', async (req, res) => {
    try {
        const newAgent: Omit<Agent, 'id'> = req.body;
        const agentsCollection = adminDb.collection('agents');
        const docRef = await agentsCollection.add(newAgent);
        return res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating agent:', error);
        return res.status(500).json({ error: 'Failed to create agent' });
    }
});


// Handle Investor Creation
app.post('/investor', async (req, res) => {
    try {
        const newInvestor: Omit<Investor, 'id'> = req.body;
        const investorsCollection = adminDb.collection('investors');
        const docRef = await investorsCollection.add(newInvestor);
        return res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating investor:', error);
        return res.status(500).json({ error: 'Failed to create investor' });
    }
});


// Handle Booking Creation
app.post('/booking', async (req, res) => {
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
        
        return res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating booking:', error);
        return res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Handle Expense Creation
app.post('/expense', async (req, res) => {
    try {
        const newExpense: Omit<Expense, 'id'> = req.body;
        const expensesCollection = adminDb.collection('expenses');
        const docRef = await expensesCollection.add(newExpense);
        return res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating expense:', error);
        return res.status(500).json({ error: 'Failed to create expense' });
    }
});

// Generic Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    return res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Export the API
export const api = functions.region('asia-southeast1').https.onRequest(app);
