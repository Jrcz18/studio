
'use server';
/**
 * @fileOverview Unit health report generation flow.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

export const UnitHealthReportInputSchema = z.object({
  unitId: z.string(),
  unitName: z.string(),
});
export type UnitHealthReportInput = z.infer<typeof UnitHealthReportInputSchema>;

export const UnitHealthReportOutputSchema = z.object({
  healthScore: z.number().min(0).max(100),
  summary: z.string(),
  recommendations: z.array(z.string()),
});
export type UnitHealthReportOutput = z.infer<typeof UnitHealthReportOutputSchema>;

const healthReportPrompt = ai.definePrompt({
  name: 'unitHealthReportPrompt',
  input: { schema: z.object({ unitName: z.string(), incidents: z.array(z.any()) }) },
  output: { schema: UnitHealthReportOutputSchema },
  prompt: `Generate a "Unit Health Report" for "{{unitName}}" based on incidents. Score 0-100. High score (90-100) is excellent. Low score (0-59) needs immediate action. Analyze frequency, severity, and resolution of incidents. A single high-severity unresolved issue should drop score below 50. Provide a healthScore, a brief summary, and actionable recommendations. Incidents: {{#if incidents.length}}{{#each incidents}}- Date:{{this.date}},Type:{{this.type}},Severity:{{this.severity}},Resolved:{{this.isResolved}},Desc:"{{this.description}}"{{/each}}{{else}}- No incidents.{{/if}}`,
});

export const generateUnitHealthReportFlow = ai.defineFlow(
  {
    name: 'generateUnitHealthReportFlow',
    inputSchema: UnitHealthReportInputSchema,
    outputSchema: UnitHealthReportOutputSchema,
  },
  async (input) => {
    const { adminDb } = await getFirebaseAdmin();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 90);
    const incidentsSnapshot = await adminDb
      .collection('incidents')
      .where('unitId', '==', input.unitId)
      .where('date', '>=', pastDate.toISOString().split('T')[0])
      .orderBy('date', 'desc')
      .get();
    const incidents = incidentsSnapshot.docs.map((doc) => doc.data());
    const { output } = await healthReportPrompt({
      unitName: input.unitName,
      incidents: incidents,
    });
    if (!output) {
      throw new Error('Failed to generate health report from AI.');
    }
    return output;
  }
);


// Client-facing function
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
