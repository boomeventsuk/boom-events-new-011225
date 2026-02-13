

# Update FOMO Badges for Three Events

## Summary
Update the urgency messaging on three events to reflect current ticket availability.

## Changes to `public/events-boombastic.json`

### 1. Bedford 2PM Club (140226-2PM-BED)
- **Current:** "LAST 50 TICKETS!" / "2 WEEKS TO GO!"
- **New:** "LAST 25 TICKETS!" / "THIS SATURDAY!"
- Tier changes from `urgent` to `critical` (adds pulse animation)

### 2. Footloose 80s Northampton (210326-FL80-NPTON)
- **Current:** "SELLING FAST!" (no time message)
- **New:** "LAST 50 TICKETS!"
- Tier changes from `selling_fast` to `urgent`

### 3. Footloose 80s Bedford (280326-FL80-BED)
- **Current:** "SELLING FAST!" (no time message)
- **New:** "LAST 30 TICKETS!"
- Tier changes from `selling_fast` to `urgent`

## No code changes needed
All updates are data-only in the JSON file. The existing `FomoBadge` component handles the styling automatically based on the tier.

