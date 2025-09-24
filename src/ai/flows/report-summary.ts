
'use server';
/**
 * @fileOverview Report summary generation flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ReportSummaryInputSchema, ReportSummaryOutputSchema, type ReportSummaryInput, type ReportSummaryOutput } from '@/lib/types';


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
