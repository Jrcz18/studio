
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth.tsx';
import { getUnreadNotifications } from '@/services/notifications';
import { addNotification } from '@/services/notifications';
import { findLocalEvents } from '@/ai/tools';
import type { AppNotification } from '@/lib/types';

const Header = () => {
  const [currentDate, setCurrentDate] = useState('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { user } = useAuth();


  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    setCurrentDate(now.toLocaleDateString('en-US', options));
    
    async function fetchNotifications() {
        if(user) {
            const notificationsData = await getUnreadNotifications(user.uid);
            setNotifications(notificationsData);
        }
    }
    
    async function checkForEvents() {
        if (user) {
            // This check should ideally be done once per day
            const lastChecked = localStorage.getItem('lastEventCheck');
            const today = new Date().toISOString().split('T')[0];
            if (lastChecked === today) return;

            try {
                const events = await findLocalEvents({ location: 'Makati' });
                if (events) {
                    await addNotification({
                        userId: user.uid,
                        type: 'event',
                        title: 'Local Events Nearby!',
                        description: 'Potential for booking surge. ' + events.split('\n')[1].trim().substring(2),
                        isRead: false,
                        createdAt: new Date().toISOString(),
                    });
                    localStorage.setItem('lastEventCheck', today);
                }
            } catch (error) {
                console.error("Failed to check for local events:", error);
            }
        }
    }

    fetchNotifications();
    checkForEvents();
    
    // Set up a listener or periodic fetch for real-time updates
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);

  }, [user]);

  const notificationCount = useMemo(() => {
    return notifications.length;
  }, [notifications]);
  

  return (
    <header className="bg-yellow-400 shadow-md z-10" id="app-header">
      {/* Main Header Section */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-yellow-600 text-sm font-bold professional-title">MP</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-black professional-title truncate">Manila Prime</h1>
              <p className="text-xs text-black professional-subtitle">Management App</p>
            </div>
          </div>
          
          {/* Notification and Settings */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Link href="/dashboard/notifications" className="w-9 h-9 bg-white rounded-full flex items-center justify-center relative border border-gray-300 hover:border-yellow-600 transition-colors">
                <span className="text-gray-600 text-lg">🔔</span>
                {notificationCount > 0 && (
                    <span id="notificationBadge" className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                )}
            </Link>

            <Link href="/dashboard/settings" className="w-9 h-9 bg-white rounded-full flex items-center justify-center border border-gray-300 hover:border-yellow-600 transition-colors">
              <span className="text-gray-600 text-lg">⚙️</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Date Display */}
      <div className="px-4 py-2 bg-yellow-300 border-t border-yellow-500">
        <div className="text-center">
          <p id="currentDate" className="text-xs font-medium text-black professional-subtitle">
            {currentDate}
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
