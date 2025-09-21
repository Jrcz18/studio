
'use server';
/**
 * @fileOverview Generates a concise summary for an agent's monthly report.
 *
 * - generateAgentReportSummary - A function that generates the agent report summary.
 * - AgentReportSummaryInput - The input type for the generateAgentReportSummary function.
 * - AgentReportSummaryOutput - The return type for the generateAgentReportSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export async function generateAgentReportSummary(
  input: z.infer<typeof AgentReportSummaryInputSchema>
): Promise<z.infer<typeof AgentReportSummaryOutputSchema>> {
  const AgentReportSummaryInputSchema = z.object({
    agentName: z.string().describe('The name of the agent.'),
    month: z.string().describe('The month of the report (e.g., "January").'),
    year: z.number().describe('The year of the report (e.g., 2024).'),
    totalBookings: z
      .number()
      .describe('The total number of bookings secured by the agent.'),
    totalRevenueGenerated: z
      .number()
      .describe("The total revenue generated from the agent's bookings."),
    totalCommission: z
      .number()
      .describe('The total commission earned by the agent.'),
  });

  const AgentReportSummaryOutputSchema = z.object({
    summary: z
      .string()
      .describe(
        "A concise, insightful summary of the agent's monthly report."
      ),
  });

  const reportSummaryPrompt = ai.definePrompt({
    name: 'agentReportSummaryPrompt',
    input: { schema: AgentReportSummaryInputSchema },
    output: { schema: AgentReportSummaryOutputSchema },
    prompt: `You are a performance analyst AI for a property management company.
    
    Generate a brief, insightful summary for the monthly performance report of agent {{agentName}} for {{month}} {{year}}.

    The performance data is as follows:
    - Total Bookings: {{totalBookings}}
    - Total Revenue Generated: ₱{{totalRevenueGenerated}}
    - Total Commission Earned: ₱{{totalCommission}}

    Provide a one or two-sentence summary highlighting the agent's performance. Comment on their contribution to revenue and whether it was a productive month for them. The tone should be professional and encouraging.
    `,
  });

  const generateReportSummaryFlow = ai.defineFlow(
    {
      name: 'generateAgentReportSummaryFlow',
      inputSchema: AgentReportSummaryInputSchema,
      outputSchema: AgentReportSummaryOutputSchema,
    },
    async (input) => {
      const { output } = await reportSummaryPrompt(input);
      return output!;
    }
  );

  return generateReportSummaryFlow(input);
}

export type AgentReportSummaryInput = z.infer<typeof import('./agent-report-summary').generateAgentReportSummary extends (input: infer I, ...args: any[]) => any ? I : never>;
export type AgentReportSummaryOutput = z.infer<typeof import('./agent-report-summary').generateAgentReportSummary extends (...args: any[]) => Promise<infer O> ? O : never>;
