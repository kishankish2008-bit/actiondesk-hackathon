import { describe, it, expect } from 'vitest';
import { TaskManager } from '../server/src/orchestrator/taskManager.js';
import { ProviderRegistry } from '../server/src/adapters/providerRegistry.js';
import { OfficialProductApis } from '../server/src/adapters/officialProductApis.js';

const liveProduct = () => ({
  id: 'amazon-B0TEST1234',
  title: 'Wireless Noise Cancelling Headphones',
  brand: 'Example Brand',
  category: 'Headphones',
  price: 12999,
  currency: 'INR',
  rating: 4.5,
  reviewCount: 20,
  features: ['Wireless', 'Noise cancelling'],
  inStock: true,
  deliveryDays: 0,
  description: 'API listing description',
  sourceUrl: 'https://www.amazon.in/dp/B0TEST1234',
  providerId: 'amazon_in',
  providerName: 'Amazon India',
  retrievedAt: new Date().toISOString(),
});

const registryWithClient = (client: any) =>
  new ProviderRegistry(
    {
      AMAZON_CREATORS_CLIENT_ID: 'configured',
      AMAZON_CREATORS_CLIENT_SECRET: 'configured',
      AMAZON_CREATORS_PARTNER_TAG: 'configured',
    },
    { ...client, supports: () => true },
  );

describe('Task manager live-provider behavior', () => {
  it('never invents products when credentials are absent and offers Amazon search handoff', async () => {
    const task = await new TaskManager().createTask(
      'Find noise cancelling headphones on Amazon under ₹18,000.',
    );
    expect(task.status).toBe('provider_limitation');
    expect(task.options).toEqual([]);
    expect(task.recommendation).toBeUndefined();
    expect(task.handoffInfo?.providerId).toBe('amazon_in');
    expect(task.handoffInfo?.handoffUrl).toContain('amazon.in/s?k=');
    expect(task.handoffInfo?.didSearchProvider).toBe(false);
  });

  it('shows only validated live API listings and filters them against user budget', async () => {
    const registry = registryWithClient({ searchProducts: async () => [liveProduct()] });
    const task = await new TaskManager(registry).createTask(
      'Find wireless noise cancelling headphones on Amazon under ₹15,000.',
    );
    expect(task.status).toBe('awaiting_selection');
    expect(task.options).toHaveLength(1);
    expect(task.recommendation?.selectedItem.dataOrigin).toBe('live_provider');
    expect(task.recommendation?.selectedItem.sourceUrl).toBe('https://www.amazon.in/dp/B0TEST1234');
  });

  it('compares listings across each connected retailer when the user does not choose one', async () => {
    const flipkartProduct = {
      ...liveProduct(),
      id: 'flipkart-FK123',
      providerId: 'flipkart',
      providerName: 'Flipkart',
      title: 'Wireless ANC Headphones',
      price: 10999,
      sourceUrl: 'https://www.flipkart.com/item/p/itm123',
    };
    const calls: string[] = [];
    const registry = new ProviderRegistry(
      {
        AMAZON_CREATORS_CLIENT_ID: 'configured',
        AMAZON_CREATORS_CLIENT_SECRET: 'configured',
        AMAZON_CREATORS_PARTNER_TAG: 'configured',
        FLIPKART_AFFILIATE_ID: 'configured',
        FLIPKART_AFFILIATE_TOKEN: 'configured',
      },
      {
        supports: () => true,
        searchProducts: async (provider) => {
          calls.push(provider.id);
          return [provider.id === 'flipkart' ? flipkartProduct : liveProduct()];
        },
      },
    );
    const task = await new TaskManager(registry).createTask(
      'Find wireless noise-cancelling headphones under ₹15,000.',
    );
    expect(calls.sort()).toEqual(['amazon_in', 'flipkart']);
    expect(task.status).toBe('awaiting_selection');
    expect(task.options.map((option) => option.providerName).sort()).toEqual([
      'Amazon India',
      'Flipkart',
    ]);
    expect(task.recommendation?.alternatives).toHaveLength(1);
  });

  it('does not fall back to invented results when partner API fails', async () => {
    const registry = registryWithClient({
      searchProducts: async () => {
        throw new Error('upstream unavailable');
      },
    });
    const task = await new TaskManager(registry).createTask(
      'Find headphones on Amazon under ₹15,000.',
    );
    expect(task.status).toBe('provider_limitation');
    expect(task.options).toEqual([]);
    expect(task.handoffInfo?.reason).toContain('upstream unavailable');
    expect(task.handoffInfo?.didSearchProvider).toBe(true);
  });

  it('uses MakeMyTrip official-site handoff for train requests and does not show fake schedules', async () => {
    const tm = new TaskManager();
    const task = await tm.createTask('Find a train from Bengaluru to Goa on 24 May on MakeMyTrip.');
    expect(task.status).toBe('provider_limitation');
    expect(task.options).toEqual([]);
    expect(task.handoffInfo?.providerId).toBe('makemytrip');
    expect(task.handoffInfo?.handoffUrl).toBe('https://www.makemytrip.com/railways/');
  });

  it('requires key trip details and never resolves clarification into a local fixture', async () => {
    const tm = new TaskManager();
    const task = await tm.createTask('Book me a train to Goa.');
    expect(task.status).toBe('needs_clarification');
    expect(task.missingFields?.length).toBeGreaterThan(0);
    const clarified = await tm.clarifyTask(task.id, { origin: 'Bengaluru', date: '2026-12-01' });
    expect(clarified.status).toBe('provider_limitation');
    expect(clarified.options).toEqual([]);
  });

  it('opens a selected live listing as a direct user-controlled handoff', async () => {
    const registry = registryWithClient({ searchProducts: async () => [liveProduct()] });
    const tm = new TaskManager(registry);
    const task = await tm.createTask('Find noise cancelling headphones on Amazon under ₹15,000.');
    const handoff = await tm.confirmAndExecute(task.id, true);
    expect(handoff.status).toBe('provider_handoff_ready');
    expect(handoff.providerHandoff?.url).toBe('https://www.amazon.in/dp/B0TEST1234');
    expect(handoff.actionLog.at(-1)?.message).toContain('did not sign in');
  });

  it('does not expose product partner secrets through provider status', () => {
    const registry = new ProviderRegistry(
      {
        AMAZON_CREATORS_CLIENT_ID: 'private-id',
        AMAZON_CREATORS_CLIENT_SECRET: 'private-secret',
        AMAZON_CREATORS_PARTNER_TAG: 'private-tag',
      },
      new OfficialProductApis({
        AMAZON_CREATORS_CLIENT_ID: 'private-id',
        AMAZON_CREATORS_CLIENT_SECRET: 'private-secret',
        AMAZON_CREATORS_PARTNER_TAG: 'private-tag',
      }),
    );
    expect(JSON.stringify(registry.getProviders())).not.toContain('private-secret');
  });
});
