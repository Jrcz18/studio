'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Booking, Unit } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  bookings: Booking[];
  units: Unit[];
}

const Calendar: React.FC<CalendarProps> = ({ bookings, units }) => {
  const [masterDate, setMasterDate] = useState<Date | null>(null);

  useEffect(() => {
    setMasterDate(new Date());
  }, []);

  const toYYYYMMDD = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const bookingData = useMemo(() => {
    const data: { [unitId: string]: { [dateKey: string]: { status: 'booked'; booking: Booking } } } = {};
    units.forEach(u => {
      if (u.id) data[u.id] = {};
    });
    bookings.forEach(booking => {
      if (!booking.unitId || !data[booking.unitId]) return;
      const startDate = new Date(booking.checkinDate);
      const endDate = new Date(booking.checkoutDate);
      for (let d = startDate; d < endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = toYYYYMMDD(new Date(d));
        data[booking.unitId][dateKey] = { status: 'booked', booking: booking };
      }
    });
    return data;
  }, [bookings, units]);

  const showDayDetails = (unitId: string, dateKey: string) => {
    const data = bookingData[unitId]?.[dateKey];
    const unitName = units.find(u => u.id === unitId)?.name;
    if (data) {
      alert(`Unit: ${unitName}\nGuest: ${data.booking.guestFirstName}\nDates: ${data.booking.checkinDate} to ${data.booking.checkoutDate}`);
    } else {
       alert(`Unit: ${unitName}\nDate: ${dateKey}\nStatus: Available`);
    }
  };

  const changeMasterMonth = (delta: number) => {
    setMasterDate(d => d ? new Date(d.getFullYear(), d.getMonth() + delta, 1) : null);
  };

  if (!masterDate) {
    return <div className="p-4 text-center">Loading calendar...</div>;
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysInMonth = new Date(masterDate.getFullYear(), masterDate.getMonth() + 1, 0).getDate();

  return (
    <div className="calendar-container prime-card">
      <div className="fb-header">
          <h3 className="font-bold text-gray-900">📋 All Units Overview</h3>
          <div className="flex items-center space-x-1">
              <button className="month-nav" onClick={() => changeMasterMonth(-1)}><ChevronLeft size={20} /></button>
              <div className="month-year">
                  {`${monthNames[masterDate.getMonth()]} ${masterDate.getFullYear()}`}
              </div>
              <button className="month-nav" onClick={() => changeMasterMonth(1)}><ChevronRight size={20} /></button>
          </div>
      </div>
      
      <div className="master-grid-container">
          <div className="master-grid">
              <div className="units-column">
                  <div className="grid-header">UNIT</div>
                  <div className="unit-list">
                      {units.map(unit => (
                          <div key={unit.id} className="unit-cell">
                              <div className="unit-number">{unit.name}</div>
                              <div className="unit-type">{unit.type}</div>
                          </div>
                      ))}
                  </div>
              </div>
              
              <div className="days-column">
                  <div className="days-header">
                      {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1;
                          const date = new Date(masterDate.getFullYear(), masterDate.getMonth(), day);
                          const dayName = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                          const headerBg = isWeekend ? '#e67e22' : 'hsl(var(--primary))';

                          return (
                              <div key={`header-${day}`} className="day-header-master" style={{ background: headerBg }}>
                                  <div className="day-header-day-number">{day}</div>
                                  <div className="day-header-day-name">{dayName}</div>
                              </div>
                          );
                      })}
                  </div>
                  <div className="day-rows">
                      {units.map(unit => (
                      <div key={unit.id} className="day-row-content">
                          {Array.from({ length: daysInMonth }, (_, i) => {
                              const day = i + 1;
                              const date = new Date(masterDate.getFullYear(), masterDate.getMonth(), day);
                              const dateKey = toYYYYMMDD(date);
                              const status = bookingData[unit.id!]?.[dateKey]?.status;
                              
                              return (
                                  <div 
                                      key={`${unit.id}-${day}`} 
                                      className={`day-cell-master ${status || ''}`}
                                      onClick={() => showDayDetails(unit.id!, dateKey)}
                                  >
                                      {status === 'booked' ? 'B' : ''}
                                  </div>
                              );
                          })}
                      </div>
                  ))}
                  </div>
              </div>
          </div>
      </div>

      <div className="p-4 border-t">
          <h4 className="mb-3 text-sm font-semibold">Legend</h4>
          <div className="flex items-center space-x-6 text-xs">
              <div className="flex items-center">
                  <div className="w-6 h-6 day-cell-master booked flex items-center justify-center mr-2">B</div>
                  <span>Booked</span>
              </div>
              <div className="flex items-center">
                  <div className="w-6 h-6 day-cell-master mr-2"></div>
                  <span>Available</span>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Calendar;
