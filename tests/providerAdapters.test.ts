import { describe, it, expect } from 'vitest';
import { InfoAdapter } from '../server/src/adapters/infoAdapter.js';
import { ProviderRegistry } from '../server/src/adapters/providerRegistry.js';
import { OfficialProductApis } from '../server/src/adapters/officialProductApis.js';

describe('Live-source boundaries', () => {
  it('does not invent facts or citations when no information source is configured', async () => {
    const result = await new InfoAdapter().query({ query: 'What is the luggage policy?' });
    expect(result.sources).toEqual([]);
    expect(result.isSimulatedKnowledgebase).toBe(false);
    expect(result.unverifiedClaims?.length).toBeGreaterThan(0);
    expect(result.answer).toContain('No answer or citations have been invented');
  });

  it('reports shopping providers as handoff-only when official credentials are absent', () => {
    const apis = new OfficialProductApis({});
    const registry = new ProviderRegistry({}, apis);
    expect(
      registry
        .getProviders()
        .filter((p) => p.domain === 'product_shopping')
        .every((p) => !p.connected && p.capability === 'user_handoff_only'),
    ).toBe(true);
  });

  it('builds encoded official-site product search links without local demo destinations', () => {
    const registry = new ProviderRegistry({});
    const provider = registry.getProviders().find((p) => p.id === 'amazon_in')!;
    const handoff = registry.buildHandoffInfo(provider, 'product_shopping', {
      query: 'noise cancelling headphones',
      currency: 'INR',
      constraints: ['USB-C'],
    });
    expect(handoff.handoffUrl).toBe(
      'https://www.amazon.in/s?k=noise%20cancelling%20headphones%20USB-C',
    );
    expect(handoff.didSearchProvider).toBe(false);
    expect(handoff.didBookOrPurchase).toBe(false);
  });

  it('includes a requested product budget in the retailer handoff search terms', () => {
    const registry = new ProviderRegistry({});
    const provider = registry.getProviders().find((p) => p.id === 'amazon_in')!;
    const handoff = registry.buildHandoffInfo(provider, 'product_shopping', {
      query: 'smartphones',
      budget: 25000,
      currency: 'INR',
      constraints: [],
    });
    expect(new URL(handoff.handoffUrl).searchParams.get('k')).toBe('smartphones under ₹25,000');
  });
});
