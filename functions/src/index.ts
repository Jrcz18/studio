
'use server';

import { onRequest } from 'firebase-functions/v2/https';
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

// Promise that resolves when admin is ready
const adminInitPromise = getFirebaseAdmin()
  .then(admin => {
    adminDb = admin.adminDb;
    console.log('Firebase Admin initialized successfully for all endpoints.');
  })
  .catch(error => {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK:', error);
    throw error;
  });

// --- Middleware to ensure DB is initialized before any request ---
const ensureDbInitialized = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  if (!adminDb) {
    adminInitPromise
      .then(() => next())
      .catch(error => {
        console.error('Database initialization check failed:', error);
        res.status(500).json({ error: 'Failed to initialize database connection.' });
      });
  } else {
    next();
  }
};

app.use(ensureDbInitialized);

// --- Helper functions ---
async function findBookingConflict(newBooking: Omit<Booking, 'id'>): Promise<Booking | null> {
  const bookingsCollection = adminDb.collection('bookings') as CollectionReference<Booking>;
  const snapshot = await bookingsCollection
    .where('unitId', '==', newBooking.unitId)
    .where('checkoutDate', '>', newBooking.checkinDate)
    .get();

  if (snapshot.empty) return null;

  return (
    snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Booking))
      .find(booking => booking.checkinDate < newBooking.checkoutDate) || null
  );
}

async function createNotification(notificationData: Omit<AppNotification, 'id'>): Promise<string> {
  const docRef = await adminDb.collection('notifications').add(notificationData);
  return docRef.id;
}

// --- API Endpoints ---
app.post('/sendDiscordNotification', async (req, res) => {
  try {
    const result = await sendDiscordNotificationFlow(req.body);
    return res.json(result);
  } catch (error: any) {
    console.error('Error running sendDiscordNotificationFlow:', error);
    return res.status(500).json({ error: 'Something went wrong!' });
  }
});

app.post('/unit', async (req, res) => {
  try {
    const newUnit: Omit<Unit, 'id'> = req.body;
    const docRef = await adminDb.collection('units').add(newUnit);
    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error('Error creating unit:', error);
    return res.status(500).json({ error: 'Failed to create unit' });
  }
});

app.post('/agent', async (req, res) => {
  try {
    const newAgent: Omit<Agent, 'id'> = req.body;
    const docRef = await adminDb.collection('agents').add(newAgent);
    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error('Error creating agent:', error);
    return res.status(500).json({ error: 'Failed to create agent' });
  }
});

app.post('/investor', async (req, res) => {
  try {
    const newInvestor: Omit<Investor, 'id'> = req.body;
    const docRef = await adminDb.collection('investors').add(newInvestor);
    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error('Error creating investor:', error);
    return res.status(500).json({ error: 'Failed to create investor' });
  }
});

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

    const docRef = await adminDb.collection('bookings').add(newBooking);

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
        data: { bookingId: docRef.id, unitId: newBooking.unitId },
      });
    }

    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.post('/expense', async (req, res) => {
  try {
    const newExpense: Omit<Expense, 'id'> = req.body;
    const docRef = await adminDb.collection('expenses').add(newExpense);
    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return res.status(500).json({ error: 'Failed to create expense' });
  }
});

// --- Generic Error Handler ---
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  return res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// --- Export the API (Firebase v2) ---
export const api = onRequest(
  { region: 'asia-southeast1', secrets: ['SERVICE_ACCOUNT_KEY', 'DISCORD_WEBHOOK_URL'] },
  app
);
