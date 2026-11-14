import { ProviderDescriptor, ProductItem, ShoppingConstraints } from '../../../shared/types.js';
import { LiveSearchClient } from './providerRegistry.js';

type Json = Record<string, any>;

/** Official partner API transports. Credentials remain server-side and are never logged. */
export class OfficialProductApis implements LiveSearchClient {
  private env: Record<string, string | undefined>;
  private amazonToken?: { value: string; expiresAt: number };

  constructor(env: Record<string, string | undefined> = process.env) {
    this.env = env;
  }

  supports(providerId: string): boolean {
    if (providerId === 'amazon_in')
      return this.has(
        'AMAZON_CREATORS_CLIENT_ID',
        'AMAZON_CREATORS_CLIENT_SECRET',
        'AMAZON_CREATORS_PARTNER_TAG',
      );
    if (providerId === 'flipkart')
      return this.has('FLIPKART_AFFILIATE_ID', 'FLIPKART_AFFILIATE_TOKEN');
    return false;
  }

  async searchProducts(
    provider: ProviderDescriptor,
    constraints: ShoppingConstraints,
  ): Promise<unknown[]> {
    if (provider.id === 'amazon_in') return this.searchAmazon(constraints);
    if (provider.id === 'flipkart') return this.searchFlipkart(constraints);
    throw new Error(`No official product API is implemented for ${provider.name}.`);
  }

  private has(...names: string[]): boolean {
    return names.every((name) => Boolean(this.env[name]?.trim()));
  }

  private async requestJson(url: string, init: RequestInit): Promise<Json> {
    const target = new URL(url);
    if (target.protocol !== 'https:') throw new Error('Partner API endpoints must use HTTPS.');
    const trusted =
      target.hostname === 'creatorsapi.amazon' ||
      target.hostname === 'api.amazon.com' ||
      target.hostname === 'api.amazon.co.uk' ||
      target.hostname === 'api.amazon.co.jp' ||
      target.hostname === 'affiliate-api.flipkart.net';
    if (!trusted) throw new Error('Partner API endpoint host is not approved.');
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      response = await fetch(url, { ...init, signal: AbortSignal.timeout(10000) });
      if (response.ok) break;
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) {
        // Avoid returning upstream response bodies; providers can echo sensitive request details.
        throw new Error(`Partner API request failed with HTTP ${response.status}.`);
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
    try {
      return (await response!.json()) as Json;
    } catch {
      throw new Error('Partner API returned an invalid JSON response.');
    }
  }

  private async getAmazonToken(): Promise<string> {
    if (this.amazonToken && this.amazonToken.expiresAt > Date.now() + 30_000)
      return this.amazonToken.value;
    const tokenUrl = this.env.AMAZON_CREATORS_TOKEN_URL || 'https://api.amazon.co.uk/auth/o2/token';
    if (new URL(tokenUrl).pathname !== '/auth/o2/token')
      throw new Error('Amazon token endpoint path is not approved.');
    const body = JSON.stringify({
      grant_type: 'client_credentials',
      client_id: this.env.AMAZON_CREATORS_CLIENT_ID!,
      client_secret: this.env.AMAZON_CREATORS_CLIENT_SECRET!,
      scope: 'creatorsapi::default',
    });
    const result = await this.requestJson(tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
    if (typeof result.access_token !== 'string' || !Number.isFinite(result.expires_in)) {
      throw new Error('Amazon Creators API returned an invalid token response.');
    }
    this.amazonToken = {
      value: result.access_token,
      expiresAt: Date.now() + result.expires_in * 1000,
    };
    return result.access_token;
  }

  private async searchAmazon(c: ShoppingConstraints): Promise<ProductItem[]> {
    const token = await this.getAmazonToken();
    const endpoint =
      this.env.AMAZON_CREATORS_API_URL || 'https://creatorsapi.amazon/catalog/v1/searchItems';
    const apiUrl = new URL(endpoint);
    if (apiUrl.hostname !== 'creatorsapi.amazon' || apiUrl.pathname !== '/catalog/v1/searchItems')
      throw new Error('Amazon search endpoint is not approved.');
    const searchTerms = [c.query, ...c.constraints].join(' ').trim();
    const data = await this.requestJson(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'x-marketplace': 'www.amazon.in',
      },
      body: JSON.stringify({
        partnerTag: this.env.AMAZON_CREATORS_PARTNER_TAG,
        keywords: searchTerms,
        marketplace: 'www.amazon.in',
        itemCount: 10,
        itemPage: 1,
        availability: 'Available',
        resources: [
          'images.primary.medium',
          'itemInfo.title',
          'itemInfo.byLineInfo',
          'itemInfo.features',
          'offersV2.listings.price',
          'offersV2.listings.availability',
        ],
      }),
    });
    const items: Json[] = data.searchResult?.items || [];
    return items.flatMap((item) => {
      const title = item.itemInfo?.title?.displayValue;
      const offer = item.offersV2?.listings?.[0];
      const amount = Number(offer?.price?.amount);
      if (!title || !Number.isFinite(amount) || amount <= 0 || !item.asin) return [];
      const url =
        typeof item.detailPageURL === 'string'
          ? item.detailPageURL
          : `https://www.amazon.in/dp/${encodeURIComponent(item.asin)}`;
      if (!this.isProviderUrl(url, 'amazon.in')) return [];
      return [
        {
          id: `amazon-${item.asin}`,
          title,
          brand: item.itemInfo?.byLineInfo?.brand?.displayValue || 'Brand not provided',
          category: c.category || 'General',
          price: amount,
          currency: 'INR',
          rating: 0,
          reviewCount: 0,
          features: (item.itemInfo?.features?.displayValues || []).filter(
            (x: unknown) => typeof x === 'string',
          ),
          inStock: true,
          deliveryDays: 0,
          description: '',
          sourceUrl: url,
          providerId: 'amazon_in',
          providerName: 'Amazon India',
          retrievedAt: new Date().toISOString(),
          uncertaintyNote:
            'Rating and delivery date were not provided by the API response; verify final price and availability on Amazon.',
        },
      ];
    });
  }

  private async searchFlipkart(c: ShoppingConstraints): Promise<ProductItem[]> {
    const endpoint = new URL(
      this.env.FLIPKART_AFFILIATE_SEARCH_URL ||
        'https://affiliate-api.flipkart.net/affiliate/1.0/search.json',
    );
    if (
      endpoint.hostname !== 'affiliate-api.flipkart.net' ||
      endpoint.pathname !== '/affiliate/1.0/search.json'
    )
      throw new Error('Flipkart search endpoint is not approved.');
    endpoint.searchParams.set('query', [c.query, ...c.constraints].join(' ').trim());
    endpoint.searchParams.set('resultCount', '10');
    const data = await this.requestJson(endpoint.toString(), {
      headers: {
        'Fk-Affiliate-Id': this.env.FLIPKART_AFFILIATE_ID!,
        'Fk-Affiliate-Token': this.env.FLIPKART_AFFILIATE_TOKEN!,
      },
    });
    const items: Json[] = data.productInfoList || [];
    return items.flatMap((entry) => {
      const p = entry.productBaseInfo?.productAttributes;
      const id = entry.productBaseInfo?.productIdentifier?.productId;
      const price = Number(p?.sellingPrice?.amount);
      if (
        !p?.title ||
        !id ||
        !Number.isFinite(price) ||
        price <= 0 ||
        !p.productUrl ||
        !this.isProviderUrl(p.productUrl, 'flipkart.com')
      )
        return [];
      const features = [p.productDescription, p.productBrand].filter(
        (v): v is string => typeof v === 'string' && v.length > 0,
      );
      return [
        {
          id: `flipkart-${id}`,
          title: p.title,
          brand: p.productBrand || 'Flipkart listing',
          category: c.category || 'General',
          price,
          currency: p.sellingPrice?.currency || 'INR',
          rating: Number(p.productRating?.averageRating) || 0,
          reviewCount: Number(p.productRating?.ratingCount) || 0,
          features,
          inStock: p.inStock === true || p.inStock === 'true',
          deliveryDays: 0,
          description: p.productDescription || '',
          sourceUrl: p.productUrl,
          providerId: 'flipkart',
          providerName: 'Flipkart',
          retrievedAt: new Date().toISOString(),
          uncertaintyNote:
            'Delivery date is not guaranteed by this search response; confirm listing details on Flipkart.',
        },
      ];
    });
  }

  private isProviderUrl(value: string, domain: string): boolean {
    try {
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        (url.hostname === domain || url.hostname.endsWith(`.${domain}`))
      );
    } catch {
      return false;
    }
  }
}
