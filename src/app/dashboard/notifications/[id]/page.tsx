
import { getAllNotifications, getNotification } from '@/services/notifications';
import NotificationDetailClient from '@/components/dashboard/notifications/notification-detail-client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// This tells Next.js to pre-render these pages at build time
export async function generateStaticParams() {
    try {
        const notifications = await getAllNotifications();
        // Ensure notifications and their IDs are valid before mapping
        return notifications
            .filter(notification => notification && notification.id)
            .map((notification) => ({
                id: notification.id!,
            }));
    } catch (error) {
        console.error("Failed to generate static params for notifications:", error);
        // Return an empty array on error to prevent build failure
        return [];
    }
}

export default async function NotificationDetailPage({ params }: { params: { id: string } }) {
    const notification = await getNotification(params.id);

    if (!notification) {
        notFound();
    }

    return (
        <div className="p-4">
             <div className="flex items-center mb-6">
                <Link href="/dashboard/notifications" className="mr-4 p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Notification Details</h2>
                    <p className="text-sm text-gray-500">Viewing a single notification.</p>
                </div>
            </div>
            <NotificationDetailClient notification={notification} />
        </div>
    );
}
