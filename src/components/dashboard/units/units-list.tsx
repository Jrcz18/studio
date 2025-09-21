
'use client';

import { useState } from 'react';
import type { Unit, Booking } from '@/lib/types';
import { Link as LinkIcon, Download } from 'lucide-react';
import { getBookings } from '@/services/bookings';
import ical from 'ical-generator';
import { Button } from '@/components/ui/button';

interface UnitsListProps {
  units: Unit[];
  onEdit: (unit: Unit) => void;
  onDelete: (unitId: string) => void;
}


export function UnitsList({ units, onEdit, onDelete }: UnitsListProps) {
  if (units.length === 0) {
    return <p className="text-gray-500 text-center py-8">No units found. Click "+ Add" to create one.</p>;
  }

  return (
    <div className="space-y-4">
      {units.map((unit) => (
        <UnitCard key={unit.id} unit={unit} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

function UnitCard({ unit, onEdit, onDelete }: { unit: Unit, onEdit: (unit: Unit) => void, onDelete: (unitId: string) => void }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadIcal = async () => {
    setIsDownloading(true);
    try {
      const allBookings = await getBookings();
      const unitBookings = allBookings.filter(b => b.unitId === unit.id);
      
      const cal = ical({ name: `${unit.name} Bookings` });

      unitBookings.forEach((booking: Booking) => {
        cal.createEvent({
          start: new Date(booking.checkinDate),
          end: new Date(booking.checkoutDate),
          summary: `Booking for ${booking.guestFirstName} ${booking.guestLastName}`,
          description: `Guests: ${booking.adults + booking.children}. Total: ₱${booking.totalAmount}`,
          organizer: 'Manila Prime Staycation <primestaycation24@gmail.com>',
        });
      });

      const blob = new Blob([cal.toString()], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${unit.name.replace(/\s+/g, '_')}_calendar.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to generate iCal file:', error);
      alert('Could not generate calendar file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const statusVariant = {
    available: 'bg-green-100 text-green-800',
    occupied: 'bg-red-100 text-red-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="fb-card">
      <div className="fb-header">
        <div>
          <h3 className="font-semibold text-gray-800 text-lg">{unit.name}</h3>
          <p className="text-sm text-gray-600">
            {unit.type} - Max {unit.maxOccupancy} guests
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusVariant[unit.status]}`}>
          {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
        </span>
      </div>
      <div className="fb-content">
        <div className="mb-4">
          <p className="text-2xl font-bold text-yellow-600">
            ₱{unit.rate.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">per night</p>
        </div>
        <p className="text-sm text-gray-600 mb-4">{unit.description}</p>
        
        <div className="border-t border-gray-200 py-4">
          <h4 className="font-semibold text-gray-800 mb-2">Calendar Sync</h4>

          {/* Master Calendar URL */}
           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <h5 className="font-semibold text-yellow-800 mb-2">Export Calendar</h5>
              <p className="text-xs text-yellow-700 mb-3">Download an iCal (.ics) file of all bookings for this unit to import into other calendar platforms.</p>
              <Button onClick={handleDownloadIcal} disabled={isDownloading} className="w-full prime-button">
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? 'Generating...' : 'Download iCal File'}
              </Button>
            </div>

          <h5 className="font-semibold text-gray-800 mb-2">Import Calendars</h5>
           <p className="text-xs text-gray-500 mb-3">Add iCal links from other platforms to import their bookings into this app.</p>
          <div className="space-y-2 mb-4">
            <p className="flex items-center text-sm text-gray-600">
              <LinkIcon className="w-4 h-4 mr-2" /> 
              <span className="font-semibold mr-2">Airbnb:</span>
              <span className="truncate text-gray-500">{unit.calendars.airbnb || 'Not set'}</span>
            </p>
            <p className="flex items-center text-sm text-gray-600">
              <LinkIcon className="w-4 h-4 mr-2" /> 
              <span className="font-semibold mr-2">Booking.com:</span>
              <span className="truncate text-gray-500">{unit.calendars.bookingcom || 'Not set'}</span>
            </p>
            <p className="flex items-center text-sm text-gray-600">
              <LinkIcon className="w-4 h-4 mr-2" /> 
              <span className="font-semibold mr-2">Direct:</span>
              <span className="truncate text-gray-500">{unit.calendars.direct || 'Not set'}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="fb-actions">
        <button
          onClick={() => onEdit(unit)}
          className="fb-btn fb-btn-secondary"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(unit.id!)}
          className="fb-btn fb-btn-secondary"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
