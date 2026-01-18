'use client';

import type { Booking, Expense, Unit } from '@/lib/types';
import { StatsBookingIcon, StatsRevenueIcon, StatsUnitsIcon, StatsProfitIcon } from './icons';
import { useMemo } from 'react';

interface StatsCardsProps {
    bookings: Booking[];
    expenses: Expense[];
    units: Unit[];
}

const StatsCards = ({ bookings, expenses, units }: StatsCardsProps) => {
    const stats = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const activeBookingsCount = bookings.filter(booking => {
            const checkin = new Date(booking.checkinDate);
            const checkout = new Date(booking.checkoutDate);
            return checkin <= today && checkout >= today;
        }).length;

        const currentMonthBookings = bookings.filter(booking => {
            const checkinDate = new Date(booking.checkinDate);
            return checkinDate.getMonth() === currentMonth && checkinDate.getFullYear() === currentYear;
        });

        const currentMonthExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        });

        const monthlyRevenue = currentMonthBookings.reduce((total, booking) => total + (booking.totalAmount || 0), 0);
        const totalUnits = units.length;
        const totalExpenses = currentMonthExpenses.reduce((total, expense) => total + (expense.amount || 0), 0);
        const netProfit = monthlyRevenue - totalExpenses;

        return [
            { label: "Active Bookings", value: activeBookingsCount, icon: StatsBookingIcon, color: "blue" },
            { label: "This Month's Revenue", value: `₱${monthlyRevenue.toLocaleString()}`, icon: StatsRevenueIcon, color: "green" },
            { label: "Total Units", value: totalUnits, icon: StatsUnitsIcon, color: "yellow" },
            { label: "This Month's Profit", value: `₱${netProfit.toLocaleString()}`, icon: StatsProfitIcon, color: "orange" },
        ];
    }, [bookings, expenses, units]);
    
    const colorVariants: { [key: string]: { bg: string, text: string } } = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
        green: { bg: 'bg-green-100', text: 'text-green-600' },
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
    };


    return (
        <div className="grid grid-cols-2 gap-3 mb-4">
            {stats.map(stat => (
                <div key={stat.label} className="fb-card">
                    <div className="fb-content p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs font-medium">{stat.label}</p>
                                <p className={`text-xl font-bold ${colorVariants[stat.color].text}`}>
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`w-10 h-10 ${colorVariants[stat.color].bg} rounded-full flex items-center justify-center`}>
                                <stat.icon className={`text-2xl ${colorVariants[stat.color].text}`} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsCards;
