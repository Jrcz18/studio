
'use client';

import React, { useEffect, useState } from 'react';
import Calendar from '@/components/dashboard/calendar';
import StatsCards from '@/components/dashboard/stats-cards';
import RecentActivity from '@/components/dashboard/recent-activity';
import type { Booking, Expense, Unit } from '@/lib/types';
import { getBookings } from '@/services/bookings';
import { getExpenses } from '@/services/expenses';
import { getUnits } from '@/services/units';

export default function DashboardPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [units, setUnits] = React.useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const bookingsData = await getBookings();
        const expensesData = await getExpenses();
        const unitsData = await getUnits();
        setBookings(bookingsData);
        setExpenses(expensesData);
        setUnits(unitsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
      return <div className="p-4 text-center">Loading dashboard...</div>
  }

  return (
    <div id="dashboardSection" className="section p-4">
      <Calendar bookings={bookings} units={units} />
      <StatsCards bookings={bookings} expenses={expenses} units={units} />
      <RecentActivity bookings={bookings} expenses={expenses} />
    </div>
  );
}
