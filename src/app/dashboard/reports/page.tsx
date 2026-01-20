
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
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    
        // 🔹 PRORATED REVENUE
        let totalRevenue = 0;
        const relevantBookings: Booking[] = [];
    
        allBookings.forEach(booking => {
            if (!unitIds.includes(booking.unitId)) return;
    
            const checkin = new Date(booking.checkinDate);
            const checkout = new Date(booking.checkoutDate);
    
            const totalNights = Math.ceil(
                (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)
            );
    
            if (totalNights <= 0 || !booking.totalAmount) return;
    
            const pricePerNight = booking.totalAmount / totalNights;
            let counted = false;
    
            // walk through each night
            for (let d = new Date(checkin); d < checkout; d.setDate(d.getDate() + 1)) {
                const night = new Date(d);
    
                if (night >= monthStart && night <= monthEnd) {
                    totalRevenue += pricePerNight;
                    counted = true;
                }
            }
    
            // only include booking in report if it contributed nights this month
            if (counted) {
                relevantBookings.push(booking);
            }
        });
    
        // 🔹 FLAT MONTHLY EXPENSES (no prorating, as requested)
    
        const specificExpenses = allExpenses.filter(e => {
            if (!e.unitId) return false;
            const expenseDate = new Date(e.date);
            return (
                unitIds.includes(e.unitId) &&
                expenseDate.getFullYear() === year &&
                expenseDate.getMonth() === month
            );
        }).reduce((sum, e) => sum + e.amount, 0);
    
        // General expenses (shared across all units)
        const generalExpenses = allExpenses.filter(e => {
            if (e.unitId) return false;
            const expenseDate = new Date(e.date);
            return (
                expenseDate.getFullYear() === year &&
                expenseDate.getMonth() === month
            );
        }).reduce((sum, e) => sum + e.amount, 0);
    
        // Distribute general expenses proportionally by unit count
        const proportion = unitIds.length / (units.length || 1);
        const proportionalGeneralExpenses = generalExpenses * proportion;
    
        const totalExpenses = specificExpenses + proportionalGeneralExpenses;
        const netProfit = totalRevenue - totalExpenses;
    
        return {
            totalRevenue,
            totalExpenses,
            netProfit,
            bookings: relevantBookings,
            expenses: allExpenses.filter(e => {
                const expenseDate = new Date(e.date);
                return (
                    expenseDate.getFullYear() === year &&
                    expenseDate.getMonth() === month &&
                    (!e.unitId || unitIds.includes(e.unitId))
                );
            }),
        };
    };


    const handleGenerateUnitReport = () => {
        setGeneratingUnitReport(true);
        const year = parseInt(selectedUnitYear);
        const month = parseInt(selectedUnitMonth);

        const unitIdsToReport = selectedUnitId === 'all' ? units.map(u => u.id!) : [selectedUnitId];
        const performance = getMonthlyPerformance(unitIdsToReport, year, month);
        
        let unit: Unit | null = null;
        let investor: Investor | null = null;
        let investorShare = 0;
        
        if (selectedUnitId === 'all') {
            // For "All Units" — sum investor shares across all units
            const relevantInvestors = investors.filter(i => 
                i.unitIds && i.unitIds.some(id => units.map(u => u.id!).includes(id))
            );
        
            investorShare = relevantInvestors.reduce((sum, i) => {
                return sum + (performance.netProfit > 0 ? (performance.netProfit * i.sharePercentage) / 100 : 0);
            }, 0);
        
        } else {
            // Single unit selected — normal lookup
            unit = units.find(u => u.id === selectedUnitId) || null;
            if (unit) {
                investor = investors.find(i => i.unitIds?.includes(unit.id!)) || null;
                if (investor && performance.netProfit > 0) {
                    investorShare = (performance.netProfit * investor.sharePercentage) / 100;
                }
            }
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
    
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    
        let agentRevenue = 0;
        const agentBookings: Booking[] = [];
    
        // 🔹 PRORATED AGENT REVENUE
        allBookings.forEach(booking => {
            if (booking.agentId !== selectedAgentId) return;
    
            const checkin = new Date(booking.checkinDate);
            const checkout = new Date(booking.checkoutDate);
    
            const totalNights = Math.ceil(
                (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)
            );
    
            if (totalNights <= 0 || !booking.totalAmount) return;
    
            const pricePerNight = booking.totalAmount / totalNights;
            let counted = false;
    
            // walk through each night and count only this month
            for (let d = new Date(checkin); d < checkout; d.setDate(d.getDate() + 1)) {
                const night = new Date(d);
    
                if (night >= monthStart && night <= monthEnd) {
                    agentRevenue += pricePerNight;
                    counted = true;
                }
            }
    
            // only include bookings that contributed to this month
            if (counted) {
                agentBookings.push(booking);
            }
        });
    
        let totalCommission = 0;
        let reportData: any = {};
    
        if (agent.commissionType === 'fixed_commission') {
            // 🔹 FIXED COMMISSION — still based on full nights of each booking
            totalCommission = agentBookings.reduce((sum, booking) => {
                const unit = units.find(u => u.id === booking.unitId);
                if (unit && booking.nightlyRate !== undefined) {
                    const surplus = booking.nightlyRate - unit.rate;
            
                    const checkin = new Date(booking.checkinDate);
                    const checkout = new Date(booking.checkoutDate);
            
                    let nightsInMonth = 0;
                    for (let d = new Date(checkin); d < checkout; d.setDate(d.getDate() + 1)) {
                        const night = new Date(d);
                        if (night >= monthStart && night <= monthEnd) {
                            nightsInMonth++;
                        }
                    }
            
                    if (surplus > 0 && nightsInMonth > 0) {
                        return sum + (surplus * nightsInMonth);
                    }
                }
                return sum;
            }, 0);

    
            reportData = {
                totalRevenueGenerated: agentRevenue,
                totalCommission,
            };
    
        } else { // 🔹 PERCENTAGE PROFIT-SHARING (PRORATED + CONSISTENT)
            const relevantUnitIds = [...new Set(agentBookings.map(b => b.unitId))];
    
            if (relevantUnitIds.length > 0) {
                const performance = getMonthlyPerformance(relevantUnitIds, year, month);
    
                const agentContributionPercentage =
                    performance.totalRevenue > 0
                        ? agentRevenue / performance.totalRevenue
                        : 0;
    
                const agentProfitShare = agentContributionPercentage * performance.netProfit;
                totalCommission = agentProfitShare * (agent.commissionRate / 100);
    
                reportData = {
                    totalRevenueGenerated: agentRevenue,
                    totalCommission,
                    unitPerformance: {
                        ...performance,
                        unitNames: units
                            .filter(u => relevantUnitIds.includes(u.id!))
                            .map(u => u.name)
                            .join(', '),
                    },
                    agentContributionPercentage: agentContributionPercentage * 100,
                };
            } else {
                reportData = {
                    totalRevenueGenerated: 0,
                    totalCommission: 0,
                    unitPerformance: {},
                    agentContributionPercentage: 0,
                };
            }
        }
    
        setGeneratedAgentReport({
            agent,
            month: months[month].label,
            year,
            bookings: agentBookings,
            ...reportData
        });
    
        setGeneratingAgentReport(false);
    };

    const handleGenerateInvestorReport = () => {
        if (!selectedInvestorId) return;

        setGeneratingInvestorReport(true);
        const investor = investors.find(i => i.id === selectedInvestorId);
        
        if (!investor || !investor.unitIds || investor.unitIds.length === 0) {
            console.warn('This investor has no units assigned. Please edit the investor to assign units.');
            setGeneratingInvestorReport(false);
            return;
        }

        const year = parseInt(selectedInvestorYear);
        const month = parseInt(selectedInvestorMonth);
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
      <div className="flex items-center mb-6">
        <Link href="/dashboard/more" className="mr-4 p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
            <h2 className="text-xl font-bold text-gray-900">Reports</h2>
            <p className="text-sm text-gray-500">Financial performance overview</p>
        </div>
      </div>
      
      <Tabs defaultValue="unit" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-200 rounded-lg p-1">
          <TabsTrigger value="unit" className="data-[state=active]:prime-button rounded-md">Unit Report</TabsTrigger>
          <TabsTrigger value="agent" className="data-[state=active]:prime-button rounded-md">Agent Report</TabsTrigger>
          <TabsTrigger value="investor" className="data-[state=active]:prime-button rounded-md">Investor Report</TabsTrigger>
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
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>                            ))}
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
