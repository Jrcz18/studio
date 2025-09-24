
'use server';
import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';

config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Helper to dynamically import and handle flows
const handleFlow = (flowName: string, modulePath: string) => async (req: express.Request, res: express.Response) => {
    try {
        const module = await import(modulePath);
        const flow = module[flowName];
        if (typeof flow !== 'function') {
            throw new Error(`Flow '${flowName}' not found or not a function in module '${modulePath}'.`);
        }
        const result = await flow(req.body);
        res.json(result);
    } catch (error: any) {
        console.error(`Error handling flow '${flowName}':`, error);
        res.status(500).json({ error: 'Something went wrong!', message: error.message });
    }
};

// Define endpoints using the lazy-loading helper
app.post('/chat', handleFlow('chatFlow', './ai/flows/chat'));
app.post('/analyzeExpense', handleFlow('expenseAnalysisFlow', './ai/flows/expense-analyzer'));
app.post('/resolveConflict', handleFlow('resolveConflictFlow', './ai/flows/resolve-conflict'));
app.post('/generateReportSummary', handleFlow('generateReportSummaryFlow', './ai/flows/report-summary'));
app.post('/generateAgentReportSummary', handleFlow('generateAgentReportSummaryFlow', './ai/flows/agent-report-summary'));
app.post('/generateInvestorReportSummary', handleFlow('generateInvestorReportSummaryFlow', './ai/flows/investor-report-summary'));
app.post('/generateUnitHealthReport', handleFlow('generateUnitHealthReportFlow', './ai/flows/generate-unit-health-report'));
app.post('/sendAdminBookingNotification', handleFlow('sendAdminNotificationFlow', './ai/flows/send-admin-notification'));


app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Set the region to asia-southeast1
export const api = functions.region('asia-southeast1').https.onRequest(app);
