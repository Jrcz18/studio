
'use client';
/**
 * @fileOverview Client-side function to generate a unit health report by calling a backend API.
 *
 * - generateUnitHealthReport - Calls the backend to generate the report.
 * - UnitHealthReportInput - The input type for the function.
 * - UnitHealthReportOutput - The return type for the function.
 */

import { z } from 'genkit';

export const UnitHealthReportInputSchema = z.object({
  unitId: z.string().describe('The ID of the unit to generate the report for.'),
  unitName: z.string().describe('The name of the unit.'),
});
export type UnitHealthReportInput = z.infer<typeof UnitHealthReportInputSchema>;

export const UnitHealthReportOutputSchema = z.object({
  healthScore: z.number().min(0).max(100).describe('A numerical health score from 0 (terrible) to 100 (perfect).'),
  summary: z.string().describe('A concise, natural-language summary of the unit\'s current health status.'),
  recommendations: z.array(z.string()).describe('A list of actionable recommendations to improve the unit\'s health.'),
});
export type UnitHealthReportOutput = z.infer<typeof UnitHealthReportOutputSchema>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function generateUnitHealthReport(input: UnitHealthReportInput): Promise<UnitHealthReportOutput> {
    const res = await fetch(`${API_BASE_URL}/generateUnitHealthReport`, {
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
