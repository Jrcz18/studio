
import React from 'react';
import { getNotification, getAllNotifications } from '@/services/notifications';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import NotificationDetailClient from '@/components/dashboard/notifications/notification-detail-client';
import type { AppNotification } from '@/lib/types';


// This function is called at build time to generate static pages for each notification
export async function generateStaticParams() {
  const notifications = await getAllNotifications();
  return notifications.map((notification) => ({
    id: notification.id,
  }));
}

async function getNotificationData(id: string): Promise<AppNotification | null> {
    try {
        const notifData = await getNotification(id);
        return notifData;
    } catch (error) {
        console.error(`Failed to fetch notification ${id}:`, error);
        return null;
    }
}


export default async function NotificationDetailPage({ params }: { params: { id: string } }) {
    const notification = await getNotificationData(params.id);

    if (!notification) {
        return (
             <div className="p-4">
                <div className="flex items-center mb-6">
                    <Link href="/dashboard/notifications" className="mr-4 p-2 rounded-full hover:bg-gray-100">
                       <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Notification Details</h2>
                    </div>
                </div>
                <div className="p-4 text-center text-red-500">Notification not found or failed to load.</div>
            </div>
        );
    }


    return (
        <NotificationDetailClient notification={notification} />
    );
}
