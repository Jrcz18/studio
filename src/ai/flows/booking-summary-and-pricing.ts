
'use client';
/**
 * @fileOverview Client-side function to generate a booking summary with pricing and availability by calling a backend API.
 *
 * - generateBookingSummary - A function that calls the backend to generate the booking summary.
 * - BookingSummaryInput - The input type for the generateBookingSummary function.
 * - BookingSummaryOutput - The return type for the generateBookingSummary function.
 */

import { type BookingSummaryInput, type BookingSummaryOutput } from '@/lib/types';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function generateBookingSummary(input: BookingSummaryInput): Promise<BookingSummaryOutput> {
    if (!API_BASE_URL) {
        throw new Error('API base URL is not configured.');
    }
    const res = await fetch(`${API_BASE_URL}/generateBookingSummary`, {
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
