
'use server';
/**
 * @fileOverview AI chat assistant flow.
 */
import { ai } from '@/ai/genkit';
import { translateText, getPropertyDatabaseReport } from '@/ai/tools';
import { ChatInputSchema, ChatOutputSchema, type ChatInput, type ChatOutput } from '@/lib/types';


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
