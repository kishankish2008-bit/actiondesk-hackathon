# Implementation blueprint

## Project structure

- `client/src/`: React interface, speech service, task/API client, and provider-result UI.
- `server/src/index.ts`: loopback Express API, origin checks, JSON limit, and request schemas.
- `server/src/parser/`: deterministic task parsing and optional language-model adapter.
- `server/src/orchestrator/taskManager.ts`: request state transitions, handoff logic, and no-fallback policy.
- `server/src/adapters/providerRegistry.ts`: provider capability resolution, URL construction, validation, filtering, and recommendations.
- `server/src/adapters/officialProductApis.ts`: Amazon Creators and Flipkart Affiliate API transports.
- `server/src/adapters/infoAdapter.ts`: returns a no-source response until a real approved search integration is added.
- `shared/`: domain types, validation schemas, ports, and example prompts.
- `tests/`: parser, provider, state-machine, API-boundary, and policy checks.

## Provider implementation contract

Every live provider adapter must:

1. Be backed by a current licensed partner API contract.
2. Keep credentials on the server and authenticate using the provider’s documented flow.
3. Use bounded request timeouts and safe error messages; never print credentials or full authorization headers.
4. Normalize only fields actually returned by the provider and validate required output fields.
5. Restrict returned listing URLs to the correct HTTPS provider domain.
6. Return no result when required price, currency, identifier, availability, or safe source URL is missing.
7. Leave account, personal data, booking, and payment actions to the user on the provider’s site.

No fixture fallback is allowed in task search. When the API is absent, unavailable, invalid, or yields no eligible listing, provide an official handoff without result cards.

## Current gaps

- Live credentials have not been configured or tested from this workspace.
- Rail consumer search has no integrated licensed API; MakeMyTrip is a handoff.
- General knowledge has no live search connector; it hands off to a web search page.
- The prototype is local-only and needs authentication, rate limiting, per-user storage controls, and deployment hardening before external hosting.
