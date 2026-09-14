// Carrusel del hero: pasa cada 8 s, se frena con el puntero, el foco y "menos movimiento"; flechas y puntos siempre.
const INTERVALO = 8000;
const montar = (raiz: HTMLElement) => {
  const slides = [...raiz.querySelectorAll<HTMLElement>('[data-slide]')];
  const puntos = [...raiz.querySelectorAll<HTMLButtonElement>('[data-slide-ir]')];
  if (slides.length < 2) return;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let actual = 0;
  let timer = 0;
  const mostrar = (n: number) => {
    slides[actual]!.hidden = true;
    actual = (n + slides.length) % slides.length;
    slides[actual]!.hidden = false;
    puntos.forEach((p, i) => { p.classList.toggle('is-activo', i === actual); if (i === actual) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current'); });
  };
  const parar = () => window.clearInterval(timer);
  const arrancar = () => { parar(); if (!quieto) timer = window.setInterval(() => mostrar(actual + 1), INTERVALO); };
  raiz.querySelector('[data-slide-anterior]')?.addEventListener('click', () => { mostrar(actual - 1); arrancar(); });
  raiz.querySelector('[data-slide-siguiente]')?.addEventListener('click', () => { mostrar(actual + 1); arrancar(); });
  puntos.forEach((p, i) => p.addEventListener('click', () => { mostrar(i); arrancar(); }));
  raiz.addEventListener('pointerenter', parar);
  raiz.addEventListener('pointerleave', arrancar);
  raiz.addEventListener('focusin', parar);
  raiz.addEventListener('focusout', arrancar);
  document.addEventListener('astro:before-swap', parar, { once: true });
  arrancar();
};
const iniciar = () => document.querySelectorAll<HTMLElement>('[data-carrusel]:not([data-montado])').forEach((r) => { r.dataset.montado = ''; montar(r); });
document.addEventListener('astro:page-load', iniciar);

export {};
