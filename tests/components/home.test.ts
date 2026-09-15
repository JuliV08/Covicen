import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Hero from '@/components/home/Hero.astro';
import TarifaDestacada from '@/components/home/TarifaDestacada.astro';
import Faq from '@/components/Faq.astro';
import CuentaRegresiva from '@/components/CuentaRegresiva.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async (C: unknown, props: Record<string, unknown>) => (await AstroContainer.create()).renderToString(C as never, { props });
const destacadas = ['a', 'b', 'c', 'd'].map((s, i) => ({ slug: s, titulo: `Nota ${s}`, fecha: `2026-09-0${i + 1}`, resumen: 'r', etiquetas: [], destacada: true }));

describe('Hero', () => {
  it('sin destacadas: un h1, la fecha de inicio, CTAs y sin carrusel', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa(), novedades: [] });
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain('5 de octubre de 2026');
    expect(html).toContain('href="/tarifas/"');
    expect(html).not.toContain('data-carrusel');
  });
  it('con destacadas: carrusel con el slide fijo primero, las destacadas después (máximo 3), controles y puntos', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa(), novedades: destacadas });
    expect(html).toContain('data-carrusel');
    expect(html.match(/data-slide="/g)?.length).toBe(4);
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain('aria-roledescription="carrusel"');
    expect(html).toContain('data-siguiente');
    expect(html.match(/data-slide-ir="/g)?.length).toBe(4);
    expect(html).toContain('href="/novedades/a/"');
  });
  // El h1 no puede vivir dentro de una diapositiva: carrusel.ts las esconde con `hidden` y el home se quedaría sin h1
  // en el árbol de accesibilidad a los 8 segundos. Va en la portada fija, antes de la primera [data-slide].
  it('el h1 queda fuera de las diapositivas, en la portada fija, con y sin carrusel', async () => {
    for (const novedades of [[], destacadas]) {
      const html = await render(Hero, { empresa: await fuenteLocalJson.empresa(), novedades });
      expect(html).toContain('data-portada');
      expect(html.match(/<h1/g)?.length).toBe(1);
      expect(html.indexOf('<h1')).toBeGreaterThan(-1);
      expect(html.indexOf('<h1')).toBeLessThan(html.indexOf('data-slide="'));
    }
  });
  // WCAG 2.2.2 (pausar, detener, ocultar) + spec §10.3: la pista anuncia el cambio y hay botón de pausa.
  it('con destacadas: pista con aria-live y botón de pausa con etiquetas para los dos estados', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa(), novedades: destacadas });
    expect(html).toMatch(/data-pista[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
    expect(html).toContain('data-pausa');
    expect(html).toContain('aria-label="Pausar el carrusel"');
    expect(html).toContain('data-reanudar="Reanudar el carrusel"');
  });
  it('sin destacadas no hay controles ni botón de pausa', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa(), novedades: [] });
    expect(html).not.toContain('data-pausa');
    expect(html).not.toContain('data-siguiente');
  });
});

describe('TarifaDestacada', () => {
  it('muestra la categoría destacada al público, la vigencia y la resolución', async () => {
    // Intl separa "$" del número con un espacio no separable (U+00A0 o U+202F): se normaliza con escapes, no con literales.
    const html = (await render(TarifaDestacada, { tarifario: await fuenteLocalJson.tarifario() })).replace(/[  ]/g, ' ');
    expect(html).toContain('$ 1.500');
    expect(html).toContain('Autos');
    expect(html).toContain('$ 1.239,67');
    expect(html).toContain('26 de febrero de 2026');
    expect(html).toContain('Cuadro vigente');
    expect(html).toContain('248/2026');
    expect(html).not.toContain('Tarifa ofertada');
  });
});

describe('Faq', () => {
  it('usa details/summary nativos', async () => {
    const html = await render(Faq, { preguntas: (await fuenteLocalJson.faq()).slice(0, 2) });
    expect(html.match(/<details/g)?.length).toBe(2);
    expect(html).toContain('<summary');
  });
});

describe('CuentaRegresiva', () => {
  it('renderiza texto estático con la fecha y los data-attributes para el script', async () => {
    const html = await render(CuentaRegresiva, { fecha: '2026-10-05' });
    expect(html).toContain('data-cuenta-regresiva');
    expect(html).toContain('data-fecha="2026-10-05"');
    expect(html).toContain('5 de octubre de 2026');
  });
});
