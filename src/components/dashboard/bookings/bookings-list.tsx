'use client';

import { bookings, units } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';
import { BookingReceiptDialog } from './booking-receipt-dialog';
import { useState } from 'react';

export function BookingsList() {
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(
    null
  );
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const handleShowReceipt = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setIsReceiptOpen(true);
  };

  if (bookings.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">No bookings found</p>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => {
        const unit = units.find((u) => u.id === booking.unitId);
        const statusVariant = {
          pending: 'bg-yellow-100 text-yellow-800',
          partial: 'bg-orange-100 text-orange-800',
          paid: 'bg-green-100 text-green-800',
        };

        return (
          <Card key={booking.id} className="fb-card">
            <CardHeader className="fb-header">
              <div className="flex items-center">
                <div className="fb-avatar">
                  <span>
                    {booking.guestFirstName.charAt(0)}
                    {booking.guestLastName.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">
                    {booking.guestFirstName} {booking.guestLastName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {unit ? unit.name : 'Unknown Unit'}
                  </p>
                </div>
              </div>
              <Badge
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  statusVariant[booking.paymentStatus]
                }`}
              >
                {booking.paymentStatus.charAt(0).toUpperCase() +
                  booking.paymentStatus.slice(1)}
              </Badge>
            </CardHeader>
            <CardContent className="fb-content">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                <div>
                  <p>
                    <strong>Check-in:</strong> {formatDate(booking.checkinDate)}
                  </p>
                  <p>
                    <strong>Check-out:</strong>{' '}
                    {formatDate(booking.checkoutDate)}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Guests:</strong> {booking.adults + booking.children}
                  </p>
                  <p>
                    <strong>Total:</strong> ₱{booking.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="fb-actions">
              <Button
                onClick={() => handleShowReceipt(booking.id)}
                className="fb-btn fb-btn-primary"
              >
                Receipt
              </Button>
              <Button
                onClick={() => alert('Edit feature coming soon!')}
                className="fb-btn fb-btn-secondary"
              >
                Edit
              </Button>
              <Button
                onClick={() => alert('Delete feature coming soon!')}
                className="fb-btn fb-btn-secondary"
              >
                Delete
              </Button>
            </CardFooter>
          </Card>
        );
      })}
      <BookingReceiptDialog
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        bookingId={selectedBookingId}
      />
    </div>
  );
}
