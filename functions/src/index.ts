'use server';

import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { sendDiscordNotificationFlow } from './ai/flows/send-discord-notification';
import { getFirebaseAdmin } from './lib/firebase-admin';
import ical from 'ical-generator';
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

// Handle CORS preflight requests
app.options('*', cors());


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

    // Send Discord notification
    const discordMessage = `
-----------------------------
🏢 New Unit Added!
-----------------------------
**Unit ID:** ${docRef.id}
**Name:** ${newUnit.name}
**Type:** ${newUnit.type || 'N/A'}
**Capacity:** ${newUnit.capacity || 'N/A'}
`;
    await sendDiscordNotificationFlow({ content: discordMessage });

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
    const ref = adminDb.collection('units').doc(req.params.unitId);

    // Get old data
    const beforeSnap = await ref.get();
    const before = beforeSnap.data();

    // Apply update
    await ref.update(unitData);

    // Get new data
    const afterSnap = await ref.get();
    const after = afterSnap.data();

    // Build changed fields diff
    const changedFields = Object.keys(unitData)
      .filter((key) => before?.[key] !== after?.[key])
      .map((key) => `**${key}**: \`${before?.[key] ?? 'N/A'}\` → \`${after?.[key]}\``)
      .join('\n');

    // Send Discord notification
    await sendDiscordNotificationFlow({
      content: `
-----------------------------
✏️ Unit **${req.params.unitId}** was updated:
-----------------------------
**Name:** ${after?.name || 'N/A'}
${changedFields || 'No changes detected.'}
`,
    });

    return res.status(200).json({ message: 'Unit updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update unit' });
  }
});


app.delete('/unit/:unitId', async (req, res) => {
  try {
    const adminDb = getDb();
    const docRef = adminDb.collection('units').doc(req.params.unitId);
    const docSnap = await docRef.get();

    const unit = docSnap.data() as Unit | undefined;

    await docRef.delete();

    // Discord notification
    if (unit) {
      try {
        await sendDiscordNotificationFlow({
          content: `
-----------------------------
❌ Unit deleted!
-----------------------------
**Unit ID:** ${req.params.unitId}
**Name:** ${unit.name}
**Type:** ${unit.type || 'N/A'}
**Capacity:** ${unit.capacity || 'N/A'}`,
        });
      } catch (err) {
        console.error('Discord notification failed:', err);
      }
    }

    return res.status(200).json({ message: 'Unit deleted successfully' });
  } catch (err: any) {
    console.error('Failed to delete unit:', err);
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
    const agentId = req.params.agentId;
    console.log('DELETE request received for agentId:', agentId); // <--- add this

    const adminDb = getDb();
    await adminDb.collection('agents').doc(agentId).delete();

    return res.status(200).json({ message: 'Agent deleted successfully' });
  } catch (err: any) {
    console.error('DELETE agent failed:', err);
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
    const newBooking: Omit<Booking, 'id' | 'bookingId' | 'totalAmount'> & {
      isCustomAmount?: boolean;
      totalAmount?: number;
    } = req.body;

    // Fetch unit data
    const unitRef = adminDb.collection('units').doc(newBooking.unitId);
    const unitSnap = await unitRef.get();

    if (!unitSnap.exists) {
      return res.status(400).json({ error: 'Invalid unit ID — unit not found.' });
    }

    const unitData = unitSnap.data() as Unit;

    // Calculate total nights
    const checkin = new Date(newBooking.checkinDate);
    const checkout = new Date(newBooking.checkoutDate);
    const oneDay = 1000 * 60 * 60 * 24;
    const totalNights = Math.max(0, Math.round((checkout.getTime() - checkin.getTime()) / oneDay));

    // Compute total amount
    let totalAmount: number;
    if (newBooking.isCustomAmount && newBooking.totalAmount) {
      // ✅ Respect the manually entered total from frontend
      totalAmount = newBooking.totalAmount;
    } else {
      // 🧮 Compute automatically from unit rate + guests + nights
      const capacity = unitData.capacity ?? unitData.baseOccupancy ?? 0;
      const extraGuests = Math.max(0, (newBooking.adults + newBooking.children) - capacity);
      const extraGuestFee = unitData.extraGuestFee ?? 0;
      totalAmount = totalNights * (unitData.rate + extraGuests * extraGuestFee);
    }

    // Conflict check
    const conflictCheck: Booking = {
      ...newBooking,
      id: '',
      bookingId: '',
      totalAmount,
      createdAt: new Date().toISOString(),
      nightlyRate: unitData.rate,
      paymentStatus: newBooking.paymentStatus || 'pending',
    };

    const conflict = await findBookingConflict(conflictCheck);
    if (conflict)
      return res.status(409).json({
        error: 'Booking conflict detected.',
        existingBooking: conflict,
      });

    // Create booking doc
    const docRef = adminDb.collection('bookings').doc();
    const id = docRef.id;

    const bookingWithId: Booking = {
      ...newBooking,
      id,
      bookingId: id,
      totalAmount,
      nightlyRate: unitData.rate,
      paymentStatus: newBooking.paymentStatus || 'pending',
      createdAt: new Date().toISOString(),
    };

    await docRef.set(bookingWithId);

    // Discord notification
    try {
      await sendDiscordNotificationFlow({
        content: `
-----------------------------
🎉 New booking confirmed!
-----------------------------
**Booking ID:** ${id}
**Unit:** ${unitData.name || 'Unknown unit'}
**Unit ID:** ${newBooking.unitId}
**Guest:** ${newBooking.guestFirstName} ${newBooking.guestLastName}
**From:** ${newBooking.checkinDate}
**To:** ${newBooking.checkoutDate}
**Total:** ₱${totalAmount.toLocaleString()} ${newBooking.isCustomAmount ? '(Custom)' : ''}
**Special Requests:** ${newBooking.specialRequests?.trim() || 'N/A'}

\u200B`,
      });
    } catch (e) {
      console.error('Discord notification failed:', e);
    }

    // Optional app notification
    if (newBooking.uid) {
      await adminDb.collection('notifications').add({
        userId: newBooking.uid,
        type: 'booking',
        title: 'Booking Confirmed!',
        description: `Your booking for ${unitData.name} from ${newBooking.checkinDate} to ${newBooking.checkoutDate} is confirmed.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        data: { bookingId: id, unitId: newBooking.unitId },
      } as Omit<AppNotification, 'id'>);
    }

    return res.status(201).json({ bookingId: id, id, totalAmount });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.put('/booking/:bookingId', async (req, res) => {
  try {
    const adminDb = getDb();
    const bookingData: Partial<Booking> = req.body;
    const ref = adminDb.collection('bookings').doc(req.params.bookingId);

    const beforeSnap = await ref.get();
    const before = beforeSnap.data() as Booking | undefined;

    // Recalculate totals if relevant fields change
    let updatedFields = { ...bookingData };
    if (
      bookingData.checkinDate ||
      bookingData.checkoutDate ||
      bookingData.unitId ||
      bookingData.adults !== undefined ||
      bookingData.children !== undefined
    ) {
      const targetUnitId = bookingData.unitId || before?.unitId;
      const unitSnap = await adminDb.collection('units').doc(targetUnitId!).get();
      const unit = unitSnap.data() as Unit;

      const checkin = new Date(bookingData.checkinDate || before?.checkinDate!);
      const checkout = new Date(bookingData.checkoutDate || before?.checkoutDate!);
      const oneDay = 1000 * 60 * 60 * 24;
      const totalNights = Math.max(0, Math.round((checkout.getTime() - checkin.getTime()) / oneDay));

      const adults = bookingData.adults ?? before?.adults ?? 0;
      const children = bookingData.children ?? before?.children ?? 0;
      const capacity = unit.capacity ?? unit.baseOccupancy ?? 0;
      const extraGuests = Math.max(0, adults + children - capacity);
      const totalAmount =
        totalNights * ((unit.rate ?? 0) + extraGuests * (unit.extraGuestFee ?? 0));

      updatedFields.totalAmount = totalAmount;
      updatedFields.nightlyRate = unit.rate;
    }

    // Always ensure bookingId = id stays synced
    if (before?.id && !bookingData.bookingId) {
      updatedFields.bookingId = before.id;
    }

    await ref.update(updatedFields);

    const afterSnap = await ref.get();
    const after = afterSnap.data() as Booking;

    // Discord notification for update
    const unitDoc = await adminDb.collection('units').doc(after?.unitId).get();
    const unitName = unitDoc.exists ? unitDoc.data()?.name : 'Unknown unit';

    const changedFields = Object.keys(bookingData)
      .filter((key) => before?.[key as keyof Booking] !== after?.[key as keyof Booking])
      .map(
        (key) =>
          `**${key}**: \`${before?.[key as keyof Booking] ?? 'N/A'}\` → \`${after?.[key as keyof Booking]}\``
      )
      .join('\n');

    await sendDiscordNotificationFlow({
      content: `
-----------------------------
✏️ Booking **${req.params.bookingId}** was updated:
-----------------------------
**Unit:** ${unitName} (${after?.unitId || 'N/A'})
${changedFields || 'No changes detected.'}

\u200B`,
    });

    return res.status(200).json({ message: 'Booking updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update booking' });
  }
});

app.delete('/booking/:bookingId', async (req, res) => {
  try {
    const adminDb = getDb();
    const docRef = adminDb.collection('bookings').doc(req.params.bookingId);
    const docSnap = await docRef.get();
    const booking = docSnap.data() as Booking | undefined;

    await docRef.delete();

    if (booking) {
      await sendDiscordNotificationFlow({
        content: `
-----------------------------
❌ Booking deleted!
-----------------------------
**Booking ID:** ${req.params.bookingId}
**Guest:** ${booking.guestFirstName} ${booking.guestLastName || 'N/A'}
**Unit ID:** ${booking.unitId || 'N/A'}
**From:** ${booking.checkinDate || 'N/A'}
**To:** ${booking.checkoutDate || 'N/A'}

\u200B`,
      });
    }

    return res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (err: any) {
    console.error('Failed to delete booking:', err);
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

//--- ical API ---

app.get('/ical/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;
    const adminDb = getDb();

    // Ensure unit exists
    const unitSnap = await adminDb.collection('units').doc(unitId).get();
    if (!unitSnap.exists) {
      return res.status(404).send('Unit not found');
    }

    const unit = unitSnap.data() as Unit;

    // Fetch bookings for this unit
    const bookingsSnap = await adminDb
      .collection('bookings')
      .where('unitId', '==', unitId)
      .get();

    const calendar = ical({
      name: `${unit.name} Availability`,
      timezone: 'UTC',
      method: 'PUBLISH', // ✅ string, not enum
    });

    bookingsSnap.forEach((doc) => {
      const booking = doc.data() as Booking;

      if (!booking.checkinDate || !booking.checkoutDate) return;

      calendar.createEvent({
        id: booking.id || doc.id,
        uid: `booking-${booking.bookingId || doc.id}@yourdomain.com`, // stable UID
        start: new Date(booking.checkinDate),
        end: new Date(booking.checkoutDate),
        summary: 'Reserved',
        description: `Booking ID: ${booking.bookingId || doc.id}`,
        status: 'CONFIRMED',
        transparency: 'OPAQUE',
      });
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');

    return res.status(200).send(calendar.toString());
  } catch (err) {
    console.error('iCal export failed:', err);
    return res.status(500).send('Failed to generate iCal');
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

// --- External Booking API ---
app.post('/external-booking', async (req, res) => {
  try {
    const adminDb = getDb();
    const newBooking: Omit<Booking, 'id'> & { source: string } = req.body; // source e.g. 'Airbnb'

    const conflict = await findBookingConflict(newBooking);
    if (conflict)
      return res.status(409).json({ error: 'Booking conflict detected.', existingBooking: conflict });

    const docRef = adminDb.collection('bookings').doc();
    const id = docRef.id;
    
    await docRef.set({
      ...newBooking,
      id,
      bookingId: id,
      createdAt: new Date().toISOString(),
    });

    // Discord notification for external booking
    try {
      const unitDoc = await adminDb.collection('units').doc(newBooking.unitId).get();
      const unitName = unitDoc.exists ? unitDoc.data()?.name : 'Unknown unit';
      await sendDiscordNotificationFlow({
        content: `
-----------------------------
🎉 New booking external source confirmed!
-----------------------------
**Source:** ${newBooking.source}
**Unit:** ${unitName}
**Guest:** ${newBooking.guestFirstName}
**From:** ${newBooking.checkinDate} 
**To:** ${newBooking.checkoutDate}
**Total:** ₱${(newBooking.totalAmount ?? 0).toLocaleString()}

\u200B`,
      });
    } catch (e) {
      console.error('Discord notification failed for external booking', e);
    }

    // Optional app notification just mentions source
    await adminDb.collection('notifications').add({
      type: 'booking',
      title: `Booking from ${newBooking.source}`,
      description: `Booking for unit ${newBooking.unitId} from ${newBooking.checkinDate} to ${newBooking.checkoutDate}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      data: { bookingId: docRef.id, unitId: newBooking.unitId, source: newBooking.source },
    } as Omit<AppNotification, 'id'>);

    return res.status(201).json({ id: docRef.id });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create external booking' });
  }
});

// --- Safe Backfill Booking IDs Endpoint ---
app.get('/backfillBookingIds', async (req, res) => {
  try {
    const adminDb = getDb();
    const bookingsSnapshot = await adminDb.collection('bookings').get();

    if (bookingsSnapshot.empty) {
      return res.status(200).send('No bookings found to backfill.');
    }

    const batch = adminDb.batch();
    let updatedCount = 0;

    bookingsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.id) {
        batch.update(doc.ref, { id: doc.id });
        updatedCount++;
        console.log(`✅ Backfilled booking id for doc ${doc.id}`);
      }
    });

    await batch.commit();

    if (updatedCount === 0) {
      return res.status(200).send('All bookings already have IDs. Nothing to backfill.');
    } else {
      return res.status(200).send(`✅ Backfill complete! Total updated: ${updatedCount}`);
    }
  } catch (err) {
    console.error('❌ Backfill failed:', err);
    return res.status(500).send('❌ Backfill failed');
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

// Firestore triggers for Google Calendar
export { bookingCreated, bookingUpdated, bookingDeleted } from './triggers/booking-calendar-sync';

export { backfillBookingIds } from './scripts/backfillBookingIds';


