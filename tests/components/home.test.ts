import { readFileSync } from 'node:fs';
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
  // El h1 no puede vivir dentro de una diapositiva: rotacion.ts las esconde con `hidden` y el home se quedaría sin h1
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
  // El párrafo del hero cae sobre la foto a pantalla completa: en texto-2 (gris) daba 3,1:1 sobre el asfalto de la foto
  // de día en tema claro. Va en color pleno, y quien mide que eso alcance es tests/styles/hero-foto.test.ts, que asume
  // justamente --color-texto: si acá vuelve a texto-2, aquella guarda mediría el color equivocado y no se enteraría.
  it('el párrafo del hero va en color pleno, no en texto-2', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa(), novedades: [] });
    const parrafo = html.match(/<p class="mt-6 max-w-2xl[^"]*"/)?.[0] ?? '';
    expect(parrafo, 'no encontré el párrafo del hero').toContain('text-texto');
    expect(parrafo).not.toContain('text-texto-2');
  });
  // Con una foto por tema, conmutar es un corte seco (el CSS las alterna con `display`) y el canvas del parallax se
  // remonta: el velo de la disolvencia lo tapa. scripts/tema.ts lo levanta antes de cambiar el tema y lo baja después.
  it('con las dos fotos, el hero trae el velo de la disolvencia de tema', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa(), novedades: [] });
    expect(html).toContain('data-velo-tema');
    expect(html).toContain('class="velo-tema"');
    expect(html).toMatch(/data-velo-tema[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-velo-tema/);
    // El velo tapa el hero entero, texto incluido: tiene que quedar fuera del árbol de accesibilidad y sin capturar el puntero.
    expect(readFileSync('src/styles/global.css', 'utf8')).toMatch(/\.velo-tema\s*\{[^}]*pointer-events:\s*none/);
  });
  // Regresión medida en producción (15/09/2026): la foto del tema opuesto nace dentro de un `display: none` y, con
  // carga diferida, el navegador no la baja NUNCA, ni siquiera cuando después se la muestra (quedaba en
  // naturalWidth 0). Donde no corre el canvas del parallax —celular, ventana angosta, menos movimiento— el hero se
  // quedaba sin foto al cambiar de tema. Las dos van `eager`; la que no se ve arranca con prioridad baja.
  it('ninguna de las dos fotos del hero va con carga diferida', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa(), novedades: [] });
    const fotos = (html.match(/<img[^>]*>/g) ?? []).filter((i) => i.includes('parallax-2d-img'));
    expect(fotos.length, 'esperaba las dos fotos del hero').toBe(2);
    fotos.forEach((img) => expect(img, 'una foto del hero quedó diferida').not.toContain('loading="lazy"'));
    expect(fotos.filter((i) => i.includes('fetchpriority="high"')).length, 'solo la visible lleva prioridad alta').toBe(1);
    expect(fotos.filter((i) => i.includes('fetchpriority="low"')).length, 'la oculta va en prioridad baja').toBe(1);
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
  // `zona-noche` era el parche de cuando la única foto era la nocturna: en tema claro se mostraba esa misma foto, así
  // que la sección entera volvía al tema oscuro para no perder el 4,5:1 del pliego 61.7. Con la foto de día cargada
  // cada tema usa la suya y el parche sobra; el contraste de las dos lo mide tests/styles/hero-foto.test.ts.
  // (El panel del Consorcio sí la sigue llevando: esa foto no tiene versión de día.)
  it('con una foto por tema, el hero sigue el tema y ya no es zona noche', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa(), novedades: [] });
    expect(html).not.toMatch(/<section[^>]*class="[^"]*zona-noche/);
    // Una foto por tema: global.css muestra la que corresponde con `display` según html[data-tema].
    expect(html.match(/parallax[^"]*solo-oscuro/g)?.length, 'falta la foto nocturna').toBe(1);
    expect(html.match(/parallax[^"]*solo-claro/g)?.length, 'falta la foto de día').toBe(1);
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
  // `montoSinIva` es nullable en el contrato y significa "sin valor publicado": va el criterio de la casa (esconder,
  // no a confirmar), no un throw que se lleve puesto el build entero del home.
  it('sin valor publicado: no renderiza la sección en vez de romper el build', async () => {
    const base = await fuenteLocalJson.tarifario();
    const sinPrecio = { ...base, tarifas: [{ ...base.tarifas[0]!, montoSinIva: null, montoConIva: null }, ...base.tarifas.slice(1)] };
    const html = await render(TarifaDestacada, { tarifario: sinPrecio });
    expect(html).not.toContain('id="tarifa"');
    expect(html).not.toContain('Cuadro vigente');
    expect(html).not.toContain('Tarifario completo por categoría');
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
