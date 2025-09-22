
'use client';
/**
 * @fileOverview Client-side function to generate a concise summary for a financial report by calling a backend API.
 *
 * - generateReportSummary - Calls the backend to generate the report summary.
 * - ReportSummaryInput - The input type for the function.
 * - ReportSummaryOutput - The return type for the function.
 */

import { z } from 'zod';

const ReportSummaryInputSchema = z.object({
    unitName: z.string().describe('The name of the rental unit or "All Units".'),
    month: z.string().describe('The month of the report (e.g., "January").'),
    year: z.number().describe('The year of the report (e.g., 2024).'),
    totalRevenue: z.number().describe('The total revenue for the month.'),
    totalExpenses: z.number().describe('The total expenses for the month.'),
    netProfit: z.number().describe('The net profit for the month.'),
});

const ReportSummaryOutputSchema = z.object({
    summary: z.string().describe('A concise, insightful summary of the monthly report.'),
});

export type ReportSummaryInput = z.infer<typeof ReportSummaryInputSchema>;
export type ReportSummaryOutput = z.infer<typeof ReportSummaryOutputSchema>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function generateReportSummary(input: ReportSummaryInput): Promise<ReportSummaryOutput> {
    // TODO: Backend functionality is temporarily disabled until Firebase billing is enabled.
    // This is a placeholder response.
    console.log("Called generateReportSummary with:", input);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return {
      summary: `AI summary for ${input.unitName} is temporarily disabled. Please enable billing and deploy Firebase Functions to activate this feature.`,
    };

    /*
    // Original code to be re-enabled later
    const res = await fetch(`${API_BASE_URL}/generateReportSummary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Request failed');
    }
    return res.json();
    */
}
