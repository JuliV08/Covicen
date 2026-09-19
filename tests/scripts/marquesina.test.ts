import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';

// marquesina.ts es un script de navegador (se engancha a document al importarse), así que se prueba con un DOM de
// linkedom. Lo que hay que fijar acá es el ESTADO del freno, que es donde estuvo el bug: al hacer clic en «Reanudar»
// el foco queda en el propio botón y el puntero encima, así que los frenos implícitos (:hover y :focus-within, que
// son CSS y acá no existen) seguían frenando la cinta. La marca `data-corriendo` es la que les gana.
const marcado = `<section class="marquesina" data-marquesina style="--avisos: 2">
  <div class="marquesina-pista"><div class="marquesina-cinta"></div></div>
  <button data-pausa data-pausar="Pausar los avisos" data-reanudar="Reanudar los avisos" aria-label="Pausar los avisos"></button>
</section>`;

const montar = async (quieto = false) => {
  const { document, window } = parseHTML(`<!doctype html><html><body>${marcado}</body></html>`);
  vi.stubGlobal('document', document);
  vi.stubGlobal('window', window);
  vi.stubGlobal('matchMedia', () => ({ matches: quieto }));
  vi.resetModules();
  await import('@/scripts/marquesina');
  document.dispatchEvent(new window.Event('astro:page-load'));
  const $ = (s: string) => document.querySelector(s)!;
  const disparar = (s: string, tipo: string) => $(s).dispatchEvent(new window.Event(tipo));
  return { document, window, $, click: () => disparar('[data-pausa]', 'click'), disparar };
};

describe('marquesina (freno de la cinta de avisos)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('arranca corriendo y el botón ofrece pausar', async () => {
    const { $ } = await montar();
    expect($('[data-marquesina]').hasAttribute('data-pausado')).toBe(false);
    expect($('[data-pausa]').getAttribute('aria-label')).toBe('Pausar los avisos');
  });

  it('el botón pausa y el ícono cambia de cara', async () => {
    const { $, click } = await montar();
    click();
    expect($('[data-marquesina]').hasAttribute('data-pausado')).toBe(true);
    expect($('[data-pausa]').hasAttribute('data-pausado')).toBe(true);
    expect($('[data-pausa]').getAttribute('aria-label')).toBe('Reanudar los avisos');
  });

  // El bug que reportó Juli: una vez pausada, la cinta no se podía largar de nuevo.
  it('«Reanudar» la larga de verdad, aunque el foco y el puntero hayan quedado en el botón', async () => {
    const { $, click } = await montar();
    click();
    click();
    const cinta = $('[data-marquesina]');
    expect(cinta.hasAttribute('data-pausado')).toBe(false);
    // Sin esta marca, el CSS la seguiría frenando por :hover y :focus-within del propio botón recién clickeado.
    expect(cinta.hasAttribute('data-corriendo'), 'la cinta no queda liberada de los frenos implícitos').toBe(true);
    expect($('[data-pausa]').getAttribute('aria-label')).toBe('Pausar los avisos');
  });

  it('pausar de nuevo saca la excepción: el botón manda en los dos sentidos', async () => {
    const { $, click } = await montar();
    click(); click(); click();
    expect($('[data-marquesina]').hasAttribute('data-pausado')).toBe(true);
    expect($('[data-marquesina]').hasAttribute('data-corriendo')).toBe(false);
  });

  // La excepción dura hasta que el usuario se va: después, el puntero y el foco vuelven a frenar como corresponde.
  it('al salir con el puntero o con el foco, la excepción se suelta', async () => {
    for (const evento of ['pointerleave', 'focusout']) {
      const { $, click, disparar } = await montar();
      click(); click();
      expect($('[data-marquesina]').hasAttribute('data-corriendo')).toBe(true);
      disparar('[data-marquesina]', evento);
      expect($('[data-marquesina]').hasAttribute('data-corriendo'), evento).toBe(false);
    }
  });

  it('con "menos movimiento" no hay nada que frenar: el botón no se muestra', async () => {
    const { $ } = await montar(true);
    expect($('[data-pausa]').hasAttribute('hidden')).toBe(true);
  });

  // El CSS es la otra mitad del arreglo: sin la regla de `data-corriendo`, el script marca y nadie lo mira.
  it('el CSS le da a data-corriendo más peso que a :hover y :focus-within', async () => {
    const fuente = readFileSync('src/components/Marquesina.astro', 'utf8');
    const running = /\.marquesina\[data-corriendo\]:not\(\[data-pausado\]\) \.marquesina-cinta \{[^}]*animation-play-state:\s*running/.exec(fuente);
    expect(running, 'falta la regla que le gana a los frenos implícitos').not.toBeNull();
    // Tiene que ir DESPUÉS de las tres que frenan: a igualdad de peso gana la última.
    expect(fuente.indexOf('data-corriendo')).toBeGreaterThan(fuente.indexOf('focus-within'));
  });
});
