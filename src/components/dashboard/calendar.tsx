
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Booking, Unit } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  bookings: Booking[];
  units: Unit[];
}

// Assign a unique color to each unit
const unitColors = [
    '#EF4444', '#3B82F6', '#22C55E', '#F97316', '#8B5CF6', '#EC4899', '#10B981',
    '#FBBF24', '#6366F1', '#D946EF', '#0EA5E9', '#84CC16'
];

const Calendar: React.FC<CalendarProps> = ({ bookings, units }) => {
  const [masterDate, setMasterDate] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial date on client-side to avoid hydration mismatch
    setMasterDate(new Date());
  }, []);
  
  const unitColorMap = useMemo(() => {
    const map = new Map<string, string>();
    units.forEach((unit, index) => {
      map.set(unit.id!, unitColors[index % unitColors.length]);
    });
    return map;
  }, [units]);

  const toYYYYMMDD = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Pre-process bookings into a more efficient data structure for rendering
  const bookingData = useMemo(() => {
    const data: { [unitId: string]: { [dateKey: string]: { status: 'booked'; booking: Booking } } } = {};
    units.forEach(u => {
      if (u.id) data[u.id] = {};
    });
    bookings.forEach(booking => {
      if (!booking.unitId || !data[booking.unitId]) return;
      
      const startDate = new Date(booking.checkinDate);
      const endDate = new Date(booking.checkoutDate);
      
      // Loop from check-in date until (but not including) check-out date
      for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
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

  const renderMasterCalendar = () => {
        if (!masterDate) return null; // Don't render until date is set on client

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const daysInMonth = new Date(masterDate.getFullYear(), masterDate.getMonth() + 1, 0).getDate();

        return (
            <div className="calendar-container">
                <div className="flex justify-between items-center mb-5 px-4 pt-4">
                    <h3 className="m-0">📋 All Units Overview</h3>
                    <div className="flex gap-2.5 items-center">
                        <button className="month-nav" onClick={() => changeMasterMonth(-1)}><ChevronLeft size={20} /></button>
                        <div className="month-year text-base min-w-[120px] text-center">
                            {`${monthNames[masterDate.getMonth()]} ${masterDate.getFullYear()}`}
                        </div>
                        <button className="month-nav" onClick={() => changeMasterMonth(1)}><ChevronRight size={20} /></button>
                    </div>
                </div>
                
                <div className="master-grid-container">
                    <div className="master-grid">
                        <div className="units-column bg-white">
                            <div className="grid-header bg-primary text-primary-foreground">UNIT</div>
                            <div className="unit-list">
                                {units.map(unit => (
                                    <div 
                                        key={unit.id} 
                                        className="unit-cell bg-white"
                                        style={{
                                            borderLeft: `4px solid ${unitColorMap.get(unit.id!)}`
                                        }}
                                    >
                                        <div className="unit-number text-sm">{unit.name}</div>
                                        <div className="unit-type text-[10px]">{unit.type}</div>
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
                                        const bookingInfo = bookingData[unit.id!]?.[dateKey];
                                        
                                        const cellStyle = bookingInfo
                                            ? { backgroundColor: unitColorMap.get(unit.id!), color: 'white' }
                                            : {};
                                        
                                        return (
                                            <div 
                                                key={`${unit.id}-${day}`} 
                                                className='day-cell-master'
                                                style={cellStyle}
                                                onClick={() => showDayDetails(unit.id!, dateKey)}
                                            >
                                                {bookingInfo ? 'B' : ''}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                            </div>
                        </div>
                    </div>
                </div>

                 <div className="bg-white rounded-xl shadow p-4 m-4">
                    <h4 className="m-0 mb-3 text-sm">Legend</h4>
                     <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {units.map(unit => (
                            <div key={unit.id} className="flex items-center">
                                <div style={{ width: '12px', height: '12px', backgroundColor: unitColorMap.get(unit.id!), marginRight: '6px', borderRadius: '2px' }}></div>
                                <span style={{ fontSize: '12px', fontWeight: 500 }}>{unit.name}</span>
                            </div>
                        ))}
                        <div className="flex items-center">
                            <div style={{ width: '12px', height: '12px', border: '1px solid #ccc', marginRight: '6px', borderRadius: '2px' }}></div>
                            <span style={{ fontSize: '12px', fontWeight: 500 }}>Available</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

  return (
    <div className="prime-card overflow-hidden">
        {renderMasterCalendar()}
    </div>
  );
};

export default Calendar;
