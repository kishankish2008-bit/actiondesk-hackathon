# ActionDesk

ActionDesk is a voice-and-text assistant prototype for shopping, travel, and web lookups. It parses a request, asks for missing details, searches only through configured official commerce partner APIs, and offers a direct official-site handoff when no supported API is available.

## Current working scope

- **Amazon India product search:** Amazon Creators API transport, including server-side OAuth token caching and validated listing links.
- **Flipkart product search:** Flipkart Affiliate API transport with response validation and budget, currency, and stock filtering.
- **Train search:** MakeMyTrip, IRCTC, and Goibibo official-site handoff. ActionDesk does not scrape these sites or invent train schedules. The public MakeMyTrip myBiz API contract is for corporate travel-request handoff, not consumer train search.
- **General information:** No live search API is configured. ActionDesk says it could not verify the request and offers a web search handoff rather than inventing an answer or citation.
- **Gemini:** Optional server-side request understanding and Desk Buddy help use structured, schema-validated output. If no key is configured or Gemini is unavailable, ActionDesk falls back to the local parser. Gemini is not treated as a live search source.
- **Checkout:** The user confirms the listing, then ActionDesk opens the official provider page. Login, address entry, booking, and payment stay on that provider’s site.
- **Voice:** Browser speech recognition/synthesis when the browser supports it.

There are no local product, train, or knowledge fixtures in the request flow. A partner API must return schema-valid data before ActionDesk displays results. Missing credentials, API errors, empty results, and unsupported travel search result in a clear handoff without substitute cards.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Amazon Creators API access for Amazon India search
- Flipkart Affiliate API access for Flipkart search

## Setup

```powershell
npm install
Copy-Item .env.example .env
```

Add credentials to `.env` on your computer. Set `GEMINI_API_KEY` to enable request understanding and Desk Buddy answers; without it, local parsing still works. Never paste keys into chat, commit `.env`, or place partner secrets in client-side files. Amazon requires an Associates account and approved Creators API access for the target marketplace. The supported token endpoint varies with the credential version; set `AMAZON_CREATORS_TOKEN_URL` to the endpoint shown for your issued credentials.

Run the app:

```powershell
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The loopback API health check is [http://127.0.0.1:3001/health](http://127.0.0.1:3001/health). `GET /api/providers` reports whether required credentials are configured; it does not validate their remote acceptance until a search is attempted.

## Verification

```powershell
npm run typecheck
npm test
npm run build
```

See [architecture](docs/ARCHITECTURE.md), [provider capability matrix](docs/PROVIDER_CAPABILITY_MATRIX.md), [security boundaries](docs/SECURITY_THREAT_MODEL.md), and [verification guide](docs/TEST_AND_DEMO_PLAN.md).
