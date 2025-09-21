
'use client';

import { useState, useEffect } from 'react';
import type { Unit, SyncedEvent, Platform } from '@/lib/types';
import { syncCalendars } from '@/app/actions/sync-calendars';
import { formatDate } from '@/lib/utils';
import { Calendar, Link as LinkIcon, List, Copy, Check } from 'lucide-react';

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
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<SyncedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [masterUrlCopied, setMasterUrlCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    // Dynamically determine the base URL.
    // This will be the Vercel URL when deployed, or localhost during development.
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
    
    handleSync(true); // Auto-sync on component mount silently
  }, [unit.id]); // Re-run if unit ID changes


  const statusVariant = {
    available: 'bg-green-100 text-green-800',
    occupied: 'bg-red-100 text-red-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
  };
  
  const platformColors: Record<Platform, string> = {
    'Airbnb': 'bg-red-50 text-red-700 border-red-200',
    'Booking.com': 'bg-blue-50 text-blue-700 border-blue-200',
    'Direct': 'bg-green-50 text-green-700 border-green-200',
  };

  const handleSync = async (isAutoSync = false) => {
    if (!unit.id) return;

    if (!isAutoSync) {
        setLoading(true);
    }
    setError(null);
    if (!isAutoSync) {
        setEvents([]);
    }
    try {
      if(!unit.calendars.airbnb && !unit.calendars.bookingcom && !unit.calendars.direct) {
        if (!isAutoSync) {
            setError("Please provide at least one calendar URL to sync.");
        }
        setLoading(false);
        return;
      }
      
      const result = await syncCalendars(unit.calendars, unit.id);
      setEvents(result);

      if (result.length === 0 && !isAutoSync) {
        setError('No new events found in the provided calendars. The URLs might be incorrect, empty, or placeholder examples.');
      }
    } catch (e) {
      console.error('Syncing failed:', e);
       if (!isAutoSync) {
        const message = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`An error occurred while syncing: ${message}`);
       }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMasterUrl = () => {
    const url = `${baseUrl}/api/ical/${unit.id}`;
    navigator.clipboard.writeText(url);
    setMasterUrlCopied(true);
    setTimeout(() => setMasterUrlCopied(false), 2000);
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
        
        <div className="border-t border-b border-gray-200 py-4">
          <h4 className="font-semibold text-gray-800 mb-2">Calendar Sync</h4>

          {/* Master Calendar URL */}
           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <h5 className="font-semibold text-yellow-800 mb-2">Master Calendar URL</h5>
              <p className="text-xs text-yellow-700 mb-2">Use this link to export your bookings from this app to other platforms like Airbnb or Booking.com.</p>
              <div className="flex items-center bg-white border rounded-md">
                <input 
                  type="text" 
                  readOnly 
                  value={baseUrl ? `${baseUrl}/api/ical/${unit.id}`: 'Loading...'}
                  className="p-2 text-sm bg-transparent w-full outline-none"
                />
                <button 
                  onClick={handleCopyMasterUrl}
                  className="p-2 text-gray-500 hover:text-gray-800"
                  title="Copy URL"
                >
                  {masterUrlCopied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
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
          <button
            onClick={() => handleSync()}
            className="w-full fb-btn fb-btn-primary"
            disabled={loading}
          >
            {loading ? 'Syncing...' : 'Sync Now'}
          </button>
          
          {loading && (
            <div className="text-center p-4">
              <p className="text-gray-600">Fetching and parsing calendar data...</p>
            </div>
          )}

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-sm mt-4">
              <p>{error}</p>
            </div>
          )}

          {events.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                <List className="w-5 h-5 mr-2" />
                Synced Bookings
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {events.map((event) => (
                  <div key={event.uid} className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                     <div className="flex items-center justify-between">
                       <p className="font-semibold text-gray-800 truncate">{event.summary}</p>
                       <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${platformColors[event.platform]}`}>
                         {event.platform}
                       </span>
                     </div>
                     <p className="text-sm text-gray-600 flex items-center mt-1">
                       <Calendar className="w-4 h-4 mr-2" />
                       {formatDate(event.start)} - {formatDate(event.end)}
                     </p>
                  </div>
                ))}
              </div>
            </div>
          )}
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
