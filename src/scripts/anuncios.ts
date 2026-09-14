// Rotación de la barra de anuncios: cada 6 s pasa al siguiente (con fundido, vía CSS al des-ocultar). Se frena con el
// puntero encima, con el foco adentro y con "menos movimiento"; los botones anterior/siguiente funcionan siempre.
const INTERVALO = 6000;

const montar = (raiz: HTMLElement) => {
  const items = [...raiz.querySelectorAll<HTMLElement>('[data-anuncio]')];
  if (items.length < 2) return;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let actual = Math.max(0, items.findIndex((el) => !el.hidden));
  let timer = 0;
  const mostrar = (n: number) => {
    items[actual]!.hidden = true;
    actual = (n + items.length) % items.length;
    items[actual]!.hidden = false;
  };
  const parar = () => window.clearInterval(timer);
  const arrancar = () => { parar(); if (!quieto) timer = window.setInterval(() => mostrar(actual + 1), INTERVALO); };
  raiz.querySelector('[data-anuncio-anterior]')?.addEventListener('click', () => { mostrar(actual - 1); arrancar(); });
  raiz.querySelector('[data-anuncio-siguiente]')?.addEventListener('click', () => { mostrar(actual + 1); arrancar(); });
  raiz.addEventListener('pointerenter', parar);
  raiz.addEventListener('pointerleave', arrancar);
  raiz.addEventListener('focusin', parar);
  raiz.addEventListener('focusout', arrancar);
  document.addEventListener('astro:before-swap', parar, { once: true });
  arrancar();
};

const iniciar = () => document.querySelectorAll<HTMLElement>('[data-anuncios]:not([data-montado])').forEach((r) => { r.dataset.montado = ''; montar(r); });
document.addEventListener('astro:page-load', iniciar);

export {};
