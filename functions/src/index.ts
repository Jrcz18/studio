
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
let adminDb: FirebaseFirestore.Firestore | undefined;

// This promise resolves when the admin SDK is ready.
const adminInitPromise = getFirebaseAdmin()
  .then(admin => {
    adminDb = admin.adminDb;
    console.log('Firebase Admin initialized successfully.');
    return adminDb;
  })
  .catch(error => {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK:', error);
    // Exit the process if the admin SDK fails to initialize.
    // This prevents the function from running in a broken state.
    process.exit(1);
  });

// --- Middleware to ensure DB is initialized before any request ---
const ensureDbInitialized = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  if (!adminDb) {
    adminInitPromise
      .then(() => {
        if (adminDb) {
          next();
        } else {
          // This case should theoretically not be reached if process.exit(1) works.
          res.status(500).json({ error: 'Database not available after initialization attempt.' });
        }
      })
      .catch(error => {
        console.error('Database initialization check failed during request:', error);
        res.status(500).json({ error: 'Failed to initialize database connection.' });
      });
  } else {
    next();
  }
};

// Apply the middleware to all routes
app.use(ensureDbInitialized);


// --- Helper functions ---
async function findBookingConflict(newBooking: Omit<Booking, 'id'>): Promise<Booking | null> {
  const bookingsCollection = adminDb!.collection('bookings') as CollectionReference<Booking>;
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
  const docRef = await adminDb!.collection('notifications').add(notificationData);
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
    const docRef = await adminDb!.collection('units').add(newUnit);
    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error('Error creating unit:', error);
    return res.status(500).json({ error: 'Failed to create unit' });
  }
});

app.delete('/unit/:unitId', async (req, res) => {
    try {
        const { unitId } = req.params;
        if (!unitId) {
            return res.status(400).json({ error: 'Unit ID is required' });
        }
        await adminDb!.collection('units').doc(unitId).delete();
        return res.status(200).json({ message: 'Unit deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting unit:', error);
        return res.status(500).json({ error: 'Failed to delete unit' });
    }
});


app.post('/agent', async (req, res) => {
  try {
    const newAgent: Omit<Agent, 'id'> = req.body;
    const docRef = await adminDb!.collection('agents').add(newAgent);
    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error('Error creating agent:', error);
    return res.status(500).json({ error: 'Failed to create agent' });
  }
});

app.post('/investor', async (req, res) => {
  try {
    const newInvestor: Omit<Investor, 'id'> = req.body;
    const docRef = await adminDb!.collection('investors').add(newInvestor);
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

    const docRef = await adminDb!.collection('bookings').add(newBooking);

    // Optional: Send a discord notification on new booking
    try {
        const unitDoc = await adminDb!.collection("units").doc(newBooking.unitId).get();
        const unitName = unitDoc.exists ? unitDoc.data()?.name : "Unknown unit";
        await sendDiscordNotificationFlow({
            content: `📅 New booking confirmed!\nUnit: ${unitName}\nGuest: ${newBooking.guestFirstName}\nFrom: ${newBooking.checkinDate} To: ${newBooking.checkoutDate}`,
        });
    } catch (notificationError) {
        console.error("Failed to send Discord notification for new booking:", notificationError);
        // Do not block the booking creation if notification fails
    }


    if (newBooking.uid) {
      const unitDoc = await adminDb!.collection('units').doc(newBooking.unitId).get();
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
    const docRef = await adminDb!.collection('expenses').add(newExpense);
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
