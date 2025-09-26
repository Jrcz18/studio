
'use client';

import type { Expense } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchFromApi(path: string, options: RequestInit = {}) {
    if (!API_BASE_URL) {
        throw new Error("API_BASE_URL not configured.");
    }
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed with status ' + response.status }));
        throw new Error(errorData.error || 'An unknown API error occurred');
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
}


export async function getExpenses(): Promise<Expense[]> {
    return fetchFromApi('/expenses');
}

export async function addExpense(expenseData: Omit<Expense, 'id'>): Promise<{ id: string }> {
    return fetchFromApi('/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
    });
}

export async function updateExpense(expenseData: Expense): Promise<void> {
    const { id, ...data } = expenseData;
    if (!id) throw new Error("Expense ID is required for update");
    await fetchFromApi(`/expense/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export async function deleteExpense(expenseId: string): Promise<void> {
    await fetchFromApi(`/expense/${expenseId}`, {
        method: 'DELETE',
    });
}
