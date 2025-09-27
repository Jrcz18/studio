
'use client';

import type { Unit } from '@/lib/types';

const API_BASE_URL = "https://asia-southeast1-unified-booker.cloudfunctions.net/api";


async function fetchFromApi(path: string, options: RequestInit = {}) {
    if (!API_BASE_URL) {
        throw new Error("API_BASE_URL not configured.");
    }
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, mode: 'cors' });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed with status ' + response.status }));
        throw new Error(errorData.error || 'An unknown API error occurred');
    }
    return response.json();
}

export async function getUnits(): Promise<Unit[]> {
    return fetchFromApi('/units');
}
