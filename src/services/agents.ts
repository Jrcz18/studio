
'use client';

import type { Agent } from '@/lib/types';

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


export async function getAgents(): Promise<Agent[]> {
    return fetchFromApi('/agents');
}

export async function addAgent(agentData: Omit<Agent, 'id'>): Promise<{ id: string }> {
    return fetchFromApi('/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData),
    });
}

export async function updateAgent(agentData: Agent): Promise<void> {
    const { id, ...data } = agentData;
    if (!id) throw new Error("Agent ID is required for update");
    await fetchFromApi(`/agent/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function deleteAgent(agentId: string): Promise<void> {
    await fetchFromApi(`/agent/${agentId}`, {
        method: 'DELETE',
    });
}
