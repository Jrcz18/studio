
'use server';
/**
 * @fileOverview Admin notification flow (simulated email).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const AdminNotificationInputSchema = z.object({
  guestName: z.string(),
  guestContact: z.string(),
  numberOfGuests: z.number(),
  checkinDate: z.string(),
  checkoutDate: z.string(),
  unitName: z.string(),
});
export type AdminNotificationInput = z.infer<typeof AdminNotificationInputSchema>;

export const AdminNotificationOutputSchema = z.object({
  message: z.string(),
});
export type AdminNotificationOutput = z.infer<typeof AdminNotificationOutputSchema>;

export const sendAdminNotificationFlow = ai.defineFlow(
  {
    name: 'sendAdminNotificationFlow',
    inputSchema: AdminNotificationInputSchema,
    outputSchema: AdminNotificationOutputSchema,
  },
  async (input) => {
    const ADMIN_EMAIL = 'admin@example.com';
    const emailSubject = `New Guest Arrival: ${input.guestName} for Unit ${input.unitName}`;
    const emailBody = `<p>Dear Admin,</p><p>Guest: ${input.guestName}, Contact: ${input.guestContact}, Guests: ${input.numberOfGuests}, Check-in: ${input.checkinDate}, Check-out: ${input.checkoutDate}, Unit: ${input.unitName}.</p>`;
    
    // In a real app, you would use an email service like SendGrid here.
    // For this simulation, we just log to the console.
    console.log(`--- SIMULATING EMAIL TO ${ADMIN_EMAIL} ---`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`Body: ${emailBody}`);

    return { message: `Successfully sent notification for ${input.guestName} to ${ADMIN_EMAIL}` };
  }
);


// Client-facing function
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
