
'use client';

import type { Investor } from '@/lib/types';

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


export async function getInvestors(): Promise<Investor[]> {
    return fetchFromApi('/investors');
}

export async function addInvestor(investorData: Omit<Investor, 'id'>): Promise<{ id: string }> {
    return fetchFromApi('/investor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(investorData),
    });
}

export async function updateInvestor(investorData: Investor): Promise<void> {
    const { id, ...data } = investorData;
    if (!id) throw new Error("Investor ID is required for update");
    await fetchFromApi(`/investor/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function deleteInvestor(investorId: string): Promise<void> {
    await fetchFromApi(`/investor/${investorId}`, {
        method: 'DELETE',
    });
}
