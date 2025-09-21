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
import { translateText, getWeather, findLocalEvents } from '@/ai/tools';

const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  prompt: z.string().describe("The user's latest message."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe("The AI's response."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const chatPrompt = ai.definePrompt(
    {
      name: 'chatPrompt',
      input: { schema: ChatInputSchema },
      output: { schema: ChatOutputSchema },
      tools: [translateText, getWeather, findLocalEvents],
      system: `You are a helpful AI assistant integrated into a property management application. 
      
      You have access to a few tools to help you answer questions.
      - Use the translateText tool if the user asks for a translation.
      - Use the getWeather tool if the user asks about the weather for a specific city.
      - Use the findLocalEvents tool if the user asks about events, concerts, or festivals.
      - Do not use tools for any other purpose.

      You do not have access to real-time information from the general internet, so you cannot answer questions about current events or live data unless you use one of your tools.`,
      prompt: `{{#each history}}
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
