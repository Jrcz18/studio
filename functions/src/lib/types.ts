

export type Unit = {
  id?: string;
  name: string;
  type: string;
  rate: number;
  maxOccupancy: number;
  baseOccupancy: number; 
  extraGuestFee: number; 
  status: 'available' | 'occupied' | 'maintenance';
  description: string;
  healthScore?: number; 
  calendars: {
    airbnb: string;
    bookingcom: string;
    direct: string;
  };
  wifiNetwork?: string;
  wifiPassword?: string;
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
    commissionMarkup: number;
    totalBookings: number;
    totalCommissions: number;
    joinDate: string;
    status: 'active' | 'inactive';
};

export type Investor = {
    id?: string;
    name: string;
    email: string;
    phone: string;
    investmentAmount: number;
    sharePercentage: number;
    joinDate: string;
    status: 'active' | 'inactive';
    unitIds: string[];
};

export type AppNotification = {
    id?: string;
    userId: string;
    type: 'booking' | 'expense' | 'reminder' | 'event' | 'system';
    title: string;
    description: string;
    createdAt: string;
    isRead: boolean;
    data?: Record<string, any>;
};
