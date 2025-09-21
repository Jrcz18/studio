
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
import { InvestorReportView } from "@/components/dashboard/reports/investor-report-view";
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

    // Unit Report State
    const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
    const [selectedUnitMonth, setSelectedUnitMonth] = useState<string>(String(new Date().getMonth()));
    const [selectedUnitYear, setSelectedUnitYear] = useState<string>(String(new Date().getFullYear()));
    const [generatingUnitReport, setGeneratingUnitReport] = useState(false);
    const [generatedUnitReport, setGeneratedUnitReport] = useState<any>(null);

    // Agent Report State
    const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
    const [selectedAgentMonth, setSelectedAgentMonth] = useState<string>(String(new Date().getMonth()));
    const [selectedAgentYear, setSelectedAgentYear] = useState<string>(String(new Date().getFullYear()));
    const [generatingAgentReport, setGeneratingAgentReport] = useState(false);
    const [generatedAgentReport, setGeneratedAgentReport] = useState<any>(null);
    
    // Investor Report State
    const [selectedInvestorId, setSelectedInvestorId] = useState<string | undefined>(undefined);
    const [selectedInvestorMonth, setSelectedInvestorMonth] = useState<string>(String(new Date().getMonth()));
    const [selectedInvestorYear, setSelectedInvestorYear] = useState<string>(String(new Date().getFullYear()));
    const [generatingInvestorReport, setGeneratingInvestorReport] = useState(false);
    const [generatedInvestorReport, setGeneratedInvestorReport] = useState<any>(null);


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

    const getMonthlyPerformance = (unitIds: string[], year: number, month: number) => {
        const relevantBookings = allBookings.filter(b => {
            const bookingDate = new Date(b.checkinDate);
            return unitIds.includes(b.unitId) && bookingDate.getFullYear() === year && bookingDate.getMonth() === month;
        });

        const relevantExpenses = allExpenses.filter(e => {
            const expenseDate = new Date(e.date);
            // Include general expenses (unitId is null) and expenses for the specific units
            return (!e.unitId || unitIds.includes(e.unitId)) && expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
        });
        
        const totalRevenue = relevantBookings.reduce((acc, booking) => acc + booking.totalAmount, 0);

        // Distribute general expenses proportionally
        const generalExpenses = allExpenses.filter(e => !e.unitId && new Date(e.date).getFullYear() === year && new Date(e.date).getMonth() === month)
                                          .reduce((sum, e) => sum + e.amount, 0);
        const proportion = unitIds.length / (units.length || 1);
        const proportionalGeneralExpenses = generalExpenses * proportion;
        
        const specificExpenses = relevantExpenses.filter(e => e.unitId).reduce((acc, expense) => acc + expense.amount, 0);

        const totalExpenses = specificExpenses + proportionalGeneralExpenses;
        const netProfit = totalRevenue - totalExpenses;

        return { totalRevenue, totalExpenses, netProfit, bookings: relevantBookings, expenses: relevantExpenses };
    };

    const handleGenerateUnitReport = () => {
        setGeneratingUnitReport(true);
        const year = parseInt(selectedUnitYear);
        const month = parseInt(selectedUnitMonth);

        const unitIdsToReport = selectedUnitId === 'all' ? units.map(u => u.id!) : [selectedUnitId];
        const performance = getMonthlyPerformance(unitIdsToReport, year, month);

        const unit = units.find(u => u.id === selectedUnitId);
        const investor = unit ? investors.find(i => i.unitIds && i.unitIds.includes(unit.id!)) : null;
        
        let investorShare = 0;
        if (investor && performance.netProfit > 0) {
            investorShare = (performance.netProfit * investor.sharePercentage) / 100;
        }

        setGeneratedUnitReport({
            unit: unit || { name: 'All Units' },
            month: months[month].label,
            year,
            ...performance,
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
    
    const handleGenerateInvestorReport = () => {
        if (!selectedInvestorId) return;

        setGeneratingInvestorReport(true);
        const year = parseInt(selectedInvestorYear);
        const month = parseInt(selectedInvestorMonth);
        const investor = investors.find(i => i.id === selectedInvestorId);
        
        if (!investor || !investor.unitIds || investor.unitIds.length === 0) {
            console.warn('This investor has no units assigned. Please edit the investor to assign units.');
            setGeneratingInvestorReport(false);
            return;
        }

        const performance = getMonthlyPerformance(investor.unitIds, year, month);
        const investorShare = (performance.netProfit > 0) ? (performance.netProfit * investor.sharePercentage) / 100 : 0;
        
        const investorUnits = units.filter(u => investor.unitIds!.includes(u.id!));

        setGeneratedInvestorReport({
            investor,
            units: investorUnits,
            month: months[month].label,
            year,
            ...performance,
            investorShare,
        });

        setGeneratingInvestorReport(false);
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Monthly Investor Report</h3>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <Select value={selectedInvestorId} onValueChange={setSelectedInvestorId}>
                        <SelectTrigger><SelectValue placeholder="Select Investor" /></SelectTrigger>
                        <SelectContent>
                            {investors.map(investor => (
                                <SelectItem key={investor.id} value={investor.id!}>{investor.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedInvestorMonth} onValueChange={setSelectedInvestorMonth}>
                        <SelectTrigger><SelectValue placeholder="Select Month" /></SelectTrigger>
                        <SelectContent>
                            {months.map(month => (
                                <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedInvestorYear} onValueChange={setSelectedInvestorYear}>
                        <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleGenerateInvestorReport} className="prime-button w-full" disabled={generatingInvestorReport || !selectedInvestorId}>
                    {generatingInvestorReport ? 'Generating...' : 'Generate'}
                    </Button>
                </div>
            </div>
            {generatedInvestorReport && <InvestorReportView report={generatedInvestorReport} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
