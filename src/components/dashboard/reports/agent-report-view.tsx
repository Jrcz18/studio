
'use client';

import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { generateAgentReportSummary, AgentReportSummaryInput } from '@/ai/flows/agent-report-summary';
import { useEffect, useState } from 'react';

export function AgentReportView({ report }: { report: any }) {
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
      const input: AgentReportSummaryInput = {
        agentName: report.agent.name,
        month: report.month,
        year: report.year,
        totalBookings: report.bookings.length,
        totalCommission: report.totalCommission,
        totalRevenueGenerated: report.totalRevenueGenerated,
      };
      const result = await generateAgentReportSummary(input);
      setSummary(result.summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      setSummary('Could not generate AI summary at this time.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('agent-report-content')?.innerHTML;
    const printWindow = window.open('', '_blank', 'height=800,width=800');
    if (printWindow) {
        const fileName = `Agent_Report_${report.agent.name.replace(/ /g, '_')}_${report.month}_${report.year}`;
        printWindow.document.write(`<html><head><title>${fileName}</title>`);
        printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
        printWindow.document.write('<style>body { -webkit-print-color-adjust: exact; font-family: sans-serif; }</style>');
        printWindow.document.write('</head><body class="p-8">');
        printWindow.document.write(printContent || '');
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        setTimeout(() => { // Timeout to allow content to load
            printWindow.print();
        }, 500);
    }
  }

  if (!report) return null;

  return (
    <div className="prime-card p-4">
        <div id="agent-report-content">
            <div className="text-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">Monthly Agent Performance</h2>
                <p className="text-lg font-semibold text-gray-600">{report.agent.name}</p>
                <p className="text-md text-gray-500">{report.month} {report.year}</p>
            </div>

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

            <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div>
                    <p className="text-2xl font-bold text-blue-600">{report.bookings.length}</p>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-green-600">₱{report.totalRevenueGenerated.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Revenue Generated</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-yellow-600">₱{report.totalCommission.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Commission</p>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b pb-1">Bookings Details</h3>
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
        </div>
        <div className="mt-6 border-t pt-4 flex justify-end">
            <Button onClick={handlePrint} className="prime-button">Print Report</Button>
        </div>
    </div>
  );
}
