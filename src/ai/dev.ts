'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/smart-conflict-detection.ts';
import '@/ai/flows/booking-summary-and-pricing.ts';
import '@/ai/flows/report-summary.ts';
