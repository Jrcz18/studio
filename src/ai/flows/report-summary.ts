
'use server';
/**
 * @fileOverview Report summary generation flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ReportSummaryInputSchema = z.object({
  unitName: z.string().describe('The name of the rental unit or "All Units".'),
  month: z.string().describe('The month of the report (e.g., "January").'),
  year: z.number().describe('The year of the report (e.g., 2024).'),
  totalRevenue: z.number().describe('The total revenue for the month.'),
  totalExpenses: z.number().describe('The total expenses for the month.'),
  netProfit: z.number().describe('The net profit for the month.'),
});
export type ReportSummaryInput = z.infer<typeof ReportSummaryInputSchema>;

export const ReportSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise, insightful summary of the monthly report.'),
});
export type ReportSummaryOutput = z.infer<typeof ReportSummaryOutputSchema>;

const reportSummaryPrompt = ai.definePrompt({
  name: 'reportSummaryPrompt',
  input: { schema: ReportSummaryInputSchema },
  output: { schema: ReportSummaryOutputSchema },
  prompt: `Generate a brief, professional summary for the {{month}} {{year}} report of {{unitName}}. Data: Revenue ₱{{totalRevenue}}, Expenses ₱{{totalExpenses}}, Net Profit ₱{{netProfit}}. Highlight key performance.`,
});

export const generateReportSummaryFlow = ai.defineFlow(
  {
    name: 'generateReportSummaryFlow',
    inputSchema: ReportSummaryInputSchema,
    outputSchema: ReportSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await reportSummaryPrompt(input);
    return output!;
  }
);


// Client-facing function
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export async function generateReportSummary(input: ReportSummaryInput): Promise<ReportSummaryOutput> {
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
}
