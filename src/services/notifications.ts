
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
    const q = query(
        notificationsCollection, 
        where('userId', '==', userId), 
        where('isRead', '==', false),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
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
    
    const promises = snapshot.docs.map(document => 
        updateDoc(doc(db, 'notifications', document.id), { isRead: true })
    );

    await Promise.all(promises);
}
