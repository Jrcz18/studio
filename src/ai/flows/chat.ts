'use server';
/**
 * @fileOverview A simple AI chat assistant flow.
 *
 * - chat - A function that takes a prompt and history and returns a response.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  prompt: z.string().describe('The user\'s latest message.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The AI\'s response.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const chatPrompt = ai.definePrompt(
    {
      name: 'chatPrompt',
      input: { schema: ChatInputSchema },
      output: { schema: ChatOutputSchema },
      prompt: `You are a helpful AI assistant integrated into a property management application. Answer the user's questions.
      You do not have access to real-time information from the internet, so you cannot answer questions about current events, weather, or live data.

    {{#each history}}
    {{role}}: {{content}}
    {{/each}}
    user: {{prompt}}
    model: `,
    },
  );

  const chatFlow = ai.defineFlow(
    {
      name: 'chatFlow',
      inputSchema: ChatInputSchema,
      outputSchema: ChatOutputSchema,
    },
    async (input) => {
      const { output } = await chatPrompt(input);
      return { response: output?.response || 'Sorry, I could not generate a response.'};
    }
  );

  return chatFlow(input);
}
