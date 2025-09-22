
'use client';

import { formatDate, printContent } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { generateReportSummary, ReportSummaryInput } from '@/ai/flows/report-summary';
import { useEffect, useState } from 'react';

export function ReportView({ report }: { report: any }) {
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (report) {
      handleGenerateSummary();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report]);

  const handleGenerateSummary = async () => {
    if (!report) return;
    setLoadingSummary(true);
    setSummary('');

    try {
      const input: ReportSummaryInput = {
        unitName: report.unit.name,
        month: report.month,
        year: report.year,
        totalRevenue: report.totalRevenue,
        totalExpenses: report.totalExpenses,
        netProfit: report.netProfit,
      };
      const result = await generateReportSummary(input);
      setSummary(result.summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setSummary('Could not generate AI summary at this time.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handlePrint = () => {
    printContent({
      contentId: 'report-content',
      title: `${report.unit.name.replace(/ /g, '_')}_${report.month}_${report.year}`
    });
  };

  if (!report) return null;

  return (
    <div className="prime-card p-4">
        <div id="report-content">
            <div className="text-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Monthly Performance Report</h2>
                <p className="text-lg font-semibold text-gray-600">{report.unit.name}</p>
                <p className="text-md text-gray-500">{report.month} {report.year}</p>
            </div>

             {/* AI Summary */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M12 3c7.2 0 9 1.8 9 9s-1.8 9-9 9-9-1.8-9-9 1.8-9 9-9z"/><path d="M9 9h6v6H9z"/><path d="M9 3v6"/><path d="M15 3v6"/></svg>
                AI-Powered Summary
              </h3>
              {loadingSummary ? (
                <p className="text-sm text-blue-700 animate-pulse">Generating insights...</p>
              ) : (
                <p className="text-sm text-blue-700">{summary}</p>
              )}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div>
                    <p className="text-2xl font-bold text-green-600">₱{report.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-red-600">₱{report.totalExpenses.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-yellow-600">₱{report.netProfit.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Net Profit</p>
                </div>
            </div>

            {/* Revenue Details */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-1">Revenue Details</h3>
                {report.bookings.length > 0 ? (
                    <div className="flow-root">
                        <ul className="-my-2 divide-y divide-gray-200">
                            {report.bookings.map((booking: any) => (
                                <li key={booking.id} className="py-2 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{booking.guestFirstName} {booking.guestLastName}</p>
                                        <p className="text-xs text-gray-500">{formatDate(booking.checkinDate)} - {formatDate(booking.checkoutDate)}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-green-600">+ ₱{booking.totalAmount.toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : <p className="text-sm text-gray-500">No bookings for this month.</p>}
            </div>

            {/* Expenses Details */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-1">Expense Details</h3>
                {report.expenses.length > 0 ? (
                     <div className="flow-root">
                        <ul className="-my-2 divide-y divide-gray-200">
                            {report.expenses.map((expense: any) => (
                                <li key={expense.id} className="py-2 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">{expense.title}</p>
                                        <p className="text-xs text-gray-500">{expense.category} - {formatDate(expense.date)}</p>
                                    </div>
                                    <p className="text-sm font-semibold text-red-600">- ₱{expense.amount.toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : <p className="text-sm text-gray-500">No expenses for this month.</p>}
            </div>

            {/* Investor Share */}
            {report.investor && (
                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">Investor Payout</h3>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-gray-700">{report.investor.name}</p>
                            <p className="text-xs text-gray-500">{report.investor.sharePercentage}% Share</p>
                        </div>
                        <p className="text-lg font-bold text-yellow-700">₱{report.investorShare.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                    </div>
                 </div>
            )}
        </div>
        <div className="mt-6 border-t pt-4 flex justify-end print-hide">
            <Button onClick={handlePrint} className="prime-button">Print Report</Button>
        </div>
    </div>
  );
}
