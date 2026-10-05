import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
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
