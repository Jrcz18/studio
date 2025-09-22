
'use client';

import type { Booking, Unit, ReceiptSettings } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { getReceiptSettings } from '@/services/receipt-settings';
import { printContent } from '@/lib/utils';


export function BookingReceiptDialog({
  bookingId,
  open,
  onOpenChange,
  bookings,
  units,
}: {
  bookingId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookings: Booking[];
  units: Unit[];
}) {
  const [settings, setSettings] = useState<ReceiptSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  const booking = open && bookingId ? bookings.find((b) => b.id === bookingId) : null;
  
  useEffect(() => {
    async function fetchSettings() {
      if (open) {
        setLoading(true);
        const settingsData = await getReceiptSettings();
        setSettings(settingsData);
        setLoading(false);
      }
    }
    fetchSettings();
  }, [open]);

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

  const wifiNetwork = unit?.wifiNetwork || settings?.wifiNetwork;
  const wifiPassword = unit?.wifiPassword || settings?.wifiPassword;

  const receiptContentId = `receipt-content-${booking.id}`;

  const handlePrint = () => {
    printContent({
      contentId: receiptContentId,
      title: `Booking_Receipt_${booking.guestFirstName}_${booking.guestLastName}`
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0 print-hide">
          <DialogTitle>Booking Receipt</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1">
          <div id={receiptContentId} className="space-y-4 p-6">
              {loading ? (
                  <div className="text-center p-8">Loading receipt details...</div>
              ) : (
                  <>
                      <div className="text-center mb-6">
                          <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-3">
                              <span className="text-white text-xl font-bold">MP</span>
                          </div>
                          <h4 className="text-lg font-bold text-gray-800">Manila Prime Staycation</h4>
                          <p className="text-sm text-gray-600">Booking Receipt</p>
                      </div>
                      
                      <div className="border-t border-b border-gray-200 py-4 mb-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                  <p className="text-gray-600">Booking ID:</p>
                                  <p className="font-semibold">#${booking.id!.substring(0, 4)}</p>
                              </div>
                              <div>
                                  <p className="text-gray-600">Date Issued:</p>
                                  <p className="font-semibold">{booking.createdAt ? formatDate(booking.createdAt.split('T')[0]) : 'N/A'}</p>
                              </div>
                          </div>
                      </div>
                      
                      <div className="mb-4">
                          <h5 className="font-semibold text-gray-800 mb-2">Guest Information</h5>
                          <div className="text-sm space-y-1">
                              <p><strong>Name:</strong> {booking.guestFirstName} {booking.guestLastName}</p>
                              <p><strong>Phone:</strong> {booking.guestPhone}</p>
                              <p><strong>Email:</strong> {booking.guestEmail}</p>
                          </div>
                      </div>
                      
                      <div className="mb-4">
                          <h5 className="font-semibold text-gray-800 mb-2">Booking Details</h5>
                          <div className="text-sm space-y-1">
                              <p><strong>Unit:</strong> {unit?.name} ({unit?.type})</p>
                              <p><strong>Check-in:</strong> {formatDate(booking.checkinDate)} {settings?.checkinTime}</p>
                              <p><strong>Check-out:</strong> {formatDate(booking.checkoutDate)} {settings?.checkoutTime}</p>
                              <p><strong>Nights:</strong> {nights}</p>
                              <p><strong>Guests:</strong> {booking.adults} Adults, {booking.children} Children</p>
                          </div>
                      </div>
                      
                      {wifiNetwork && (
                          <div className="mb-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                              <h5 className="font-semibold text-gray-800 mb-2">📶 WiFi Access</h5>
                              <div className="text-sm space-y-1">
                                  <p><strong>Network:</strong> {wifiNetwork}</p>
                                  <p><strong>Password:</strong> <span className="font-mono bg-white px-2 py-1 rounded border">{wifiPassword || 'No password'}</span></p>
                                  <p className="text-xs text-gray-600 mt-2">Please connect to our complimentary WiFi during your stay</p>
                              </div>
                          </div>
                      )}
                      
                      <div className="mb-4">
                          <h5 className="font-semibold text-gray-800 mb-2">Payment Summary</h5>
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
                                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusVariant[booking.paymentStatus]}`}>
                                          {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      {booking.specialRequests &&
                          <div className="mb-4">
                              <h5 className="font-semibold text-gray-800 mb-2">Special Requests</h5>
                              <p className="text-sm text-gray-600">{booking.specialRequests}</p>
                          </div>
                      }
                      
                      <div className="text-center text-xs text-gray-500 mt-6">
                          <p>Thank you for choosing Manila Prime Staycation!</p>
                           {settings?.contactEmail && <p>For inquiries, contact us at {settings.contactEmail}</p>}
                      </div>
                  </>
              )}
          </div>
        </div>
        <DialogFooter className="p-6 pt-4 border-t print-hide">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handlePrint} className="prime-button">
              🖨️ Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
