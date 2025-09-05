'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { bookings, units } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function BookingReceiptDialog({
  bookingId,
  open,
  onOpenChange,
}: {
  bookingId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!bookingId) return null;

  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return null;

  const unit = units.find((u) => u.id === booking.unitId);
  const checkinDate = new Date(booking.checkinDate);
  const checkoutDate = new Date(booking.checkoutDate);
  const nights = Math.ceil(
    (checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const statusVariant = {
    pending: 'bg-red-100 text-red-800',
    partial: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
  };

  const handlePrint = () => {
    const receiptContent =
      document.getElementById('receiptContent')?.innerHTML || '';
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
        <html>
            <head>
                <title>Booking Receipt</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                </style>
            </head>
            <body>
                ${receiptContent}
            </body>
        </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Receipt</DialogTitle>
        </DialogHeader>

        <div id="receiptContent" className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl font-bold">MP</span>
            </div>
            <h4 className="text-lg font-bold text-gray-800">
              Manila Prime Staycation
            </h4>
            <p className="text-sm text-gray-600">Booking Receipt</p>
          </div>

          <div className="border-t border-b border-gray-200 py-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Booking ID:</p>
                <p className="font-semibold">
                  #{booking.id.toString().padStart(4, '0')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Date Issued:</p>
                <p className="font-semibold">
                  {formatDate(booking.createdAt.split('T')[0])}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="font-semibold text-gray-800 mb-2">
              Guest Information
            </h5>
            <div className="text-sm space-y-1">
              <p>
                <strong>Name:</strong> {booking.guestFirstName}{' '}
                {booking.guestLastName}
              </p>
              <p>
                <strong>Phone:</strong> {booking.guestPhone}
              </p>
              <p>
                <strong>Email:</strong> {booking.guestEmail}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="font-semibold text-gray-800 mb-2">
              Booking Details
            </h5>
            <div className="text-sm space-y-1">
              <p>
                <strong>Unit:</strong> {unit?.name} ({unit?.type})
              </p>
              <p>
                <strong>Check-in:</strong> {formatDate(booking.checkinDate)}
              </p>
              <p>
                <strong>Check-out:</strong> {formatDate(booking.checkoutDate)}
              </p>
              <p>
                <strong>Nights:</strong> {nights}
              </p>
              <p>
                <strong>Guests:</strong> {booking.adults} Adults,{' '}
                {booking.children} Children
              </p>
            </div>
          </div>

          <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <h5 className="font-semibold text-gray-800 mb-2">📶 WiFi Access</h5>
            <div className="text-sm space-y-1">
              <p>
                <strong>Network:</strong> Manila Prime WiFi
              </p>
              <p>
                <strong>Password:</strong>{' '}
                <span className="font-mono bg-white px-2 py-1 rounded border">
                  Prime{unit?.name?.replace(/\s+/g, '')}
                </span>
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Please connect to our complimentary WiFi during your stay
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h5 className="font-semibold text-gray-800 mb-2">
              Payment Summary
            </h5>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span>Rate per night:</span>
                <span>₱{booking.nightlyRate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Number of nights:</span>
                <span>{nights}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>₱{booking.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Payment Status:</span>
                  <Badge
                    className={`px-2 py-1 rounded text-xs ${
                      statusVariant[booking.paymentStatus]
                    }`}
                  >
                    {booking.paymentStatus.charAt(0).toUpperCase() +
                      booking.paymentStatus.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {booking.specialRequests && (
            <div className="mb-4">
              <h5 className="font-semibold text-gray-800 mb-2">
                Special Requests
              </h5>
              <p className="text-sm text-gray-600">
                {booking.specialRequests}
              </p>
            </div>
          )}

          <div className="text-center text-xs text-gray-500 mt-6">
            <p>Thank you for choosing Manila Prime Staycation!</p>
            <p>For inquiries, contact us at primestaycation24@gmail.com</p>
          </div>
        </div>
        <DialogFooter className="mt-6 flex space-x-3">
          <Button onClick={handlePrint} className="w-full">
            🖨️ Print
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full prime-button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
