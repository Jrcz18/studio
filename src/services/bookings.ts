
'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import type { Booking } from '@/lib/types';
import { auth } from '@/lib/firebase';

const bookingsCollectionRef = collection(db, 'bookings');
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// CLIENT-SIDE functions
export async function getBookings(): Promise<Booking[]> {
    const snapshot = await getDocs(bookingsCollectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
}

export async function addBooking(bookingData: Omit<Booking, 'id'>): Promise<string> {
    if (!API_BASE_URL) {
        throw new Error("API base URL is not configured. Cannot create booking.");
    }
    const user = auth.currentUser;

    const payload = {
        ...bookingData,
        uid: user?.uid, // Pass the current user's ID to the backend for notifications
    };

    const response = await fetch(`${API_BASE_URL}/booking`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
            throw new Error(`409 Conflict: ${JSON.stringify(errorData)}`);
        }
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    return result.id;
}

export async function updateBooking(bookingData: Booking): Promise<void> {
    const { id, ...data } = bookingData;
    if (!id) throw new Error("Booking ID is required for update");
    const bookingDoc = doc(db, 'bookings', id);
    await updateDoc(bookingDoc, data);
}

export async function deleteBooking(bookingId: string): Promise<void> {
    if (!API_BASE_URL) {
        throw new Error("API_BASE_URL not configured. Cannot delete booking.");
    }

    const response = await fetch(`${API_BASE_URL}/booking/${bookingId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete booking via backend');
    }
}
