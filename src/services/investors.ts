
'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Investor } from '@/lib/types';

const investorsCollection = collection(db, 'investors');
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getInvestors(): Promise<Investor[]> {
    const snapshot = await getDocs(investorsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Investor));
}

export async function addInvestor(investorData: Omit<Investor, 'id'>): Promise<string> {
    if (!API_BASE_URL) {
        throw new Error("API base URL is not configured.");
    }
    const response = await fetch(`${API_BASE_URL}/investor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(investorData),
    });

     if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add investor via backend');
    }
    const result = await response.json();
    return result.id;
}

export async function updateInvestor(investorData: Investor): Promise<void> {
    const { id, ...data } = investorData;
    if (!id) throw new Error("Investor ID is required for update");
    const investorDoc = doc(db, 'investors', id);
    await updateDoc(investorDoc, data);
}

export async function deleteInvestor(investorId: string): Promise<void> {
    const investorDoc = doc(db, 'investors', investorId);
    await deleteDoc(investorDoc);
}
