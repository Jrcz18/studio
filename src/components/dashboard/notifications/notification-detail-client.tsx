
'use client';

import React, { useEffect } from 'react';
import { markNotificationAsRead } from '@/services/notifications';
import type { AppNotification } from '@/lib/types';
import { ArrowLeft, Bell, Calendar, DollarSign } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

const iconMap: Record<string, React.ReactNode> = {
    booking: <Calendar className="w-8 h-8 text-blue-500" />,
    expense: <DollarSign className="w-8 h-8 text-red-500" />,
    reminder: <Bell className="w-8 h-8 text-yellow-500" />,
    event: <Calendar className="w-8 h-8 text-purple-500" />,
    system: <Bell className="w-8 h-8 text-gray-500" />,
};

export default function NotificationDetailClient({ notification }: { notification: AppNotification }) {
    
    useEffect(() => {
        // Mark as read when the component mounts
        if (notification && !notification.isRead) {
            markNotificationAsRead(notification.id!);
        }
    }, [notification]);


    if (!notification) {
        return <div className="p-4 text-center text-red-500">Notification not found.</div>;
    }

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

            <div className="prime-card p-6">
                <div className="flex items-start space-x-4">
                     <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {iconMap[notification.type]}
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                        <h1 className="text-2xl font-bold text-gray-800 mt-1">{notification.title}</h1>
                        <p className="mt-4 text-gray-700 whitespace-pre-wrap">{notification.description}</p>
                    </div>
                </div>

                {notification.data && Object.keys(notification.data).length > 0 && (
                    <div className="mt-6 border-t pt-4">
                        <h3 className="font-semibold text-gray-800 mb-2">Associated Data</h3>
                        <pre className="bg-gray-50 p-3 rounded-md text-xs text-gray-600 overflow-x-auto">
                            {JSON.stringify(notification.data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
