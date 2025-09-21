
'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, where, getDoc, deleteDoc } from 'firebase/firestore';
import type { AppNotification } from '@/lib/types';

const notificationsCollection = collection(db, 'notifications');

// Get a single notification by its ID
export async function getNotification(notificationId: string): Promise<AppNotification | null> {
    const docRef = doc(db, 'notifications', notificationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AppNotification;
    }
    return null;
}

// Get all notifications for a user, sorted by most recent
export async function getAllNotifications(userId: string): Promise<AppNotification[]> {
    const q = query(notificationsCollection, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
    // Sort manually to avoid needing a composite index
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// Get only unread notifications for a user
export async function getUnreadNotifications(userId: string): Promise<AppNotification[]> {
    const allNotifications = await getAllNotifications(userId);
    return allNotifications.filter(n => !n.isRead);
}


// Add a new notification
export async function addNotification(notificationData: Omit<AppNotification, 'id' | 'link'>): Promise<string> {
    const docRef = await addDoc(notificationsCollection, {
        ...notificationData,
    });
    // Now update the document with its own ID in the link
    await updateDoc(docRef, { link: `/dashboard/notifications/${docRef.id}`});
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
    const allNotifications = await getAllNotifications(userId);
    const unreadNotifications = allNotifications.filter(n => !n.isRead);

    const promises = unreadNotifications.map(notification => 
        updateDoc(doc(db, 'notifications', notification.id!), { isRead: true })
    );
    await Promise.all(promises);
}

// Delete a specific notification
export async function deleteNotification(notificationId: string): Promise<void> {
    if (!notificationId) throw new Error("Notification ID is required to delete.");
    const notificationDoc = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationDoc);
}
