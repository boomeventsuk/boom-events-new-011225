#!/bin/bash

# Smoke test script for SEO/AEO/AIO artifacts
# Verifies all required files and endpoints exist and are valid

set -e

echo "🔍 Running smoke tests for SEO/AEO/AIO artifacts..."

# Test 1: Check sitemap exists and includes required URLs
echo "✓ Testing sitemap.xml..."
if [ ! -f "public/sitemap.xml" ]; then
  echo "❌ ERROR: public/sitemap.xml not found"
  exit 1
fi

if ! grep -q "/for-ai/" public/sitemap.xml; then
  echo "❌ ERROR: sitemap.xml missing /for-ai/ entry"
  exit 1
fi

if ! grep -q "/venues.json" public/sitemap.xml; then
  echo "❌ ERROR: sitemap.xml missing /venues.json entry"
  exit 1
fi

# Test 2: Check venues.json exists and is valid JSON
echo "✓ Testing venues.json..."
if [ ! -f "public/venues.json" ]; then
  echo "❌ ERROR: public/venues.json not found"
  exit 1
fi

if ! python3 -m json.tool public/venues.json > /dev/null 2>&1; then
  echo "❌ ERROR: public/venues.json is not valid JSON"
  exit 1
fi

# Test 3: Check sample event JSON exists and is valid
echo "✓ Testing sample event JSON..."
SAMPLE_EVENT_DIR=$(find public/events -maxdepth 1 -type d | head -2 | tail -1)
if [ -z "$SAMPLE_EVENT_DIR" ]; then
  echo "❌ ERROR: No event directories found in public/events/"
  exit 1
fi

SAMPLE_JSON="$SAMPLE_EVENT_DIR/index.json"
if [ ! -f "$SAMPLE_JSON" ]; then
  echo "❌ ERROR: Sample event JSON not found at $SAMPLE_JSON"
  exit 1
fi

if ! python3 -m json.tool "$SAMPLE_JSON" > /dev/null 2>&1; then
  echo "❌ ERROR: Sample event JSON is not valid JSON"
  exit 1
fi

# Test 4: Check required static files exist
echo "✓ Testing required static files..."
REQUIRED_FILES=(
  "public/site.webmanifest"
  "public/apple-touch-icon.png"
  "public/for-ai/index.html"
  "public/faq/index.html"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ ERROR: Required file not found: $file"
    exit 1
  fi
done

# Test 5: Verify manifest is valid JSON
echo "✓ Testing web manifest..."
if ! python3 -m json.tool public/site.webmanifest > /dev/null 2>&1; then
  echo "❌ ERROR: site.webmanifest is not valid JSON"
  exit 1
fi

echo "🎉 All smoke tests passed!"
echo "📋 Summary:"
echo "   ✅ Sitemap includes /for-ai/ and /venues.json"
echo "   ✅ venues.json exists and is valid JSON"
echo "   ✅ Sample event JSON exists and is valid"
echo "   ✅ All required static files present"
echo "   ✅ Web manifest is valid JSON"

exit 0