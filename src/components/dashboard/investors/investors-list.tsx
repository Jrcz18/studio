
'use client';

import type { Investor, ProfitPayment, Unit, Booking, Expense } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useMemo } from 'react';

interface InvestorsListProps {
  investors: Investor[];
  profitPayments: ProfitPayment[];
  units: Unit[];
  bookings: Booking[];
  expenses: Expense[];
  onEdit: (investor: Investor) => void;
  onDelete: (investorId: string) => void;
  onPayProfit: (investor: Investor) => void;
}

export function InvestorsList({ 
    investors, 
    profitPayments, 
    units,
    bookings,
    expenses,
    onEdit, 
    onDelete, 
    onPayProfit 
}: InvestorsListProps) {
  
  if (investors.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">No investors found.</p>
    );
  }

  const getUnitPerformance = useMemo(() => {
    const performance: { [unitId: string]: { revenue: number, expenses: number, net: number } } = {};
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    units.forEach(unit => {
      const unitBookings = bookings.filter(b => b.unitId === unit.id);
      const unitExpenses = expenses.filter(e => e.unitId === unit.id);

      const revenue = unitBookings
        .filter(b => {
          const bookingDate = new Date(b.checkinDate);
          return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
        })
        .reduce((sum, b) => sum + b.totalAmount, 0);
      
      const expenseAmount = unitExpenses
        .filter(e => {
          const expenseDate = new Date(e.date);
          return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, e) => sum + e.amount, 0);
      
      performance[unit.id!] = {
        revenue,
        expenses: expenseAmount,
        net: revenue - expenseAmount
      };
    });
    return performance;
  }, [units, bookings, expenses]);


  return (
    <div className="space-y-4">
      {investors.map((investor) => {
        const investorUnits = units.filter(u => investor.unitIds?.includes(u.id!));
        
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const monthlyProfit = investorUnits.reduce((total, unit) => {
            const performance = getUnitPerformance[unit.id!];
            return total + (performance?.net ?? 0);
        }, 0);
        
        const investorShare = (monthlyProfit * investor.sharePercentage) / 100;
        
        const currentPayment = profitPayments.find(
          (p) => p.investorId === investor.id && p.month === currentMonth
        );
        const paymentStatus = currentPayment ? 'paid' : 'pending';
        const totalPayments = profitPayments
          .filter((p) => p.investorId === investor.id)
          .reduce((sum, p) => sum + p.amount, 0);

        return (
          <div key={investor.id} className="fb-card">
            <div className='fb-header'>
              <div className='flex items-center'>
                <div className='fb-avatar'>
                  <span>{investor.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{investor.name}</h3>
                  <p className="text-sm text-gray-600">{investor.email}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  investor.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {investor.status.charAt(0).toUpperCase() +
                  investor.status.slice(1)}
              </span>
            </div>
            
            <div className='fb-content'>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                <div>
                  <p>
                    <strong>Investment:</strong> ₱
                    {investor.investmentAmount.toLocaleString()}
                  </p>
                  <p>
                    <strong>Share:</strong> {investor.sharePercentage}%
                  </p>
                   <p>
                    <strong>Units:</strong> {investorUnits.length > 0 ? investorUnits.map(u => u.name).join(', ') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Dec Share:</strong> ₱{investorShare.toLocaleString()}
                  </p>
                  <p>
                    <strong>Total Received:</strong> ₱
                    {totalPayments.toLocaleString()}
                  </p>
                </div>
              </div>

              <div
                className={`mb-3 p-2 rounded-lg ${
                  paymentStatus === 'paid'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      paymentStatus === 'paid'
                        ? 'text-green-800'
                        : 'text-yellow-800'
                    }`}
                  >
                    December 2024:{' '}
                    {paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}
                  </span>
                  {paymentStatus === 'pending' ? (
                    <button
                      onClick={() => onPayProfit(investor)}
                      className="text-xs bg-yellow-500 text-white px-2 py-1 rounded font-semibold h-auto"
                    >
                      Pay Now
                    </button>
                  ) : (
                    <span className="text-xs text-green-600">
                      {currentPayment?.paymentDate ? formatDate(currentPayment.paymentDate) : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="fb-actions">
              <button
                onClick={() => alert('Payment History Coming Soon!')}
                className="fb-btn fb-btn-primary"
              >
                History
              </button>
              <button
                onClick={() => onEdit(investor)}
                className="fb-btn fb-btn-secondary"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(investor.id!)}
                className="fb-btn fb-btn-secondary"
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
