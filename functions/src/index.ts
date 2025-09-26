
'use server';

import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { sendDiscordNotificationFlow } from './ai/flows/send-discord-notification';
import { getFirebaseAdmin } from './lib/firebase-admin';
import type { CollectionReference, DocumentData } from 'firebase-admin/firestore';
import type { Booking, Unit, AppNotification, Agent, Investor, Expense } from './lib/types';

config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- Firebase Admin SDK Initialization ---
let adminDb: FirebaseFirestore.Firestore;
try {
  ({ adminDb } = getFirebaseAdmin());
  console.log('Firebase Admin initialized successfully.');
} catch (error) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK:', error);
    // Exit the process if the admin SDK fails to initialize.
    // This prevents the function from running in a broken state.
    process.exit(1);
}


// --- Helper functions ---

// Generic function to get a collection
async function getCollection(collectionName: string): Promise<DocumentData[]> {
    const snapshot = await adminDb.collection(collectionName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

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

// --- Units API ---
app.get('/units', async (req, res) => {
    try {
        const units = await getCollection('units');
        return res.status(200).json(units);
    } catch (error: any) {
        console.error('Error fetching units:', error);
        return res.status(500).json({ error: 'Failed to fetch units' });
    }
});

app.get('/unit/:unitId', async (req, res) => {
    try {
        const { unitId } = req.params;
        const docRef = adminDb.collection('units').doc(unitId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return res.status(200).json({ id: docSnap.id, ...docSnap.data() });
        } else {
            return res.status(404).json({ error: 'Unit not found' });
        }
    } catch (error: any) {
        console.error('Error fetching unit:', error);
        return res.status(500).json({ error: 'Failed to fetch unit' });
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

app.put('/unit/:unitId', async (req, res) => {
    try {
        const { unitId } = req.params;
        const unitData: Partial<Unit> = req.body;
        await adminDb.collection('units').doc(unitId).update(unitData);
        return res.status(200).json({ message: 'Unit updated successfully' });
    } catch (error: any) {
        console.error('Error updating unit:', error);
        return res.status(500).json({ error: 'Failed to update unit' });
    }
});

app.delete('/unit/:unitId', async (req, res) => {
    try {
        const { unitId } = req.params;
        if (!unitId) {
            return res.status(400).json({ error: 'Unit ID is required' });
        }
        await adminDb.collection('units').doc(unitId).delete();
        return res.status(200).json({ message: 'Unit deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting unit:', error);
        return res.status(500).json({ error: 'Failed to delete unit' });
    }
});


// --- Agents API ---
app.get('/agents', async (req, res) => {
    try {
        const agents = await getCollection('agents');
        return res.status(200).json(agents);
    } catch (error: any) {
        console.error('Error fetching agents:', error);
        return res.status(500).json({ error: 'Failed to fetch agents' });
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

app.put('/agent/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        const agentData: Partial<Agent> = req.body;
        await adminDb.collection('agents').doc(agentId).update(agentData);
        return res.status(200).json({ message: 'Agent updated successfully' });
    } catch (error: any) {
        console.error('Error updating agent:', error);
        return res.status(500).json({ error: 'Failed to update agent' });
    }
});

app.delete('/agent/:agentId', async (req, res) => {
    try {
        const { agentId } = req.params;
        if (!agentId) {
            return res.status(400).json({ error: 'Agent ID is required' });
        }
        await adminDb.collection('agents').doc(agentId).delete();
        return res.status(200).json({ message: 'Agent deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting agent:', error);
        return res.status(500).json({ error: 'Failed to delete agent' });
    }
});

// --- Investors API ---
app.get('/investors', async (req, res) => {
    try {
        const investors = await getCollection('investors');
        return res.status(200).json(investors);
    } catch (error: any) {
        console.error('Error fetching investors:', error);
        return res.status(500).json({ error: 'Failed to fetch investors' });
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

app.put('/investor/:investorId', async (req, res) => {
    try {
        const { investorId } = req.params;
        const investorData: Partial<Investor> = req.body;
        await adminDb.collection('investors').doc(investorId).update(investorData);
        return res.status(200).json({ message: 'Investor updated successfully' });
    } catch (error: any) {
        console.error('Error updating investor:', error);
        return res.status(500).json({ error: 'Failed to update investor' });
    }
});

app.delete('/investor/:investorId', async (req, res) => {
    try {
        const { investorId } = req.params;
        if (!investorId) {
            return res.status(400).json({ error: 'Investor ID is required' });
        }
        await adminDb.collection('investors').doc(investorId).delete();
        return res.status(200).json({ message: 'Investor deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting investor:', error);
        return res.status(500).json({ error: 'Failed to delete investor' });
    }
});

// --- Bookings API ---
app.get('/bookings', async (req, res) => {
    try {
        const bookings = await getCollection('bookings');
        return res.status(200).json(bookings);
    } catch (error: any) {
        console.error('Error fetching bookings:', error);
        return res.status(500).json({ error: 'Failed to fetch bookings' });
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

    // Optional: Send a discord notification on new booking
    try {
        const unitDoc = await adminDb.collection("units").doc(newBooking.unitId).get();
        const unitName = unitDoc.exists ? unitDoc.data()?.name : "Unknown unit";
        await sendDiscordNotificationFlow({
            content: `📅 New booking confirmed!\nUnit: ${unitName}\nGuest: ${newBooking.guestFirstName}\nFrom: ${newBooking.checkinDate} To: ${newBooking.checkoutDate}`,
            username: "Booking Bot"
        });
    } catch (notificationError) {
        console.error("Failed to send Discord notification for new booking:", notificationError);
        // Do not block the booking creation if notification fails
    }


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

app.put('/booking/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const bookingData: Partial<Booking> = req.body;
        await adminDb.collection('bookings').doc(bookingId).update(bookingData);
        return res.status(200).json({ message: 'Booking updated successfully' });
    } catch (error: any) {
        console.error('Error updating booking:', error);
        return res.status(500).json({ error: 'Failed to create booking' });
    }
});

app.delete('/booking/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        if (!bookingId) {
            return res.status(400).json({ error: 'Booking ID is required' });
        }
        await adminDb.collection('bookings').doc(bookingId).delete();
        return res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting booking:', error);
        return res.status(500).json({ error: 'Failed to delete booking' });
    }
});


// --- Expenses API ---
app.get('/expenses', async (req, res) => {
    try {
        const expenses = await getCollection('expenses');
        return res.status(200).json(expenses);
    } catch (error: any) {
        console.error('Error fetching expenses:', error);
        return res.status(500).json({ error: 'Failed to fetch expenses' });
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

app.put('/expense/:expenseId', async (req, res) => {
    try {
        const { expenseId } = req.params;
        const expenseData: Partial<Expense> = req.body;
        await adminDb.collection('expenses').doc(expenseId).update(expenseData);
        return res.status(200).json({ message: 'Expense updated successfully' });
    } catch (error: any) {
        console.error('Error updating expense:', error);
        return res.status(500).json({ error: 'Failed to create expense' });
    }
});

app.delete('/expense/:expenseId', async (req, res) => {
    try {
        const { expenseId } = req.params;
        if (!expenseId) {
            return res.status(400).json({ error: 'Expense ID is required' });
        }
        await adminDb.collection('expenses').doc(expenseId).delete();
        return res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting expense:', error);
        return res.status(500).json({ error: 'Failed to delete expense' });
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
