
'use server';
/**
 * @fileOverview Analyzes an expense to suggest a category and detect anomalies.
 *
 * - analyzeExpense - A function that analyzes the expense.
 * - ExpenseAnalysisInput - The input type for the analyzeExpense function.
 * - ExpenseAnalysisOutput - The return type for the analyzeExpense function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';


export async function analyzeExpense(
  input: z.infer<typeof ExpenseAnalysisInputSchema>
): Promise<z.infer<typeof ExpenseAnalysisOutputSchema>> {
  const ExpenseAnalysisInputSchema = z.object({
    description: z.string().describe('The description of the expense.'),
    amount: z.number().describe('The amount of the expense.'),
  });

  const ExpenseAnalysisOutputSchema = z.object({
    category: z
      .enum([
        'utilities',
        'maintenance',
        'cleaning',
        'supplies',
        'insurance',
        'other',
      ])
      .describe('The suggested category for the expense.'),
    isAnomaly: z
      .boolean()
      .describe('Whether the expense is considered an anomaly.'),
    anomalyReason: z
      .string()
      .optional()
      .describe('The reason if the expense is an anomaly.'),
  });

  const expenseAnalysisPrompt = ai.definePrompt({
    name: 'expenseAnalysisPrompt',
    input: { schema: ExpenseAnalysisInputSchema },
    output: { schema: ExpenseAnalysisOutputSchema },
    prompt: `You are an AI assistant for a property management company. Analyze the following expense details.

  Expense Description: "{{description}}"
  Expense Amount: ₱{{amount}}

  Based on the description, suggest the most appropriate category from the following options: 'utilities', 'maintenance', 'cleaning', 'supplies', 'insurance', 'other'.

  Also, determine if this expense is an anomaly. An anomaly could be an unusually high amount for a typical expense (e.g., an electricity bill over ₱20,000) or an expense that seems unrelated to property management. 
  
  Set 'isAnomaly' to true if it is an anomaly and provide a brief reason.
  `,
  });

  const expenseAnalysisFlow = ai.defineFlow(
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

  return expenseAnalysisFlow(input);
}


export type ExpenseAnalysisInput = z.infer<typeof import('./expense-analyzer').analyzeExpense extends (input: infer I, ...args: any[]) => any ? I : never>;
export type ExpenseAnalysisOutput = z.infer<typeof import('./expense-analyzer').analyzeExpense extends (...args: any[]) => Promise<infer O> ? O : never>;
