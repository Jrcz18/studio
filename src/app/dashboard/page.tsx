
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [bookingsData, expensesData, unitsData] = await Promise.all([
          getBookings(),
          getExpenses(),
          getUnits(),
        ]);
        setBookings(bookingsData);
        setExpenses(expensesData);
        setUnits(unitsData);
      } catch (e: any) {
        console.error("Failed to fetch dashboard data:", e);
        setError("Could not load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
      return <div className="p-4 text-center">Loading dashboard...</div>
  }
  
  if (error) {
      return <div className="p-4 text-center text-red-500">{error}</div>
  }

  return (
    <div id="dashboardSection" className="section p-4">
      <Calendar bookings={bookings} units={units} />
      <StatsCards bookings={bookings} expenses={expenses} units={units} />
      <RecentActivity bookings={bookings} expenses={expenses} />
    </div>
  );
}
