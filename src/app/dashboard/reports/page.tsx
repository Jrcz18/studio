
'use client';

import { useEffect, useState } from "react";
import type { Booking, Expense, Unit, Investor, Agent } from "@/lib/types";
import { getBookings } from "@/services/bookings";
import { getExpenses } from "@/services/expenses";
import { getUnits } from "@/services/units";
import { getInvestors } from "@/services/investors";
import { getAgents } from "@/services/agents";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ReportView } from "@/components/dashboard/reports/report-view";
import { AgentReportView } from "@/components/dashboard/reports/agent-report-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    // State for Unit Report
    const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
    const [selectedUnitMonth, setSelectedUnitMonth] = useState<string>(String(new Date().getMonth()));
    const [selectedUnitYear, setSelectedUnitYear] = useState<string>(String(new Date().getFullYear()));
    const [generatingUnitReport, setGeneratingUnitReport] = useState(false);
    const [generatedUnitReport, setGeneratedUnitReport] = useState<any>(null);

    // State for Agent Report
    const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
    const [selectedAgentMonth, setSelectedAgentMonth] = useState<string>(String(new Date().getMonth()));
    const [selectedAgentYear, setSelectedAgentYear] = useState<string>(String(new Date().getFullYear()));
    const [generatingAgentReport, setGeneratingAgentReport] = useState(false);
    const [generatedAgentReport, setGeneratedAgentReport] = useState<any>(null);


    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const [bookingsData, expensesData, unitsData, investorsData, agentsData] = await Promise.all([
                getBookings(),
                getExpenses(),
                getUnits(),
                getInvestors(),
                getAgents()
            ]);
            setAllBookings(bookingsData);
            setAllExpenses(expensesData);
            setUnits(unitsData);
            setInvestors(investorsData);
            setAgents(agentsData);
            setLoading(false);
        }
        fetchData();
    }, []);

    const handleGenerateUnitReport = () => {
        setGeneratingUnitReport(true);
        const year = parseInt(selectedUnitYear);
        const month = parseInt(selectedUnitMonth);

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

        setGeneratedUnitReport({
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
        setGeneratingUnitReport(false);
    };

    const handleGenerateAgentReport = () => {
        if (!selectedAgentId) return;

        setGeneratingAgentReport(true);
        const year = parseInt(selectedAgentYear);
        const month = parseInt(selectedAgentMonth);
        const agent = agents.find(a => a.id === selectedAgentId);
        if (!agent) {
            setGeneratingAgentReport(false);
            return;
        }

        const agentBookings = allBookings.filter(b => {
            const bookingDate = new Date(b.checkinDate);
            return b.agentId === selectedAgentId &&
                   bookingDate.getFullYear() === year &&
                   bookingDate.getMonth() === month;
        });

        const totalRevenueGenerated = agentBookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const totalCommission = (totalRevenueGenerated * agent.commissionRate) / 100;

        setGeneratedAgentReport({
            agent,
            month: months[month].label,
            year,
            bookings: agentBookings,
            totalRevenueGenerated,
            totalCommission,
        });

        setGeneratingAgentReport(false);
    }

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
      
      <Tabs defaultValue="unit" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="unit">Unit Report</TabsTrigger>
          <TabsTrigger value="agent">Agent Report</TabsTrigger>
          <TabsTrigger value="investor">Investor Report</TabsTrigger>
        </TabsList>
        <TabsContent value="unit">
            <div className="prime-card p-4 my-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Monthly Unit Report</h3>
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

                    <Select value={selectedUnitMonth} onValueChange={setSelectedUnitMonth}>
                        <SelectTrigger><SelectValue placeholder="Select Month" /></SelectTrigger>
                        <SelectContent>
                            {months.map(month => (
                                <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedUnitYear} onValueChange={setSelectedUnitYear}>
                        <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleGenerateUnitReport} className="prime-button w-full" disabled={generatingUnitReport}>
                    {generatingUnitReport ? 'Generating...' : 'Generate'}
                    </Button>
                </div>
            </div>
            {generatedUnitReport && <ReportView report={generatedUnitReport} />}
        </TabsContent>
        <TabsContent value="agent">
            <div className="prime-card p-4 my-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Monthly Agent Report</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                        <SelectTrigger><SelectValue placeholder="Select Agent" /></SelectTrigger>
                        <SelectContent>
                            {agents.map(agent => (
                                <SelectItem key={agent.id} value={agent.id!}>{agent.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedAgentMonth} onValueChange={setSelectedAgentMonth}>
                        <SelectTrigger><SelectValue placeholder="Select Month" /></SelectTrigger>
                        <SelectContent>
                            {months.map(month => (
                                <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedAgentYear} onValueChange={setSelectedAgentYear}>
                        <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleGenerateAgentReport} className="prime-button w-full" disabled={generatingAgentReport || !selectedAgentId}>
                    {generatingAgentReport ? 'Generating...' : 'Generate'}
                    </Button>
                </div>
            </div>
            {generatedAgentReport && <AgentReportView report={generatedAgentReport} />}
        </TabsContent>
        <TabsContent value="investor">
            <div className="prime-card p-4 my-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Investor Reports</h3>
                <p className="text-sm text-gray-500 text-center py-8">Investor reporting feature is coming soon.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
