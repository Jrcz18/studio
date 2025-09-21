'use server';
/**
 * @fileOverview A flow to send an email notification to the building admin for a new booking.
 *
 * - sendAdminBookingNotification - A function that triggers the admin notification.
 * - AdminNotificationInput - The input type for the notification function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// You should replace this with a secure way to get the admin email,
// like from environment variables or a config service.
const ADMIN_EMAIL = 'admin@example.com'; 

export const AdminNotificationInputSchema = z.object({
  guestName: z.string().describe('The full name of the guest.'),
  guestContact: z.string().describe('The contact phone number of the guest.'),
  numberOfGuests: z.number().describe('The total number of guests (adults + children).'),
  checkinDate: z.string().describe('The check-in date for the booking.'),
  checkoutDate: z.string().describe('The check-out date for the booking.'),
  unitName: z.string().describe('The name of the unit that was booked.'),
});
export type AdminNotificationInput = z.infer<
  typeof AdminNotificationInputSchema
>;

// The output will be the result of the email sending action, which we can simplify to a success message.
const AdminNotificationOutputSchema = z.object({
  message: z.string(),
});
export type AdminNotificationOutput = z.infer<
  typeof AdminNotificationOutputSchema
>;

export async function sendAdminBookingNotification(
  input: AdminNotificationInput
): Promise<AdminNotificationOutput> {
  return sendAdminNotificationFlow(input);
}

const sendAdminNotificationFlow = ai.defineFlow(
  {
    name: 'sendAdminNotificationFlow',
    inputSchema: AdminNotificationInputSchema,
    outputSchema: AdminNotificationOutputSchema,
  },
  async (input) => {
    // In a real application, you would integrate with an email service like SendGrid, Mailgun, or Resend.
    // For this example, we will simulate the email sending process by logging the content.
    
    const emailSubject = `New Guest Arrival Notice: ${input.guestName} for Unit ${input.unitName}`;
    
    const emailBody = `
      <p>Dear Building Administration,</p>
      <p>Please be advised of a new guest arrival for Unit ${input.unitName}.</p>
      <p><strong>Guest Details:</strong></p>
      <ul>
        <li><strong>Name:</strong> ${input.guestName}</li>
        <li><strong>Contact Number:</strong> ${input.guestContact}</li>
        <li><strong>Total Guests:</strong> ${input.numberOfGuests}</li>
        <li><strong>Check-in Date:</strong> ${input.checkinDate}</li>
        <li><strong>Check-out Date:</strong> ${input.checkoutDate}</li>
      </ul>
      <p>Please facilitate their check-in process accordingly.</p>
      <p>Thank you,<br>Manila Prime Property Management</p>
    `;

    console.log('--- SIMULATING EMAIL SEND ---');
    console.log(`To: ${ADMIN_EMAIL}`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`Body: ${emailBody}`);
    console.log('-----------------------------');
    
    // Here you would add the actual email sending logic:
    // await sendEmail({ to: ADMIN_EMAIL, subject: emailSubject, html: emailBody });

    return {
      message: `Successfully sent notification for ${input.guestName} to ${ADMIN_EMAIL}`,
    };
  }
);
