
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { AppNotification } from '@/lib/types';
import { getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/services/notifications';
import { Button } from '@/components/ui/button';
import { Bell, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const iconMap = {
    booking: <Calendar className="w-5 h-5 text-blue-500" />,
    expense: <DollarSign className="w-5 h-5 text-red-500" />,
    reminder: <Bell className="w-5 h-5 text-yellow-500" />,
    event: <Calendar className="w-5 h-5 text-purple-500" />,
    system: <Bell className="w-5 h-5 text-gray-500" />,
};

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (user) {
            setLoading(true);
            const data = await getAllNotifications(user.uid);
            setNotifications(data);
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleNotificationClick = async (notification: AppNotification) => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification.id!);
            // Optimistically update the UI
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };
    
    const handleMarkAllAsRead = async () => {
        if (user) {
            await markAllNotificationsAsRead(user.uid);
            setNotifications(prev => prev.map(n => ({...n, isRead: true })));
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Loading notifications...</div>;
    }

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                    <p className="text-sm text-gray-500">Your recent alerts and updates</p>
                </div>
                 <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={notifications.every(n => n.isRead)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark all as read
                </Button>
            </div>

            <div className="space-y-3">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={cn(
                                "fb-card p-4 flex items-start space-x-4 cursor-pointer transition-colors",
                                notification.isRead ? 'bg-white' : 'bg-yellow-50 border-yellow-200'
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                notification.isRead ? 'bg-gray-100' : 'bg-white'
                            )}>
                                {iconMap[notification.type]}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800">{notification.title}</p>
                                <p className="text-sm text-gray-600">{notification.description}</p>
                                <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
                            </div>
                            {!notification.isRead && (
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full self-center flex-shrink-0" aria-label="Unread"></div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16">
                        <Bell className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications yet</h3>
                        <p className="mt-1 text-sm text-gray-500">We'll let you know when something new comes up.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
