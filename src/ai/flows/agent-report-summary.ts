
'use client';
/**
 * @fileOverview Client-side function to generate a concise summary for an agent's monthly report by calling a backend API.
 *
 * - generateAgentReportSummary - A function that calls the backend to generate the agent report summary.
 * - AgentReportSummaryInput - The input type for the generateAgentReportSummary function.
 * - AgentReportSummaryOutput - The return type for the generateAgentReportSummary function.
 */

import { z } from 'zod';

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

export type AgentReportSummaryInput = z.infer<typeof AgentReportSummaryInputSchema>;
export type AgentReportSummaryOutput = z.infer<typeof AgentReportSummaryOutputSchema>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function generateAgentReportSummary(input: AgentReportSummaryInput): Promise<AgentReportSummaryOutput> {
    // TODO: Backend functionality is temporarily disabled until Firebase billing is enabled.
    // This is a placeholder response.
    console.log("Called generateAgentReportSummary with:", input);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return {
      summary: `AI summary for ${input.agentName} is temporarily disabled. Please enable billing and deploy Firebase Functions to activate this feature.`,
    };

    /*
    // Original code to be re-enabled later
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
    */
}
