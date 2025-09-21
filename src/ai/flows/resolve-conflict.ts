
'use server';
/**
 * @fileOverview A flow to suggest a resolution for a booking conflict.
 *
 * - suggestConflictResolution - A function that suggests a resolution for a booking conflict.
 * - ConflictResolutionInput - The input type for the suggestConflictResolution function.
 * - ConflictResolutionOutput - The return type for the suggestConflictResolution function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export async function suggestConflictResolution(
  input: z.infer<typeof ConflictResolutionInputSchema>
): Promise<z.infer<typeof ConflictResolutionOutputSchema>> {
  
  const BookingDetailsSchema = z.object({
    id: z.string().optional(),
    guestName: z.string(),
    checkinDate: z.string(),
    checkoutDate: z.string(),
    totalAmount: z.number(),
    createdAt: z.string(),
  });

  const ConflictResolutionInputSchema = z.object({
    existingBooking: BookingDetailsSchema.describe('The booking that already exists in the calendar.'),
    newBooking: BookingDetailsSchema.describe('The new booking that is causing the conflict.'),
    unitName: z.string().describe('The name of the unit with the booking conflict.'),
  });

  const ConflictResolutionOutputSchema = z.object({
    suggestion: z.string().describe('The suggested course of action to resolve the conflict.'),
    suggestedAction: z.enum(['keep_existing', 'prioritize_new', 'offer_alternative']).describe('A machine-readable suggested action.'),
  });
  
  const resolveConflictPrompt = ai.definePrompt({
    name: 'resolveConflictPrompt',
    input: { schema: ConflictResolutionInputSchema },
    output: { schema: ConflictResolutionOutputSchema },
    prompt: `You are an expert property manager AI specializing in conflict resolution. Analyze the following booking conflict for the unit "{{unitName}}" and suggest the best course of action.

    Existing Booking:
    - Guest: {{existingBooking.guestName}}
    - Dates: {{existingBooking.checkinDate}} to {{existingBooking.checkoutDate}}
    - Value: ₱{{existingBooking.totalAmount}}
    - Booked On: {{existingBooking.createdAt}}

    New Conflicting Booking:
    - Guest: {{newBooking.guestName}}
    - Dates: {{newBooking.checkinDate}} to {{newBooking.checkoutDate}}
    - Value: ₱{{newBooking.totalAmount}}
    - Booked On: {{newBooking.createdAt}}

    Prioritize the booking that is more valuable (higher total amount, longer stay). Also consider which booking was made first. Provide a concise, actionable suggestion for the property manager. For example, suggest contacting one guest to offer a different unit or a discount to reschedule. Then, set the 'suggestedAction' field based on your analysis: 'keep_existing' if the old booking is clearly better, 'prioritize_new' if the new one is much more valuable, or 'offer_alternative' if a compromise is best.`,
  });

  const resolveConflictFlow = ai.defineFlow(
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

  return resolveConflictFlow(input);
}

export type BookingDetails = z.infer<typeof import('./resolve-conflict').suggestConflictResolution extends (input: any) => Promise<infer O> ? O extends {existingBooking: any} ? O['existingBooking'] : never : never>;
export type ConflictResolutionInput = z.infer<typeof import('./resolve-conflict').suggestConflictResolution extends (input: infer I) => any ? I : never>;
export type ConflictResolutionOutput = z.infer<typeof import('./resolve-conflict').suggestConflictResolution extends (input: any) => Promise<infer O> ? O : never>;

