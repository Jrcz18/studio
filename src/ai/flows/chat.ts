
'use server';
/**
 * @fileOverview AI chat assistant flow.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { translateText, getPropertyDatabaseReport } from '@/ai/tools';

export const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'tool']),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  prompt: z.string().describe("The user's latest message."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.object({
  response: z.string().describe("The AI's response."),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },
  tools: [translateText, getPropertyDatabaseReport],
  system: `You are a helpful AI assistant for a property management app. Today's date is ${new Date().toDateString()}. Infer dates from queries like "last month".`,
  prompt: `{{#each history}}{{role}}: {{content}}{{/each}}user: {{prompt}}model: `,
});

export const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    const { output } = await chatPrompt(input);
    return { response: output?.response || 'Sorry, I could not generate a response.' };
  }
);


// Client-facing function
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
export async function chat(input: ChatInput): Promise<ChatOutput> {
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
}
