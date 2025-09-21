
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookingsList } from '@/components/dashboard/bookings/bookings-list';
import { AddBookingDialog } from '@/components/dashboard/bookings/add-booking-dialog';
import { EditBookingDialog } from '@/components/dashboard/bookings/edit-booking-dialog';
import type { Agent, Booking, Unit } from '@/lib/types';
import { getBookings, addBooking as addBookingService, updateBooking as updateBookingService, deleteBooking as deleteBookingService } from '@/services/bookings';
import { getUnits } from '@/services/units';
import { useUIContext } from '@/hooks/use-ui-context';
import { getAgents } from '@/services/agents';
import { sendAdminBookingNotification } from '@/ai/flows/send-admin-notification';
import { useToast } from '@/hooks/use-toast';


export default function BookingsPage() {
  const {
    isAddBookingOpen,
    setIsAddBookingOpen,
    isEditBookingOpen,
    setIsEditBookingOpen,
  } = useUIContext();

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        const [bookingsData, unitsData, agentsData] = await Promise.all([
          getBookings(),
          getUnits(),
          getAgents()
        ]);
        setBookings(bookingsData);
        setUnits(unitsData);
        setAgents(agentsData);
        setLoading(false);
    }
    fetchData();
  }, []);
  
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsAddBookingOpen(true);
    }
  }, [searchParams, setIsAddBookingOpen]);

  const handleOpenEditDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsEditBookingOpen(true);
  };

  const addBooking = async (newBookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Omit<Booking, 'id'> = {
      ...newBookingData,
      createdAt: new Date().toISOString(),
    };
    const id = await addBookingService(newBooking);
    const fullBooking = { ...newBooking, id };
    setBookings((prev) => [...prev, fullBooking]);

    // Send admin notification
    try {
      const unit = units.find(u => u.id === fullBooking.unitId);
      if (unit) {
        await sendAdminBookingNotification({
          guestName: `${fullBooking.guestFirstName} ${fullBooking.guestLastName}`,
          guestContact: fullBooking.guestPhone,
          numberOfGuests: fullBooking.adults + fullBooking.children,
          checkinDate: fullBooking.checkinDate,
          checkoutDate: fullBooking.checkoutDate,
          unitName: unit.name,
        });
        toast({
          title: 'Admin Notified',
          description: 'An email has been sent to the building admin.',
        });
      }
    } catch (error) {
      console.error('Failed to send admin notification:', error);
       toast({
          title: 'Notification Failed',
          description: 'Could not send email to the building admin.',
          variant: 'destructive',
       });
    }
  };

  const updateBooking = async (updatedBooking: Booking) => {
    await updateBookingService(updatedBooking);
    setBookings((prev) => 
        prev.map((b) => b.id === updatedBooking.id ? updatedBooking : b)
    );
    setSelectedBooking(null);
  };

  const deleteBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to delete this booking?')) {
        await deleteBookingService(bookingId);
        setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading bookings...</div>
  }


  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bookings</h2>
          <p className="text-sm text-gray-500">Manage all reservations</p>
        </div>
        <AddBookingDialog
          open={isAddBookingOpen}
          onOpenChange={setIsAddBookingOpen}
          onAddBooking={addBooking}
          units={units}
          agents={agents}
        >
          <button
            onClick={() => setIsAddBookingOpen(true)}
            className="prime-button px-4 py-2 text-sm"
          >
            + Add
          </button>
        </AddBookingDialog>
      </div>
      <BookingsList 
        bookings={bookings} 
        units={units} 
        onEdit={handleOpenEditDialog}
        onDelete={deleteBooking} 
      />
      {selectedBooking && (
        <EditBookingDialog
          key={selectedBooking.id}
          open={isEditBookingOpen}
          onOpenChange={setIsEditBookingOpen}
          booking={selectedBooking}
          onUpdateBooking={updateBooking}
          units={units}
        />
      )}
    </div>
  );
}
