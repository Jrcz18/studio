
'use client';
/**
 * @fileOverview Client-side function for an AI chat assistant, calling a backend API.
 *
 * - chat - A function that takes a prompt and history and returns a response from the backend.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { z } from 'zod';

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

export type ChatInput = z.infer<typeof ChatInputSchema>;
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function chat(input: ChatInput): Promise<ChatOutput> {
    // TODO: Backend functionality is temporarily disabled until Firebase billing is enabled.
    // This is a placeholder response.
    console.log("AI chat called with:", input.prompt);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    return {
        response: "AI chat is temporarily disabled. To enable it, please upgrade your Firebase project to the 'Blaze' (Pay-as-you-go) plan and deploy the backend functions."
    };

    /*
    // Original code to be re-enabled later
    const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'AI chat request failed');
    }
    return res.json();
    */
}
