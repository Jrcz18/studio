
'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, addDoc } from 'firebase/firestore';
import type { Unit } from '@/lib/types';

const unitsCollection = collection(db, 'units');
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getUnits(): Promise<Unit[]> {
    const snapshot = await getDocs(unitsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit));
}

export async function getUnit(unitId: string): Promise<Unit | null> {
    const unitDoc = doc(db, 'units', unitId);
    const snapshot = await getDoc(unitDoc);
    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Unit;
    }
    return null;
}

export async function addUnit(unitData: Omit<Unit, 'id'>): Promise<string> {
    if (!API_BASE_URL) {
        // Fallback to direct Firestore write if API is not configured
        console.warn("API_BASE_URL not configured. Falling back to direct Firestore write. Calendar sync will not be initialized.");
        const docRef = await addDoc(collection(db, 'units'), unitData);
        return docRef.id;
    }
    
    const response = await fetch(`${API_BASE_URL}/unit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(unitData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add unit via backend');
    }

    const result = await response.json();
    return result.id;
}

export async function updateUnit(unitData: Unit): Promise<void> {
    const { id, ...data } = unitData;
    if (!id) throw new Error("Unit ID is required for update");
    const unitDoc = doc(db, 'units', id);
    await updateDoc(unitDoc, data);
}

export async function deleteUnit(unitId: string): Promise<void> {
    const unitDoc = doc(db, 'units', unitId);
    await deleteDoc(unitDoc);
}
