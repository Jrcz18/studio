
'use server';

import type { SyncedEvent, Unit, Booking, Platform } from '@/lib/types';
import { getUnit } from '@/services/units';
import { fetchAndParseCalendar } from '@/services/calendar';
import { sendDiscordNotification } from '@/services/discord';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

async function getExistingBookingUIDs(unitId: string, uidsToFetch: string[]): Promise<string[]> {
    if (uidsToFetch.length === 0) {
        return [];
    }

    const { adminDb } = await getFirebaseAdmin();
    const bookingsCollection = adminDb.collection('bookings');
    const batches: string[][] = [];
    for (let i = 0; i < uidsToFetch.length; i += 30) {
        batches.push(uidsToFetch.slice(i, i + 30));
    }

    const existingUIDs = new Set<string>();

    for (const batch of batches) {
        const q = bookingsCollection
            .where('unitId', '==', unitId)
            .where('uid', 'in', batch);
        const querySnapshot = await q.get();
        querySnapshot.forEach(doc => {
            const booking = doc.data() as Booking;
            if (booking.uid) {
                existingUIDs.add(booking.uid);
            }
        });
    }
    
    return Array.from(existingUIDs);
}

async function createBookingFromEvent(event: SyncedEvent, unit: Unit): Promise<void> {
    const { adminDb } = await getFirebaseAdmin();
    const bookingsCollection = adminDb.collection('bookings');
    
    const newBookingData: Omit<Booking, 'id' | 'createdAt'> = {
        uid: event.uid,
        guestFirstName: "Synced",
        guestLastName: event.platform,
        guestPhone: "N/A",
        guestEmail: "N/A",
        unitId: unit.id!,
        checkinDate: event.start,
        checkoutDate: event.end,
        adults: 0,
        children: 0,
        nightlyRate: unit.rate,
        totalAmount: 0, 
        paymentStatus: 'paid',
        specialRequests: `Synced from ${event.platform}: ${event.summary}`,
    };

    const docRef = await bookingsCollection.add({
        ...newBookingData,
        createdAt: new Date().toISOString()
    });
    
    await sendDiscordNotification({ ...newBookingData, id: docRef.id, createdAt: new Date().toISOString() }, unit);
}


export async function syncCalendars(unitCalendars: Unit['calendars'], unitId: string): Promise<SyncedEvent[]> {
    const unit = await getUnit(unitId);
    if(!unit) {
        throw new Error("Unit not found");
    }

    let allEvents: SyncedEvent[] = [];
    const calendarPromises: Promise<void>[] = [];

    const processCalendar = async (url: string, platform: Platform) => {
        if (url) {
            try {
                const events = await fetchAndParseCalendar(url);
                const platformEvents: SyncedEvent[] = events.map(e => ({...e, platform}));
                allEvents.push(...platformEvents);
            } catch (error) {
                console.error(`Error processing calendar for ${platform}:`, error);
                // Continue with other calendars even if one fails
            }
        }
    };

    calendarPromises.push(processCalendar(unitCalendars.airbnb, 'Airbnb'));
    calendarPromises.push(processCalendar(unitCalendars.bookingcom, 'Booking.com'));
    calendarPromises.push(processCalendar(unitCalendars.direct, 'Direct'));

    await Promise.all(calendarPromises);
    
    // Deduplicate UIDs and check against existing bookings
    const uidsToFetch = [...new Set(allEvents.map(e => e.uid))];
    const existingUIDs = await getExistingBookingUIDs(unitId, uidsToFetch);
    const newEvents = allEvents.filter(event => !existingUIDs.includes(event.uid));

    // Create bookings for new, non-existing events
    for (const event of newEvents) {
        await createBookingFromEvent(event, unit);
    }
    
    return allEvents;
}
