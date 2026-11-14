# Provider capability matrix

| Provider | Current ActionDesk behavior | Credential source | Limit |
|---|---|---|---|
| Amazon India | Official Creators API product search when configured; otherwise Amazon search handoff | Amazon Associates Creators API | Requires approved Associates/Creators API access for Amazon.in. Search results and prices may change before checkout. |
| Flipkart | Official Affiliate API product search when configured; otherwise Flipkart search handoff | Flipkart Affiliate API | Requires registered affiliate credentials. Search results and prices may change before checkout. |
| MakeMyTrip Railways | Official website handoff | No consumer train-search API integrated | Public myBiz Travel Request API covers approved corporate travel requests, not consumer train inventory. |
| IRCTC | Official website handoff | Licensed IRCTC Web Services access not integrated | No scraping, login automation, or booking automation. |
| Goibibo Trains | Official website handoff | No licensed consumer rail-search API integrated | No scraping or booking automation. |
| General information | Google search handoff with explicit no-source message | No live search API configured | ActionDesk does not present unverified answers or invented citations. |

## Official API references

- Amazon Creators API [SearchItems](https://affiliate-program.amazon.in/creatorsapi/docs/en-us/api-reference/operations/search-items), [Using cURL](https://affiliate-program.amazon.in/creatorsapi/docs/en-us/get-started/using-curl), and [credential versions](https://affiliate-program.amazon.in/creatorsapi/docs/en-us/concepts/understanding-versions).
- Flipkart Affiliate API [Product API reference](https://affiliate.flipkart.com/api-docs/af_prod_ref.html) and [API overview](https://affiliate.flipkart.com/api-docs/af_overview.html).
- MakeMyTrip [myBiz Travel Request API](https://mybiz.makemytrip.com/integrated-travel-solutions/travel-request-api) is for sending approved corporate travel requests. It is not the consumer train-search API required for automated live rail results.

## Provider state interpretation

`Credentials configured` means the local environment has the required values and ActionDesk has the matching transport code. It is not a live credential health check. Only a successful API response produces displayed product results. Provider errors and invalid response shapes produce no results and a clear official-site handoff.
