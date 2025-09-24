
'use client';
/**
 * @fileOverview Client-side function for generating a unit health report.
 */
import type { UnitHealthReportInput, UnitHealthReportOutput } from '@/lib/types';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function generateUnitHealthReport(input: UnitHealthReportInput): Promise<UnitHealthReportOutput> {
    if (!API_BASE_URL) {
        throw new Error('API base URL is not configured.');
    }
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
