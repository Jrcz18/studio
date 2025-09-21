
'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import type { UnitIncident } from '@/lib/types';

const incidentsCollection = collection(db, 'incidents');

/**
 * Adds a new incident to the Firestore database.
 * @param incidentData The data for the new incident.
 * @returns The ID of the newly created incident document.
 */
export async function addIncident(incidentData: Omit<UnitIncident, 'id'>): Promise<string> {
    const docRef = await addDoc(incidentsCollection, incidentData);
    return docRef.id;
}

/**
 * Updates an existing incident in the Firestore database.
 * @param incidentData The incident data to update, including its ID.
 */
export async function updateIncident(incidentData: UnitIncident): Promise<void> {
    const { id, ...data } = incidentData;
    if (!id) throw new Error("Incident ID is required for update");
    const incidentDoc = doc(db, 'incidents', id);
    await updateDoc(incidentDoc, data);
}

/**
 * Fetches all incidents for a specific unit, optionally limited by a date range.
 * @param unitId The ID of the unit to fetch incidents for.
 * @param daysAgo (Optional) The number of days into the past to fetch incidents from.
 * @returns A promise that resolves to an array of incidents.
 */
export async function getIncidentsForUnit(unitId: string, daysAgo?: number): Promise<UnitIncident[]> {
    let q = query(incidentsCollection, where('unitId', '==', unitId), orderBy('date', 'desc'));

    if (daysAgo) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - daysAgo);
        const dateString = pastDate.toISOString().split('T')[0];
        q = query(incidentsCollection, where('unitId', '==', unitId), where('date', '>=', dateString), orderBy('date', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UnitIncident));
}
