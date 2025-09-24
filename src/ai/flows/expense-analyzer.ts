
'use server';
/**
 * @fileOverview Expense analysis flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ExpenseAnalysisInputSchema, ExpenseAnalysisOutputSchema, type ExpenseAnalysisInput, type ExpenseAnalysisOutput } from '@/lib/types';


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
