import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import express from "express";
import cors from "cors";

import { sendDiscordNotificationFlow } from "./ai/flows/send-discord-notification";
import { getFirebaseAdmin } from "./lib/firebase-admin";

import type { CollectionReference } from "firebase-admin/firestore";
import type { Booking, Unit, AppNotification, Agent, Investor, Expense } from "./lib/types";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// --- Lazy Firestore instance ---
function db() {
  return getFirebaseAdmin().adminDb;
}

// --- Helper functions ---
async function findBookingConflict(newBooking: Omit<Booking, "id">): Promise<Booking | null> {
  const bookingsCollection = db().collection("bookings") as CollectionReference<Booking>;
  const snapshot = await bookingsCollection
    .where("unitId", "==", newBooking.unitId)
    .where("checkoutDate", ">", newBooking.checkinDate)
    .get();

  if (snapshot.empty) return null;

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as Booking))
    .find((booking) => booking.checkinDate < newBooking.checkoutDate) || null;
}

async function createNotification(notificationData: Omit<AppNotification, "id">): Promise<string> {
  const docRef = await db().collection("notifications").add(notificationData);
  return docRef.id;
}

// --- API Endpoints ---
app.post("/sendDiscordNotification", async (req, res) => {
  try {
    const result = await sendDiscordNotificationFlow(req.body);
    return res.json(result);
  } catch (error: any) {
    console.error("Error running sendDiscordNotificationFlow:", error);
    return res.status(500).json({ error: "Something went wrong!" });
  }
});

app.post("/unit", async (req, res) => {
  try {
    const newUnit: Omit<Unit, "id"> = req.body;
    const docRef = await db().collection("units").add(newUnit);
    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error("Error creating unit:", error);
    return res.status(500).json({ error: "Failed to create unit" });
  }
});

app.post("/agent", async (req, res) => {
  try {
    const newAgent: Omit<Agent, "id"> = req.body;
    const docRef = await db().collection("agents").add(newAgent);
    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error("Error creating agent:", error);
    return res.status(500).json({ error: "Failed to create agent" });
  }
});

app.post("/investor", async (req, res) => {
  try {
    const newInvestor: Omit<Investor, "id"> = req.body;
    const docRef = await db().collection("investors").add(newInvestor);
    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error("Error creating investor:", error);
    return res.status(500).json({ error: "Failed to create investor" });
  }
});

app.post("/booking", async (req, res) => {
  try {
    const newBooking: Omit<Booking, "id"> = req.body;

    const conflict = await findBookingConflict(newBooking);
    if (conflict) {
      return res.status(409).json({ error: "Booking conflict detected.", existingBooking: conflict });
    }

    const docRef = await db().collection("bookings").add(newBooking);

    const unitDoc = await db().collection("units").doc(newBooking.unitId).get();
    const unitName = unitDoc.exists ? unitDoc.data()?.name : "Unknown unit";

    await sendDiscordNotificationFlow({
      content: `📅 New booking confirmed!\nUnit: ${unitName} (${newBooking.unitId})\nUser: ${newBooking.uid || "Guest"}\nFrom: ${newBooking.checkinDate}\nTo: ${newBooking.checkoutDate}`,
    });

    if (newBooking.uid) {
      await createNotification({
        userId: newBooking.uid,
        type: "booking",
        title: "Booking Confirmed!",
        description: `Your booking for ${unitName} from ${newBooking.checkinDate} to ${newBooking.checkoutDate} is confirmed.`,
        createdAt: new Date().toISOString(),
        isRead: false,
        data: { bookingId: docRef.id, unitId: newBooking.unitId },
      });
    }

    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return res.status(500).json({ error: "Failed to create booking" });
  }
});

app.post("/expense", async (req, res) => {
  try {
    const newExpense: Omit<Expense, "id"> = req.body;
    const docRef = await db().collection("expenses").add(newExpense);
    return res.status(201).json({ id: docRef.id });
  } catch (error: any) {
    console.error("Error creating expense:", error);
    return res.status(500).json({ error: "Failed to create expense" });
  }
});

// --- Generic Error Handler ---
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  return res.status(500).json({ error: "Something went wrong!", message: err.message });
});

// --- Export HTTP API (2nd Gen, southeastasia) ---
export const api = onRequest(
  {
    region: "asia-southeast1",
    secrets: ["SERVICE_ACCOUNT_KEY", "DISCORD_WEBHOOK_URL"],
  },
  app
);

// --- Firestore Trigger for bookings (southeastasia) ---
export const bookingCreated = onDocumentCreated(
  {
    document: "bookings/{bookingId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const booking = event.data?.data() as Booking;
    if (!booking) return;

    const unitDoc = await db().collection("units").doc(booking.unitId).get();
    const unitName = unitDoc.exists ? unitDoc.data()?.name : "Unknown unit";

    await sendDiscordNotificationFlow({
      content: `📅 New booking added (external source)!\nUnit: ${unitName} (${booking.unitId})\nUser: ${booking.uid || "Guest"}\nFrom: ${booking.checkinDate}\nTo: ${booking.checkoutDate}`,
    });
  }
);
