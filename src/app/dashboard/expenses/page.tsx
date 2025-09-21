
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ExpensesList } from '@/components/dashboard/expenses/expenses-list';
import { AddExpenseDialog } from '@/components/dashboard/expenses/add-expense-dialog';
import type { Expense, Unit } from '@/lib/types';
import { getExpenses, addExpense as addExpenseService, updateExpense as updateExpenseService, deleteExpense as deleteExpenseService } from '@/services/expenses';
import { getUnits } from '@/services/units';
import { useUIContext } from '@/hooks/use-ui-context';

export default function ExpensesPage() {
  const { isAddExpenseOpen, setIsAddExpenseOpen } = useUIContext();
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = React.useState<Expense | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchData() {
        const expensesData = await getExpenses();
        const unitsData = await getUnits();
        setExpenses(expensesData);
        setUnits(unitsData);
        setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsAddExpenseOpen(true);
    }
  }, [searchParams, setIsAddExpenseOpen]);

  const handleOpenAddDialog = () => {
    setSelectedExpense(null);
    setIsAddExpenseOpen(true);
  };
  
  const handleOpenEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsAddExpenseOpen(true);
  };

  const addExpense = async (newExpenseData: Omit<Expense, 'id'>) => {
    const id = await addExpenseService(newExpenseData);
    setExpenses((prev) => [...prev, { ...newExpenseData, id }]);
  };

  const updateExpense = async (updatedExpense: Expense) => {
    await updateExpenseService(updatedExpense);
    setExpenses((prev) =>
      prev.map((e) => (e.id === updatedExpense.id ? updatedExpense : e))
    );
    setSelectedExpense(null);
  }

  const deleteExpense = async (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
        await deleteExpenseService(expenseId);
        setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading expenses...</div>
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Expenses</h2>
          <p className="text-sm text-gray-500">Track all property expenses</p>
        </div>
        <AddExpenseDialog
          open={isAddExpenseOpen}
          onOpenChange={setIsAddExpenseOpen}
          onAddExpense={addExpense}
          onUpdateExpense={updateExpense}
          expense={selectedExpense}
          units={units}
        >
          <button
            onClick={handleOpenAddDialog}
            className="prime-button px-4 py-2 text-sm"
          >
            + Add
          </button>
        </AddExpenseDialog>
      </div>
      <ExpensesList expenses={expenses} units={units} onEdit={handleOpenEditDialog} onDelete={deleteExpense} />
    </div>
  );
}
