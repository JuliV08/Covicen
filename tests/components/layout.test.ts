import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Base from '@/layouts/Base.astro';
import Header from '@/components/Header.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async (path: string, props: Record<string, unknown>) => {
  const c = await AstroContainer.create();
  return c.renderToString(Base, { request: new Request(`https://covicen.test${path}`), props, slots: { default: '<p>contenido</p>' } });
};

describe('Base', () => {
  it('título con patrón, canonical absoluta, noindex en demo, lang es-AR', async () => {
    const html = await render('/tarifas/', { titulo: 'Tarifas', descripcion: 'Cuánto cuesta el peaje.' });
    expect(html).toContain('<html lang="es-AR"');
    expect(html).toContain('<title>Tarifas | Covicen</title>');
    expect(html).toContain('<link rel="canonical" href="https://covicen.test/tarifas/"');
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).toContain('property="og:image" content="https://covicen.test/og.png"');
  });
  it('Home usa el título de marca', async () => {
    const html = await render('/', { titulo: 'Inicio', descripcion: 'x' });
    expect(html).toContain('<title>Covicen — Tramo Centro</title>');
  });
  it('incluye Organization y WebSite en JSON-LD y el skip link', async () => {
    const html = await render('/obras/', { titulo: 'Obras', descripcion: 'x' });
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain('href="#contenido"');
    expect(html).toContain('<main id="contenido"');
  });
  it('migas: renderiza nav y BreadcrumbList con Inicio primero', async () => {
    const html = await render('/obras/', { titulo: 'Obras', descripcion: 'x', migas: [{ nombre: 'Obras', href: '/obras' }] });
    expect(html).toContain('aria-label="Migas de pan"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('"name":"Inicio"');
    expect(html).toContain('aria-current="page"');
  });
  it('el 140 está en toda página, con tel:', async () => {
    const html = await render('/politicas/', { titulo: 'Políticas', descripcion: 'x' });
    expect(html).toContain('href="tel:140"');
    expect(html).toContain('aria-label="Llamar a emergencias, 140"');
    expect(html).not.toContain('data-emergencias="a-confirmar"');
  });
  it('impresión: el body lleva el sitio y la fecha del encabezado de la hoja (pliego 61.7)', async () => {
    const html = await render('/tarifas/', { titulo: 'Tarifas', descripcion: 'x' });
    expect(html).toMatch(/<body[^>]*data-sitio="covicen\.test"/);
    expect(html).toMatch(/<body[^>]*data-fecha="\d{1,2}\/\d{1,2}\/\d{4}"/);
  });
  it('el destino del skip link tiene foco visible: sin outline-none y con su regla de foco', async () => {
    const html = await render('/tarifas/', { titulo: 'Tarifas', descripcion: 'x' });
    expect(html).not.toMatch(/<main[^>]*outline-none/);
    expect(readFileSync('src/layouts/Base.astro', 'utf8')).toMatch(/#contenido:focus-visible[^{]*\{[^}]*outline:\s*2px solid var\(--color-acento\)/);
  });
});

describe('Header', () => {
  const props = async () => ({ contacto: await fuenteLocalJson.contacto(), rutaActual: '/tarifas/' });
  it('marca la página actual, tiene el 140 grande con tel: y el menú mobile', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Header, { props: await props() });
    expect(html).toContain('href="tel:140"');
    expect(html).toMatch(/href="\/tarifas\/"[^>]*aria-current="page"/);
    expect(html).toContain('popovertarget="menu-mobile"');
  });
  it('el desplegable Nosotros no sale con aria-expanded fijo: sin JS mentiría', async () => {
    // El <summary> nativo ya expone si el <details> está abierto. Un aria-expanded="false" en el marcado lo pisa y,
    // sin JS que lo sincronice, el lector anuncia "contraído" sobre un menú abierto: peor que no poner nada.
    const c = await AstroContainer.create();
    const html = await c.renderToString(Header, { props: await props() });
    expect(html).toMatch(/<summary[^>]*>/);
    expect(html).not.toMatch(/<summary[^>]*aria-expanded/);
    // con JS sí lo pone y lo mantiene al día con el estado del <details>
    expect(readFileSync('src/components/Header.astro', 'utf8')).toMatch(/setAttribute\('aria-expanded', String\(d\.open\)\)/);
  });
  it('lleva la barra superior con los accesos y, en el menú mobile, TelePASE y Mi cuenta', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Header, { props: await props() });
    // Los avisos se fueron del header a la cinta (components/Marquesina.astro) el 15/09/2026.
    expect(html).not.toContain('data-anuncios');
    expect(html.match(/>TelePASE</g)?.length).toBe(2);
    expect(html.match(/>Mi cuenta</g)?.length).toBe(2);
    expect(html).not.toContain('Corredor Vial del Centro');
  });
});
