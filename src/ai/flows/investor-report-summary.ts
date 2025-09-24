
'use server';
/**
 * @fileOverview Investor report summary generation flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const InvestorReportSummaryInputSchema = z.object({
  investorName: z.string().describe("The name of the investor."),
  month: z.string().describe('The month of the report (e.g., "January").'),
  year: z.number().describe('The year of the report (e.g., 2024).'),
  totalNetProfit: z.number().describe("The total net profit from the investor's units."),
  sharePercentage: z.number().describe("The investor's share percentage."),
  investorShare: z.number().describe("The final amount of the investor's share."),
});
export type InvestorReportSummaryInput = z.infer<typeof InvestorReportSummaryInputSchema>;

export const InvestorReportSummaryOutputSchema = z.object({
  summary: z.string().describe("A concise, insightful summary of the investor's monthly report."),
});
export type InvestorReportSummaryOutput = z.infer<typeof InvestorReportSummaryOutputSchema>;

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
