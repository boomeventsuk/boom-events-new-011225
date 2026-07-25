# Auth.md

Authentication and access policy for agents using www.boomevents.co.uk.

## Summary

No authentication is required. Every machine-readable endpoint on this site is
public, read-only and free to use. There is no agent registration step, no API
key to request, and no OAuth flow.

## Public endpoints

| Endpoint | Format | Contents |
| --- | --- | --- |
| `/llms.txt` | text/markdown | Short site summary |
| `/llms-full.txt` | text/markdown | Extended site summary |
| `/events-boombastic.json` | application/json | All upcoming events: title, date, venue, price, availability, booking URL |
| `/venues.json` | application/json | Venue reference data |
| `/event/{code}/` | text/html, text/markdown | Individual event page |
| `/openapi.json` | OpenAPI 3 | Machine description of the feeds above |
| `/.well-known/api-catalog` | application/linkset+json | API catalogue |
| `/.well-known/mcp/server-card.json` | application/json | MCP server card |
| `/.well-known/agent-skills/index.json` | application/json | Agent Skills index |

Any page also returns markdown when requested with `Accept: text/markdown`.

## Rate limits

None enforced. Please stay under roughly 1 request per second and send an
identifying User-Agent so we can contact you if something breaks.

## Crawling policy

See `/robots.txt`. AI training, AI input and search are all permitted, declared
via Content-Signal. Named AI crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot,
Google-Extended, Applebot-Extended and others) are explicitly allowed.

## What agents cannot do

Ticket purchases cannot be completed by an agent. Checkout runs through
Eventbrite and must be completed by the person attending. There is no
programmatic booking endpoint, and no agentic commerce protocol is implemented
(no x402, UCP, ACP or MPP) because this site does not process payments itself.

An agent should send the buyer to the event page URL to complete a purchase.

## Contact

hello@boomevents.co.uk

Boombastic Events Ltd.
