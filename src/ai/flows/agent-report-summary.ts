
'use server';
/**
 * @fileOverview Agent report summary generation flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const AgentReportSummaryInputSchema = z.object({
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
export type AgentReportSummaryInput = z.infer<typeof AgentReportSummaryInputSchema>;

export const AgentReportSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      "A concise, insightful summary of the agent's monthly report."
    ),
});
export type AgentReportSummaryOutput = z.infer<typeof AgentReportSummaryOutputSchema>;

const agentReportSummaryPrompt = ai.definePrompt({
  name: 'agentReportSummaryPrompt',
  input: { schema: AgentReportSummaryInputSchema },
  output: { schema: AgentReportSummaryOutputSchema },
  prompt: `Generate a brief, encouraging summary for agent {{agentName}}'s report for {{month}} {{year}}. Data: Bookings: {{totalBookings}}, Revenue Generated: ₱{{totalRevenueGenerated}}, Commission: ₱{{totalCommission}}. Comment on performance.`,
});

export const generateAgentReportSummaryFlow = ai.defineFlow(
  {
    name: 'generateAgentReportSummaryFlow',
    inputSchema: AgentReportSummaryInputSchema,
    outputSchema: AgentReportSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await agentReportSummaryPrompt(input);
    return output!;
  }
);

// Client-facing function
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export async function generateAgentReportSummary(input: AgentReportSummaryInput): Promise<AgentReportSummaryOutput> {
    const res = await fetch(`${API_BASE_URL}/generateAgentReportSummary`, {
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
