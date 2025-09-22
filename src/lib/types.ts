






export type Unit = {
  id?: string;
  name: string;
  type: string;
  rate: number;
  maxOccupancy: number;
  baseOccupancy: number; // New field for base occupancy
  extraGuestFee: number; // New field for extra guest fee
  status: 'available' | 'occupied' | 'maintenance';
  description: string;
  healthScore?: number; // New field for health score
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
  uid?: string; // Unique identifier from iCal source
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

export type Reminder = {
  id?: string;
  title: string;
  description: string;
  category: 'payment' | 'maintenance' | 'cleaning' | 'booking' | 'inspection' | 'meeting' | 'other';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  dueTime?: string;
  status: 'pending' | 'completed';
  createdAt: string;
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

export type Agent = {
    id?: string;
    name: string;
    email: string;
    phone: string;
    commissionType: 'percentage' | 'fixed_commission';
    commissionRate: number; // For percentage
    commissionMarkup: number; // For fixed markup
    totalBookings: number;
    totalCommissions: number;
    joinDate: string;
    status: 'active' | 'inactive';
};

export type Expense = {
    id?: string;
    title: string;
    category: 'utilities' | 'maintenance' | 'cleaning' | 'supplies' | 'insurance' | 'other';
    amount: number;
    date: string;
    unitId: string | null;
    description: string;
    status: 'paid' | 'unpaid';
};

export type ProfitPayment = {
    id?: string;
    investorId: string;
    month: string;
    amount: number;
    paymentDate: string;
    paymentMethod: 'bank_transfer' | 'gcash' | 'cash' | 'check';
    notes: string;
    status: 'paid';
};

export type UnitIncident = {
  id?: string;
  unitId: string;
  date: string;
  type: 'complaint' | 'maintenance' | 'staff_note' | 'damage';
  severity: 'low' | 'medium' | 'high';
  description: string;
  isResolved: boolean;
};

export type Platform = 'Airbnb' | 'Booking.com' | 'Direct';

export interface RentalUnit {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  calendars: {
    airbnb: string;
    bookingcom: string;
    direct: string;
  };
}

export type SyncedEvent = {
  uid: string;
  summary: string;
  start: string;
  end: string;
  platform: Platform;
};

export type ReceiptSettings = {
    id?: string;
    wifiNetwork: string;
    wifiPassword?: string;
    contactEmail: string;
    contactPhone?: string;
    checkinTime: string;
    checkoutTime: string;
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
