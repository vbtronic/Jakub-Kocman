// mobilní menu
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const toggle = (open) => {
  document.body.classList.toggle('nav-open', open);
  burger.setAttribute('aria-expanded', open);
};
burger.addEventListener('click', () => toggle(!document.body.classList.contains('nav-open')));
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });

// lightbox
const lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg'),
      lbCount = document.getElementById('lbCount'), lbCap = document.getElementById('lbCap');
let shots = [], idx = 0;
const show = i => {
  idx = (i + shots.length) % shots.length;
  const shot = shots[idx];
  const popis = shot.dataset.popis || shot.querySelector('img')?.alt || '';
  lbImg.src = shot.dataset.full;
  lbImg.alt = popis;
  // popisek ukazujeme, jen když ho Jakub opravdu vyplnil
  if (lbCap) {
    const vlastni = shot.dataset.popis && !/^Realizace elektroinstalace č\. \d+ –/.test(shot.dataset.popis);
    lbCap.textContent = vlastni ? shot.dataset.popis : '';
    lbCap.hidden = !vlastni;
  }
  lbCount.textContent = `${idx + 1} / ${shots.length}`;
};
document.addEventListener('click', e => {
  const shot = e.target.closest('.shot');
  if (!shot) return;
  shots = [...document.querySelectorAll('.shot')].filter(s => s.offsetParent !== null);
  lb.classList.add('open');
  show(shots.indexOf(shot));
});
const closeLb = () => { lb.classList.remove('open'); lbImg.src = ''; };
document.getElementById('lbClose').addEventListener('click', closeLb);
lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
document.getElementById('lbPrev').addEventListener('click', () => show(idx - 1));
document.getElementById('lbNext').addEventListener('click', () => show(idx + 1));
document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') show(idx - 1);
  if (e.key === 'ArrowRight') show(idx + 1);
});

// Postupné odkrývání sekcí při scrollu.
// Třídu js-reveal přidáváme až odsud, takže bez JavaScriptu zůstane
// obsah normálně viditelný. Respektujeme i nastavení "omezit pohyb".
(() => {
  const klid = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (klid || !('IntersectionObserver' in window)) return;

  // Hero ani hlavičku galerie neanimujeme – jsou nad ohybem stránky
  // a neviditelný start by jen zdržel to hlavní, co má člověk vidět.
  const bloky = [...document.querySelectorAll('section .wrap')]
    .filter(el => !el.closest('.hero'));
  if (!bloky.length) return;

  document.documentElement.classList.add('js-reveal');
  bloky.forEach(el => el.classList.add('reveal'));

  const pozorovatel = new IntersectionObserver((zaznamy, self) => {
    zaznamy.forEach(z => {
      if (!z.isIntersecting) return;
      z.target.classList.add('videt');
      self.unobserve(z.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  bloky.forEach(el => pozorovatel.observe(el));
})();

// Stín hlavičky až po odscrollování – nahoře stránky působí rušivě.
(() => {
  const prepni = () => document.body.classList.toggle('scrolled', window.scrollY > 8);
  prepni();
  window.addEventListener('scroll', prepni, { passive: true });
})();

// Kdyby si někdo rozšířil okno s otevřeným menu, zůstalo by viset otevřené
// a hamburger, kterým se zavírá, by v liště už nebyl. Zavíráme ho tedy sami.
(() => {
  const liste = window.matchMedia('(min-width: 1600px)');
  const zavriVListe = (e) => { if (e.matches) toggle(false); };
  liste.addEventListener('change', zavriVListe);
  zavriVListe(liste);
})();
