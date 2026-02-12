
# Redirect Old FSD URL to Live Event

## The Problem
An ad is pointing to `boomevents.co.uk/event/071225-FSD-NPTON` (the old Christmas 2025 Family Silent Disco), which no longer exists. It needs to forward to the current live event.

## The Fix
Add one line to `public/_redirects`:

```
/event/071225-FSD-NPTON    /event/210326-FSD-NPTON    301
```

This is a permanent (301) redirect, so anyone clicking the ad link will be instantly forwarded to the live Family Silent Disco page (March 21, 2026 at The Picturedrome).

## Also Update Existing Legacy Redirect
The file already has a redirect from the old long-form URL (`/events/christmas-family-silent-disco-northampton/*`) pointing to `071225-FSD-NPTON`. We should update that to point directly to `210326-FSD-NPTON` as well, so it doesn't chain through two redirects.

## Technical Details
- File to edit: `public/_redirects`
- Add new redirect line for `/event/071225-FSD-NPTON` to `/event/210326-FSD-NPTON`
- Update existing line 8 to point the legacy URL directly to `210326-FSD-NPTON`
- Both use 301 (permanent redirect) status
