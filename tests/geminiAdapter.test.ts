import { describe, expect, it, vi } from 'vitest';
import { ServerLlmParserAdapter } from '../server/src/parser/llmAdapter.js';

const geminiPayload = (candidate: unknown) => ({
  candidates: [{ content: { parts: [{ text: JSON.stringify(candidate) }] } }],
});

describe('ServerLlmParserAdapter Gemini integration', () => {
  it('keeps deterministic parsing available when no Gemini key is configured', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const adapter = new ServerLlmParserAdapter({}, fetcher);
    const parsed = await adapter.parse('Find wireless headphones on Amazon under ₹8,000');

    expect(adapter.getStatus()).toEqual({ configured: false, model: 'gemini-3.8-flash' });
    expect(parsed.source).toBe('local_fallback');
    expect(parsed.result.taskType).toBe('product_shopping');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('sends request text to Gemini with a server-side key and validates the structured result', async () => {
    const fetcher: typeof fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect((init?.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
      const body = JSON.parse(String(init?.body));
      expect(body.generationConfig.responseMimeType).toBe('application/json');
      return new Response(
        JSON.stringify(
          geminiPayload({
            taskType: 'product_shopping',
            shoppingConstraints: {
              query: 'bluetooth earbuds',
              category: 'Electronics',
              currency: 'INR',
              constraints: ['multipoint'],
            },
          }),
        ),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });
    const adapter = new ServerLlmParserAdapter({ GEMINI_API_KEY: 'test-key' }, fetcher);
    const parsed = await adapter.parse('I need earbuds that connect to two devices');

    expect(parsed.source).toBe('gemini');
    expect(parsed.result.taskType).toBe('product_shopping');
    expect(parsed.result.constraints.type).toBe('product_shopping');
    if (parsed.result.constraints.type === 'product_shopping') {
      expect(parsed.result.constraints.data.query).toBe('bluetooth earbuds');
      expect(parsed.result.constraints.data.constraints).toContain('multipoint');
    }
  });

  it('falls back to local parsing when Gemini returns an error', async () => {
    const fetcher: typeof fetch = vi.fn(async () => new Response('{}', { status: 429 }));
    const adapter = new ServerLlmParserAdapter({ GEMINI_API_KEY: 'test-key' }, fetcher);
    const parsed = await adapter.parse('Find a train from Bengaluru to Goa next Friday');

    expect(parsed.source).toBe('local_fallback');
    expect(parsed.result.taskType).toBe('train_search');
  });

  it('returns helper text from Gemini without exposing raw provider failures', async () => {
    const fetcher: typeof fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: 'Add your route, date, passenger count, and budget to get a clearer train request.',
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    );
    const adapter = new ServerLlmParserAdapter({ GEMINI_API_KEY: 'test-key' }, fetcher);

    await expect(adapter.answerHelper('How should I phrase a train search?')).resolves.toContain(
      'route, date',
    );
  });
});
