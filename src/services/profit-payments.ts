
'use client';

import type { ProfitPayment } from '@/lib/types';

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

export async function getProfitPayments(): Promise<ProfitPayment[]> {
    return fetchFromApi('/profit-payments');
}

export async function addProfitPayment(paymentData: Omit<ProfitPayment, 'id'>): Promise<{ id: string }> {
     return fetchFromApi('/profit-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
    });
}
