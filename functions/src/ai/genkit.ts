
'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This is the backend-specific Genkit initialization.
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
