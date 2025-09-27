
export type Unit = {
  id?: string;
  name: string;
  type: string;
  rate: number;
  maxOccupancy: number;
  baseOccupancy: number;
  extraGuestFee: number;
  status: 'available' | 'occupied' | 'maintenance';
};

export type Booking = {
  id?: string;
  uid?: string; 
  guestFirstName: string;
  guestLastName:string;
  guestPhone: string;
  guestEmail: string;
  unitId: string;
  agentId?: string;
  checkinDate: string;
  checkoutDate: string;
  adults: number;
  children: number;
  nightlyRate: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  specialRequests: string;
  createdAt: string;
};

export type Agent = {
    id?: string;
    name: string;
    email: string;
    phone: string;
    commissionType: 'percentage' | 'fixed_commission';
    commissionRate: number;
    joinDate: string;
    status: 'active' | 'inactive';
};
