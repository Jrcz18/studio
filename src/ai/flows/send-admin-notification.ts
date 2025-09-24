
'use client';
/**
 * @fileOverview Client-side function for sending an admin notification.
 */
import type { AdminNotificationInput, AdminNotificationOutput } from '@/lib/types';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function sendAdminBookingNotification(input: AdminNotificationInput): Promise<AdminNotificationOutput> {
    if (!API_BASE_URL) {
        throw new Error('API base URL is not configured.');
    }
    const res = await fetch(`${API_BASE_URL}/sendAdminBookingNotification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Request failed');
    }
    return res.json();
}
