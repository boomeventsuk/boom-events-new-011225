/* scripts/generate-event-pages.js — generates public/events/<slug>/index.html with clean JSON-LD */
const fs = require('fs');
const path = require('path');
const SITE_URL = process.env.SITE_URL || 'https://boomevents.co.uk';

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p,{recursive:true}); }
function readJson(p){ try{ return JSON.parse(fs.readFileSync(p,'utf8')); }catch{ return []; } }
function slug(s){ return (s||'').toString().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
function withUkOffset(iso){ if(!iso) return iso; if(/[zZ]|[+-]\d{2}:\d{2}$/.test(iso)) return iso; const d=new Date(iso); const m=d.getMonth()+1; const off=(m>=4&&m<=10)?'+01:00':'+00:00'; return iso+off; }
function splitVenueCity(loc){ if(!loc) return {venue:'',city:''}; const parts=loc.split(',').map(p=>p.trim()); if(parts.length<2) return {venue:loc.trim(),city:''}; const city=parts[parts.length-1]; const venue=parts.slice(0,-1).join(', '); return {venue,city}; }

function page(ev,desc,s){
  const {venue,city}=splitVenueCity(ev.location||'');
  const start=withUkOffset(ev.start||'');
  const end=withUkOffset(ev.end||'');
  const share = `${SITE_URL}/events/${s}/`;
  const img = ev.image ? (ev.image.startsWith('http')?ev.image: SITE_URL + ev.image) : '';
  const offers={"@type":"Offer","url":ev.bookUrl||'',"availability":"https://schema.org/InStock","priceCurrency":"GBP"};
  if(ev.price&&ev.price!=="TBA"&&!isNaN(Number(ev.price))) offers.price=Number(ev.price);
  const sd={"@context":"https://schema.org","@type":"Event","name":ev.title||'',"startDate":start,"endDate":end,"eventStatus":"https://schema.org/EventScheduled","eventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode","location":{"@type":"Place","name":venue||(ev.location||'').split(',')[0]?.trim()||ev.location||'',"address":{"@type":"PostalAddress","addressLocality":city||ev.location||'',"addressCountry":"GB"}},"image":img,"description":desc||ev.description||'',"organizer":{"@type":"Organization","name":"Boombastic Events","url":SITE_URL},"offers":offers};
  const bc={"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":SITE_URL+"/"},{"@type":"ListItem","position":2,"name":"Events","item":SITE_URL+"/events/"},{"@type":"ListItem","position":3,"name":ev.title||'Event',"item":share}]};
  
  const utmUrl=ev.bookUrl?`${ev.bookUrl}${ev.bookUrl.includes('?')?'&':'?'}utm_source=boombastic&utm_campaign=event_page`:ev.bookUrl;
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${ev.title} | Boombastic Events</title><meta name="description" content="${desc||ev.description||''}"><meta property="og:title" content="${ev.title}"><meta property="og:description" content="${desc||ev.description||''}"><meta property="og:url" content="${share}"><meta property="og:image" content="${img}"><meta property="og:type" content="event"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${ev.title}"><meta name="twitter:description" content="${desc||ev.description||''}"><meta name="twitter:image" content="${img}"><link rel="canonical" href="${share}"><script type="application/ld+json">${JSON.stringify(sd)}</script><script type="application/ld+json">${JSON.stringify(bc)}</script></head><body><main style="max-width:980px;margin:20px auto;font-family:system-ui,sans-serif;padding:20px"><h1>${ev.title}</h1><p>${desc||ev.description||''}</p>${ev.start?`<p><strong>Date:</strong> ${new Date(ev.start).toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'})} <strong>Time:</strong> ${new Date(ev.start).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}${ev.end?`–${new Date(ev.end).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`:''}</p>`:''}<p><strong>Venue:</strong> ${venue||ev.location||''}</p>${city?`<p><strong>Location:</strong> ${city}</p>`:''}${ev.bookUrl?`<p><a href="${utmUrl}" target="_blank" rel="noopener" style="background:#ff6b35;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold">Buy Tickets</a></p>`:''}</main></body></html>`;
}

(function run(){
  const events=readJson(path.join(process.cwd(),'public','events.json'));
  const copy=readJson(path.join(process.cwd(),'content','event-copy.json'))||{};
  const outDir=path.join(process.cwd(),'public','events');
  ensureDir(outDir);
  events.forEach(ev=>{
    const s=ev.slug||slug(ev.title||ev.id||'event');
    const desc=copy[String(ev.id)]||copy[s]||ev.description||'';
    const html=page(ev,desc,s);
    const d=path.join(outDir,s);
    ensureDir(d);
    fs.writeFileSync(path.join(d,'index.html'),html,'utf8');
    console.log('Generated:',s);
  });
})();