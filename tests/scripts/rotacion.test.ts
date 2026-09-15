import { parseHTML } from 'linkedom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// rotacion.ts es un script de navegador (se engancha a document al importarse), así que se prueba con un DOM de
// linkedom y relojes falsos. Es la única forma de verificar el pausado sin abrir un navegador.
const marcado = `<section data-carrusel>
  <div data-pista aria-live="polite" aria-atomic="true">
    <div data-portada></div>
    <div data-slide="inicio"></div>
    <div data-slide="a" hidden></div>
    <div data-slide="b" hidden></div>
  </div>
  <button data-pausa data-pausar="Pausar el carrusel" data-reanudar="Reanudar el carrusel" aria-label="Pausar el carrusel"></button>
  <button data-anterior></button>
  <button data-siguiente></button>
  <button data-slide-ir="inicio" class="punto is-activo"></button>
  <button data-slide-ir="a" class="punto"></button>
  <button data-slide-ir="b" class="punto"></button>
</section>`;

const montar = async (quieto = false) => {
  // El window de linkedom es un proxy sobre globalThis: setInterval/clearInterval ya son los relojes falsos de vitest.
  const { document, window } = parseHTML(`<!doctype html><html><body>${marcado}</body></html>`);
  vi.stubGlobal('document', document);
  vi.stubGlobal('window', window);
  vi.stubGlobal('matchMedia', () => ({ matches: quieto }));
  vi.resetModules();
  await import('@/scripts/rotacion');
  document.dispatchEvent(new window.Event('astro:page-load'));
  const $ = (s: string) => document.querySelector(s)!;
  const visible = () => [...document.querySelectorAll<HTMLElement>('[data-slide]')].findIndex((el) => !el.hidden);
  const disparar = (s: string, tipo: string) => $(s).dispatchEvent(new window.Event(tipo));
  const click = (s: string) => disparar(s, 'click');
  return { document, $, visible, click, disparar };
};

describe('rotacion (carrusel y anuncios)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('pasa sola cada 8 s, mueve el punto activo y saca la portada de la pantalla (no del árbol)', async () => {
    const { $, visible } = await montar();
    expect(visible()).toBe(0);
    expect($('[data-portada]').hasAttribute('data-fuera')).toBe(false);
    vi.advanceTimersByTime(8000);
    expect(visible()).toBe(1);
    // La portada (volanta + h1) sigue en el DOM: se recorta por CSS, nunca con `hidden`.
    expect($('[data-portada]').hasAttribute('data-fuera')).toBe(true);
    expect($('[data-portada]').hasAttribute('hidden')).toBe(false);
    expect($('[data-slide-ir="a"]').classList.contains('is-activo')).toBe(true);
    expect($('[data-slide-ir="a"]').getAttribute('aria-current')).toBe('true');
    vi.advanceTimersByTime(16000);
    expect(visible()).toBe(0);
    expect($('[data-portada]').hasAttribute('data-fuera')).toBe(false);
  });

  it('el botón de pausa frena de verdad y la elección aguanta (WCAG 2.2.2)', async () => {
    const { $, visible, click, disparar } = await montar();
    click('[data-pausa]');
    expect($('[data-pausa]').getAttribute('aria-label')).toBe('Reanudar el carrusel');
    expect($('[data-pausa]').hasAttribute('data-pausado')).toBe(true);
    // 20 s no son vuelta entera (2,5 tics de 8 s): si algo siguiera girando, no caería justo en la primera.
    vi.advanceTimersByTime(20000);
    expect(visible()).toBe(0);
    // Ni el puntero ni el foco lo reanudan mientras esté pausado.
    disparar('[data-carrusel]', 'pointerleave');
    vi.advanceTimersByTime(20000);
    expect(visible()).toBe(0);
    click('[data-pausa]');
    expect($('[data-pausa]').getAttribute('aria-label')).toBe('Pausar el carrusel');
    vi.advanceTimersByTime(8000);
    expect(visible()).toBe(1);
  });

  it('con "menos movimiento" arranca pausado, pero el botón sirve para largarlo', async () => {
    const { $, visible, click } = await montar(true);
    expect($('[data-pausa]').getAttribute('aria-label')).toBe('Reanudar el carrusel');
    vi.advanceTimersByTime(20000);
    expect(visible()).toBe(0);
    click('[data-pausa]');
    vi.advanceTimersByTime(8000);
    expect(visible()).toBe(1);
  });

  it('la pista anuncia el cambio a mano ("polite") y calla el automático ("off")', async () => {
    const { $, visible, click } = await montar();
    vi.advanceTimersByTime(8000);
    expect($('[data-pista]').getAttribute('aria-live')).toBe('off');
    click('[data-siguiente]');
    expect(visible()).toBe(2);
    expect($('[data-pista]').getAttribute('aria-live')).toBe('polite');
    click('[data-anterior]');
    expect(visible()).toBe(1);
    click('[data-slide-ir="inicio"]');
    expect(visible()).toBe(0);
  });
});
