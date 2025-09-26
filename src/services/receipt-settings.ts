
'use client';

import type { ReceiptSettings } from '@/lib/types';

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


export async function getReceiptSettings(): Promise<ReceiptSettings> {
    const settings = await fetchFromApi('/receipt-settings');
    if (settings) {
        return settings;
    }
    // Return default settings if nothing is configured in the backend
    return {
        wifiNetwork: 'Manila Prime WiFi',
        contactEmail: 'primestaycation24@gmail.com',
        checkinTime: '15:00',
        checkoutTime: '11:00'
    };
}

export async function updateReceiptSettings(settings: Partial<ReceiptSettings>): Promise<void> {
    await fetchFromApi('/receipt-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
}
