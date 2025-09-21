
'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import type { Booking } from '@/lib/types';
import { getUnit } from './units';
import { sendDiscordNotification } from './discord';


const bookingsCollection = collection(db, 'bookings');

export async function getBookings(): Promise<Booking[]> {
    const snapshot = await getDocs(bookingsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
}

export async function addBooking(bookingData: Omit<Booking, 'id'>): Promise<string> {
    const docRef = await addDoc(bookingsCollection, bookingData);
    
    try {
        const unit = await getUnit(bookingData.unitId);
        if (unit) {
            await sendDiscordNotification({ ...bookingData, id: docRef.id, createdAt: new Date().toISOString() }, unit);
        }
    } catch (error) {
        console.error("Failed to send Discord notification:", error);
    }

    return docRef.id;
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
