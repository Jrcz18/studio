
'use client';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { Agent } from '@/lib/types';

const agentsCollection = collection(db, 'agents');
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;


export async function getAgents(): Promise<Agent[]> {
    const snapshot = await getDocs(agentsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));
}

export async function addAgent(agentData: Omit<Agent, 'id'>): Promise<string> {
     if (!API_BASE_URL) {
        throw new Error("API base URL is not configured.");
    }
    const response = await fetch(`${API_BASE_URL}/agent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add agent via backend');
    }
    const result = await response.json();
    return result.id;
}

export async function updateAgent(agentData: Agent): Promise<void> {
    const { id, ...data } = agentData;
    if (!id) throw new Error("Agent ID is required for update");
    const agentDoc = doc(db, 'agents', id);
    await updateDoc(agentDoc, data);
}

export async function deleteAgent(agentId: string): Promise<void> {
    const agentDoc = doc(db, 'agents', agentId);
    await deleteDoc(agentDoc);
}
