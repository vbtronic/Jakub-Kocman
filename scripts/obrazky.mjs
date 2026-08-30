// Zpracuje fotky nahrané přes administraci.
//
// Jakub nahraje fotku z mobilu → spadne do img/upload/ tak, jak je (klidně 5 MB JPEG).
// Tenhle skript ji převede na webp, zmenší na rozumnou velikost, vyrobí náhled
// a v data/galerie.yml přepíše cestu z img/upload/… na img/g/… + img/t/….
// Původní soubor pak smaže, aby se nehromadil v repu.
//
// Spuštění: npm run obrazky

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import yaml from 'js-yaml';
import { proData, proWeb } from './nastaveni.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UPLOAD = path.join(ROOT, 'img', 'upload');
const PLNE = path.join(ROOT, 'img', 'g');
const NAHLEDY = path.join(ROOT, 'img', 't');

// odpovídá parametrům stávajících fotek v repu
const PLNA_STRANA = 1600;
const NAHLED_STRANA = 760;
const KVALITA_PLNA = 82;
const KVALITA_NAHLED = 78;

const ZPRACOVATELNE = /\.(jpe?g|png|webp|heic|heif|tiff?)$/i;

/** Bezpečný název souboru — bez diakritiky, mezer a divných znaků. */
function slug(jmeno) {
  return jmeno
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'fotka';
}

/** Najde volný název, ať nepřepíšeme existující fotku. */
function volnyNazev(zaklad) {
  let jmeno = `${zaklad}.webp`;
  let i = 2;
  while (fs.existsSync(path.join(PLNE, jmeno)) || fs.existsSync(path.join(NAHLEDY, jmeno))) {
    jmeno = `${zaklad}-${i++}.webp`;
  }
  return jmeno;
}

if (!fs.existsSync(UPLOAD)) {
  console.log('img/upload/ neexistuje — nic ke zpracování.');
  process.exit(0);
}

const kZpracovani = fs.readdirSync(UPLOAD).filter(f => ZPRACOVATELNE.test(f));
if (!kZpracovani.length) {
  console.log('Žádné nové fotky ke zpracování.');
  process.exit(0);
}

fs.mkdirSync(PLNE, { recursive: true });
fs.mkdirSync(NAHLEDY, { recursive: true });

// mapa: původní cesta v img/upload → nové cesty
const prejmenovano = new Map();

for (const soubor of kZpracovani) {
  const zdroj = path.join(UPLOAD, soubor);
  const jmeno = volnyNazev(slug(soubor));

  // rotate() srovná fotku podle EXIF orientace z mobilu
  const vstup = sharp(zdroj).rotate();
  const meta = await vstup.metadata();

  await vstup
    .clone()
    .resize(PLNA_STRANA, PLNA_STRANA, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: KVALITA_PLNA })
    .toFile(path.join(PLNE, jmeno));

  await vstup
    .clone()
    .resize(NAHLED_STRANA, NAHLED_STRANA, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: KVALITA_NAHLED })
    .toFile(path.join(NAHLEDY, jmeno));

  const puvodni = (fs.statSync(zdroj).size / 1024).toFixed(0);
  const nova = (fs.statSync(path.join(PLNE, jmeno)).size / 1024).toFixed(0);
  console.log(`  ${soubor} (${meta.width}×${meta.height}, ${puvodni} kB) → ${jmeno} (${nova} kB)`);

  prejmenovano.set(`img/upload/${soubor}`, {
    soubor: proData(`img/g/${jmeno}`),
    nahled: proData(`img/t/${jmeno}`),
  });
  fs.unlinkSync(zdroj);
}

// --- přepsat cesty v data/galerie.yml -----------------------------------
const cestaYml = path.join(ROOT, 'data', 'galerie.yml');
const data = yaml.load(fs.readFileSync(cestaYml, 'utf8')) || {};
data.fotky = data.fotky || [];

let zmeneno = 0;
for (const f of data.fotky) {
  // Decap ukládá cesty od kořene webu; pro porovnání je zkrátíme
  const klic = proWeb(f.soubor);
  const nove = prejmenovano.get(klic);
  if (nove) { f.soubor = nove.soubor; f.nahled = nove.nahled; zmeneno++; }
}

// fotky nahrané mimo galerii (nikdo je v YAML nezmínil) připojíme na konec
const zminene = new Set(data.fotky.map(f => String(f.soubor || '')));
for (const nove of prejmenovano.values()) {
  if (!zminene.has(nove.soubor)) {
    data.fotky.push({ soubor: nove.soubor, nahled: nove.nahled, popis: '' });
    zmeneno++;
  }
}

const hlavicka = '# Fotky v galerii. Pořadí v tomto souboru = pořadí na webu.\n' +
                 '# Spravuje se přes administraci na /admin/ — ručně sem psát nemusíš.\n';
fs.writeFileSync(cestaYml, hlavicka + yaml.dump(data, { lineWidth: 0, quotingType: '"' }));

console.log(`✓ zpracováno ${kZpracovani.length} fotek, upraveno ${zmeneno} záznamů v galerii`);
