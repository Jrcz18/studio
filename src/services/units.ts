
'use client';

import type { Unit } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchFromApi(path: string, options: RequestInit = {}) {
    if (!API_BASE_URL) {
        throw new Error("API_BASE_URL not configured.");
    }
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed with status ' + response.status }));
        throw new Error(errorData.error || 'An unknown API error occurred');
    }
    if (response.status === 204) { // No Content
        return null;
    }
    return response.json();
}

export async function getUnits(): Promise<Unit[]> {
    return fetchFromApi('/units');
}

export async function getUnit(unitId: string): Promise<Unit | null> {
    return fetchFromApi(`/unit/${unitId}`);
}

export async function addUnit(unitData: Omit<Unit, 'id'>): Promise<{ id: string }> {
    return fetchFromApi('/unit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitData),
    });
}

export async function updateUnit(unitData: Unit): Promise<void> {
    const { id, ...data } = unitData;
    if (!id) throw new Error("Unit ID is required for update");
    await fetchFromApi(`/unit/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function deleteUnit(unitId: string): Promise<void> {
    await fetchFromApi(`/unit/${unitId}`, {
        method: 'DELETE',
    });
}
