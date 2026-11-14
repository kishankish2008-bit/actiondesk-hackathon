# ActionDesk verification and demo guide

## Run locally

1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env` and add authorized Amazon Creators API and/or Flipkart Affiliate API credentials locally.
3. Start the app: `npm run dev`.
4. Open `http://localhost:5173` and check `http://127.0.0.1:3001/health`.
5. Submit a product request naming Amazon or Flipkart. With valid credentials, results should show the provider and retrieval time. Without credentials or if the API fails, the result list must be empty and an official provider handoff shown.
6. Submit a train request for MakeMyTrip. ActionDesk should show no itineraries and provide the MakeMyTrip railways link. The user searches and books there.
7. Submit a general question. ActionDesk should state that it has no live approved search source and provide web-search handoff without fabricated citations.
8. Confirm a live product. ActionDesk opens the exact provider URL returned by the API; user sign-in, address, and payment remain on the provider.

## Automated checks

```powershell
npm run typecheck
npm test
npm run build
```

The test suite covers request parsing, API origin/input boundaries, provider handoff behavior, no-result fallback rules, and live-result validation. Network integration is not marked as live-tested unless valid credentials are present and a real provider call succeeds. The local `GET /health` endpoint is a quick server check; it does not prove partner credentials are valid.

## Demo acceptance conditions

- The home screen starts with no preloaded product or train results.
- Provider cards distinguish configured credentials from official-site handoff.
- Unavailable API access never produces substitute products, trains, ratings, prices, stock, or citations.
- Search result cards show a real provider URL and retrieval timestamp.
- Confirmation hands off to the provider listing without automating identity, address, or payment data.
- No action is described as booked, purchased, searched, or verified unless the corresponding API action actually completed.
