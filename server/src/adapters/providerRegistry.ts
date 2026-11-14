import {
  ProviderDescriptor,
  ProviderHandoffInfo,
  TaskType,
  TrainConstraints,
  ShoppingConstraints,
  GeneralInfoConstraints,
  ProductItem,
  Recommendation,
} from '../../../shared/types.js';
import { LiveProductResultSchema } from '../../../shared/schemas.js';

export interface LiveSearchClient {
  searchProducts?: (
    provider: ProviderDescriptor,
    constraints: ShoppingConstraints,
  ) => Promise<unknown[]>;
  supports?: (providerId: string) => boolean;
}

export class ProviderRegistry {
  constructor(
    private env: Record<string, string | undefined> = process.env,
    private liveClient?: LiveSearchClient,
  ) {}

  private has(...names: string[]): boolean {
    return names.every((name) => Boolean(this.env[name]?.trim()));
  }

  getProviders(): ProviderDescriptor[] {
    const amazonReady =
      this.has(
        'AMAZON_CREATORS_CLIENT_ID',
        'AMAZON_CREATORS_CLIENT_SECRET',
        'AMAZON_CREATORS_PARTNER_TAG',
      ) && Boolean(this.liveClient?.supports?.('amazon_in'));
    const flipkartReady =
      this.has('FLIPKART_AFFILIATE_ID', 'FLIPKART_AFFILIATE_TOKEN') &&
      Boolean(this.liveClient?.supports?.('flipkart'));
    const provider = (
      id: string,
      name: string,
      domain: TaskType,
      url: string,
      ready: boolean,
      vars: string[],
      reason: string,
      terms: string,
    ): ProviderDescriptor => ({
      id,
      name,
      domain,
      capability: ready ? 'authorized_live_search' : 'user_handoff_only',
      connected: ready,
      officialUrl: url,
      requiredEnvVars: vars,
      statusReason: reason,
      termsSummary: terms,
    });
    return [
      provider(
        'amazon_in',
        'Amazon India',
        'product_shopping',
        'https://www.amazon.in',
        amazonReady,
        [
          'AMAZON_CREATORS_CLIENT_ID',
          'AMAZON_CREATORS_CLIENT_SECRET',
          'AMAZON_CREATORS_PARTNER_TAG',
        ],
        amazonReady
          ? 'Amazon Creators API credentials are configured.'
          : 'Amazon Creators API credentials are missing or incomplete.',
        'Search uses the official Amazon Creators API. The user reviews the listing and completes checkout on Amazon.',
      ),
      provider(
        'flipkart',
        'Flipkart',
        'product_shopping',
        'https://www.flipkart.com',
        flipkartReady,
        ['FLIPKART_AFFILIATE_ID', 'FLIPKART_AFFILIATE_TOKEN'],
        flipkartReady
          ? 'Flipkart Affiliate API credentials are configured.'
          : 'Flipkart Affiliate API credentials are missing or incomplete.',
        'Search uses the official Flipkart Affiliate API. The user reviews the listing and completes checkout on Flipkart.',
      ),
      provider(
        'makemytrip',
        'MakeMyTrip Railways',
        'train_search',
        'https://www.makemytrip.com/railways/',
        false,
        ['MAKEMYTRIP_PARTNER_API_KEY'],
        'The configured MakeMyTrip partner API contract does not include consumer rail search; official-site handoff is enabled.',
        'ActionDesk does not scrape or automate booking. Search and payment continue on MakeMyTrip.',
      ),
      provider(
        'irctc',
        'IRCTC',
        'train_search',
        'https://www.irctc.co.in/nget/train-search',
        false,
        ['IRCTC_API_KEY', 'IRCTC_AGENT_ID'],
        'No licensed IRCTC train-search API transport is configured.',
        'ActionDesk does not scrape or automate IRCTC login or booking. Search and payment continue on IRCTC.',
      ),
      provider(
        'goibibo',
        'Goibibo Trains',
        'train_search',
        'https://www.goibibo.com/trains/',
        false,
        ['GOIBIBO_PARTNER_API_KEY'],
        'No Goibibo consumer train-search API transport is configured.',
        'ActionDesk does not scrape or automate booking. Search and payment continue on Goibibo.',
      ),
      provider(
        'web_search',
        'Web search',
        'general_info',
        'https://www.google.com/search',
        false,
        [],
        'No approved search provider is configured for general information.',
        'Open a search provider directly to verify current information.',
      ),
    ];
  }

  resolveProvider(taskType: TaskType, preferredProviderId?: string): ProviderDescriptor {
    const all = this.getProviders();
    const matching = all.filter((p) => p.domain === taskType);
    if (preferredProviderId) {
      const chosen = matching.find(
        (p) =>
          p.id === preferredProviderId ||
          p.name.toLowerCase().includes(preferredProviderId.toLowerCase()),
      );
      if (chosen) return chosen;
    }
    return matching.find((p) => p.connected) || matching[0];
  }

  buildSafeHandoffUrl(
    providerId: string,
    constraints?: TrainConstraints | ShoppingConstraints | GeneralInfoConstraints,
  ): string {
    switch (providerId) {
      case 'amazon_in':
        return `https://www.amazon.in/s?k=${encodeURIComponent(this.shoppingTerms(constraints))}`;
      case 'flipkart':
        return `https://www.flipkart.com/search?q=${encodeURIComponent(this.shoppingTerms(constraints))}`;
      case 'makemytrip':
        return 'https://www.makemytrip.com/railways/';
      case 'irctc':
        return 'https://www.irctc.co.in/nget/train-search';
      case 'goibibo':
        return 'https://www.goibibo.com/trains/';
      default:
        return `https://www.google.com/search?q=${encodeURIComponent(constraints && 'query' in constraints ? constraints.query : '')}`;
    }
  }

  private shoppingTerms(
    constraints?: TrainConstraints | ShoppingConstraints | GeneralInfoConstraints,
  ): string {
    if (!constraints || !('query' in constraints)) return '';
    const details = 'constraints' in constraints ? constraints.constraints : [];
    const budget =
      'budget' in constraints && constraints.budget
        ? `under ${constraints.currency === 'USD' ? '$' : '₹'}${constraints.budget.toLocaleString('en-IN')}`
        : '';
    return [constraints.query, ...details, budget].filter(Boolean).join(' ').trim();
  }

  buildHandoffInfo(
    primary: ProviderDescriptor,
    taskType: TaskType,
    constraints?: TrainConstraints | ShoppingConstraints | GeneralInfoConstraints,
    errorReason?: string,
  ): ProviderHandoffInfo {
    const choices = this.getProviders().filter((p) => p.domain === taskType);
    return {
      providerId: primary.id,
      providerName: primary.name,
      capability: primary.capability,
      officialUrl: primary.officialUrl,
      handoffUrl: this.buildSafeHandoffUrl(primary.id, constraints),
      reason: errorReason || primary.statusReason,
      termsNotice: primary.termsSummary,
      didSearchProvider: Boolean(errorReason),
      didBookOrPurchase: false,
      availableHandoffs: choices.map((p) => ({
        providerId: p.id,
        providerName: p.name,
        officialUrl: p.officialUrl,
        handoffUrl: this.buildSafeHandoffUrl(p.id, constraints),
        capability: p.capability,
        statusReason: p.statusReason,
      })),
    };
  }

  async executeAuthorizedLiveProductSearch(
    provider: ProviderDescriptor,
    constraints: ShoppingConstraints,
  ): Promise<{ options: ProductItem[]; recommendation: Recommendation<ProductItem> }> {
    if (
      provider.capability !== 'authorized_live_search' ||
      !provider.connected ||
      !this.liveClient?.searchProducts ||
      !this.liveClient.supports?.(provider.id)
    ) {
      throw new Error(`Provider '${provider.name}' is not configured for official live search.`);
    }
    const raw = await this.liveClient.searchProducts(provider, constraints);
    const options = raw
      .map((item) => {
        const parsed = LiveProductResultSchema.parse(item);
        return {
          ...parsed,
          sourceLabel: `${parsed.providerName} · official partner API`,
          dataOrigin: 'live_provider' as const,
        };
      })
      .filter(
        (p) =>
          p.currency === constraints.currency &&
          (!constraints.budget || p.price <= constraints.budget) &&
          p.inStock,
      )
      .map((product) => {
        const text =
          `${product.title} ${product.brand} ${product.features.join(' ')} ${product.description}`.toLowerCase();
        const matchedConstraints = constraints.constraints.filter((constraint) =>
          text.includes(constraint.toLowerCase()),
        );
        return { product, score: matchedConstraints.length };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);
    if (!options.length)
      throw new Error(
        'The partner API returned no products that match your currency, budget, and availability requirements.',
      );
    const selectedItem = options[0];
    const recommendation: Recommendation<ProductItem> = {
      selectedItem,
      reason: `Top provider result for this search. Confirm the product specifications, seller, availability, and final price on ${selectedItem.providerName}.`,
      highlights: selectedItem.features.slice(0, 3),
      tradeoffs: [
        selectedItem.uncertaintyNote || 'Availability and final price can change before checkout.',
      ],
      alternatives: options.slice(1, 4),
    };
    return { options, recommendation };
  }
}
