
'use server';
/**
 * @fileOverview Investor report summary generation flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { InvestorReportSummaryInputSchema, InvestorReportSummaryOutputSchema, type InvestorReportSummaryInput, type InvestorReportSummaryOutput } from '@/lib/types';


const investorReportSummaryPrompt = ai.definePrompt({
  name: 'investorReportSummaryPrompt',
  input: { schema: InvestorReportSummaryInputSchema },
  output: { schema: InvestorReportSummaryOutputSchema },
  prompt: `Generate a brief, informative summary for investor {{investorName}}'s report for {{month}} {{year}}. Data: Total Net Profit: ₱{{totalNetProfit}}, Share: {{sharePercentage}}%, Payout: ₱{{investorShare}}. Comment on investment performance.`,
});

export const generateInvestorReportSummaryFlow = ai.defineFlow(
  {
    name: 'generateInvestorReportSummaryFlow',
    inputSchema: InvestorReportSummaryInputSchema,
    outputSchema: InvestorReportSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await investorReportSummaryPrompt(input);
    return output!;
  }
);


// Client-facing function
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export async function generateInvestorReportSummary(input: InvestorReportSummaryInput): Promise<InvestorReportSummaryOutput> {
    const res = await fetch(`${API_BASE_URL}/generateInvestorReportSummary`, {
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
