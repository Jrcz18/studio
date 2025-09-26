
'use client';

import type { Reminder } from '@/lib/types';
import { auth } from '@/lib/firebase';

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


export async function getReminders(): Promise<Reminder[]> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return fetchFromApi(`/reminders/${user.uid}`);
}

export async function addReminder(reminderData: Omit<Reminder, 'id'>): Promise<{id: string}> {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const payload = {
        ...reminderData,
        userId: user.uid,
    };

    return fetchFromApi('/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export async function updateReminder(reminderData: Reminder): Promise<void> {
    const { id, ...data } = reminderData;
    if (!id) throw new Error("Reminder ID is required for update");
    await fetchFromApi(`/reminder/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function deleteReminder(reminderId: string): Promise<void> {
    await fetchFromApi(`/reminder/${reminderId}`, {
        method: 'DELETE',
    });
}
