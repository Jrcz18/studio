
'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import type { Booking } from '@/lib/types';
import { addNotification } from './notifications';
import { auth } from '@/lib/firebase';

const bookingsCollection = collection(db, 'bookings');

export async function getBookings(): Promise<Booking[]> {
    const snapshot = await getDocs(bookingsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
}

export async function addBooking(bookingData: Omit<Booking, 'id'>): Promise<string> {
    const response = await fetch('https://mpbookingserver.vercel.app/api/booking', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        // For conflict errors, embed the data in the error message
        if (response.status === 409) {
            throw new Error(`409 Conflict: ${JSON.stringify(errorData)}`);
        }
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    const bookingId = result.id;

    // Create a notification
    const user = auth.currentUser;
    if (user) {
        await addNotification({
            userId: user.uid,
            type: 'booking',
            title: 'New Booking Created',
            description: `Booking for ${bookingData.guestFirstName} ${bookingData.guestLastName} was successfully created.`,
            isRead: false,
            createdAt: new Date().toISOString(),
            data: { bookingId }
        });
    }

    return bookingId;
}

export async function updateBooking(bookingData: Booking): Promise<void> {
    const { id, ...data } = bookingData;
    if (!id) throw new Error("Booking ID is required for update");
    const bookingDoc = doc(db, 'bookings', id);
    await updateDoc(bookingDoc, data);
}

export async function deleteBooking(bookingId: string): Promise<void> {
    const bookingDoc = doc(db, 'bookings', bookingId);
    await deleteDoc(bookingDoc);
}
