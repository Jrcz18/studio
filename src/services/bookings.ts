
'use client';

import type { Booking } from '@/lib/types';
import { auth } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchFromApi(path: string, options: RequestInit = {}) {
    if (!API_BASE_URL) {
        throw new Error("API_BASE_URL not configured.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, options);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Request failed with status ${response.status}` }));
         if (response.status === 409) {
            // Specifically handle conflict errors by embedding the data
            throw new Error(`409 Conflict: ${JSON.stringify(errorData)}`);
        }
        throw new Error(errorData.error || 'An unknown API error occurred');
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
}


export async function getBookings(): Promise<Booking[]> {
    return fetchFromApi('/bookings');
}

export async function addBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'totalAmount' | 'nightlyRate'>): Promise<{ id: string, totalAmount: number, nightlyRate: number }> {
    const user = auth.currentUser;
    const payload = {
        ...bookingData,
        uid: user?.uid, 
    };
    return fetchFromApi('/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function updateBooking(bookingData: Booking): Promise<void> {
    const { id, ...data } = bookingData;
    if (!id) throw new Error("Booking ID is required for update");
    await fetchFromApi(`/booking/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function deleteBooking(bookingId: string): Promise<void> {
    await fetchFromApi(`/booking/${bookingId}`, {
        method: 'DELETE',
    });
}
