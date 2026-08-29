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
      lbCount = document.getElementById('lbCount');
let shots = [], idx = 0;
const show = i => {
  idx = (i + shots.length) % shots.length;
  const shot = shots[idx];
  lbImg.src = shot.dataset.full;
  lbImg.alt = shot.querySelector('img')?.alt || '';
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
