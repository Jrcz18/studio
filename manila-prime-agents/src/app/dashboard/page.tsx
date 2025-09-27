
'use client';

import React, { useEffect, useState } from 'react';
import Calendar from '@/components/calendar';
import { AddBookingDialog } from '@/components/add-booking-dialog';
import type { Booking, Unit, Agent } from '@/lib/types';
import { getBookings, addBooking as addBookingService } from '@/services/bookings';
import { getUnits } from '@/services/units';
import { getAgents } from '@/services/agents';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const { logout } = useAuth();


  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [bookingsData, unitsData, agentsData] = await Promise.all([
          getBookings(),
          getUnits(),
          getAgents(),
        ]);
        setBookings(bookingsData);
        setUnits(unitsData);
        setAgents(agentsData);
      } catch (e: any) {
        console.error("Failed to fetch dashboard data:", e);
        setError("Could not load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const addBooking = async (newBookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBookingWithDate: Omit<Booking, 'id'> = {
      ...newBookingData,
      createdAt: new Date().toISOString(),
    };
    
    try {
      const { id } = await addBookingService(newBookingWithDate);
      setBookings((prev) => [...prev, { ...newBookingWithDate, id }]);
      return true; // Indicate success
    } catch (error: any) {
        console.error('Failed to add booking:', error);
        alert('Booking Failed: ' + error.message);
        return false; // Indicate failure
    }
  };


  if (loading) {
      return <div className="p-4 text-center">Loading dashboard...</div>
  }
  
  if (error) {
      return <div className="p-4 text-center text-red-500">{error}</div>
  }

  return (
    <div className="p-4">
        <header className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-2xl font-bold">Agent Dashboard</h1>
                <p className="text-sm text-gray-500">View calendars and create bookings.</p>
            </div>
            <div className="flex items-center gap-4">
                <AddBookingDialog
                    open={isAddBookingOpen}
                    onOpenChange={setIsAddBookingOpen}
                    onAddBooking={addBooking}
                    units={units}
                    agents={agents}
                    >
                    <Button onClick={() => setIsAddBookingOpen(true)} className="prime-button">
                        + Add Booking
                    </Button>
                </AddBookingDialog>
                <Button variant="outline" onClick={logout}>Logout</Button>
            </div>
        </header>
        <Calendar bookings={bookings} units={units} />
    </div>
  );
}
