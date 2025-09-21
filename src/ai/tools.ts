
'use server';
/**
 * @fileOverview A collection of AI tools for the Genkit assistant.
 *
 * - translateText: Translates text to a specified language.
 * - getWeather: Fetches the weather for a given city (placeholder).
 * - findLocalEvents: Finds local events near a location (placeholder).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// 1. Translation Tool (Fully Functional)
export const translateText = ai.defineTool(
  {
    name: 'translateText',
    description: 'Translates a given text into a specified target language.',
    inputSchema: z.object({
      text: z.string().describe('The text to translate.'),
      targetLanguage: z
        .string()
        .describe('The language to translate the text into (e.g., "Tagalog", "Spanish").'),
    }),
    outputSchema: z.object({
      translation: z.string().describe('The translated text.'),
    }),
  },
  async (input) => {
    console.log(`Translating "${input.text}" to ${input.targetLanguage}`);
    const prompt = `Translate the following text to ${input.targetLanguage}: ${input.text}`;
    const { text } = await ai.generate({ prompt });
    return { translation: text };
  }
);


// 2. Weather API Tool (Placeholder)
export const getWeather = ai.defineTool(
  {
    name: 'getWeather',
    description: 'Gets the current weather forecast for a specified city.',
    inputSchema: z.object({
      city: z.string().describe('The city, e.g., "Naga City, PH"'),
    }),
    outputSchema: z.string().describe('A description of the weather.'),
  },
  async (input) => {
    console.log(`Fetching weather for ${input.city}`);
    
    // TODO: Implement a real weather API call here.
    // 1. Sign up for a free weather API service (e.g., OpenWeatherMap, WeatherAPI.com).
    // 2. Get an API key and add it to your .env file (e.g., WEATHER_API_KEY=your_key).
    // 3. Use `fetch` to call the weather API with the city and API key.
    // 4. Parse the response and return a human-readable weather string.

    // For now, returning hardcoded data for demonstration.
    return `The weather in ${input.city} is currently sunny with a high of 32°C.`;
  }
);


// 3. Local Events API Tool (Now with Dynamic Dates)
export const findLocalEvents = ai.defineTool(
  {
    name: 'findLocalEvents',
    description: 'Finds local events, concerts, or festivals near a specified location.',
    inputSchema: z.object({
      location: z.string().describe('The location to search for events, e.g., "Makati"'),
    }),
    outputSchema: z.string().describe('A list of local events.'),
  },
  async (input) => {
    console.log(`Finding local events near ${input.location}`);
    
    // TODO: Implement a real event API call here (e.g., Ticketmaster, Eventbrite).

    // For now, returning dynamic placeholder data for demonstration.
    const today = new Date();
    const futureEvent1 = new Date(today);
    futureEvent1.setDate(today.getDate() + 7); // 7 days from now
    
    const futureEvent2 = new Date(today);
    futureEvent2.setDate(today.getDate() + 12); // 12 days from now

    const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    return `Upcoming events near ${input.location}: 
      - OPM Legends Concert at Ayala Triangle on ${formatDate(futureEvent1)}.
      - Makati Street Food Fair at Salcedo Market from ${formatDate(futureEvent2)}.`;
  }
);
