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
    <div className="prime-card p-4">
        <div className="calendar-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: '0' }}>📋 All Units Overview</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button className="month-nav" onClick={() => changeMasterMonth(-1)}><ChevronLeft size={20} /></button>
                    <div className="month-year" style={{ fontSize: '16px', minWidth: '120px', textAlign: 'center' }}>
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
                                    <div className="unit-number" style={{fontSize: '14px', marginBottom: '2px'}}>{unit.name}</div>
                                    <div className="unit-type" style={{padding: '2px 6px', fontSize: '10px'}}>{unit.type}</div>
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

            <div style={{ marginTop: '20px', background: 'white', borderRadius: '12px', padding: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Legend</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <div style={{ width: '24px', height: '24px', background: 'hsl(var(--destructive))', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '12px', marginRight: '8px' }}>B</div>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>Booked</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '8px', background: '#f8f9fa', borderRadius: '8px' }}>
                        <div style={{ width: '24px', height: '24px', background: 'white', border: '2px solid var(--border)', borderRadius: '6px', marginRight: '8px' }}></div>
                        <span style={{ fontSize: '13px', fontWeight: 500 }}>Available</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Calendar;
