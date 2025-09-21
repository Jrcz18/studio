
'use server';
/**
 * @fileOverview Generates a concise summary for a financial report.
 *
 * - generateReportSummary - A function that generates the report summary.
 * - ReportSummaryInput - The input type for the generateReportSummary function.
 * - ReportSummaryOutput - The return type for the generateReportSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReportSummaryInputSchema = z.object({
  unitName: z.string().describe('The name of the rental unit or "All Units".'),
  month: z.string().describe('The month of the report (e.g., "January").'),
  year: z.number().describe('The year of the report (e.g., 2024).'),
  totalRevenue: z.number().describe('The total revenue for the month.'),
  totalExpenses: z.number().describe('The total expenses for the month.'),
  netProfit: z.number().describe('The net profit for the month.'),
});
export type ReportSummaryInput = z.infer<typeof ReportSummaryInputSchema>;

const ReportSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise, insightful summary of the monthly report.'),
});
export type ReportSummaryOutput = z.infer<typeof ReportSummaryOutputSchema>;

export async function generateReportSummary(
  input: ReportSummaryInput
): Promise<ReportSummaryOutput> {
  
  const reportSummaryPrompt = ai.definePrompt({
    name: 'reportSummaryPrompt',
    input: {schema: ReportSummaryInputSchema},
    output: {schema: ReportSummaryOutputSchema},
    prompt: `You are a financial analyst AI for a property management company.
    
    Generate a brief, insightful summary for the monthly report of {{unitName}} for {{month}} {{year}}.

    The financial data is as follows:
    - Total Revenue: ₱{{totalRevenue}}
    - Total Expenses: ₱{{totalExpenses}}
    - Net Profit: ₱{{netProfit}}

    Provide a one or two-sentence summary highlighting the key performance aspect (e.g., strong profitability, high expenses, a loss, etc.). The tone should be professional and informative.
    `,
  });

  const generateReportSummaryFlow = ai.defineFlow(
    {
      name: 'generateReportSummaryFlow',
      inputSchema: ReportSummaryInputSchema,
      outputSchema: ReportSummaryOutputSchema,
    },
    async input => {
      const {output} = await reportSummaryPrompt(input);
      return output!;
    }
  );

  return generateReportSummaryFlow(input);
}
