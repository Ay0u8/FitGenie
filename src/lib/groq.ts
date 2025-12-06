import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY is not set. Add it to .env.local');
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function callGroqChat({
  systemPrompt,
  messages,
  model = 'meta-llama/llama-4-maverick-17b-128e-instruct',
}: {
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  model?: string;
}) {
  const chatMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages,
  ];

  const completion = await groq.chat.completions.create({
    model,
    messages: chatMessages,
    temperature: 0.5,
  });

  const content = completion.choices?.[0]?.message?.content ?? '';
  return content;
}

Encoding
UTF8
