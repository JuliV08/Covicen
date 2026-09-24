import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Peaje, { getStaticPaths } from '@/pages/peajes/[slug].astro';

describe('/peajes/[slug]/', () => {
  it('genera una página por estación con h1, Place en JSON-LD y el 140', async () => {
    const rutas = await getStaticPaths();
    expect(rutas.map((r) => r.params.slug).sort()).toEqual(['carcarana', 'franck', 'james-craik', 'leones', 'san-francisco', 'totoras']);
    const c = await AstroContainer.create();
    const html = await c.renderToString(Peaje, { request: new Request('https://covicen.test/peajes/carcarana/'), params: { slug: 'carcarana' }, props: rutas.find((r) => r.params.slug === 'carcarana')!.props });
    expect(html).toContain('<title>Peaje Carcarañá — RN 9 km 340 | Covicen</title>');
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain('"@type":"Place"');
    expect(html).toContain('href="tel:140"');
    // spec §11: el botón Imprimir también en la página de la estación (ahí hay un cuadro que imprimir)
    expect(html).toContain('data-imprimir');
  });
  // 24/09/2026: debajo de las tablas de tarifas ya no va nada, y con eso se había ido el único enlace de la estación a
  // la resolución. Vuelve arriba de la tabla, en la línea de vigencia; en /tarifas/ no, que ya lo tiene en el encabezado.
  it('la página de una estación operativa enlaza la resolución en el Boletín Oficial, arriba de la tabla', async () => {
    const rutas = await getStaticPaths();
    const c = await AstroContainer.create();
    const html = await c.renderToString(Peaje, { request: new Request('https://covicen.test/peajes/franck/'), params: { slug: 'franck' }, props: rutas.find((r) => r.params.slug === 'franck')!.props });
    const enlace = html.indexOf('>Ver en el Boletín Oficial</a>');
    expect(enlace, 'la estación se quedó sin enlace a la resolución').toBeGreaterThan(-1);
    expect(html.slice(Math.max(0, enlace - 300), enlace)).toMatch(/href="https:\/\/www\.boletinoficial\.gob\.ar\/[^"]*"/);
    expect(enlace, 'el enlace quedó debajo de la tabla').toBeLessThan(html.indexOf('<table'));
    expect(html).not.toContain('Publicado el');
  });
  it('una estación próxima explica que todavía no cobra', async () => {
    const rutas = await getStaticPaths();
    const c = await AstroContainer.create();
    const html = await c.renderToString(Peaje, { request: new Request('https://covicen.test/peajes/totoras/'), params: { slug: 'totoras' }, props: rutas.find((r) => r.params.slug === 'totoras')!.props });
    expect(html).toContain('todavía no cobra');
    expect(html).not.toContain('Ficha completa');
    expect(html).not.toContain('data-imprimir');
  });
});
