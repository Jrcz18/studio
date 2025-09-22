
'use client';
/**
 * @fileOverview Client-side function to generate a booking summary with pricing and availability by calling a backend API.
 *
 * - generateBookingSummary - A function that calls the backend to generate the booking summary.
 * - BookingSummaryInput - The input type for the generateBookingSummary function.
 * - BookingSummaryOutput - The return type for the generateBookingSummary function.
 */

import { z } from 'zod';

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

export type BookingSummaryInput = z.infer<typeof BookingSummaryInputSchema>;
export type BookingSummaryOutput = z.infer<typeof BookingSummaryOutputSchema>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function generateBookingSummary(input: BookingSummaryInput): Promise<BookingSummaryOutput> {
    const res = await fetch(`${API_BASE_URL}/generateBookingSummary`, {
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
