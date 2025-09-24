
'use client';
/**
 * @fileOverview Client-side function for sending a Discord notification.
 */

import type { DiscordNotificationInput, DiscordNotificationOutput } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function sendDiscordNotification(input: DiscordNotificationInput): Promise<DiscordNotificationOutput> {
    if (!API_BASE_URL) {
        throw new Error('API base URL is not configured.');
    }
    const res = await fetch(`${API_BASE_URL}/sendDiscordNotification`, {
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
