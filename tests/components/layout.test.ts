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
    expect(html).toContain('<title>Covicen — Corredor Vial del Centro</title>');
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
  it('emergencias: sin número muestra el slot a confirmar en toda página', async () => {
    const html = await render('/politicas/', { titulo: 'Políticas', descripcion: 'x' });
    expect(html).toContain('data-emergencias="a-confirmar"');
  });
});

describe('Header', () => {
  it('marca la página actual y expone el CTA de emergencias con tel: cuando hay número', async () => {
    const c = await AstroContainer.create();
    const contacto = { ...(await fuenteLocalJson.contacto()), emergencias: { telefono: '0800 555 0000', etiqueta: 'Emergencias' } };
    const html = await c.renderToString(Header, { props: { contacto, rutaActual: '/tarifas/' } });
    expect(html).toContain('href="tel:08005550000"');
    expect(html).toMatch(/href="\/tarifas\/"[^>]*aria-current="page"/);
    expect(html).toContain('popovertarget="menu-mobile"');
  });
});
