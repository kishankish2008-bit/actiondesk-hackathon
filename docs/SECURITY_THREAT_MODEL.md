# ActionDesk security boundaries

## Implemented controls

- The Express server binds to loopback by default, accepts browser origins only from the local Vite origins, limits JSON request bodies, disables the Express fingerprint header, and validates user input with Zod.
- Amazon and Flipkart partner credentials are read only by the server. Amazon OAuth access tokens are cached in server memory and never returned in task/provider responses.
- The optional Gemini key is read only by the server. Request text is redacted before the Gemini request, calls use a fixed Google API host and bounded timeout, and structured task output is validated with Zod. On model failure, task parsing falls back locally; helper replies fail with a bounded user-facing message.
- Partner API requests use HTTPS, bounded timeouts, fixed provider hosts, and safe error messages. Returned product links are restricted to the matching retailer domain before display.
- Product results must pass the live-result schema and are filtered for the requested currency, budget, and availability. The application has no demo product/train/knowledge fixtures in its request path; API failures do not trigger fallback results.
- Train providers that do not have a configured licensed consumer search API are handoff-only. ActionDesk does not scrape or automate retailer/travel-site login, form submission, or checkout.
- General-information tasks return no factual answer or citation when no live approved search source exists. They offer a web search handoff instead.
- The handoff flow opens only a provider API-returned product URL or a statically configured official provider URL. Users complete account, address, booking, and payment actions directly on the provider site.
- Logs redact common password, token, card, CVV, OTP, email, phone, and address fields. Task data stays in process memory and is cleared on server restart.

## Limits before production deployment

- The app is still a local prototype: it has no user authentication, persistent database, per-user isolation, rate limiting, or production observability. Do not expose it to the public internet in this state.
- Provider status means credentials and transport configuration are present; the credentials may still be invalid, expired, region-ineligible, or rate-limited. The first actual API call verifies remote access.
- Retail pricing and stock can change after the response. Users must verify listing details and totals on the official provider page.
- No rail API contract is integrated. MakeMyTrip handoff is intentional because the public myBiz Travel Request API does not provide consumer train search.
- General web search currently hands off to Google; it does not claim to have retrieved or verified search results.
- Gemini helper replies are not source verification. The UI discloses that user messages are sent to Google when Gemini is configured and directs time-sensitive questions to approved live sources.
- Browser voice APIs can send voice data to the browser vendor’s speech service. The app does not persist audio.

## Review checklist

Before production, add authenticated user sessions, per-user task isolation, durable secret management, request and provider rate limits, retry policies that respect provider terms, retention controls, audit monitoring, and contract tests against each approved provider account. Review each provider’s latest API terms and data display requirements before release.
