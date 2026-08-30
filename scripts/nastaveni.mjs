// Jediné místo, kde je zapsané, kde web bydlí.
// Při přechodu na vlastní doménu se mění jen tenhle soubor
// (a k tomu hlavičky v index.html / galerie.html a pole v admin/config.yml).

/** Veřejná adresa webu, bez lomítka na konci. Používá se v sitemapě. */
export const WEB = 'https://jakubkocman.cz';

/**
 * Podadresář, ve kterém web běží. Na vlastní doméně v kořeni je prázdný;
 * na GitHub Pages to byl název repozitáře.
 *
 * Cesty k fotkám se v data/*.yml ukládají od kořene webu, protože relativní
 * cesty by si administrace na /admin/ přeložila špatně. Do HTML se počáteční
 * lomítko zase odebírá, aby web fungoval i jinde a šel otevřít lokálně.
 */
export const ZAKLADNI_CESTA = '';

/**
 * Z uložené cesty udělá tvar pro HTML: "/img/g/a.webp" -> "img/g/a.webp"
 *
 * Odřízne aktuální prefix, a když nesedí, spolehne se na to, že cesta k obrázku
 * vždycky začíná složkou img/. Díky tomu přežije i změnu ZAKLADNI_CESTA
 * (přechod na vlastní doménu) bez toho, aby se musela přepisovat data.
 */
export function proWeb(cesta) {
  let c = String(cesta || '');
  if (ZAKLADNI_CESTA && c.startsWith(ZAKLADNI_CESTA + '/')) {
    return c.slice(ZAKLADNI_CESTA.length + 1);
  }
  const odImg = c.indexOf('img/');
  if (odImg > 0) return c.slice(odImg);
  return c.replace(/^\//, '');
}

/** Z cesty v repozitáři udělá tvar pro uložení: "img/g/a.webp" -> "/img/g/a.webp" */
export function proData(cesta) {
  return ZAKLADNI_CESTA + '/' + String(cesta || '').replace(/^\//, '');
}
