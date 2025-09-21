
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
import { translateText, getWeather, findLocalEvents, googleSearch, getPropertyDatabaseReport } from '@/ai/tools';

export async function chat(
  input: z.infer<typeof ChatInputSchema>
): Promise<z.infer<typeof ChatOutputSchema>> {
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

  const chatPrompt = ai.definePrompt(
    {
      name: 'chatPrompt',
      input: { schema: ChatInputSchema },
      output: { schema: ChatOutputSchema },
      tools: [translateText, getWeather, findLocalEvents, googleSearch, getPropertyDatabaseReport],
      system: `You are a helpful AI assistant integrated into a property management application. You can answer questions and perform tasks based on the tools you have access to.

Your Tools:
- getPropertyDatabaseReport: Use this if the user asks for financial data, performance reports, revenue, expenses, or booking counts for a specific time period. You will need to provide a start and end date.
- googleSearch: Use this for general knowledge questions or topics about current events.
- translateText: Use this if the user asks for a translation into another language.
- getWeather: Use this if the user asks about the weather for a specific city.
- findLocalEvents: Use this if the user asks about events, concerts, or festivals in a location.

Instructions:
- First, decide if a tool is necessary to answer the user's question.
- If a tool is needed, use it.
- If no specific tool is needed, or if the user is having a general conversation, answer directly.
- Infer dates from user queries. If they say "last month," calculate the date range for the previous calendar month. Today's date is ${new Date().toDateString()}.`,
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

export type ChatInput = z.infer<typeof import('./chat').chat extends (input: infer I, ...args: any[]) => any ? I : never>;
export type ChatOutput = z.infer<typeof import('./chat').chat extends (...args: any[]) => Promise<infer O> ? O : never>;
