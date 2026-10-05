import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Breadcrumbs from '@/components/Breadcrumbs.astro';
import ContactoCta from '@/components/home/ContactoCta.astro';
import Hero from '@/components/home/Hero.astro';
import Seccion from '@/components/ui/Seccion.astro';
import Proximamente from '@/layouts/Proximamente.astro';
import Asistencia from '@/pages/asistencia.astro';
import Emergencias from '@/pages/emergencias.astro';
import MediosDePago from '@/pages/medios-de-pago.astro';
import PreguntasFrecuentes from '@/pages/preguntas-frecuentes.astro';
import Tramites from '@/pages/tramites.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

// Fase A de la tanda estética del 05/10/2026: docs/superpowers/specs/2026-10-05-fase-a-encabezados-design.md.
const render = async (C: unknown, props: Record<string, unknown> = {}) =>
  (await AstroContainer.create()).renderToString(C as never, { props });
const fuentes = (dir: string, ext: RegExp) =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) => ext.test(f)).map((f) => join(dir, f));

// «Me acaban de pedir también que saque el background grid animado que sigue al mouse» (Juli, 05/10/2026).
describe('fuera la grilla animada', () => {
  it('no quedan ni el componente, ni el script, ni su ayudante de color, ni la clase vieja', () => {
    for (const f of ['src/components/ilustraciones/GrillaCinetica.astro', 'src/scripts/grilla-cinetica.ts', 'src/scripts/lib/color.ts']) {
      expect(existsSync(f), f).toBe(false);
    }
    const rastros = fuentes('src', /\.(astro|ts|css)$/).filter((f) => /data-grilla|GrillaCinetica|grilla-cinetica|seccion-cinetica/.test(readFileSync(f, 'utf8')));
    expect(rastros).toEqual([]);
  });
  it('una sección con tono no trae canvas, y conserva el tono y las dos costuras', async () => {
    const html = await render(Seccion, { titulo: 'Prueba.', fondo: 'fondo-2' });
    expect(html).not.toContain('<canvas');
    expect(html).toMatch(/<section[^>]*class="[^"]*seccion-tono/);
    expect(html.match(/class="costura /g)?.length).toBe(2);
  });
  it('el bloque de Contacto de la home tampoco trae canvas', async () => {
    const html = await render(ContactoCta, { contacto: await fuenteLocalJson.contacto() });
    expect(html).not.toContain('<canvas');
    expect(html).toMatch(/<section[^>]*class="[^"]*seccion-tono/);
  });
});

const pagina = async (Pagina: unknown, url: string) =>
  (await AstroContainer.create()).renderToString(Pagina as never, { request: new Request(`https://covicen.test${url}`) });
const conTitulo = (tag: string) => /\bclass="[^"]*\btitulo\b/.test(tag);

describe('el degradé llega a todos los títulos', () => {
  it('todo <h1> escrito a mano lleva .titulo', () => {
    const sin = fuentes('src', /\.astro$/).flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/<h1\s[^>]*>/g)].filter((m) => !conTitulo(m[0])).map((m) => `${f}: ${m[0]}`));
    expect(sin).toEqual([]);
  });
  it('el título de Seccion lleva .titulo, como h2 y como h1', async () => {
    expect((await render(Seccion, { titulo: 'Prueba.' })).match(/<h2[^>]*>/)?.[0]).toMatch(/\btitulo\b/);
    expect((await render(Seccion, { titulo: 'Prueba.', nivel: 'h1' })).match(/<h1[^>]*>/)?.[0]).toMatch(/\btitulo\b/);
  });
  // Revisión del 05/10/2026: `.entrada > *` (movimiento.css, sin capa) le ganaba la animación al h1 del hero y el brillo
  // no se veía nunca. El h1 va envuelto, como la etiqueta: la entrada la hace el envoltorio y el barrido, el h1.
  it('el h1 del hero no es hijo directo de .entrada', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa() });
    expect(html).toMatch(/<div style="--i: 1"[^>]*><h1 class="titulo titulo-foto/);
  });
  it('el h1 del hero y el de la portada van con el brillo de foto', async () => {
    expect((await render(Hero, { empresa: await fuenteLocalJson.empresa() })).match(/<h1[^>]*>/)?.[0]).toMatch(/\btitulo titulo-foto\b/);
    expect((await render(Proximamente)).match(/<h1[^>]*>/)?.[0]).toMatch(/\btitulo titulo-foto\b/);
  });
  it('los h2 sueltos de contenido también', async () => {
    expect(await pagina(Emergencias, '/emergencias/')).toMatch(/<h2 class="[^"]*\btitulo\b[^"]*"[^>]*>Canales de atención<\/h2>/);
    const faq = await pagina(PreguntasFrecuentes, '/preguntas-frecuentes/');
    const temas = [...faq.matchAll(/<section id="tema-[^"]*"[^>]*><h2[^>]*>/g)].map((m) => m[0]);
    expect(temas.length).toBeGreaterThan(0);
    for (const t of temas) expect(t).toMatch(/\btitulo\b/);
    const asistencia = await pagina(Asistencia, '/asistencia/');
    for (const t of ['Compartí tu ubicación', 'Contanos qué pasó']) expect(asistencia).toMatch(new RegExp(`<h2 class="[^"]*\\btitulo\\b[^"]*"[^>]*>${t}</h2>`));
  });
  // Novedades no sirve acá: en el contenedor de tests la colección de Astro viene vacía y la página no trae tarjetas.
  it('los títulos de tarjeta no llevan degradé', async () => {
    expect((await pagina(MediosDePago, '/medios-de-pago/')).match(/<h2 class="text-xl">/g)?.length).toBeGreaterThan(0);
    expect((await pagina(Tramites, '/tramites/')).match(/<h2 class="text-2xl">/g)?.length).toBeGreaterThan(0);
  });
});

describe('encabezados centrados', () => {
  const encabezado = (html: string) => /<header[^>]*>[\s\S]*?<\/header>/.exec(html)?.[0] ?? '';
  it('por defecto: columna centrada, etiqueta con una línea a cada lado, título y bajada al medio', async () => {
    const h = encabezado(await render(Seccion, { eyebrow: 'El tramo', titulo: 'Prueba.', intro: 'Bajada.' }));
    expect(h.match(/<header[^>]*>/)?.[0]).toMatch(/\bmx-auto\b.*\btext-center\b|\btext-center\b.*\bmx-auto\b/);
    expect(h.match(/<p class="eyebrow[^"]*"/)?.[0]).toContain('justify-center');
    expect(h.match(/class="inline-block h-px w-6 bg-acento"/g)?.length).toBe(2);
    expect(h.match(/<h2[^>]*>/)?.[0]).toMatch(/\bmx-auto\b/);
    expect(h.match(/<p class="[^"]*\bmax-w-2xl\b[^"]*">Bajada\.<\/p>/)?.[0]).toMatch(/\bmx-auto\b/);
  });
  it('alinear="izquierda" deja el encabezado como antes', async () => {
    const h = encabezado(await render(Seccion, { eyebrow: 'X', titulo: 'Prueba.', intro: 'Bajada.', alinear: 'izquierda' }));
    expect(h).not.toContain('text-center');
    expect(h.match(/class="inline-block h-px w-6 bg-acento"/g)?.length).toBe(1);
  });
  it('las migas de pan van centradas', async () => {
    const html = await render(Breadcrumbs, { migas: [{ nombre: 'Tarifas', href: '/tarifas' }] });
    expect(html.match(/<ol[^>]*>/)?.[0]).toContain('justify-center');
  });
});

// Lo que quedaba suelto a la izquierda al final de una sección pasa al centro (fase A). Es una lista cerrada, sacada
// recorriendo los 46 usos de Seccion y los encabezados armados a mano el 05/10/2026.
const CENTRADOS: Array<[string, RegExp]> = [
  // Desde la fase C el botón va en la columna del mapa: centrado en una columna, a la izquierda desde 1280.
  ['src/components/home/ElTramo.astro', /<div slot="abajo" class="flex justify-center xl:justify-start"><Boton href="\/el-tramo"/],
  ['src/pages/el-tramo.astro', /<div class="revelar mt-8 flex justify-center"><Boton href="\/tarifas">/],
  ['src/pages/emergencias.astro', /<div class="revelar mt-6 flex justify-center"><Boton href="\/asistencia"/],
  ['src/pages/emergencias.astro', /<h2 class="titulo mx-auto mb-4 text-center text-2xl">Canales de atención<\/h2>/],
  ['src/pages/emergencias.astro', /<div class="revelar mt-12 flex justify-center"><Boton href="\/seguridad-vial"/],
  ['src/pages/tarifas.astro', /<div class="revelar flex justify-center"><Boton href="\/tramites"/],
  // Las salidas del pie de Tarifas son tarjetas-enlace con ícono desde el 05/10/2026 (eran tres botones sueltos).
  ['src/pages/tarifas.astro', /<nav aria-label="Más sobre peajes" class="contenedor pb-8">\s*<ul class="escalonar grid gap-4 sm:grid-cols-3">/],
  // El cuerpo de Quiénes somos y sus números, centrados bajo el encabezado (05/10/2026: «sigue flotando a la izquierda»).
  ['src/pages/quienes-somos.astro', /<div class="revelar prose-covicen mx-auto max-w-prose text-center text-lg text-texto-2">/],
  ['src/pages/quienes-somos.astro', /<div class="escalonar mx-auto mt-12 grid max-w-3xl gap-10 sm:grid-cols-2">/],
  ['src/pages/medios-de-pago.astro', /<div class="revelar flex flex-wrap items-center justify-center gap-4">\s*<Boton href=\{oficina\}/],
  ['src/pages/seguridad-vial.astro', /<div class="revelar mt-8 flex flex-wrap justify-center gap-3"><Boton href="tel:140"/],
  ['src/pages/tramites.astro', /<div class="revelar mt-16 flex flex-col items-center gap-4 text-center">/],
  ['src/pages/tramites.astro', /<h2 class="titulo mx-auto text-2xl">¿Tenés una consulta sobre un trámite\?<\/h2>/],
  ['src/pages/novedades/[slug].astro', /<header class="revelar mx-auto max-w-3xl text-center">/],
  ['src/pages/novedades/[slug].astro', /<h1 class="titulo mx-auto mt-4">/],
  ['src/pages/novedades/[slug].astro', /<div class="prose-covicen revelar mx-auto mt-12 max-w-prose text-lg text-texto-2">/],
  ['src/pages/novedades/[slug].astro', /<div class="revelar mt-12 flex justify-center"><Boton href="\/novedades"/],
  ['src/pages/404.astro', /<section class="contenedor py-24 text-center">/],
  ['src/pages/404.astro', /<h1 class="titulo mx-auto mt-3">/],
  ['src/pages/404.astro', /<p class="mx-auto mt-4 max-w-prose text-texto-2">/],
  ['src/pages/preguntas-frecuentes.astro', /<h2 class="titulo revelar mx-auto mb-4 text-center text-2xl">/],
  ['src/pages/transparencia/[...resto].astro', /<h2 class="titulo revelar mx-auto mb-6 text-center text-2xl">Normativa aplicable<\/h2>/],
  // Los que encontró la revisión del 05/10/2026: el enlace final de El tramo y las filas de anclas debajo de un
  // encabezado centrado.
  ['src/pages/el-tramo.astro', /<p class="revelar text-center"><a href=\{ruta\('\/servicios'\)\}/],
  ['src/pages/preguntas-frecuentes.astro', /<nav aria-label="Temas" class="revelar mb-10 flex flex-wrap justify-center gap-2">/],
  ['src/pages/tarifas.astro', /<nav aria-label="Estaciones" class="revelar mb-8 flex flex-wrap justify-center gap-2">/],
];

describe('lo suelto, al centro', () => {
  it.each(CENTRADOS)('%s: %s', (archivo, patron) => {
    expect(readFileSync(archivo, 'utf8')).toMatch(patron);
  });
  it('el bloque de Contacto de la home es una columna centrada', async () => {
    const html = await render(ContactoCta, { contacto: await fuenteLocalJson.contacto() });
    expect(html).toMatch(/class="contenedor revelar relative z-10 flex flex-col items-center gap-6 text-center"/);
    expect(html.match(/class="inline-block h-px w-6 bg-acento"/g)?.length).toBe(2);
    expect(html).toMatch(/<div class="flex flex-wrap justify-center gap-3">/);
    expect(html.match(/<h2[^>]*>/)?.[0]).toMatch(/\btitulo mx-auto\b/);
  });
});
