import { describe, it, expect } from 'vitest';
import { TaskParser } from '../server/src/parser/taskParser.js';
import { ServerLlmParserAdapter } from '../server/src/parser/llmAdapter.js';

describe('TaskParser & ServerLlmParserAdapter', () => {
  const parser = new TaskParser();
  const llmAdapter = new ServerLlmParserAdapter();

  it('correctly parses full train search request and generates numbered plan steps', () => {
    const input =
      'Find a train from New York to Boston next Friday morning for 2 passengers with a budget under $150.';
    const result = parser.parse(input);

    expect(result.taskType).toBe('train_search');
    expect(result.needsClarification).toBe(false);
    expect(result.planTitles.length).toBe(5);
    expect(result.constraints.type).toBe('train_search');

    if (result.constraints.type === 'train_search') {
      const data = result.constraints.data;
      expect(data.origin.toLowerCase()).toContain('new york');
      expect(data.destination.toLowerCase()).toContain('boston');
      expect(data.timePreference).toBe('morning');
      expect(data.passengerCount).toBe(2);
      expect(data.budget).toBe(150);
    }
  });

  it('triggers clarification when origin is missing in a train request', () => {
    const input = 'Book me a train to Chicago.';
    const result = parser.parse(input);

    expect(result.taskType).toBe('train_search');
    expect(result.needsClarification).toBe(true);
    expect(result.missingFields).toContain('departure origin');
    expect(result.clarificationPrompt).toBeDefined();
    expect(result.planTitles.length).toBeGreaterThan(0);
  });

  it('correctly parses product shopping constraints and budget', () => {
    const input = 'I want noise-canceling headphones with USB-C and lightweight build under $200.';
    const result = parser.parse(input);

    expect(result.taskType).toBe('product_shopping');
    expect(result.needsClarification).toBe(false);
    expect(result.planTitles.length).toBe(5);
    expect(result.constraints.type).toBe('product_shopping');

    if (result.constraints.type === 'product_shopping') {
      const data = result.constraints.data;
      expect(data.query).toContain('headphones');
      expect(data.budget).toBe(200);
      expect(data.constraints).toContain('noise-canceling');
      expect(data.constraints).toContain('usb-c');
      expect(data.constraints).toContain('lightweight');
    }
  });

  it('triggers clarification when shopping request is ambiguous and lacks product type', () => {
    const input = 'I want to buy something.';
    const result = parser.parse(input);

    expect(result.taskType).toBe('product_shopping');
    expect(result.needsClarification).toBe(true);
    expect(result.missingFields).toContain('product type or category');
    expect(result.clarificationPrompt).toBeDefined();
  });

  it('understands a phone purchase command as shopping instead of sending it to web search', () => {
    const result = parser.parse('Book me a phone');
    expect(result.taskType).toBe('product_shopping');
    expect(result.constraints.type).toBe('product_shopping');
    if (result.constraints.type === 'product_shopping')
      expect(result.constraints.data.query).toBe('smartphones');
  });

  it('correctly routes general information inquiry', () => {
    const input = 'What is the luggage allowance and cancellation policy on express trains?';
    const result = parser.parse(input);

    expect(result.taskType).toBe('general_info');
    expect(result.needsClarification).toBe(false);
    expect(result.planTitles.length).toBe(4);
    expect(result.constraints.type).toBe('general_info');
  });

  it('treats a plain travel command as a train request that needs missing route/date details', () => {
    const result = parser.parse('I want to go to Pune.');

    expect(result.taskType).toBe('train_search');
    expect(result.needsClarification).toBe(true);
    expect(result.missingFields).toContain('departure origin');
    expect(result.missingFields).toContain('travel date');
    expect(result.clarificationPrompt).toContain('I can help search trains');
  });

  it('does not invent a date when a complete train route has no travel date', () => {
    const result = parser.parse('Find a train from Bengaluru to Goa.');

    expect(result.taskType).toBe('train_search');
    expect(result.needsClarification).toBe(true);
    expect(result.missingFields).toContain('travel date');
  });

  it('validates structured LLM output with Zod and falls back deterministically on invalid output', () => {
    const fallbackResult = llmAdapter.validateStructuredCandidate(
      { invalidField: true },
      'Find a train from New York to Boston next Friday for 2 passengers.',
    );
    expect(fallbackResult.taskType).toBe('train_search');
    expect(fallbackResult.needsClarification).toBe(false);
  });
});
