
'use server';
/**
 * @fileOverview Generates a booking summary with pricing and availability status.
 *
 * - generateBookingSummary - A function that generates the booking summary.
 * - BookingSummaryInput - The input type for the generateBookingSummary function.
 * - BookingSummaryOutput - The return type for the generateBookingSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export async function generateBookingSummary(
  input: z.infer<typeof BookingSummaryInputSchema>
): Promise<z.infer<typeof BookingSummaryOutputSchema>> {

  const BookingSummaryInputSchema = z.object({
    frequency: z
      .enum(['daily', 'weekly', 'monthly'])
      .describe('The frequency of the booking summary.'),
    unitId: z.string().describe('The ID of the rental unit.'),
    startDate: z.string().describe('The start date for the summary period.'),
    endDate: z.string().describe('The end date for the summary period.'),
    searchRateData: z
      .record(z.string(), z.number())
      .describe(
        'A map of dates to search rates, used for dynamic pricing adjustments.'
      ),
  });
  
  const BookingSummaryOutputSchema = z.object({
    summary: z.string().describe('The booking summary.'),
  });

  const bookingSummaryPrompt = ai.definePrompt({
    name: 'bookingSummaryPrompt',
    input: {schema: BookingSummaryInputSchema},
    output: {schema: BookingSummaryOutputSchema},
    prompt: `You are an AI assistant that generates booking summaries for rental units.

  Generate a {{frequency}} summary of bookings, pricing, and availability status for unit ID {{unitId}} from {{startDate}} to {{endDate}}.

  The summary must include:
  1. A short, natural language summary of performance (e.g., "Unit 3 had 5 nights booked this week, generating ₱15,000. Occupancy is 20% higher than last month.").
  2. A list of all bookings with platform, dates, and revenue.
  3. A dynamic housekeeping schedule, generating a daily cleaning/maintenance checklist sorted by urgency (e.g., check-outs are high priority).

  Adjust pricing dynamically based on the following search rate data. Increase prices on dates with high search rates and decrease prices when search rates are low to optimize revenue.
  {{#each searchRateData}}
  - Date: {{@key}}, Search Rate: {{this}}
  {{/each}}

  The final output should be concise and easy for a property manager to understand and act on.
  `,
  });

  const bookingSummaryFlow = ai.defineFlow(
    {
      name: 'bookingSummaryFlow',
      inputSchema: BookingSummaryInputSchema,
      outputSchema: BookingSummaryOutputSchema,
    },
    async input => {
      const {output} = await bookingSummaryPrompt(input);
      return output!;
    }
  );

  return bookingSummaryFlow(input);
}

export type BookingSummaryInput = z.infer<typeof import('./booking-summary-and-pricing').generateBookingSummary extends (input: infer I, ...args: any[]) => any ? I : never>;
export type BookingSummaryOutput = z.infer<typeof import('./booking-summary-and-pricing').generateBookingSummary extends (...args: any[]) => Promise<infer O> ? O : never>;

