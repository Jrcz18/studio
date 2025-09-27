
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Booking, Unit } from '@/lib/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  bookings: Booking[];
  units: Unit[];
}

const unitColors = [
    '#EF4444', // red-500
    '#3B82F6', // blue-500
    '#22C55E', // green-500
    '#F97316', // orange-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
];

const Calendar = ({ bookings, units }: CalendarProps) => {
  const [date, setDate] = useState(new Date());
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    setToday(now);
  }, []);

  const currentMonth = date.getMonth();
  const currentYear = date.getFullYear();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  const unitColorMap = useMemo(() => {
    const map = new Map<string, string>();
    units.forEach((unit, index) => {
      map.set(unit.id!, unitColors[index % unitColors.length]);
    });
    return map;
  }, [units]);

  const calendarGrid = useMemo(() => {
    if (!today) {
        return Array.from({ length: 35 }).map((_, i) => (
            <div key={`placeholder-${i}`} className="w-8 h-8"></div>
        ));
    }

    const grid = [];
    for (let i = 0; i < firstDay; i++) {
      grid.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayBookings = bookings.filter(booking => {
        const checkin = new Date(booking.checkinDate);
        checkin.setHours(0,0,0,0);
        const checkout = new Date(booking.checkoutDate);
        checkout.setHours(0,0,0,0);
        const currentDate = new Date(dateStr);
        return checkin <= currentDate && checkout > currentDate;
      });

      const isToday = today ? new Date(dateStr).getTime() === today.getTime() : false;
      const todayClass = isToday ? 'shadow-[0_0_0_2px_#3B82F6]' : '';

      grid.push(
        <div key={day} className={`relative w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-lg cursor-pointer transition-all duration-200 bg-white border-2 border-gray-200 text-gray-800 ${todayClass}`}>
          {day}
          {dayBookings.length > 0 && (
            <div className="absolute bottom-1 flex space-x-0.5">
              {dayBookings.map(booking => (
                <div 
                  key={booking.id}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: unitColorMap.get(booking.unitId) || '#A1A1AA' }}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
    return grid;
  }, [currentYear, currentMonth, firstDay, daysInMonth, bookings, today, unitColorMap]);

  const previousMonth = () => {
    setDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  return (
    <div className="fb-card">
      <div className="fb-header">
        <h4 className="text-base font-bold text-black">
            {monthNames[currentMonth]} {currentYear}
        </h4>
        <div className="flex items-center space-x-1">
            <button onClick={previousMonth} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
        </div>
      </div>
        
      <div className="fb-content">
          <div className="grid grid-cols-7 gap-1 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-gray-600 py-1">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 place-items-center mb-4">
            {calendarGrid}
          </div>
          
          <div className="flex items-center flex-wrap justify-center gap-x-4 gap-y-2 text-xs pt-3 border-t border-gray-200">
            {units.map((unit) => (
                 <div key={unit.id} className="flex items-center space-x-1">
                    <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: unitColorMap.get(unit.id!) || '#A1A1AA' }}
                    ></div>
                    <span className="text-gray-600">{unit.name}</span>
                </div>
            ))}
            <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-white border-2 border-gray-300 rounded"></div>
                <span className="text-gray-600">Available</span>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Calendar;
