
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookingsList } from '@/components/dashboard/bookings/bookings-list';
import { AddBookingDialog } from '@/components/dashboard/bookings/add-booking-dialog';
import { EditBookingDialog } from '@/components/dashboard/bookings/edit-booking-dialog';
import { ConflictDialog } from '@/components/dashboard/bookings/conflict-dialog';
import type { Agent, Booking, Unit } from '@/lib/types';
import { getBookings, addBooking as addBookingService, updateBooking as updateBookingService, deleteBooking as deleteBookingService } from '@/services/bookings';
import { getUnits } from '@/services/units';
import { useUIContext } from '@/hooks/use-ui-context';
import { getAgents } from '@/services/agents';
import { sendAdminBookingNotification } from '@/ai/flows/send-admin-notification';
import { sendDiscordNotification } from '@/ai/flows/send-discord-notification';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function BookingsPage() {
  const {
    isAddBookingOpen,
    setIsAddBookingOpen,
    isEditBookingOpen,
    setIsEditBookingOpen,
    isConflictDialogOpen,
    setIsConflictDialogOpen,
  } = useUIContext();

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
  const [conflictData, setConflictData] = useState<{ newBooking: Omit<Booking, 'id'>, existingBooking: Booking } | null>(null);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // State for filters
  const [unitFilter, setUnitFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

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

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const unitMatch = unitFilter === 'all' || booking.unitId === unitFilter;
      const agentMatch = agentFilter === 'all' || booking.agentId === agentFilter;
      
      let dateMatch = true;
      if (dateFilter) {
        const checkinDate = new Date(booking.checkinDate);
        // Reset time part to compare dates only
        checkinDate.setHours(0, 0, 0, 0);
        const filterDate = new Date(dateFilter);
        filterDate.setHours(0, 0, 0, 0);
        dateMatch = checkinDate.getTime() === filterDate.getTime();
      }

      return unitMatch && agentMatch && dateMatch;
    }).sort((a, b) => new Date(b.checkinDate).getTime() - new Date(a.checkinDate).getTime());
  }, [bookings, unitFilter, agentFilter, dateFilter]);

  const clearFilters = () => {
    setUnitFilter('all');
    setAgentFilter('all');
    setDateFilter(undefined);
  };

  const handleOpenEditDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsEditBookingOpen(true);
  };

  const addBooking = async (newBookingData: Omit<Booking, 'id' | 'createdAt' | 'nightlyRate'>, options: { sendAdminEmail: boolean }) => {
    try {
      const { id, totalAmount, nightlyRate } = await addBookingService(newBookingData);
      const fullBooking: Booking = { 
        ...newBookingData, 
        id, 
        totalAmount,
        nightlyRate,
        createdAt: new Date().toISOString()
      };
      setBookings((prev) => [...prev, fullBooking]);

      // Trigger notifications
      await handleNotifications(fullBooking, options);

      return true; // Indicate success
    } catch (error: any) {
        const newBookingWithDate = {
            ...newBookingData,
            createdAt: new Date().toISOString(),
        };
      if (error.message.includes('409')) {
        try {
          const conflict = JSON.parse(error.message.substring(error.message.indexOf('{')));
          setConflictData({ newBooking: newBookingWithDate, existingBooking: conflict.existingBooking });
          setIsConflictDialogOpen(true);
        } catch (parseError) {
           toast({
            title: 'Booking Conflict',
            description: 'This booking overlaps with an existing one, but the details could not be parsed.',
            variant: 'destructive',
          });
        }
      } else {
        console.error('Failed to add booking:', error);
        toast({
          title: 'Booking Failed',
          description: 'An unexpected error occurred while creating the booking.',
          variant: 'destructive',
        });
      }
      return false; // Indicate failure
    }
  };

  const forceAddBooking = async (bookingData: Omit<Booking, 'id'>) => {
    const id = `force_${Date.now()}`; // Create a temporary ID
    const fullBooking = { ...bookingData, id };
    setBookings((prev) => [...prev, fullBooking]);
    setConflictData(null);
    setIsConflictDialogOpen(false);
    toast({
        title: 'Booking Forced',
        description: 'The conflicting booking has been manually added.',
    });
  }
  
  const handleNotifications = async (booking: Booking, options: { sendAdminEmail: boolean }) => {
    try {
        const unit = units.find(u => u.id === booking.unitId);
        if (!unit) return;

        const discordMessage = `🎉 New Booking!\n**Guest:** ${booking.guestFirstName} ${booking.guestLastName}\n**Unit:** ${unit.name}\n**Dates:** ${booking.checkinDate} to ${booking.checkoutDate}\n**Total:** ₱${booking.totalAmount.toLocaleString()}`;
        await sendDiscordNotification({ content: discordMessage, username: "Booking Bot" });
        toast({
            title: 'Booking Created & Notified',
            description: 'A notification has been sent to your Discord channel.',
        });
        
        if (options.sendAdminEmail) {
            await sendAdminBookingNotification({
                guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
                guestContact: booking.guestPhone,
                numberOfGuests: booking.adults + booking.children,
                checkinDate: booking.checkinDate,
                checkoutDate: booking.checkoutDate,
                unitName: unit.name,
            });
            toast({
                title: 'Admin Notified',
                description: 'An email has been sent to the building admin.',
            });
        }
    } catch (error) {
        console.error('Failed to send notifications:', error);
        toast({
            title: 'Notification Failed',
            description: 'The booking was created, but notifications could not be sent.',
            variant: 'destructive',
        });
    }
  }

  const updateBooking = async (updatedBooking: Booking) => {
    await updateBookingService(updatedBooking);
    setBookings((prev) => 
        prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
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

      <div className="prime-card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={unitFilter} onValueChange={setUnitFilter}>
            <SelectTrigger><SelectValue placeholder="Filter by Unit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              {units.map(unit => (
                <SelectItem key={unit.id} value={unit.id!}>{unit.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger><SelectValue placeholder="Filter by Agent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id!}>{agent.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "PPP") : <span>Filter by check-in date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" onClick={clearFilters} disabled={unitFilter === 'all' && agentFilter === 'all' && !dateFilter}>
            Clear Filters
          </Button>
        </div>
      </div>

      <BookingsList 
        bookings={filteredBookings} 
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
      {conflictData && (
        <ConflictDialog
          open={isConflictDialogOpen}
          onOpenChange={setIsConflictDialogOpen}
          conflictData={conflictData}
          units={units}
          onForceAdd={forceAddBooking}
        />
      )}
    </div>
  );
}
