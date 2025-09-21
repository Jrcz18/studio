
'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import type { AppNotification } from '@/lib/types';

const notificationsCollection = collection(db, 'notifications');

// Get all notifications for a user, sorted by most recent
export async function getAllNotifications(userId: string): Promise<AppNotification[]> {
    const q = query(notificationsCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
}

// Get only unread notifications for a user
export async function getUnreadNotifications(userId: string): Promise<AppNotification[]> {
    const allNotifications = await getAllNotifications(userId);
    return allNotifications.filter(n => !n.isRead);
}


// Add a new notification
export async function addNotification(notificationData: Omit<AppNotification, 'id'>): Promise<string> {
    const docRef = await addDoc(notificationsCollection, notificationData);
    return docRef.id;
}

// Mark a specific notification as read
export async function markNotificationAsRead(notificationId: string): Promise<void> {
    if (!notificationId) throw new Error("Notification ID is required for update");
    const notificationDoc = doc(db, 'notifications', notificationId);
    await updateDoc(notificationDoc, { isRead: true });
}

// Mark all unread notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
    const q = query(notificationsCollection, where('userId', '==', userId), where('isRead', '==', false));
    const snapshot = await getDocs(q);
    
    // This query might require an index, but it's simpler. 
    // If it still fails, we can fetch all and filter client-side.
    try {
        const promises = snapshot.docs.map(document => 
            updateDoc(doc(db, 'notifications', document.id), { isRead: true })
        );
        await Promise.all(promises);
    } catch (e) {
        // Fallback for when index is not available.
        console.warn("Falling back to client-side filtering for marking notifications as read.");
        const allDocs = await getAllNotifications(userId);
        const unreadDocs = allDocs.filter(doc => !doc.isRead);
        const promises = unreadDocs.map(document =>
            updateDoc(doc(db, 'notifications', document.id!), { isRead: true })
        );
        await Promise.all(promises);
    }
}
