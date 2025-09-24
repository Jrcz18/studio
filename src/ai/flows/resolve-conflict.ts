
'use client';
/**
 * @fileOverview Client-side function for resolving booking conflicts.
 */
import type { ConflictResolutionInput, ConflictResolutionOutput } from '@/lib/types';


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function suggestConflictResolution(input: ConflictResolutionInput): Promise<ConflictResolutionOutput> {
    if (!API_BASE_URL) {
        throw new Error('API base URL is not configured.');
    }
    const res = await fetch(`${API_BASE_URL}/resolveConflict`, {
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
