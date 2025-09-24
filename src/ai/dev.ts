
'use server';

import { config } from 'dotenv';
config();

// This file is used to register all Genkit flows and tools for local development
// and for the deployment process to discover them.

import '@/ai/flows/booking-summary-and-pricing';
import '@/ai/flows/report-summary';
import '@/ai/flows/send-admin-notification';
import '@/ai/flows/expense-analyzer';
import '@/ai/flows/resolve-conflict';
import '@/ai/flows/chat';
import '@/ai/tools';
import '@/ai/flows/agent-report-summary';
import '@/ai/flows/investor-report-summary';
import '@/ai/flows/generate-unit-health-report';
