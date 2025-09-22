
import React from 'react';
import Calendar from '@/components/dashboard/calendar';
import StatsCards from '@/components/dashboard/stats-cards';
import RecentActivity from '@/components/dashboard/recent-activity';
import type { Booking, Expense, Unit } from '@/lib/types';
import { getBookings } from '@/services/bookings';
import { getExpenses } from '@/services/expenses';
import { getUnits } from '@/services/units';

export default async function DashboardPage() {
  let bookings: Booking[] = [];
  let expenses: Expense[] = [];
  let units: Unit[] = [];
  let loading = true;
  let error: string | null = null;

  try {
    const [bookingsData, expensesData, unitsData] = await Promise.all([
      getBookings(),
      getExpenses(),
      getUnits(),
    ]);
    bookings = bookingsData;
    expenses = expensesData;
    units = unitsData;
    loading = false;
  } catch (e: any) {
    console.error("Failed to fetch dashboard data:", e);
    error = "Could not load dashboard data. Please try again later.";
    loading = false;
  }

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
