
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import type { Unit, SyncedEvent, Platform, Booking } from '@/lib/types';
import ical from 'node-ical';

// Helper function to get existing booking UIDs from Firestore to prevent duplicates
async function getExistingBookingUIDs(adminDb: FirebaseFirestore.Firestore): Promise<Set<string>> {
    const bookingsSnapshot = await adminDb.collection('bookings').select('uid').get();
    if (bookingsSnapshot.empty) {
        return new Set();
    }
    const uids = bookingsSnapshot.docs.map(doc => doc.data().uid).filter(Boolean);
    return new Set(uids);
}

// Helper function to create a new booking in Firestore from a parsed calendar event
async function createBookingFromEvent(adminDb: FirebaseFirestore.Firestore, event: SyncedEvent, unit: Unit): Promise<void> {
    const newBooking: Omit<Booking, 'id'> = {
        uid: event.uid,
        guestFirstName: event.summary,
        guestLastName: `(${event.platform})`,
        guestPhone: '',
        guestEmail: '',
        unitId: unit.id!,
        checkinDate: event.start,
        checkoutDate: event.end,
        adults: 1, // iCal does not provide guest count, default to 1
        children: 0,
        nightlyRate: unit.rate, // Use the unit's base rate
        totalAmount: 0, // iCal does not provide payment details
        paymentStatus: 'pending',
        specialRequests: `Synced from ${event.platform}. Original summary: ${event.summary}`,
        createdAt: new Date().toISOString(),
    };
    await adminDb.collection('bookings').add(newBooking);
    console.log(`Created new booking for unit ${unit.name} from ${event.platform}: ${event.summary}`);
}


export async function GET(req: NextRequest) {
    // Secure the endpoint with a secret token from environment variables
    const authToken = (req.headers.get('authorization') || '').split('Bearer ')[1];
    if (authToken !== process.env.CRON_SECRET) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { adminDb } = await getFirebaseAdmin();
        const unitsSnapshot = await adminDb.collection('units').get();
        const units = unitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
        const existingUIDs = await getExistingBookingUIDs(adminDb);

        let newBookingsCount = 0;

        for (const unit of units) {
            const calendarsToSync = Object.entries(unit.calendars)
                .filter(([_, url]) => url) // Filter out empty URLs
                .map(([platform, url]) => ({ platform: platform as Platform, url }));

            for (const { platform, url } of calendarsToSync) {
                try {
                    const events = await ical.async.fromURL(url);
                    for (const key in events) {
                        const event = events[key];
                        if (event.type === 'VEVENT' && event.uid) {
                             if (!existingUIDs.has(event.uid)) {
                                const syncedEvent: SyncedEvent = {
                                    uid: event.uid,
                                    summary: event.summary || 'No Title',
                                    start: event.start.toISOString(),
                                    end: event.end.toISOString(),
                                    platform: platform,
                                };
                                await createBookingFromEvent(adminDb, syncedEvent, unit);
                                existingUIDs.add(event.uid); // Add to set to prevent re-adding in the same run
                                newBookingsCount++;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Failed to parse iCal from ${platform} for unit ${unit.name}:`, error);
                    // Continue to the next calendar even if one fails
                }
            }
        }

        return NextResponse.json({
            message: `Calendar sync completed. Found and created ${newBookingsCount} new bookings.`,
        });

    } catch (error) {
        console.error('Error during calendar sync cron job:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
