
'use client';

import { useEffect, useState } from "react";
import type { Booking, Expense, Unit, Investor } from "@/lib/types";
import { getBookings } from "@/services/bookings";
import { getExpenses } from "@/services/expenses";
import { getUnits } from "@/services/units";
import { getInvestors } from "@/services/investors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ReportView } from "@/components/dashboard/reports/report-view";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
const months = [
    { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
    { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
    { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
    { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' }
];

export default function ReportsPage() {
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
    const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
    const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
    
    const [generating, setGenerating] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<any>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [bookingsData, expensesData, unitsData, investorsData] = await Promise.all([
                getBookings(),
                getExpenses(),
                getUnits(),
                getInvestors()
            ]);
            setAllBookings(bookingsData);
            setAllExpenses(expensesData);
            setUnits(unitsData);
            setInvestors(investorsData);
            setLoading(false);
        }
        fetchData();
    }, []);

    const handleGenerateReport = () => {
        setGenerating(true);
        const year = parseInt(selectedYear);
        const month = parseInt(selectedMonth);

        let filteredBookings = allBookings;
        let filteredExpenses = allExpenses;

        if (selectedUnitId !== 'all') {
            filteredBookings = filteredBookings.filter(b => b.unitId === selectedUnitId);
            filteredExpenses = filteredExpenses.filter(e => e.unitId === selectedUnitId);
        }

        const monthlyBookings = filteredBookings.filter(b => {
            const bookingDate = new Date(b.checkinDate);
            return bookingDate.getFullYear() === year && bookingDate.getMonth() === month;
        });

        const monthlyExpenses = filteredExpenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
        });

        const totalRevenue = monthlyBookings.reduce((acc, booking) => acc + booking.totalAmount, 0);
        const totalExpenses = monthlyExpenses.reduce((acc, expense) => acc + expense.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        const unit = units.find(u => u.id === selectedUnitId);
        const investor = unit ? investors.find(i => i.unitIds.includes(unit.id!)) : null;
        
        let investorShare = 0;
        if (investor && netProfit > 0) {
            investorShare = (netProfit * investor.sharePercentage) / 100;
        }

        setGeneratedReport({
            unit: unit || { name: 'All Units' },
            month: months[month].label,
            year,
            bookings: monthlyBookings,
            expenses: monthlyExpenses,
            totalRevenue,
            totalExpenses,
            netProfit,
            investor,
            investorShare
        });
        setGenerating(false);
    };

    const overallStats = {
        totalRevenue: allBookings.reduce((acc, booking) => acc + booking.totalAmount, 0),
        totalExpenses: allExpenses.reduce((acc, expense) => acc + expense.amount, 0),
        netProfit: allBookings.reduce((acc, booking) => acc + booking.totalAmount, 0) - allExpenses.reduce((acc, expense) => acc + expense.amount, 0),
        profitMargin: allBookings.length > 0 ? ((allBookings.reduce((acc, booking) => acc + booking.totalAmount, 0) - allExpenses.reduce((acc, expense) => acc + expense.amount, 0)) / allBookings.reduce((acc, booking) => acc + booking.totalAmount, 0)) * 100 : 0
    };

    if (loading) {
      return <div className="p-4 text-center">Loading reports...</div>
    }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Reports</h2>
        <p className="text-sm text-gray-500">Financial performance overview</p>
      </div>

      <div className="prime-card p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">All-Time Overview</h3>
        <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
                <p className="text-2xl font-bold text-green-600">₱{overallStats.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-red-600">₱{overallStats.totalExpenses.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Expenses</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">₱{overallStats.netProfit.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Net Profit</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{overallStats.profitMargin.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Profit Margin</p>
            </div>
        </div>
      </div>
      
      <div className="prime-card p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Monthly Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {units.map(unit => (
                        <SelectItem key={unit.id} value={unit.id!}>{unit.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

             <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger><SelectValue placeholder="Select Month" /></SelectTrigger>
                <SelectContent>
                    {months.map(month => (
                        <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

             <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                <SelectContent>
                    {years.map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button onClick={handleGenerateReport} className="prime-button w-full" disabled={generating}>
              {generating ? 'Generating...' : 'Generate'}
            </Button>
        </div>
      </div>

        {generatedReport && <ReportView report={generatedReport} />}
    </div>
  );
}

    
