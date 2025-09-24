
'use server';
/**
 * @fileOverview Booking conflict resolution flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ConflictResolutionInputSchema, ConflictResolutionOutputSchema, type ConflictResolutionInput, type ConflictResolutionOutput } from '@/lib/types';


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
