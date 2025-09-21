
'use client';

import {
  CalendarDays,
  Building,
  ClipboardList,
  CircleDollarSign,
  User,
  Handshake,
  Cpu,
} from 'lucide-react';
import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUIContext } from '@/hooks/use-ui-context';

const actionComponents = [
  {
    label: 'AI Assistant',
    icon: Cpu,
    action: 'ai-chat',
    href: '',
  },
  {
    label: 'Add Booking',
    icon: CalendarDays,
    action: 'add',
    href: '/dashboard/bookings',
  },
  {
    label: 'Add Unit',
    icon: Building,
    action: 'add',
    href: '/dashboard/units',
  },
  {
    label: 'Add Reminder',
    icon: ClipboardList,
    action: 'add',
    href: '/dashboard/reminders',
  },
  {
    label: 'Add Expense',
    icon: CircleDollarSign,
    action: 'add',
    href: '/dashboard/expenses',
  },
  {
    label: 'Add Investor',
    icon: User,
    action: 'add',
    href: '/dashboard/investors',
  },
  {
    label: 'Add Agent',
    icon: Handshake,
    action: 'add',
    href: '/dashboard/agents',
  },
];

export function QuickActions({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { setIsAiChatOpen } = useUIContext();

  const handleNavigate = (href: string, action: string) => {
    onOpenChange(false);
    if (action === 'ai-chat') {
      setIsAiChatOpen(true);
    } else {
      router.push(`${href}?action=${action}`);
    }
  };

  const colorClasses = {
    'AI Assistant': 'bg-blue-50 hover:bg-blue-100 text-blue-800',
    'Add Booking': 'bg-green-50 hover:bg-green-100 text-green-800',
    'Add Unit': 'bg-purple-50 hover:bg-purple-100 text-purple-800',
    'Add Reminder': 'bg-yellow-50 hover:bg-yellow-100 text-yellow-800',
    'Add Expense': 'bg-red-50 hover:bg-red-100 text-red-800',
    'Add Investor': 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800',
    'Add Agent': 'bg-pink-50 hover:bg-pink-100 text-pink-800',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Actions</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 py-4 max-h-[60vh] overflow-y-auto">
          {actionComponents.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigate(item.href, item.action)}
              className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors aspect-square ${
                colorClasses[item.label as keyof typeof colorClasses]
              }`}
            >
              <item.icon className="text-3xl mb-2" />
              <span className="font-semibold text-center text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
