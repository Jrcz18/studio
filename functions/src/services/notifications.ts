
'use server';

import { getFirebaseAdmin } from '../lib/firebase-admin';
import type { AppNotification } from '../lib/types';


// Add a new notification
export async function addNotification(notificationData: Omit<AppNotification, 'id'>): Promise<string> {
    const { adminDb } = await getFirebaseAdmin();
    const docRef = await adminDb.collection('notifications').add({
        ...notificationData,
    });
    return docRef.id;
}
