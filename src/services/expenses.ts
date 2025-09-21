
'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Expense } from '@/lib/types';

const expensesCollectionRef = collection(db, 'expenses');

// CLIENT-SIDE functions
export async function getExpenses(): Promise<Expense[]> {
    const snapshot = await getDocs(expensesCollectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
}

export async function addExpense(expenseData: Omit<Expense, 'id'>): Promise<string> {
    const docRef = await addDoc(expensesCollectionRef, expenseData);
    return docRef.id;
}

export async function updateExpense(expenseData: Expense): Promise<void> {
    const { id, ...data } = expenseData;
    if (!id) throw new Error("Expense ID is required for update");
    const expenseDoc = doc(db, 'expenses', id);
    await updateDoc(expenseDoc, data);
}

export async function deleteExpense(expenseId: string): Promise<void> {
    const expenseDoc = doc(db, 'expenses', expenseId);
    await deleteDoc(expenseDoc);
}
