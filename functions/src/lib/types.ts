// --- Units ---
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

// --- Bookings ---
export type Booking = {
  id?: string;
  uid?: string; // optional user ID
  guestFirstName: string;
  guestLastName: string;
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

// --- Agents ---
export type Agent = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  commissionType: 'percentage' | 'fixed_commission';
  commissionRate: number;
  totalBookings: number;
  totalCommissions: number;
  joinDate: string;
  status: 'active' | 'inactive';
};

// --- Investors ---
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

// --- Notifications ---
export type AppNotification = {
  id?: string;
  userId?: string; // make optional
  type: 'booking' | 'expense' | 'reminder' | 'event' | 'system';
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  data?: Record<string, any>;
};

// --- Expenses ---
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

// --- Reminders ---
export type Reminder = {
  id?: string;
  title: string;
  description: string;
  date: string;
  userId: string;
  status: 'pending' | 'completed';
};

// --- Unit Incidents ---
export type UnitIncident = {
  id?: string;
  unitId: string;
  title: string;
  description: string;
  date: string;
  reportedBy?: string;
  status?: 'open' | 'closed';
};
