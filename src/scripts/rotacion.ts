// Los dos rotadores del sitio, juntos porque comparten la mecánica: el carrusel del hero (8 s) y la barra de anuncios
// (6 s). Se ve un item por vez (el resto con `hidden`) y la rotación se frena con el puntero encima, el foco adentro y
// el botón de pausa, que manda (WCAG 2.2.2): mientras esté pausado no vuelve a arrancar ni al sacar el puntero, y la
// elección dura lo que dure la página. "Menos movimiento" arranca ya pausado: el botón dice "Reanudar" y funciona.
// El aria-live de la pista sigue el patrón de carrusel del APG: "off" antes de cada vuelta automática (con "polite"
// fijo el lector cantaría el hero entero cada 8 s) y "polite" antes de cada cambio a mano, que es el que sí anuncia.
// Ganchos en la raíz: [data-pista], [data-anterior], [data-siguiente] y [data-pausa] con data-pausar/data-reanudar.
const rotar = (raiz: HTMLElement, selector: string, ms: number, alCambiar?: (i: number) => void) => {
  const items = [...raiz.querySelectorAll<HTMLElement>(selector)];
  if (items.length < 2) return;
  const pista = raiz.querySelector('[data-pista]');
  const pausa = raiz.querySelector<HTMLButtonElement>('[data-pausa]');
  let actual = Math.max(0, items.findIndex((el) => !el.hidden));
  let pausado = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let timer = 0;
  const mostrar = (n: number) => {
    items[actual]!.hidden = true;
    actual = (n + items.length) % items.length;
    items[actual]!.hidden = false;
    alCambiar?.(actual);
  };
  const parar = () => window.clearInterval(timer);
  const arrancar = () => {
    parar();
    if (!pausado) timer = window.setInterval(() => { pista?.setAttribute('aria-live', 'off'); mostrar(actual + 1); }, ms);
  };
  const ir = (n: number) => { pista?.setAttribute('aria-live', 'polite'); mostrar(n); arrancar(); };
  raiz.querySelector('[data-anterior]')?.addEventListener('click', () => ir(actual - 1));
  raiz.querySelector('[data-siguiente]')?.addEventListener('click', () => ir(actual + 1));
  const rotular = () => { pausa?.toggleAttribute('data-pausado', pausado); pausa?.setAttribute('aria-label', pausa.dataset[pausado ? 'reanudar' : 'pausar'] ?? ''); };
  pausa?.addEventListener('click', () => { pausado = !pausado; rotular(); arrancar(); });
  raiz.addEventListener('pointerenter', parar);
  raiz.addEventListener('pointerleave', arrancar);
  raiz.addEventListener('focusin', parar);
  raiz.addEventListener('focusout', arrancar);
  document.addEventListener('astro:before-swap', parar, { once: true });
  rotular();
  arrancar();
  return ir;
};

// Carrusel del hero: suma los puntos y la portada. La portada (volanta + h1) vive FUERA de las diapositivas: adentro,
// el carrusel escondería el h1 con `hidden` y el home se quedaría sin h1 en el árbol de accesibilidad 16 de cada 24
// segundos. Con una destacada a la vista se la saca de la pantalla, no del árbol ([data-fuera], recortada en el Hero).
const carrusel = (raiz: HTMLElement) => {
  const puntos = [...raiz.querySelectorAll<HTMLButtonElement>('[data-slide-ir]')];
  const portada = raiz.querySelector('[data-portada]');
  const ir = rotar(raiz, '[data-slide]', 8000, (i) => {
    portada?.toggleAttribute('data-fuera', i > 0);
    puntos.forEach((p, n) => { p.classList.toggle('is-activo', n === i); if (n === i) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current'); });
  });
  if (ir) puntos.forEach((p, i) => p.addEventListener('click', () => ir(i)));
};

const montar = (sel: string, fn: (r: HTMLElement) => void) => document.querySelectorAll<HTMLElement>(`${sel}:not([data-montado])`).forEach((r) => { r.dataset.montado = ''; fn(r); });
const iniciar = () => { montar('[data-carrusel]', carrusel); montar('[data-anuncios]', (r) => { rotar(r, '[data-anuncio]', 6000); }); };
document.addEventListener('astro:page-load', iniciar);

export {};
