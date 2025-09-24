
'use server';
/**
 * @fileOverview Agent report summary generation flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { AgentReportSummaryInputSchema, AgentReportSummaryOutputSchema, type AgentReportSummaryInput, type AgentReportSummaryOutput } from '@/lib/types';

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
