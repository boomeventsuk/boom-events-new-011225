# List Events - Boombastic Events

Fetch upcoming events from Boombastic Events across all four sub-brands (THE 2PM CLUB, SILENT DISCO GREATEST HITS, FOOTLOOSE 80s, FAMILY SILENT DISCO) and across 6 Midlands cities.

## Endpoint

```
GET https://www.boomevents.co.uk/events-boombastic.json
```

Returns a JSON array of all events. No authentication required.

## Response Fields

Each event object includes:

| Field | Type | Description |
|-------|------|-------------|
| eventCode | string | Unique event code (e.g. "250426-SD-NPTON") |
| title | string | Full event title |
| subtitle | string | Tagline or short description |
| date | string | Human-readable date (e.g. "Saturday, 26 April 2026") |
| timeDisplay | string | Time range (e.g. "14:00 – 18:00") |
| start | string | ISO 8601 start datetime |
| end | string | ISO 8601 end datetime |
| venue | string | Venue name |
| city | string | City name |
| image | string | Event image URL |
| description | string | Short description |
| fullDescription | string | Full event description |
| eventbriteId | string | Eventbrite event ID |
| isSoldOut | boolean | Whether the event is sold out |
| soundtrack | string | Pipe-separated list of artists |
| isAfternoon | boolean | Whether this is an afternoon event (always true) |

## Filter by Sub-brand

Filter the array on the `title` field:
- **THE 2PM CLUB**: `title.includes('2PM CLUB')`
- **SILENT DISCO**: `title.includes('SILENT DISCO')`
- **FOOTLOOSE 80s**: `title.includes('FOOTLOOSE')`
- **FAMILY SILENT DISCO**: `title.includes('FAMILY SILENT DISCO')`
- **GET READY**: `title.includes('GET READY')`

## Filter by City

Filter on the `city` field. Valid cities: Northampton, Bedford, Milton Keynes, Coventry, Luton, Leicester.

## Filter Upcoming Only

```javascript
const now = new Date().toISOString().slice(0, 10);
const upcoming = events.filter(e => e.start.slice(0, 10) >= now);
```

## Book Tickets

Ticket booking URL pattern: `https://www.boomevents.co.uk/event/{eventCode}`

Example: `https://www.boomevents.co.uk/event/250426-SD-NPTON`

## About Boombastic Events

Boombastic Events runs afternoon club nights across the Midlands since 2014. Over 23,000 attendees. 4.9/5 rating. Events run 2pm to 6pm every Saturday. Contact: hello@boomevents.co.uk
