LOVABLE ONE-SHOT INSTALL

1) Create files in your repo as provided (scripts/lovable-one-shot.js, scripts/generate-event-pages.js).
2) Commit & push.
3) Set Lovable build command to:
   node scripts/lovable-one-shot.js && npm run build
   (or run locally: node scripts/lovable-one-shot.js && npm run build)
4) Deploy. Check build logs for output. After the script finishes in the build, validation report will be written to:
   - public/geo-seo-validation-report.md
   - and printed in the build logs.
5) If your Lovable build environment cannot run Node scripts or cannot write files, run locally:
   - npm install
   - node scripts/lovable-one-shot.js
   - git add public/ && git commit -m "Generated event pages and SEO fixes" && git push
6) After deploy: submit sitemap https://boomevents.co.uk/sitemap.xml in Google Search Console (if verified).