
'use client';
/**
 * @fileOverview Client-side function to suggest a resolution for a booking conflict by calling a backend API.
 *
 * - suggestConflictResolution - Calls the backend to suggest a resolution for a booking conflict.
 * - ConflictResolutionInput - The input type for the function.
 * - ConflictResolutionOutput - The return type for the function.
 */

import { z } from 'zod';

const BookingDetailsSchema = z.object({
    id: z.string().optional(),
    guestName: z.string(),
    checkinDate: z.string(),
    checkoutDate: z.string(),
    totalAmount: z.number(),
    createdAt: z.string(),
  });

const ConflictResolutionInputSchema = z.object({
    existingBooking: BookingDetailsSchema.describe('The booking that already exists in the calendar.'),
    newBooking: BookingDetailsSchema.describe('The new booking that is causing the conflict.'),
    unitName: z.string().describe('The name of the unit with the booking conflict.'),
  });

const ConflictResolutionOutputSchema = z.object({
    suggestion: z.string().describe('The suggested course of action to resolve the conflict.'),
    suggestedAction: z.enum(['keep_existing', 'prioritize_new', 'offer_alternative']).describe('A machine-readable suggested action.'),
});

export type BookingDetails = z.infer<typeof BookingDetailsSchema>;
export type ConflictResolutionInput = z.infer<typeof ConflictResolutionInputSchema>;
export type ConflictResolutionOutput = z.infer<typeof ConflictResolutionOutputSchema>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function suggestConflictResolution(input: ConflictResolutionInput): Promise<ConflictResolutionOutput> {
    // TODO: Backend functionality is temporarily disabled until Firebase billing is enabled.
    // This is a placeholder response.
    console.log("Called suggestConflictResolution with:", input);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    return {
        suggestion: "AI conflict resolution is temporarily disabled. Please resolve manually or enable billing and deploy Firebase Functions to activate this feature.",
        suggestedAction: 'offer_alternative'
    };

    /*
    // Original code to be re-enabled later
    const res = await fetch(`${API_BASE_URL}/resolveConflict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Request failed');
    }
    return res.json();
    */
}
