
'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import type { Expense } from '@/lib/types';

const expensesCollectionRef = collection(db, 'expenses');
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// CLIENT-SIDE functions
export async function getExpenses(): Promise<Expense[]> {
    const snapshot = await getDocs(expensesCollectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
}

export async function addExpense(expenseData: Omit<Expense, 'id'>): Promise<string> {
    if (!API_BASE_URL) {
        throw new Error("API base URL is not configured.");
    }
    const response = await fetch(`${API_BASE_URL}/expense`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add expense via backend');
    }
    const result = await response.json();
    return result.id;
}

export async function updateExpense(expenseData: Expense): Promise<void> {
    const { id, ...data } = expenseData;
    if (!id) throw new Error("Expense ID is required for update");
    const expenseDoc = doc(db, 'expenses', id);
    await updateDoc(expenseDoc, data);
}

export async function deleteExpense(expenseId: string): Promise<void> {
    if (!API_BASE_URL) {
        throw new Error("API_BASE_URL not configured. Cannot delete expense.");
    }

    const response = await fetch(`${API_BASE_URL}/expense/${expenseId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete expense via backend');
    }
}
