
'use client';

import {
  Building,
  LineChart,
  Users,
  Handshake,
  CircleDollarSign,
  Receipt,
  Bell,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const managementItems = [
  { label: 'Units', icon: Building, href: '/dashboard/units' },
  {
    label: 'Investor Dashboard',
    icon: Users,
    href: '/dashboard/investors',
  },
  {
    label: 'Agent Management',
    icon: Handshake,
    href: '/dashboard/agents',
  },
  { label: 'Expenses', icon: CircleDollarSign, href: '/dashboard/expenses' },
];

const analyticsItems = [
    { label: 'Reports', icon: LineChart, href: '/dashboard/reports' },
];

const appItems = [
    { label: 'Notifications', icon: Bell, href: '/dashboard/notifications' },
    { label: 'Receipt Settings', icon: Receipt, href: '/dashboard/settings/receipt' },
]


export default function MorePage() {
  const router = useRouter();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">More Options</h2>
          <p className="text-sm text-gray-500">
            Management, settings, and account options
          </p>
        </div>
      </div>
      <div className="space-y-3">
        
        <h3 className="text-sm font-semibold text-gray-500 px-2 mt-4">Management</h3>
        {managementItems.map((item) => (
          <Link key={item.href} href={item.href} className="block prime-card p-0 no-underline hover:border-prime-yellow">
            <div className="flex items-center space-x-4 p-4">
                <item.icon className="w-6 h-6 text-gray-600" />
                <span className="font-semibold text-gray-800">{item.label}</span>
            </div>
          </Link>
        ))}

        <h3 className="text-sm font-semibold text-gray-500 px-2 mt-8">Analytics</h3>
        {analyticsItems.map((item) => (
            <Link key={item.href} href={item.href} className="block prime-card p-0 no-underline hover:border-prime-yellow">
                <div className="flex items-center space-x-4 p-4">
                    <item.icon className="w-6 h-6 text-gray-600" />
                    <span className="font-semibold text-gray-800">{item.label}</span>
                </div>
            </Link>
        ))}

        <h3 className="text-sm font-semibold text-gray-500 px-2 mt-8">Application</h3>
        {appItems.map((item) => (
            <Link key={item.href} href={item.href} className="block prime-card p-0 no-underline hover:border-prime-yellow">
                <div className="flex items-center space-x-4 p-4">
                    <item.icon className="w-6 h-6 text-gray-600" />
                    <span className="font-semibold text-gray-800">{item.label}</span>
                </div>
            </Link>
        ))}
      </div>
    </div>
  );
}
