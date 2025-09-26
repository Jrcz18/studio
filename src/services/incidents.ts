
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


/**
 * Adds a new incident to the Firestore database via the backend API.
 * @param incidentData The data for the new incident.
 * @returns The ID of the newly created incident document.
 */
export async function addIncident(incidentData: Omit<UnitIncident, 'id'>): Promise<{ id: string }> {
    return fetchFromApi('/incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData),
    });
}

/**
 * Updates an existing incident in the Firestore database via the backend API.
 * @param incidentData The incident data to update, including its ID.
 */
export async function updateIncident(incidentData: UnitIncident): Promise<void> {
    const { id, ...data } = incidentData;
    if (!id) throw new Error("Incident ID is required for update");
    await fetchFromApi(`/incident/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

/**
 * Fetches all incidents for a specific unit via the backend API.
 * @param unitId The ID of the unit to fetch incidents for.
 * @param daysAgo (Optional) The number of days into the past to fetch incidents from.
 * @returns A promise that resolves to an array of incidents.
 */
export async function getIncidentsForUnit(unitId: string, daysAgo?: number): Promise<UnitIncident[]> {
    let path = `/incidents/${unitId}`;
    if (daysAgo) {
        path += `?daysAgo=${daysAgo}`;
    }
    return fetchFromApi(path);
}

    