
'use client';

import { usePathname, useRouter } from 'next/navigation';
import Header from '@/components/dashboard/header';
import BottomNav from '@/components/dashboard/bottom-nav';
import { useAuth } from '@/hooks/use-auth.tsx';
import React, { useEffect } from 'react';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { UIProvider, useUIContext } from '@/hooks/use-ui-context';

const HomeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="fb-nav-icon"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const BookingsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="fb-nav-icon"
  >
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M3 10h18" />
  </svg>
);

const TasksIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="fb-nav-icon"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
  </svg>
);

const MoreIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="fb-nav-icon"
  >
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5"cy="12" r="1" />
  </svg>
);

function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const {
    isAddUnitOpen,
    isEditUnitOpen,
    isAddBookingOpen,
    isEditBookingOpen,
    isConflictDialogOpen,
    isAddAgentOpen,
    isAddExpenseOpen,
    isAddInvestorOpen,
    isPayProfitOpen,
    isAddReminderOpen,
    isQuickActionsOpen,
    setIsQuickActionsOpen,
  } = useUIContext();

  const isAnyDialogOpen =
    isAddUnitOpen ||
    isEditUnitOpen ||
    isAddBookingOpen ||
    isEditBookingOpen ||
    isConflictDialogOpen ||
    isAddAgentOpen ||
    isAddExpenseOpen ||
    isAddInvestorOpen ||
    isPayProfitOpen ||
    isAddReminderOpen ||
    isQuickActionsOpen;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: HomeIcon },
    { href: '/dashboard/bookings', label: 'Bookings', icon: BookingsIcon },
    { href: '/dashboard/reminders', label: 'Tasks', icon: TasksIcon },
    { href: '/dashboard/more', label: 'More', icon: MoreIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-gray-50 h-screen mx-auto grid grid-rows-[auto_1fr_auto] overflow-hidden">
      <Header />
      <main
        className={`relative ${
          isAnyDialogOpen ? 'overflow-hidden' : 'overflow-y-auto'
        }`}
      >
        {children}
      </main>
      <div className="relative z-10">
        <BottomNav
          navItems={navItems}
          pathname={pathname}
          onQuickActionsOpen={() => setIsQuickActionsOpen(true)}
        />
      </div>
      <QuickActions
        open={isQuickActionsOpen}
        onOpenChange={setIsQuickActionsOpen}
      />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIProvider>
      <Layout>{children}</Layout>
    </UIProvider>
  );
}
