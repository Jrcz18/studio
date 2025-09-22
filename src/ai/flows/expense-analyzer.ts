
'use client';
/**
 * @fileOverview Client-side function to analyze an expense by calling a backend API.
 *
 * - analyzeExpense - A function that calls the backend to analyze the expense.
 * - ExpenseAnalysisInput - The input type for the analyzeExpense function.
 * - ExpenseAnalysisOutput - The return type for the analyzeExpense function.
 */

import { z } from 'zod';

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

export type ExpenseAnalysisInput = z.infer<typeof ExpenseAnalysisInputSchema>;
export type ExpenseAnalysisOutput = z.infer<typeof ExpenseAnalysisOutputSchema>;


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
