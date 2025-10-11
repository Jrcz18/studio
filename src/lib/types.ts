
export type Unit = {
  id?: string;
  name: string;
  type: string;
  capacity?: number;
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
  bookingId?: string;
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
  calendarEventId?: string;
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
  userId: string;
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


import { z } from 'zod';

// Schemas for AI Flows

// agent-report-summary.ts
export const AgentReportSummaryInputSchema = z.object({
  agentName: z.string().describe('The name of the agent.'),
  month: z.string().describe('The month of the report (e.g., "January").'),
  year: z.number().describe('The year of the report (e.g., 2024).'),
  totalBookings: z
    .number()
    .describe('The total number of bookings secured by the agent.'),
  totalRevenueGenerated: z
    .number()
    .describe("The total revenue generated from the agent's bookings."),
  totalCommission: z
    .number()
    .describe('The total commission earned by the agent.'),
});
export type AgentReportSummaryInput = z.infer<typeof AgentReportSummaryInputSchema>;

export const AgentReportSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      "A concise, insightful summary of the agent's monthly report."
    ),
});
export type AgentReportSummaryOutput = z.infer<typeof AgentReportSummaryOutputSchema>;


// booking-summary-and-pricing.ts
export const BookingSummaryInputSchema = z.object({
    frequency: z
      .enum(['daily', 'weekly', 'monthly'])
      .describe('The frequency of the booking summary.'),
    unitId: z.string().describe('The ID of the rental unit.'),
    startDate: z.string().describe('The start date for the summary period.'),
    endDate: z.string().describe('The end date for the summary period.'),
    searchRateData: z
      .record(z.string(), z.number())
      .describe(
        'A map of dates to search rates, used for dynamic pricing adjustments.'
      ),
});
export type BookingSummaryInput = z.infer<typeof BookingSummaryInputSchema>;

export const BookingSummaryOutputSchema = z.object({
    summary: z.string().describe('The booking summary.'),
});
export type BookingSummaryOutput = z.infer<typeof BookingSummaryOutputSchema>;


// chat.ts
export const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  prompt: z.string().describe("The user's latest message."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  response: z.string().describe("The AI's response."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


// expense-analyzer.ts
export const ExpenseAnalysisInputSchema = z.object({
  description: z.string(),
  amount: z.number(),
});
export type ExpenseAnalysisInput = z.infer<typeof ExpenseAnalysisInputSchema>;

export const ExpenseAnalysisOutputSchema = z.object({
  category: z.enum([
    'utilities',
    'maintenance',
    'cleaning',
    'supplies',
    'insurance',
    'other',
  ]),
  isAnomaly: z.boolean(),
  anomalyReason: z.string().optional(),
});
export type ExpenseAnalysisOutput = z.infer<typeof ExpenseAnalysisOutputSchema>;


// generate-unit-health-report.ts
export const UnitHealthReportInputSchema = z.object({
  unitId: z.string(),
  unitName: z.string(),
});
export type UnitHealthReportInput = z.infer<typeof UnitHealthReportInputSchema>;

export const UnitHealthReportOutputSchema = z.object({
  healthScore: z.number().min(0).max(100),
  summary: z.string(),
  recommendations: z.array(z.string()),
});
export type UnitHealthReportOutput = z.infer<typeof UnitHealthReportOutputSchema>;


// investor-report-summary.ts
export const InvestorReportSummaryInputSchema = z.object({
  investorName: z.string().describe("The name of the investor."),
  month: z.string().describe('The month of the report (e.g., "January").'),
  year: z.number().describe('The year of the report (e.g., 2024).'),
  totalNetProfit: z.number().describe("The total net profit from the investor's units."),
  sharePercentage: z.number().describe("The investor's share percentage."),
  investorShare: z.number().describe("The final amount of the investor's share."),
});
export type InvestorReportSummaryInput = z.infer<typeof InvestorReportSummaryInputSchema>;

export const InvestorReportSummaryOutputSchema = z.object({
  summary: z.string().describe("A concise, insightful summary of the investor's monthly report."),
});
export type InvestorReportSummaryOutput = z.infer<typeof InvestorReportSummaryOutputSchema>;


// report-summary.ts
export const ReportSummaryInputSchema = z.object({
  unitName: z.string().describe('The name of the rental unit or "All Units".'),
  month: z.string().describe('The month of the report (e.g., "January").'),
  year: z.number().describe('The year of the report (e.g., 2024).'),
  totalRevenue: z.number().describe('The total revenue for the month.'),
  totalExpenses: z.number().describe('The total expenses for the month.'),
  netProfit: z.number().describe('The net profit for the month.'),
});
export type ReportSummaryInput = z.infer<typeof ReportSummaryInputSchema>;

export const ReportSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise, insightful summary of the monthly report.'),
});
export type ReportSummaryOutput = z.infer<typeof ReportSummaryOutputSchema>;


// resolve-conflict.ts
export const BookingDetailsSchema = z.object({
  id: z.string().optional(),
  guestName: z.string(),
  checkinDate: z.string(),
  checkoutDate: z.string(),
  totalAmount: z.number(),
  createdAt: z.string(),
});
export type BookingDetails = z.infer<typeof BookingDetailsSchema>;

export const ConflictResolutionInputSchema = z.object({
  existingBooking: BookingDetailsSchema,
  newBooking: BookingDetailsSchema,
  unitName: z.string(),
});
export type ConflictResolutionInput = z.infer<typeof ConflictResolutionInputSchema>;

export const ConflictResolutionOutputSchema = z.object({
  suggestion: z.string(),
  suggestedAction: z.enum(['keep_existing', 'prioritize_new', 'offer_alternative']),
});
export type ConflictResolutionOutput = z.infer<typeof ConflictResolutionOutputSchema>;


// send-admin-notification.ts
export const AdminNotificationInputSchema = z.object({
  guestName: z.string(),
  guestContact: z.string(),
  numberOfGuests: z.number(),
  checkinDate: z.string(),
  checkoutDate: z.string(),
  unitName: z.string(),
});
export type AdminNotificationInput = z.infer<typeof AdminNotificationInputSchema>;

export const AdminNotificationOutputSchema = z.object({
  message: z.string(),
});
export type AdminNotificationOutput = z.infer<typeof AdminNotificationOutputSchema>;


// send-discord-notification.ts
export const DiscordNotificationInputSchema = z.object({
  content: z.string().describe('The message content to send to Discord.'),
  username: z.string().optional().describe('An optional username to override the webhook default.'),
  avatar_url: z.string().optional().describe('An optional avatar URL to override the webhook default.'),
});
export type DiscordNotificationInput = z.infer<typeof DiscordNotificationInputSchema>;

export const DiscordNotificationOutputSchema = z.object({
  success: z.boolean().describe('Whether the message was sent successfully.'),
  message: z.string().describe('A status message.'),
});
export type DiscordNotificationOutput = z.infer<typeof DiscordNotificationOutputSchema>;

    
