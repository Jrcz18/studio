'use client';

import { units, bookings } from '@/lib/data';

const StatsCards = () => {
    const activeBookingsCount = bookings.filter(booking => {
        const checkin = new Date(booking.checkinDate);
        const checkout = new Date(booking.checkoutDate);
        const today = new Date();
        return checkin <= today && checkout >= today;
    }).length;

    const monthlyRevenue = bookings.reduce((total, booking) => total + booking.totalAmount, 0);
    const totalUnits = units.length;
    const netProfit = monthlyRevenue - 12500; // Sample expenses

    const stats = [
        { label: "Active Bookings", value: activeBookingsCount, icon: "📅", color: "blue" },
        { label: "Monthly Revenue", value: `₱${monthlyRevenue.toLocaleString()}`, icon: "💰", color: "green" },
        { label: "Total Units", value: totalUnits, icon: "🏠", color: "yellow" },
        { label: "Net Profit", value: `₱${netProfit.toLocaleString()}`, icon: "📈", color: "orange" },
    ];
    
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
                                <span className={`text-xl`}>{stat.icon}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StatsCards;
