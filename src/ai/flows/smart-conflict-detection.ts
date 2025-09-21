'use server';

/**
 * @fileOverview This file implements the Smart Conflict Detection flow.
 *
 * - detectBookingConflict - detects booking conflicts from calendar inputs.
 * - DetectBookingConflictInput - The input type for the detectBookingConflict function.
 * - DetectBookingConflictOutput - The return type for the detectBookingConflict function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectBookingConflictInputSchema = z.object({
  calendar1Events: z.string().describe('Events from the first calendar in iCal format.'),
  calendar2Events: z.string().describe('Events from the second calendar in iCal format.'),
  unitName: z.string().describe('The name of the rental unit.'),
});
export type DetectBookingConflictInput = z.infer<typeof DetectBookingConflictInputSchema>;

const DetectBookingConflictOutputSchema = z.object({
  hasConflict: z.boolean().describe('Whether or not there is a booking conflict.'),
  conflictDescription: z
    .string()
    .describe('The description of the booking conflict, if any.'),
});
export type DetectBookingConflictOutput = z.infer<typeof DetectBookingConflictOutputSchema>;

export async function detectBookingConflict(input: DetectBookingConflictInput): Promise<DetectBookingConflictOutput> {
  return detectBookingConflictFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectBookingConflictPrompt',
  input: {schema: DetectBookingConflictInputSchema},
  output: {schema: DetectBookingConflictInputSchema},
  prompt: `You are an AI assistant designed to detect booking conflicts between two calendars for a rental unit.

You are given two sets of calendar events in iCal format, and the name of the rental unit.

Calendar 1 Events:
{{{calendar1Events}}}

Calendar 2 Events:
{{{calendar2Events}}}

Rental Unit Name: {{unitName}}

Determine if there are any overlapping bookings between the two calendars. If there is a conflict,
explain the nature of the conflict, including the dates and times that overlap. If there is no conflict,
simply state that there is no conflict.

Return your answer in JSON format.
`,
});

const detectBookingConflictFlow = ai.defineFlow(
  {
    name: 'detectBookingConflictFlow',
    inputSchema: DetectBookingConflictInputSchema,
    outputSchema: DetectBookingConflictOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
