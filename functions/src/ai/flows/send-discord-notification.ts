
'use server';
/**
 * @fileOverview A Genkit flow for sending a notification to a Discord channel via a webhook.
 * 
 * - sendDiscordNotificationFlow - The main flow function.
 * - DiscordNotificationInput - The input schema for the flow.
 * - DiscordNotificationOutput - The output schema for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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


export const sendDiscordNotificationFlow = ai.defineFlow(
  {
    name: 'sendDiscordNotificationFlow',
    inputSchema: DiscordNotificationInputSchema,
    outputSchema: DiscordNotificationOutputSchema,
  },
  async (input) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL is not set in environment variables.');
      return {
        success: false,
        message: 'Discord webhook URL is not configured on the server.',
      };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: input.content,
          username: input.username,
          avatar_url: input.avatar_url,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error sending Discord notification: ${response.status} ${response.statusText}`, errorBody);
        return {
          success: false,
          message: `Failed to send message. Discord API responded with: ${response.statusText}`,
        };
      }

      return {
        success: true,
        message: 'Notification sent to Discord successfully.',
      };
    } catch (error: any) {
      console.error('Exception when sending Discord notification:', error);
      return {
        success: false,
        message: `An unexpected error occurred: ${error.message}`,
      };
    }
  }
);
