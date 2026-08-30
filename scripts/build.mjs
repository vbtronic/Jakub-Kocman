// Generuje HTML bloky z data/*.yml do index.html, galerie.html a sitemap.xml.
// Ručně psané HTML zůstává nedotčené — přepisuje se jen obsah mezi značkami
// <!-- nazev:start --> a <!-- nazev:end -->.
//
// Spuštění: npm run build

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { WEB, proWeb } from './nastaveni.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = WEB;   // adresa webu je v scripts/nastaveni.mjs

const IKONY = {
  dum:      '<path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
  klic:     '<path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4z"/>',
  rozvadec: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 7h8M8 12h8M8 17h4"/>',
  zarovka:  '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
  vystraha: '<path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  blesk:    '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z"/>',
  kolo:     '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  zasuvka:  '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/>',
};

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const nactiYaml = f => yaml.load(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8')) || {};

/** Nahradí obsah mezi <!-- klic:start --> a <!-- klic:end -->. */
function vloz(html, klic, obsah, kdeProChybu) {
  const re = new RegExp(`(<!-- ${klic}:start -->)[\\s\\S]*?(<!-- ${klic}:end -->)`);
  if (!re.test(html)) throw new Error(`Značka "${klic}" nenalezena v ${kdeProChybu}`);
  return html.replace(re, `$1\n${obsah}\n      $2`);
}

// ---------------------------------------------------------------- galerie
const { fotky = [] } = nactiYaml('galerie.yml');
if (!fotky.length) throw new Error('data/galerie.yml neobsahuje žádné fotky');

const popisNeboVychozi = (f, i) =>
  (f.popis && f.popis.trim())
    ? f.popis.trim()
    : `Realizace elektroinstalace č. ${i + 1} – KM-Elektro, Litoměřicko`;

const shot = (f, i) => {
  const popis = popisNeboVychozi(f, i);
  return `      <button class="shot" data-full="${esc(proWeb(f.soubor))}" data-popis="${esc(popis)}" ` +
    `aria-label="Zvětšit fotku ${i + 1} ze ${fotky.length}">` +
    `<img src="${esc(proWeb(f.nahled))}" alt="${esc(popis)}" loading="lazy" decoding="async" ` +
    `width="800" height="600"></button>`;
};

const vsechnyShoty = fotky.map(shot).join('\n');
const ukazkaShotu = fotky.slice(0, 6).map(shot).join('\n');

// ---------------------------------------------------------------- služby
const { sluzby = [] } = nactiYaml('sluzby.yml');
if (!sluzby.length) throw new Error('data/sluzby.yml neobsahuje žádné služby');

const neznameIkony = sluzby.map(s => s.ikona).filter(k => k && !IKONY[k]);
if (neznameIkony.length) {
  throw new Error(`Neznámé ikony: ${[...new Set(neznameIkony)].join(', ')}. ` +
    `K dispozici: ${Object.keys(IKONY).join(', ')}`);
}

const karta = s => `      <div class="card">
        <div class="ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${IKONY[s.ikona] || IKONY.blesk}</svg></div>
        <h3>${esc(s.nadpis)}</h3>
        <p>${esc(s.popis)}</p>
        <span class="price">${esc(s.cena)}</span>
      </div>`;

const karty = sluzby.map(karta).join('\n');

// ---------------------------------------------------------------- zápis HTML
const pocet = String(fotky.length);
const nahradPocet = h =>
  h.replace(/(<!-- pocet:start -->)[\s\S]*?(<!-- pocet:end -->)/g, `$1${pocet}$2`);

let index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
index = vloz(index, 'sluzby', karty, 'index.html');
index = vloz(index, 'galerie', ukazkaShotu, 'index.html');
index = nahradPocet(index);
fs.writeFileSync(path.join(ROOT, 'index.html'), index);

let galerie = fs.readFileSync(path.join(ROOT, 'galerie.html'), 'utf8');
galerie = vloz(galerie, 'galerie', vsechnyShoty, 'galerie.html');
galerie = nahradPocet(galerie);
fs.writeFileSync(path.join(ROOT, 'galerie.html'), galerie);

// ---------------------------------------------------------------- sitemap
const DNES = new Date().toISOString().slice(0, 10);
const obrazky = fotky.map((f, i) => `    <image:image>
      <image:loc>${BASE}/${esc(proWeb(f.soubor))}</image:loc>
      <image:title>${esc(popisNeboVychozi(f, i))}</image:title>
    </image:image>`).join('\n');

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${BASE}/</loc>
    <lastmod>${DNES}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${BASE}/img/jakub.webp</image:loc>
      <image:title>Jakub Kocman – elektrikář, Litoměřicko</image:title>
    </image:image>
  </url>
  <url>
    <loc>${BASE}/galerie.html</loc>
    <lastmod>${DNES}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
${obrazky}
  </url>
</urlset>
`);

console.log(`✓ ${fotky.length} fotek, ${sluzby.length} služeb, sitemap k ${DNES}`);
