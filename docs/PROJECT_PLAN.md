# ActionDesk project plan

## Prototype objectives

1. Parse natural-language text and speech requests and ask for missing information.
2. Search products through configured official partner APIs only.
3. Route train search and unsupported information requests to official search pages without inventing results.
4. Let users inspect live product details and explicitly open the provider listing.
5. Keep account access, addresses, bookings, and payment on the provider website.

## Completed in this build

- Server-side Amazon Creators API OAuth and SearchItems transport.
- Server-side Flipkart Affiliate API keyword search transport.
- Provider response normalization, result validation, currency/budget/in-stock filtering, safe official URL checks, and bounded request timeouts.
- Removed sample train/product catalogs, simulated checkout pages, and local result fallback paths from the app.
- MakeMyTrip/IRCTC/Goibibo handoff paths, explicit no-source messaging for general questions, and updated safety and setup documentation.
- Unit and API-boundary tests, TypeScript checks, and production build.

## Before claiming a real partner integration is operational

- Add authorized partner credentials to a local `.env` file.
- Run an actual live product search against each authorized provider account.
- Check provider-specific terms for data display, price freshness, affiliate links, attribution, and rate limits.
- Add authenticated user sessions, per-user task isolation, a real secret manager, rate limits, structured error telemetry, and data-retention controls before public deployment.
- Integrate a licensed consumer rail-search API only after receiving and reviewing its actual partner contract and API specification.
- Integrate a live web search provider if ActionDesk should answer general questions instead of handing off to a search engine.
