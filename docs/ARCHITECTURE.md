# ActionDesk architecture

## Runtime layout

```text
React + Vite client
  └─ task input, voice controls, clarification, results, official handoff
       │ /api
       ▼
Express loopback server
  ├─ Zod request validation and local-origin boundary
  ├─ ServerLlmParserAdapter (Gemini structured parse → Zod → local parser fallback)
  ├─ Desk Buddy helper endpoint (Gemini, when configured)
  ├─ TaskManager state machine
  ├─ ProviderRegistry → capability/status, safe provider URLs
  ├─ OfficialProductApis → Amazon Creators API + Flipkart Affiliate API
  └─ InfoAdapter → transparent no-source response until a live search source is configured
```

## Request flow

1. Gemini can classify and extract task details using a constrained JSON schema; Zod validates the output. If Gemini is unset, unavailable, or returns invalid output, the local parser handles the request. The model never performs provider searches or transactions.
2. The registry selects the requested configured partner when available. Credentials alone do not guarantee that the provider accepts the request.
3. Product queries use the official partner API on the server. The transport uses bounded network timeouts and returns normalized candidates; Zod validates required fields and the registry filters budget, currency, and availability.
4. If a provider is unavailable, errors, or returns no eligible results, the task has no recommendation and shows a transparent handoff. Train requests currently always use this path because no licensed consumer rail search contract is integrated.
5. User confirmation opens the exact official retailer listing returned by the live API. ActionDesk does not enter credentials, addresses, or payment details.

## Gemini boundary

Gemini receives redacted request text only when `GEMINI_API_KEY` is configured. Its output can influence intent and constraint parsing after schema validation; it cannot select or invoke a tool, create a product result, or claim live facts. Desk Buddy uses Gemini only for product guidance and request phrasing. Current prices, policies, availability, and train schedules still require a live approved provider source.

## Trust boundaries

- Browser: receives task data and result listings, never partner secrets.
- Server environment: holds partner client IDs, secrets, tags, and tokens.
- Provider APIs: external, variable, and subject to partner eligibility, quotas, and current terms.
- Provider pages: user-controlled handoff only; no automated page scraping or checkout.
- In-memory task state: local process only; not durable and not isolated by user account.

## Extension points

`LiveSearchClient` is the provider transport boundary. Add a new connector only after its licensed API contract, auth flow, allowed response fields, and link rules are documented. A train connector should be independently gated by an explicit licensed consumer-search API contract; do not infer one from corporate travel-request APIs.
