
'use client';

import type { UnitIncident } from '@/lib/types';

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
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

export async function getIncidentsForUnit(unitId: string, daysAgo?: number): Promise<UnitIncident[]> {
    let path = `/incidents/${unitId}`;
    if (daysAgo) {
        path += `?daysAgo=${daysAgo}`;
    }
    return fetchFromApi(path);
}

export async function addIncident(incidentData: Omit<UnitIncident, 'id'>): Promise<{ id: string }> {
    return fetchFromApi('/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData),
    });
}

export async function updateIncident(incidentData: UnitIncident): Promise<void> {
    const { id, ...data } = incidentData;
    if (!id) throw new Error("Incident ID is required for update");
    await fetchFromApi(`/incident/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function deleteIncident(incidentId: string): Promise<void> {
    await fetchFromApi(`/incident/${incidentId}`, {
        method: 'DELETE',
    });
}
