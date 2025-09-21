
'use server';
/**
 * @fileOverview A flow to generate a health report for a rental unit.
 *
 * - generateUnitHealthReport - A function that analyzes unit incidents and generates a report.
 * - UnitHealthReportInput - The input type for the function.
 * - UnitHealthReportOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getIncidentsForUnit } from '@/services/incidents';
import type { UnitIncident } from '@/lib/types';


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


export async function generateUnitHealthReport(input: UnitHealthReportInput): Promise<UnitHealthReportOutput> {
  return generateUnitHealthReportFlow(input);
}


const healthReportPrompt = ai.definePrompt({
  name: 'unitHealthReportPrompt',
  input: {
    schema: z.object({
      unitName: z.string(),
      incidents: z.array(z.object({
        date: z.string(),
        type: z.string(),
        severity: z.string(),
        description: z.string(),
        isResolved: z.boolean(),
      })),
    })
  },
  output: { schema: UnitHealthReportOutputSchema },
  prompt: `You are an expert property management analyst. Your task is to generate a "Unit Health Report" for "{{unitName}}" based on a list of recent incidents.

A high health score (90-100) means the unit is in excellent shape with few to no minor issues.
A medium score (60-89) indicates some issues that need attention.
A low score (0-59) signifies significant problems that require immediate action.

Analyze the following incidents. Consider the frequency, severity, and type of incidents. Unresolved issues should negatively impact the score more.
{{#if incidents.length}}
Incidents:
{{#each incidents}}
- Date: {{this.date}}, Type: {{this.type}}, Severity: {{this.severity}}, Resolved: {{this.isResolved}}
  Description: "{{this.description}}"
{{/each}}
{{else}}
- No incidents reported in the last 90 days.
{{/if}}

Based on your analysis:
1.  Calculate a 'healthScore' between 0 and 100. A unit with no incidents should have a score of 100. A single high-severity unresolved issue should bring the score below 50.
2.  Write a brief 'summary' of the unit's condition.
3.  Provide a list of actionable 'recommendations'. If there are no issues, suggest a routine inspection.
`,
});


const generateUnitHealthReportFlow = ai.defineFlow(
  {
    name: 'generateUnitHealthReportFlow',
    inputSchema: UnitHealthReportInputSchema,
    outputSchema: UnitHealthReportOutputSchema,
  },
  async (input) => {
    // 1. Fetch recent incidents for the unit
    const incidents = await getIncidentsForUnit(input.unitId, 90); // Get incidents from the last 90 days

    // 2. Call the AI prompt with the fetched data
    const { output } = await healthReportPrompt({
      unitName: input.unitName,
      incidents: incidents,
    });

    if (!output) {
        throw new Error("Failed to generate health report from AI.");
    }
    
    return output;
  }
);
