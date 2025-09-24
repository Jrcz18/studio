
'use server';
/**
 * @fileOverview Booking conflict resolution flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const BookingDetailsSchema = z.object({
  id: z.string().optional(),
  guestName: z.string(),
  checkinDate: z.string(),
  checkoutDate: z.string(),
  totalAmount: z.number(),
  createdAt: z.string(),
});
export type BookingDetails = z.infer<typeof BookingDetailsSchema>;

export const ConflictResolutionInputSchema = z.object({
  existingBooking: BookingDetailsSchema,
  newBooking: BookingDetailsSchema,
  unitName: z.string(),
});
export type ConflictResolutionInput = z.infer<typeof ConflictResolutionInputSchema>;

export const ConflictResolutionOutputSchema = z.object({
  suggestion: z.string(),
  suggestedAction: z.enum(['keep_existing', 'prioritize_new', 'offer_alternative']),
});
export type ConflictResolutionOutput = z.infer<typeof ConflictResolutionOutputSchema>;

const resolveConflictPrompt = ai.definePrompt({
  name: 'resolveConflictPrompt',
  input: { schema: ConflictResolutionInputSchema },
  output: { schema: ConflictResolutionOutputSchema },
  prompt: `Resolve booking conflict for "{{unitName}}". Existing: {{existingBooking.guestName}} ({{existingBooking.checkinDate}} to {{existingBooking.checkoutDate}}, ₱{{existingBooking.totalAmount}}, booked {{existingBooking.createdAt}}). New: {{newBooking.guestName}} ({{newBooking.checkinDate}} to {{newBooking.checkoutDate}}, ₱{{newBooking.totalAmount}}, booked {{newBooking.createdAt}}). Prioritize higher value and earlier booking. Suggest action and set suggestedAction field.`,
});

export const resolveConflictFlow = ai.defineFlow(
  {
    name: 'resolveConflictFlow',
    inputSchema: ConflictResolutionInputSchema,
    outputSchema: ConflictResolutionOutputSchema,
  },
  async (input) => {
    const { output } = await resolveConflictPrompt(input);
    return output!;
  }
);


// Client-facing function
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export async function suggestConflictResolution(input: ConflictResolutionInput): Promise<ConflictResolutionOutput> {
    const res = await fetch(`${API_BASE_URL}/resolveConflict`, {
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
