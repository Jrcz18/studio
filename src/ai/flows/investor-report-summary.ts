
'use client';
/**
 * @fileOverview Client-side function to generate a concise summary for an investor's monthly report by calling a backend API.
 *
 * - generateInvestorReportSummary - Calls the backend to generate the investor report summary.
 * - InvestorReportSummaryInput - The input type for the function.
 * - InvestorReportSummaryOutput - The return type for the function.
 */

import { z } from 'zod';

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

export type InvestorReportSummaryInput = z.infer<typeof InvestorReportSummaryInputSchema>;
export type InvestorReportSummaryOutput = z.infer<typeof InvestorReportSummaryOutputSchema>;

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
