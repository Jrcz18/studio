
'use server';
import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

import { chatFlow } from '@/ai/flows/chat';
import { expenseAnalysisFlow } from '@/ai/flows/expense-analyzer';
import { resolveConflictFlow } from '@/ai/flows/resolve-conflict';
import { generateReportSummaryFlow } from '@/ai/flows/report-summary';
import { generateAgentReportSummaryFlow } from '@/ai/flows/agent-report-summary';
import { generateInvestorReportSummaryFlow } from '@/ai/flows/investor-report-summary';
import { generateUnitHealthReportFlow } from '@/ai/flows/generate-unit-health-report';
import { sendAdminNotificationFlow } from '@/ai/flows/send-admin-notification';

config(); 

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const asyncHandler = (fn: (req: express.Request, res: express.Response) => Promise<any>) => 
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
};

const handleFlow = (flow: (input: any) => Promise<any>) => asyncHandler(async (req, res) => {
    const result = await flow(req.body);
    res.json(result);
});

app.post('/chat', handleFlow(chatFlow));
app.post('/analyzeExpense', handleFlow(expenseAnalysisFlow));
app.post('/resolveConflict', handleFlow(resolveConflictFlow));
app.post('/generateReportSummary', handleFlow(generateReportSummaryFlow));
app.post('/generateAgentReportSummary', handleFlow(generateAgentReportSummaryFlow));
app.post('/generateInvestorReportSummary', handleFlow(generateInvestorReportSummaryFlow));
app.post('/generateUnitHealthReport', handleFlow(generateUnitHealthReportFlow));
app.post('/sendAdminBookingNotification', handleFlow(sendAdminNotificationFlow));

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

export const api = functions.https.onRequest(app);
