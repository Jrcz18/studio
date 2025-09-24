
'use server';
import functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { sendDiscordNotificationFlow } from './ai/flows/send-discord-notification';


config();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Handle Discord Notification Flow
app.post('/sendDiscordNotification', async (req, res) => {
    try {
        const result = await sendDiscordNotificationFlow(req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Error running sendDiscordNotificationFlow:', error);
        res.status(500).json({ error: 'Something went wrong!' });
    }
});


app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

export const api = functions.region('asia-southeast1').https.onRequest(app);
