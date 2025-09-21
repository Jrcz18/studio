
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { InvestorsList } from '@/components/dashboard/investors/investors-list';
import { AddInvestorDialog } from '@/components/dashboard/investors/add-investor-dialog';
import { PayProfitDialog } from '@/components/dashboard/investors/pay-profit-dialog';
import type { Investor, ProfitPayment, Unit, Booking, Expense } from '@/lib/types';
import { getInvestors, addInvestor as addInvestorService, updateInvestor as updateInvestorService, deleteInvestor as deleteInvestorService } from '@/services/investors';
import { getProfitPayments, addProfitPayment as addProfitPaymentService } from '@/services/profit-payments';
import { getUnits } from '@/services/units';
import { getBookings } from '@/services/bookings';
import { getExpenses } from '@/services/expenses';
import { useUIContext } from '@/hooks/use-ui-context';


export default function InvestorsPage() {
  const {
    isAddInvestorOpen,
    setIsAddInvestorOpen,
    isPayProfitOpen,
    setIsPayProfitOpen,
  } = useUIContext();
  const [investors, setInvestors] = React.useState<Investor[]>([]);
  const [profitPayments, setProfitPayments] = React.useState<ProfitPayment[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestor, setSelectedInvestor] = React.useState<Investor | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchData() {
        const [investorsData, paymentsData, unitsData, bookingsData, expensesData] = await Promise.all([
          getInvestors(),
          getProfitPayments(),
          getUnits(),
          getBookings(),
          getExpenses()
        ]);
        setInvestors(investorsData);
        setProfitPayments(paymentsData);
        setUnits(unitsData);
        setBookings(bookingsData);
        setExpenses(expensesData);
        setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsAddInvestorOpen(true);
    }
  }, [searchParams, setIsAddInvestorOpen]);

  const handleOpenAddDialog = () => {
    setSelectedInvestor(null);
    setIsAddInvestorOpen(true);
  };
  
  const handleOpenEditDialog = (investor: Investor) => {
    setSelectedInvestor(investor);
    setIsAddInvestorOpen(true);
  };
  
  const handleOpenPayProfitDialog = (investor: Investor) => {
    setSelectedInvestor(investor);
    setIsPayProfitOpen(true);
  };

  const addInvestor = async (newInvestorData: Omit<Investor, 'id' | 'status'>) => {
    const newInvestor: Omit<Investor, 'id'> = {
      ...newInvestorData,
      status: 'active',
    };
    const id = await addInvestorService(newInvestor);
    setInvestors((prev) => [...prev, { ...newInvestor, id }]);
  };

  const updateInvestor = async (updatedInvestor: Investor) => {
    await updateInvestorService(updatedInvestor);
    setInvestors((prev) =>
      prev.map((i) => (i.id === updatedInvestor.id ? updatedInvestor : i))
    );
    setSelectedInvestor(null);
  };

  const deleteInvestor = async (investorId: string) => {
     if (confirm('Are you sure you want to remove this investor?')) {
        await deleteInvestorService(investorId);
        setInvestors((prev) => prev.filter((i) => i.id !== investorId));
    }
  };

  const recordProfitPayment = async (newPaymentData: Omit<ProfitPayment, 'id' | 'status'>) => {
    const newPayment: Omit<ProfitPayment, 'id'> = {
      ...newPaymentData,
      status: 'paid',
    };
    const id = await addProfitPaymentService(newPayment);
    setProfitPayments((prev) => [...prev, { ...newPayment, id }]);
  };
  
  if (loading) {
    return <div className="p-4 text-center">Loading investors...</div>
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Investor Dashboard</h2>
          <p className="text-sm text-gray-500">Financial performance & returns</p>
        </div>
        <AddInvestorDialog
          open={isAddInvestorOpen}
          onOpenChange={setIsAddInvestorOpen}
          onAddInvestor={addInvestor}
          onUpdateInvestor={updateInvestor}
          investor={selectedInvestor}
          units={units}
        >
          <button
            onClick={handleOpenAddDialog}
            className="prime-button px-4 py-2 text-sm"
          >
            + Add
          </button>
        </AddInvestorDialog>
      </div>
      <InvestorsList 
        investors={investors} 
        profitPayments={profitPayments}
        units={units}
        bookings={bookings}
        expenses={expenses}
        onEdit={handleOpenEditDialog} 
        onDelete={deleteInvestor}
        onPayProfit={handleOpenPayProfitDialog}
      />
      <PayProfitDialog
        open={isPayProfitOpen}
        onOpenChange={setIsPayProfitOpen}
        investor={selectedInvestor}
        onRecordPayment={recordProfitPayment}
      />
    </div>
  );
}
