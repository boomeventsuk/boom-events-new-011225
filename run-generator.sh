#!/bin/bash
echo "🚀 Running event page generator..."
node scripts/generate-event-pages.js
echo "✅ Generator complete!"
echo "🧪 Running smoke tests..."
bash scripts/smoke-test.sh
echo "🎉 All artifacts generated successfully!"