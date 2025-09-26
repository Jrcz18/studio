
'use server';

import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { sendDiscordNotificationFlow } from './ai/flows/send-discord-notification';
import { getFirebaseAdmin } from './lib/firebase-admin';
import type { CollectionReference, DocumentData } from 'firebase-admin/firestore';
import type { Booking, Unit, AppNotification, Agent, Investor, Expense, Reminder, UnitIncident } from './lib/types';

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
        await adminDb.collection('expenses').doc(expenseId).delete();
        return res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting expense:', error);
        return res.status(500).json({ error: 'Failed to delete expense' });
    }
});

// --- Reminders API ---
app.get('/reminders', async (req, res) => {
    try {
        const reminders = await getCollection('reminders');
        return res.status(200).json(reminders);
    } catch (error: any) {
        console.error('Error fetching reminders:', error);
        return res.status(500).json({ error: 'Failed to fetch reminders' });
    }
});

app.post('/reminder', async (req, res) => {
    try {
        const newReminder: Omit<Reminder, 'id'> = req.body;
        const docRef = await adminDb.collection('reminders').add(newReminder);
        return res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating reminder:', error);
        return res.status(500).json({ error: 'Failed to create reminder' });
    }
});

app.put('/reminder/:reminderId', async (req, res) => {
    try {
        const { reminderId } = req.params;
        const reminderData: Partial<Reminder> = req.body;
        await adminDb.collection('reminders').doc(reminderId).update(reminderData);
        return res.status(200).json({ message: 'Reminder updated successfully' });
    } catch (error: any) {
        console.error('Error updating reminder:', error);
        return res.status(500).json({ error: 'Failed to update reminder' });
    }
});

app.delete('/reminder/:reminderId', async (req, res) => {
    try {
        const { reminderId } = req.params;
        await adminDb.collection('reminders').doc(reminderId).delete();
        return res.status(200).json({ message: 'Reminder deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting reminder:', error);
        return res.status(500).json({ error: 'Failed to delete reminder' });
    }
});


// --- Notifications API ---
app.get('/notifications/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const snapshot = await adminDb.collection('notifications').where('userId', '==', userId).get();
        const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json(notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

app.post('/notification', async (req, res) => {
    try {
        const newNotification: Omit<AppNotification, 'id'> = req.body;
        const docRef = await adminDb.collection('notifications').add(newNotification);
        return res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating notification:', error);
        return res.status(500).json({ error: 'Failed to create notification' });
    }
});

app.put('/notification/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        await adminDb.collection('notifications').doc(notificationId).update({ isRead: true });
        return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

app.post('/notifications/:userId/mark-all-read', async (req, res) => {
    try {
        const { userId } = req.params;
        const snapshot = await adminDb.collection('notifications').where('userId', '==', userId).where('isRead', '==', false).get();
        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { isRead: true });
        });
        await batch.commit();
        return res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        return res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
});

app.delete('/notification/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;
        await adminDb.collection('notifications').doc(notificationId).delete();
        return res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ error: 'Failed to delete notification' });
    }
});


// --- Incidents API ---
app.get('/incidents/:unitId', async (req, res) => {
    try {
        const { unitId } = req.params;
        const { daysAgo } = req.query;
        let query: FirebaseFirestore.Query = adminDb.collection('incidents').where('unitId', '==', unitId);
        
        if (daysAgo) {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - Number(daysAgo));
            query = query.where('date', '>=', pastDate.toISOString().split('T')[0]);
        }
        
        const snapshot = await query.orderBy('date', 'desc').get();
        const incidents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json(incidents);

    } catch (error: any) {
        console.error('Error fetching incidents:', error);
        return res.status(500).json({ error: 'Failed to fetch incidents' });
    }
});

app.post('/incident', async (req, res) => {
    try {
        const newIncident: Omit<UnitIncident, 'id'> = req.body;
        const docRef = await adminDb.collection('incidents').add(newIncident);
        return res.status(201).json({ id: docRef.id });
    } catch (error: any) {
        console.error('Error creating incident:', error);
        return res.status(500).json({ error: 'Failed to create incident' });
    }
});

app.put('/incident/:incidentId', async (req, res) => {
    try {
        const { incidentId } = req.params;
        const incidentData: Partial<UnitIncident> = req.body;
        await adminDb.collection('incidents').doc(incidentId).update(incidentData);
        return res.status(200).json({ message: 'Incident updated successfully' });
    } catch (error: any) {
        console.error('Error updating incident:', error);
        return res.status(500).json({ error: 'Failed to update incident' });
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
