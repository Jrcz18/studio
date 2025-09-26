
'use server';

import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { sendDiscordNotificationFlow } from './ai/flows/send-discord-notification';
import { getFirebaseAdmin } from './lib/firebase-admin';
import type {
  Booking,
  Unit,
  AppNotification,
  Agent,
  Investor,
  Expense,
  Reminder,
  UnitIncident,
  ProfitPayment,
  ReceiptSettings,
} from './lib/types';

// Load .env locally (not in production)
if (process.env.NODE_ENV !== 'production') {
  config();
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Lazy Firebase DB getter to support runtime secrets
function getDb() {
  return getFirebaseAdmin().adminDb;
}

// --- Helper functions ---
async function getCollection<T>(collectionName: string): Promise<T[]> {
  const adminDb = getDb();
  const snapshot = await adminDb.collection(collectionName).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as T) }));
}

async function findBookingConflict(newBooking: Omit<Booking, 'id'>): Promise<Booking | null> {
  const adminDb = getDb();
  const snapshot = await adminDb
    .collection('bookings')
    .where('unitId', '==', newBooking.unitId)
    .where('checkoutDate', '>', newBooking.checkinDate)
    .get();

  if (snapshot.empty) return null;

  return (
    snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Booking) }))
      .find((booking) => booking.checkinDate < newBooking.checkoutDate) || null
  );
}

// --- Units API ---
app.get('/units', async (req, res) => {
  try {
    const units = await getCollection<Unit>('units');
    return res.status(200).json(units);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch units' });
  }
});

app.get('/unit/:unitId', async (req, res) => {
  try {
    const adminDb = getDb();
    const docSnap = await adminDb.collection('units').doc(req.params.unitId).get();
    if (!docSnap.exists) return res.status(404).json({ error: 'Unit not found' });
    return res.status(200).json({ id: docSnap.id, ...(docSnap.data() as Unit) });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch unit' });
  }
});

app.post('/unit', async (req, res) => {
  try {
    const adminDb = getDb();
    const newUnit: Omit<Unit, 'id'> = req.body;
    const docRef = await adminDb.collection('units').add(newUnit);
    return res.status(201).json({ id: docRef.id });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create unit' });
  }
});

app.put('/unit/:unitId', async (req, res) => {
  try {
    const adminDb = getDb();
    const unitData: Partial<Unit> = req.body;
    await adminDb.collection('units').doc(req.params.unitId).update(unitData);
    return res.status(200).json({ message: 'Unit updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update unit' });
  }
});

app.delete('/unit/:unitId', async (req, res) => {
  try {
    const adminDb = getDb();
    await adminDb.collection('units').doc(req.params.unitId).delete();
    return res.status(200).json({ message: 'Unit deleted successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete unit' });
  }
});

// --- Agents API ---
app.get('/agents', async (req, res) => {
  try {
    const agents = await getCollection<Agent>('agents');
    return res.status(200).json(agents);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

app.post('/agent', async (req, res) => {
  try {
    const adminDb = getDb();
    const newAgent: Omit<Agent, 'id'> = req.body;
    const docRef = await adminDb.collection('agents').add(newAgent);
    return res.status(201).json({ id: docRef.id });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create agent' });
  }
});

app.put('/agent/:agentId', async (req, res) => {
  try {
    const adminDb = getDb();
    const agentData: Partial<Agent> = req.body;
    await adminDb.collection('agents').doc(req.params.agentId).update(agentData);
    return res.status(200).json({ message: 'Agent updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update agent' });
  }
});

app.delete('/agent/:agentId', async (req, res) => {
  try {
    const adminDb = getDb();
    await adminDb.collection('agents').doc(req.params.agentId).delete();
    return res.status(200).json({ message: 'Agent deleted successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// --- Investors API ---
app.get('/investors', async (req, res) => {
  try {
    const investors = await getCollection<Investor>('investors');
    return res.status(200).json(investors);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch investors' });
  }
});

app.post('/investor', async (req, res) => {
  try {
    const adminDb = getDb();
    const newInvestor: Omit<Investor, 'id'> = req.body;
    const docRef = await adminDb.collection('investors').add(newInvestor);
    return res.status(201).json({ id: docRef.id });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create investor' });
  }
});

app.put('/investor/:investorId', async (req, res) => {
  try {
    const adminDb = getDb();
    const investorData: Partial<Investor> = req.body;
    await adminDb.collection('investors').doc(req.params.investorId).update(investorData);
    return res.status(200).json({ message: 'Investor updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update investor' });
  }
});

app.delete('/investor/:investorId', async (req, res) => {
  try {
    const adminDb = getDb();
    await adminDb.collection('investors').doc(req.params.investorId).delete();
    return res.status(200).json({ message: 'Investor deleted successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete investor' });
  }
});

// --- Bookings API ---
app.get('/bookings', async (req, res) => {
  try {
    const bookings = await getCollection<Booking>('bookings');
    return res.status(200).json(bookings);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/booking', async (req, res) => {
  try {
    const adminDb = getDb();
    const newBooking: Omit<Booking, 'id'> = req.body;

    const conflict = await findBookingConflict(newBooking);
    if (conflict)
      return res.status(409).json({ error: 'Booking conflict detected.', existingBooking: conflict });

    const docRef = await adminDb.collection('bookings').add(newBooking);

    // Discord notification
    try {
      const unitDoc = await adminDb.collection('units').doc(newBooking.unitId).get();
      const unitName = unitDoc.exists ? unitDoc.data()?.name : 'Unknown unit';
      await sendDiscordNotificationFlow({
        content: `📅 New booking confirmed!\nUnit: ${unitName}\nGuest: ${newBooking.guestFirstName}\nFrom: ${newBooking.checkinDate} To: ${newBooking.checkoutDate}`,
        username: 'Booking Bot',
      });
    } catch (e) {
      console.error('Discord notification failed:', e);
    }

    // Optional app notification
    if (newBooking.uid) {
      const unitDoc = await adminDb.collection('units').doc(newBooking.unitId).get();
      const unitName = unitDoc.data()?.name || 'the unit';
      await adminDb.collection('notifications').add({
        userId: newBooking.uid,
        type: 'booking',
        title: 'Booking Confirmed!',
        description: `Your booking for ${unitName} from ${newBooking.checkinDate} to ${newBooking.checkoutDate} is confirmed.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        data: { bookingId: docRef.id, unitId: newBooking.unitId },
      } as Omit<AppNotification, 'id'>);
    }

    return res.status(201).json({ id: docRef.id });
  } catch (err: any)_DELETE
    console.error(err);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.put('/booking/:bookingId', async (req, res) => {
  try {
    const adminDb = getDb();
    const bookingData: Partial<Booking> = req.body;
    await adminDb.collection('bookings').doc(req.params.bookingId).update(bookingData);
    return res.status(200).json({ message: 'Booking updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.delete('/booking/:bookingId', async (req, res) => {
  try {
    const adminDb = getDb();
    await adminDb.collection('bookings').doc(req.params.bookingId).delete();
    return res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// --- Expenses API ---
app.get('/expenses', async (req, res) => {
  try {
    const expenses = await getCollection<Expense>('expenses');
    return res.status(200).json(expenses);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

app.post('/expense', async (req, res) => {
  try {
    const adminDb = getDb();
    const newExpense: Omit<Expense, 'id'> = req.body;
    const docRef = await adminDb.collection('expenses').add(newExpense);
    return res.status(201).json({ id: docRef.id });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create expense' });
  }
});

app.put('/expense/:expenseId', async (req, res) => {
  try {
    const adminDb = getDb();
    const expenseData: Partial<Expense> = req.body;
    await adminDb.collection('expenses').doc(req.params.expenseId).update(expenseData);
    return res.status(200).json({ message: 'Expense updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update expense' });
  }
});

app.delete('/expense/:expenseId', async (req, res) => {
  try {
    const adminDb = getDb();
    await adminDb.collection('expenses').doc(req.params.expenseId).delete();
    return res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// --- Reminders API ---
app.get('/reminders', async (req, res) => {
  try {
    const reminders = await getCollection<Reminder>('reminders');
    return res.status(200).json(reminders);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

app.post('/reminder', async (req, res) => {
  try {
    const adminDb = getDb();
    const newReminder: Omit<Reminder, 'id'> = req.body;
    const docRef = await adminDb.collection('reminders').add(newReminder);
    return res.status(201).json({ id: docRef.id });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create reminder' });
  }
});

app.put('/reminder/:reminderId', async (req, res) => {
  try {
    const adminDb = getDb();
    const reminderData: Partial<Reminder> = req.body;
    await adminDb.collection('reminders').doc(req.params.reminderId).update(reminderData);
    return res.status(200).json({ message: 'Reminder updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update reminder' });
  }
});

app.delete('/reminder/:reminderId', async (req, res) => {
  try {
    const adminDb = getDb();
    await adminDb.collection('reminders').doc(req.params.reminderId).delete();
    return res.status(200).json({ message: 'Reminder deleted successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// --- Notifications API ---
app.get('/notifications/:userId', async (req, res) => {
  try {
    const adminDb = getDb();
    const snapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', req.params.userId)
      .get();

    const notifications: AppNotification[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as AppNotification),
      createdAt: doc.data().createdAt || new Date().toISOString(),
    }));

    return res.status(200).json(
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/notification', async (req, res) => {
  try {
    const adminDb = getDb();
    const newNotification: Omit<AppNotification, 'id'> = req.body;
    const docRef = await adminDb.collection('notifications').add(newNotification);
    return res.status(201).json({ id: docRef.id });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create notification' });
  }
});

app.put('/notification/:notificationId/read', async (req, res) => {
  try {
    const adminDb = getDb();
    await adminDb.collection('notifications').doc(req.params.notificationId).update({ isRead: true });
    return res.status(200).json({ message: 'Notification marked as read' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

app.post('/notifications/:userId/mark-all-read', async (req, res) => {
  try {
    const adminDb = getDb();
    const snapshot = await adminDb
      .collection('notifications')
      .where('userId', '==', req.params.userId)
      .where('isRead', '==', false)
      .get();

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { isRead: true }));
    await batch.commit();

    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

app.delete('/notification/:notificationId', async (req, res) => {
  try {
    const adminDb = getDb();
    await adminDb.collection('notifications').doc(req.params.notificationId).delete();
    return res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// --- Incidents API ---
app.get('/incidents/:unitId', async (req, res) => {
  try {
    const adminDb = getDb();
    const { unitId } = req.params;
    const { daysAgo } = req.query;

    let query: FirebaseFirestore.Query = adminDb.collection('incidents').where('unitId', '==', unitId);

    if (daysAgo) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - Number(daysAgo));
      query = query.where('date', '>=', pastDate.toISOString().split('T')[0]);
    }

    const snapshot = await query.orderBy('date', 'desc').get();
    const incidents: UnitIncident[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as UnitIncident),
    }));

    return res.status(200).json(incidents);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

app.post('/incident', async (req, res) => {
  try {
    const adminDb = getDb();
    const newIncident: Omit<UnitIncident, 'id'> = req.body;
    const docRef = await adminDb.collection('incidents').add(newIncident);
    return res.status(201).json({ id: docRef.id });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create incident' });
  }
});

app.put('/incident/:incidentId', async (req, res) => {
  try {
    const adminDb = getDb();
    const incidentData: Partial<UnitIncident> = req.body;
    await adminDb.collection('incidents').doc(req.params.incidentId).update(incidentData);
    return res.status(200).json({ message: 'Incident updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update incident' });
  }
});

app.delete('/incident/:incidentId', async (req, res) => {
  try {
    const adminDb = getDb();
    await adminDb.collection('incidents').doc(req.params.incidentId).delete();
    return res.status(200).json({ message: 'Incident deleted successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to delete incident' });
  }
});


// --- Profit Payments API ---
app.get('/profit-payments', async (req, res) => {
    try {
        const payments = await getCollection<ProfitPayment>('profit-payments');
        return res.status(200).json(payments);
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch profit payments' });
    }
});

app.post('/profit-payment', async (req, res) => {
    try {
        const adminDb = getDb();
        const newPayment: Omit<ProfitPayment, 'id'> = req.body;
        const docRef = await adminDb.collection('profit-payments').add(newPayment);
        return res.status(201).json({ id: docRef.id });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create profit payment' });
    }
});


// --- Receipt Settings API ---
app.get('/receipt-settings', async (req, res) => {
    try {
        const adminDb = getDb();
        const docSnap = await adminDb.collection('config').doc('receiptSettings').get();
        if (!docSnap.exists) {
            // Return default settings if not found
            return res.status(200).json({
                wifiNetwork: 'Manila Prime WiFi',
                contactEmail: 'primestaycation24@gmail.com',
                checkinTime: '15:00',
                checkoutTime: '11:00'
            });
        }
        return res.status(200).json(docSnap.data());
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch receipt settings' });
    }
});

app.post('/receipt-settings', async (req, res) => {
    try {
        const adminDb = getDb();
        const settings: Partial<ReceiptSettings> = req.body;
        await adminDb.collection('config').doc('receiptSettings').set(settings, { merge: true });
        return res.status(200).json({ message: 'Receipt settings updated successfully' });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update receipt settings' });
    }
});


// --- Discord Notification Endpoint ---
app.post('/sendDiscordNotification', async (req, res) => {
  try {
    const input = req.body; // { content, username?, avatar_url? }
    const result = await sendDiscordNotificationFlow(input);
    return res.status(result.success ? 200 : 500).json(result);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send Discord notification' });
  }
});


// --- Firebase Function Export with secrets ---
export const api = onRequest(
  {
    region: 'asia-southeast1', // optional
    secrets: ['SERVICE_ACCOUNT_KEY', 'DISCORD_WEBHOOK_URL'],
  },
  app
);
