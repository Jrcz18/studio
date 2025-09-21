
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth.tsx';
import { getReminders } from '@/services/reminders';
import { getBookings } from '@/services/bookings';
import { getExpenses } from '@/services/expenses';
import type { Reminder, Booking, Expense } from '@/lib/types';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { ActivityBookingIcon, ActivityPaymentIcon } from './icons';
import { findLocalEvents } from '@/ai/tools';
import { CalendarSearch } from 'lucide-react';


const Header = () => {
  const [currentDate, setCurrentDate] = useState('');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [localEvents, setLocalEvents] = useState<string>('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
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
    
    async function fetchData() {
        if(user) {
            const [remindersData, bookingsData, expensesData, eventsData] = await Promise.all([
              getReminders(),
              getBookings(),
              getExpenses(),
              findLocalEvents({ location: 'Makati' }) // Hardcoded location for now
            ]);
            setReminders(remindersData);
            setBookings(bookingsData);
            setExpenses(expensesData);
            setLocalEvents(eventsData);
        }
    }
    fetchData();

    if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
    }

  }, [user]);

  const notificationCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueReminders = reminders.filter(r => {
        if (r.status === 'completed') return false;
        
        const dueDate = new Date(r.dueDate);
        const userTimezoneOffset = dueDate.getTimezoneOffset() * 60000;
        const adjustedDueDate = new Date(dueDate.getTime() + userTimezoneOffset);
        adjustedDueDate.setHours(0, 0, 0, 0);

        return adjustedDueDate <= today;
    }).length;
    
    const eventCount = localEvents ? 1 : 0;
    
    return overdueReminders + eventCount;

  }, [reminders, localEvents]);

  const recentActivities = useMemo(() => {
    const bookingActivities = bookings.map(b => ({
      type: 'booking' as const,
      icon: ActivityBookingIcon,
      title: 'New booking',
      description: `${b.guestFirstName} ${b.guestLastName} - ₱${b.totalAmount.toLocaleString()}`,
      time: b.createdAt,
      color: 'blue'
    }));
  
    const expenseActivities = expenses.filter(e => e.status === 'paid').map(e => ({
      type: 'expense' as const,
      icon: ActivityPaymentIcon,
      title: 'Expense paid',
      description: `${e.title} - ₱${e.amount.toLocaleString()}`,
      time: e.date,
      color: 'green'
    }));

    const eventActivities = localEvents ? [{
      type: 'event' as const,
      icon: CalendarSearch,
      title: 'Local Events Found',
      description: localEvents.split('\n')[1].trim().substring(2), // Show first event
      time: new Date().toISOString(),
      color: 'orange'
    }] : [];
  
    return [...eventActivities, ...bookingActivities, ...expenseActivities]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [bookings, expenses, localEvents]);
  

  return (
    <>
      <header className="bg-yellow-400 shadow-md z-10" ref={headerRef} id="app-header">
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
              <Sheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                  <SheetTrigger asChild>
                      <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center relative border border-gray-300 hover:border-yellow-600 transition-colors">
                          <span className="text-gray-600 text-lg">🔔</span>
                          {notificationCount > 0 && (
                              <span id="notificationBadge" className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                              {notificationCount > 9 ? '9+' : notificationCount}
                              </span>
                          )}
                      </button>
                  </SheetTrigger>
                  <SheetContent 
                      side="top" 
                      className="w-full max-w-sm mx-auto rounded-b-lg p-6 max-h-[70vh] overflow-y-auto"
                      style={{ top: `${headerHeight + 12}px` }}
                      showOverlay={false}
                  >
                      <SheetTitle className="sr-only">Notifications</SheetTitle>
                        <div>
                          <div>
                              <h3 className="font-semibold mb-4">Recent Notifications</h3>
                          </div>
                          <div className="space-y-4">
                              {recentActivities.length > 0 ? (
                                  recentActivities.map((activity, index) => (
                                      <div key={index} className="flex items-start space-x-3 p-2">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-${activity.color}-100`}>
                                              <activity.icon className={`w-4 h-4 text-${activity.color}-600`} />
                                          </div>
                                          <div className="flex-1">
                                              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                              <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                                              <p className="text-xs text-gray-400 mt-1">{formatDate(activity.time)}</p>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="text-center py-8">
                                      <p className="text-gray-500">No new notifications</p>
                                  </div>
                              )}
                          </div>
                          <div className="border-t pt-4 mt-4">
                              <Button asChild variant="outline" className="w-full">
                                  <Link href="/dashboard/reminders">
                                      View All Reminders
                                  </Link>
                              </Button>
                          </div>
                        </div>
                  </SheetContent>
              </Sheet>

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
    </>
  );
};

export default Header;
