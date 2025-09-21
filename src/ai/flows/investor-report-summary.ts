
'use server';
/**
 * @fileOverview Generates a concise summary for an investor's monthly report.
 *
 * - generateInvestorReportSummary - A function that generates the investor report summary.
 * - InvestorReportSummaryInput - The input type for the generateInvestorReportSummary function.
 * - InvestorReportSummaryOutput - The return type for the generateInvestorReportSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';


export async function generateInvestorReportSummary(
  input: z.infer<typeof InvestorReportSummaryInputSchema>
): Promise<z.infer<typeof InvestorReportSummaryOutputSchema>> {
  const InvestorReportSummaryInputSchema = z.object({
    investorName: z.string().describe("The name of the investor."),
    month: z.string().describe('The month of the report (e.g., "January").'),
    year: z.number().describe('The year of the report (e.g., 2024).'),
    totalNetProfit: z.number().describe("The total net profit from the investor's units."),
    sharePercentage: z.number().describe("The investor's share percentage."),
    investorShare: z.number().describe("The final amount of the investor's share."),
  });

  const InvestorReportSummaryOutputSchema = z.object({
    summary: z.string().describe("A concise, insightful summary of the investor's monthly report."),
  });

  const reportSummaryPrompt = ai.definePrompt({
    name: 'investorReportSummaryPrompt',
    input: { schema: InvestorReportSummaryInputSchema },
    output: { schema: InvestorReportSummaryOutputSchema },
    prompt: `You are a financial analyst AI for a property management company.
    
    Generate a brief, insightful summary for the monthly performance report for investor {{investorName}} for {{month}} {{year}}.

    The financial data for their invested units is as follows:
    - Total Net Profit (from all their units): ₱{{totalNetProfit}}
    - Investor's Share Percentage: {{sharePercentage}}%
    - Final Investor Share Payout: ₱{{investorShare}}

    Provide a one or two-sentence summary highlighting the performance of their investment for the month. Comment on whether it was a profitable month and the resulting payout. The tone should be professional, clear, and informative.
    `,
  });

  const generateReportSummaryFlow = ai.defineFlow(
    {
      name: 'generateInvestorReportSummaryFlow',
      inputSchema: InvestorReportSummaryInputSchema,
      outputSchema: InvestorReportSummaryOutputSchema,
    },
    async (input) => {
      const { output } = await reportSummaryPrompt(input);
      return output!;
    }
  );

  return generateReportSummaryFlow(input);
}


export type InvestorReportSummaryInput = z.infer<typeof import('./investor-report-summary').generateInvestorReportSummary extends (input: infer I, ...args: any[]) => any ? I : never>;
export type InvestorReportSummaryOutput = z.infer<typeof import('./investor-report-summary').generateInvestorReportSummary extends (...args: any[]) => Promise<infer O> ? O : never>;
