
'use client';
/**
 * @fileOverview Client-side function to send an email notification to the building admin by calling a backend API.
 *
 * - sendAdminBookingNotification - Triggers the admin notification via the backend.
 * - AdminNotificationInput - The input type for the notification function.
 */

import { z } from 'zod';

const AdminNotificationInputSchema = z.object({
  guestName: z.string(),
  guestContact: z.string(),
  numberOfGuests: z.number(),
  checkinDate: z.string(),
  checkoutDate: z.string(),
  unitName: z.string(),
});
export type AdminNotificationInput = z.infer<typeof AdminNotificationInputSchema>;

const AdminNotificationOutputSchema = z.object({
  message: z.string(),
});
export type AdminNotificationOutput = z.infer<typeof AdminNotificationOutputSchema>;


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function sendAdminBookingNotification(input: AdminNotificationInput): Promise<AdminNotificationOutput> {
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
