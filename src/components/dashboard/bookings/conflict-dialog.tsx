
'use client';

import type { Booking, Unit } from '@/lib/types';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { ConflictResolutionInput, suggestConflictResolution } from '@/ai/flows/resolve-conflict';
import { AlertCircle, Cpu } from 'lucide-react';


interface ConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictData: { newBooking: Omit<Booking, 'id'>, existingBooking: Booking } | null;
  units: Unit[];
  onForceAdd: (booking: Omit<Booking, 'id'>) => void;
}

export function ConflictDialog({ open, onOpenChange, conflictData, units, onForceAdd }: ConflictDialogProps) {
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const unit = useMemo(() => {
    if (!conflictData) return null;
    return units.find(u => u.id === conflictData.existingBooking.unitId);
  }, [conflictData, units]);
  
  if (!conflictData || !unit) {
    return null;
  }
  
  const { newBooking, existingBooking } = conflictData;

  const handleGetSuggestion = async () => {
    setLoadingSuggestion(true);
    setSuggestion(null);

    const input: ConflictResolutionInput = {
      unitName: unit.name,
      existingBooking: {
        id: existingBooking.id,
        guestName: `${existingBooking.guestFirstName} ${existingBooking.guestLastName}`,
        checkinDate: existingBooking.checkinDate,
        checkoutDate: existingBooking.checkoutDate,
        totalAmount: existingBooking.totalAmount,
        createdAt: existingBooking.createdAt,
      },
      newBooking: {
        guestName: `${newBooking.guestFirstName} ${newBooking.guestLastName}`,
        checkinDate: newBooking.checkinDate,
        checkoutDate: newBooking.checkoutDate,
        totalAmount: newBooking.totalAmount,
        createdAt: newBooking.createdAt,
      },
    };

    try {
      const result = await suggestConflictResolution(input);
      setSuggestion(result.suggestion);
    } catch (error) {
      console.error("Failed to get AI suggestion:", error);
      setSuggestion("Could not generate a suggestion at this time. Please resolve manually.");
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleForceAdd = () => {
    onForceAdd(newBooking);
  };
  
  const handleClose = () => {
    setSuggestion(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
            Booking Conflict Detected
          </DialogTitle>
          <DialogDescription>
            The new booking you are trying to create overlaps with an existing reservation for <span className="font-semibold">{unit.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Existing Booking */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-800 mb-2">Existing Booking</h3>
            <p className="text-sm"><strong>Guest:</strong> {existingBooking.guestFirstName} {existingBooking.guestLastName}</p>
            <p className="text-sm"><strong>Dates:</strong> {formatDate(existingBooking.checkinDate)} to {formatDate(existingBooking.checkoutDate)}</p>
            <p className="text-sm"><strong>Value:</strong> ₱{existingBooking.totalAmount.toLocaleString()}</p>
          </div>

          {/* New Booking */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-800 mb-2">New (Conflicting) Booking</h3>
            <p className="text-sm"><strong>Guest:</strong> {newBooking.guestFirstName} {newBooking.guestLastName}</p>
            <p className="text-sm"><strong>Dates:</strong> {formatDate(newBooking.checkinDate)} to {formatDate(newBooking.checkoutDate)}</p>
            <p className="text-sm"><strong>Value:</strong> ₱{newBooking.totalAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* AI Suggestion */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
            <Cpu className="w-5 h-5 mr-2" />
            AI-Powered Suggestion
          </h3>
          {loadingSuggestion ? (
            <p className="text-sm text-blue-700 animate-pulse">Analyzing conflict...</p>
          ) : suggestion ? (
            <p className="text-sm text-blue-700">{suggestion}</p>
          ) : (
            <p className="text-sm text-gray-600">Click the button below to get an AI-powered recommendation on how to resolve this conflict.</p>
          )}
        </div>

        <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button variant="destructive" onClick={handleForceAdd}>Force Add Booking</Button>
            <Button onClick={handleGetSuggestion} disabled={loadingSuggestion} className="prime-button">
              {loadingSuggestion ? 'Thinking...' : 'Get AI Suggestion'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
