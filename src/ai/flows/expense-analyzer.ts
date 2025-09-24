
'use server';
/**
 * @fileOverview Expense analysis flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const ExpenseAnalysisInputSchema = z.object({
  description: z.string(),
  amount: z.number(),
});
export type ExpenseAnalysisInput = z.infer<typeof ExpenseAnalysisInputSchema>;

export const ExpenseAnalysisOutputSchema = z.object({
  category: z.enum([
    'utilities',
    'maintenance',
    'cleaning',
    'supplies',
    'insurance',
    'other',
  ]),
  isAnomaly: z.boolean(),
  anomalyReason: z.string().optional(),
});
export type ExpenseAnalysisOutput = z.infer<typeof ExpenseAnalysisOutputSchema>;

const expenseAnalysisPrompt = ai.definePrompt({
  name: 'expenseAnalysisPrompt',
  input: { schema: ExpenseAnalysisInputSchema },
  output: { schema: ExpenseAnalysisOutputSchema },
  prompt: `Analyze the expense: "{{description}}" - ₱{{amount}}. Suggest a category: 'utilities', 'maintenance', 'cleaning', 'supplies', 'insurance', 'other'. Is it an anomaly (e.g., electricity > ₱20,000)? If so, set isAnomaly to true and provide a reason.`,
});

export const expenseAnalysisFlow = ai.defineFlow(
  {
    name: 'expenseAnalysisFlow',
    inputSchema: ExpenseAnalysisInputSchema,
    outputSchema: ExpenseAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await expenseAnalysisPrompt(input);
    return output!;
  }
);


// Client-facing function
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export async function analyzeExpense(input: ExpenseAnalysisInput): Promise<ExpenseAnalysisOutput> {
    const res = await fetch(`${API_BASE_URL}/analyzeExpense`, {
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
