
'use client';

import type { AppNotification } from '@/lib/types';
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
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
        return null;
    }
    return response.json();
}

// Get all notifications for a user
export async function getAllNotifications(userId: string): Promise<AppNotification[]> {
    return fetchFromApi(`/notifications/${userId}`);
}

// Add a new notification
export async function addNotification(notificationData: Omit<AppNotification, 'id'>): Promise<{ id: string }> {
    return fetchFromApi('/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationData),
    });
}

// Mark a specific notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
    await fetchFromApi(`/notification/${notificationId}/read`, {
        method: 'PUT',
    });
}

// Mark all unread notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    await fetchFromApi(`/notifications/${userId}/mark-all-read`, {
        method: 'POST',
    });
}

// Delete a specific notification
export async function deleteNotification(notificationId: string): Promise<void> {
    await fetchFromApi(`/notification/${notificationId}`, {
        method: 'DELETE',
    });
}

    