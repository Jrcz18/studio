
import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';
import { config } from 'dotenv';
import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();
config(); // Load .env variables

// Initialize Genkit
const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});

// Create Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Helper function to handle async routes and errors
const asyncHandler = (fn: (req: express.Request, res: express.Response) => Promise<any>) => 
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
};

// Generic handler for AI flow endpoints
const handleFlow = (flow: (input: any) => Promise<any>) => asyncHandler(async (req, res) => {
    const result = await flow(req.body);
    res.json(result);
});


//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//    AI FLOWS & TOOLS
//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+


// CHAT FLOW
const MessageSchema = z.object({
    role: z.enum(['user', 'model', 'tool']),
    content: z.string(),
});
const ChatInputSchema = z.object({
    history: z.array(MessageSchema).describe('The conversation history.'),
    prompt: z.string().describe("The user's latest message."),
});
const ChatOutputSchema = z.object({
    response: z.string().describe("The AI's response."),
});

const translateText = ai.defineTool(
  {
    name: 'translateText',
    description: 'Translates a given text into a specified target language.',
    inputSchema: z.object({
      text: z.string().describe('The text to translate.'),
      targetLanguage: z.string().describe('The language to translate the text into (e.g., "Tagalog", "Spanish").'),
    }),
    outputSchema: z.object({ translation: z.string().describe('The translated text.') }),
  },
  async (input) => {
    const prompt = `Translate the following text to ${input.targetLanguage}: ${input.text}`;
    const { text } = await ai.generate({ prompt });
    return { translation: text };
  }
);
const getPropertyDatabaseReport = ai.defineTool(
  {
    name: 'getPropertyDatabaseReport',
    description: 'Retrieves a summary of financial and booking activity from the property database for a given date range.',
    inputSchema: z.object({
        startDate: z.string().describe("The start date of the report period in YYYY-MM-DD format."),
        endDate: z.string().describe("The end date of the report period in YYYY-MM-DD format."),
    }),
    outputSchema: z.string().describe('A summary of the report including total revenue, expenses, net profit, and booking count.'),
  },
  async (input) => {
    try {
        const adminDb = admin.firestore();
        const bookingsSnapshot = await adminDb.collection('bookings').where('checkinDate', '>=', input.startDate).where('checkinDate', '<=', input.endDate).get();
        const relevantBookings = bookingsSnapshot.docs.map(doc => doc.data());
        const expensesSnapshot = await adminDb.collection('expenses').where('date', '>=', input.startDate).where('date', '<=', input.endDate).get();
        const relevantExpenses = expensesSnapshot.docs.map(doc => doc.data());
        const totalRevenue = relevantBookings.reduce((acc, booking) => acc + (booking.totalAmount || 0), 0);
        const totalExpenses = relevantExpenses.reduce((acc, expense) => acc + (expense.amount || 0), 0);
        const netProfit = totalRevenue - totalExpenses;
        return `Report from ${input.startDate} to ${input.endDate}:\n- Total Revenue: ₱${totalRevenue.toLocaleString()}\n- Total Expenses: ₱${totalExpenses.toLocaleString()}\n- Net Profit: ₱${netProfit.toLocaleString()}\n- Number of Bookings: ${relevantBookings.length}`;
    } catch (error: any) {
        return `Sorry, I was unable to access the database. Error: ${error.message}`;
    }
  }
);
const chatPrompt = ai.definePrompt({
    name: 'chatPrompt',
    input: { schema: ChatInputSchema },
    output: { schema: ChatOutputSchema },
    tools: [translateText, getPropertyDatabaseReport],
    system: `You are a helpful AI assistant for a property management app. Today's date is ${new Date().toDateString()}. Infer dates from queries like "last month".`,
    prompt: `{{#each history}}{{role}}: {{content}}{{/each}}user: {{prompt}}model: `,
});
const chatFlow = ai.defineFlow({ name: 'chatFlow', inputSchema: ChatInputSchema, outputSchema: ChatOutputSchema }, async (input) => {
    const { output } = await chatPrompt(input);
    return { response: output?.response || 'Sorry, I could not generate a response.'};
});


// EXPENSE ANALYZER FLOW
const ExpenseAnalysisInputSchema = z.object({
    description: z.string(),
    amount: z.number(),
});
const ExpenseAnalysisOutputSchema = z.object({
    category: z.enum(['utilities', 'maintenance', 'cleaning', 'supplies', 'insurance', 'other']),
    isAnomaly: z.boolean(),
    anomalyReason: z.string().optional(),
});
const expenseAnalysisPrompt = ai.definePrompt({
    name: 'expenseAnalysisPrompt',
    input: { schema: ExpenseAnalysisInputSchema },
    output: { schema: ExpenseAnalysisOutputSchema },
    prompt: `Analyze the expense: "{{description}}" - ₱{{amount}}. Suggest a category: 'utilities', 'maintenance', 'cleaning', 'supplies', 'insurance', 'other'. Is it an anomaly (e.g., electricity > ₱20,000)? If so, set isAnomaly to true and provide a reason.`,
});
const expenseAnalysisFlow = ai.defineFlow({ name: 'expenseAnalysisFlow', inputSchema: ExpenseAnalysisInputSchema, outputSchema: ExpenseAnalysisOutputSchema }, async (input) => {
    const { output } = await expenseAnalysisPrompt(input);
    return output!;
});


// CONFLICT RESOLUTION FLOW
const BookingDetailsSchema = z.object({
    id: z.string().optional(),
    guestName: z.string(),
    checkinDate: z.string(),
    checkoutDate: z.string(),
    totalAmount: z.number(),
    createdAt: z.string(),
});
const ConflictResolutionInputSchema = z.object({
    existingBooking: BookingDetailsSchema,
    newBooking: BookingDetailsSchema,
    unitName: z.string(),
});
const ConflictResolutionOutputSchema = z.object({
    suggestion: z.string(),
    suggestedAction: z.enum(['keep_existing', 'prioritize_new', 'offer_alternative']),
});
const resolveConflictPrompt = ai.definePrompt({
    name: 'resolveConflictPrompt',
    input: { schema: ConflictResolutionInputSchema },
    output: { schema: ConflictResolutionOutputSchema },
    prompt: `Resolve booking conflict for "{{unitName}}". Existing: {{existingBooking.guestName}} ({{existingBooking.checkinDate}} to {{existingBooking.checkoutDate}}, ₱{{existingBooking.totalAmount}}, booked {{existingBooking.createdAt}}). New: {{newBooking.guestName}} ({{newBooking.checkinDate}} to {{newBooking.checkoutDate}}, ₱{{newBooking.totalAmount}}, booked {{newBooking.createdAt}}). Prioritize higher value and earlier booking. Suggest action and set suggestedAction field.`,
});
const resolveConflictFlow = ai.defineFlow({ name: 'resolveConflictFlow', inputSchema: ConflictResolutionInputSchema, outputSchema: ConflictResolutionOutputSchema }, async (input) => {
    const { output } = await resolveConflictPrompt(input);
    return output!;
});


// REPORT SUMMARY FLOW
const ReportSummaryInputSchema = z.object({
    unitName: z.string(),
    month: z.string(),
    year: z.number(),
    totalRevenue: z.number(),
    totalExpenses: z.number(),
    netProfit: z.number(),
});
const ReportSummaryOutputSchema = z.object({ summary: z.string() });
const reportSummaryPrompt = ai.definePrompt({
    name: 'reportSummaryPrompt',
    input: { schema: ReportSummaryInputSchema },
    output: { schema: ReportSummaryOutputSchema },
    prompt: `Generate a brief, professional summary for the {{month}} {{year}} report of {{unitName}}. Data: Revenue ₱{{totalRevenue}}, Expenses ₱{{totalExpenses}}, Net Profit ₱{{netProfit}}. Highlight key performance.`,
});
const generateReportSummaryFlow = ai.defineFlow({ name: 'generateReportSummaryFlow', inputSchema: ReportSummaryInputSchema, outputSchema: ReportSummaryOutputSchema }, async (input) => {
    const { output } = await reportSummaryPrompt(input);
    return output!;
});

// AGENT REPORT SUMMARY FLOW
const AgentReportSummaryInputSchema = z.object({
    agentName: z.string(),
    month: z.string(),
    year: z.number(),
    totalBookings: z.number(),
    totalRevenueGenerated: z.number(),
    totalCommission: z.number(),
});
const AgentReportSummaryOutputSchema = z.object({ summary: z.string() });
const agentReportSummaryPrompt = ai.definePrompt({
    name: 'agentReportSummaryPrompt',
    input: { schema: AgentReportSummaryInputSchema },
    output: { schema: AgentReportSummaryOutputSchema },
    prompt: `Generate a brief, encouraging summary for agent {{agentName}}'s report for {{month}} {{year}}. Data: Bookings: {{totalBookings}}, Revenue Generated: ₱{{totalRevenueGenerated}}, Commission: ₱{{totalCommission}}. Comment on performance.`,
});
const generateAgentReportSummaryFlow = ai.defineFlow({ name: 'generateAgentReportSummaryFlow', inputSchema: AgentReportSummaryInputSchema, outputSchema: AgentReportSummaryOutputSchema }, async (input) => {
    const { output } = await agentReportSummaryPrompt(input);
    return output!;
});


// INVESTOR REPORT SUMMARY FLOW
const InvestorReportSummaryInputSchema = z.object({
    investorName: z.string(),
    month: z.string(),
    year: z.number(),
    totalNetProfit: z.number(),
    sharePercentage: z.number(),
    investorShare: z.number(),
});
const InvestorReportSummaryOutputSchema = z.object({ summary: z.string() });
const investorReportSummaryPrompt = ai.definePrompt({
    name: 'investorReportSummaryPrompt',
    input: { schema: InvestorReportSummaryInputSchema },
    output: { schema: InvestorReportSummaryOutputSchema },
    prompt: `Generate a brief, informative summary for investor {{investorName}}'s report for {{month}} {{year}}. Data: Total Net Profit: ₱{{totalNetProfit}}, Share: {{sharePercentage}}%, Payout: ₱{{investorShare}}. Comment on investment performance.`,
});
const generateInvestorReportSummaryFlow = ai.defineFlow({ name: 'generateInvestorReportSummaryFlow', inputSchema: InvestorReportSummaryInputSchema, outputSchema: InvestorReportSummaryOutputSchema }, async (input) => {
    const { output } = await investorReportSummaryPrompt(input);
    return output!;
});


// UNIT HEALTH REPORT FLOW
const UnitHealthReportInputSchema = z.object({
  unitId: z.string(),
  unitName: z.string(),
});
const UnitHealthReportOutputSchema = z.object({
  healthScore: z.number().min(0).max(100),
  summary: z.string(),
  recommendations: z.array(z.string()),
});
const healthReportPrompt = ai.definePrompt({
  name: 'unitHealthReportPrompt',
  input: { schema: z.object({ unitName: z.string(), incidents: z.array(z.any()) }) },
  output: { schema: UnitHealthReportOutputSchema },
  prompt: `Generate a "Unit Health Report" for "{{unitName}}" based on incidents. Score 0-100. High score (90-100) is excellent. Low score (0-59) needs immediate action. Analyze frequency, severity, and resolution of incidents. A single high-severity unresolved issue should drop score below 50. Provide a healthScore, a brief summary, and actionable recommendations. Incidents: {{#if incidents.length}}{{#each incidents}}- Date:{{this.date}},Type:{{this.type}},Severity:{{this.severity}},Resolved:{{this.isResolved}},Desc:"{{this.description}}"{{/each}}{{else}}- No incidents.{{/if}}`,
});
const generateUnitHealthReportFlow = ai.defineFlow({ name: 'generateUnitHealthReportFlow', inputSchema: UnitHealthReportInputSchema, outputSchema: UnitHealthReportOutputSchema }, async (input) => {
    const adminDb = admin.firestore();
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 90);
    const incidentsSnapshot = await adminDb.collection('incidents').where('unitId', '==', input.unitId).where('date', '>=', pastDate.toISOString().split('T')[0]).orderBy('date', 'desc').get();
    const incidents = incidentsSnapshot.docs.map(doc => doc.data());
    const { output } = await healthReportPrompt({ unitName: input.unitName, incidents: incidents });
    if (!output) { throw new Error("Failed to generate health report from AI."); }
    return output;
});


// ADMIN NOTIFICATION FLOW (Simulated Email)
const AdminNotificationInputSchema = z.object({
    guestName: z.string(),
    guestContact: z.string(),
    numberOfGuests: z.number(),
    checkinDate: z.string(),
    checkoutDate: z.string(),
    unitName: z.string(),
});
const AdminNotificationOutputSchema = z.object({ message: z.string() });
const sendAdminNotificationFlow = ai.defineFlow({ name: 'sendAdminNotificationFlow', inputSchema: AdminNotificationInputSchema, outputSchema: AdminNotificationOutputSchema }, async (input) => {
    const ADMIN_EMAIL = 'admin@example.com';
    const emailSubject = `New Guest Arrival: ${input.guestName} for Unit ${input.unitName}`;
    const emailBody = `<p>Dear Admin,</p><p>Guest: ${input.guestName}, Contact: ${input.guestContact}, Guests: ${input.numberOfGuests}, Check-in: ${input.checkinDate}, Check-out: ${input.checkoutDate}, Unit: ${input.unitName}.</p>`;
    console.log(`--- SIMULATING EMAIL TO ${ADMIN_EMAIL} ---`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`Body: ${emailBody}`);
    // In a real app, use an email service like SendGrid here.
    return { message: `Successfully sent notification for ${input.guestName} to ${ADMIN_EMAIL}` };
});


//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
//    API ENDPOINTS
//+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

app.post('/chat', handleFlow(chatFlow));
app.post('/analyzeExpense', handleFlow(expenseAnalysisFlow));
app.post('/resolveConflict', handleFlow(resolveConflictFlow));
app.post('/generateReportSummary', handleFlow(generateReportSummaryFlow));
app.post('/generateAgentReportSummary', handleFlow(generateAgentReportSummaryFlow));
app.post('/generateInvestorReportSummary', handleFlow(generateInvestorReportSummaryFlow));
app.post('/generateUnitHealthReport', handleFlow(generateUnitHealthReportFlow));
app.post('/sendAdminBookingNotification', handleFlow(sendAdminNotificationFlow));


// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Expose the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
