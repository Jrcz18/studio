
'use server';
/**
 * @fileOverview A Genkit flow for sending a notification to a Discord channel via a webhook.
 */

import { ai } from '../genkit'; // Corrected import path
import { z } from 'zod';

// Input schema
export const DiscordNotificationInputSchema = z.object({
  content: z.string(),
  username: z.string().optional(),
  avatar_url: z.string().optional(),
});
export type DiscordNotificationInput = z.infer<typeof DiscordNotificationInputSchema>;

// Output schema
export const DiscordNotificationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DiscordNotificationOutput = z.infer<typeof DiscordNotificationOutputSchema>;

// Flow definition
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
        console.error(
          `Error sending Discord notification: ${response.status} ${response.statusText}`,
          errorBody
        );
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
