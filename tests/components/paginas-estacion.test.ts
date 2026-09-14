import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Peaje, { getStaticPaths } from '@/pages/peajes/[slug].astro';

describe('/peajes/[slug]/', () => {
  it('genera una página por estación con h1, Place en JSON-LD y el 140', async () => {
    const rutas = await getStaticPaths();
    expect(rutas.map((r) => r.params.slug).sort()).toEqual(['carcarana', 'franck', 'james-craik', 'leones', 'san-francisco', 'totoras']);
    const c = await AstroContainer.create();
    const html = await c.renderToString(Peaje, { request: new Request('https://covicen.test/peajes/carcarana/'), params: { slug: 'carcarana' }, props: rutas.find((r) => r.params.slug === 'carcarana')!.props });
    expect(html).toContain('<title>Peaje Carcarañá | Covicen</title>');
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain('"@type":"Place"');
    expect(html).toContain('href="tel:140"');
  });
  it('una estación próxima explica que todavía no cobra', async () => {
    const rutas = await getStaticPaths();
    const c = await AstroContainer.create();
    const html = await c.renderToString(Peaje, { request: new Request('https://covicen.test/peajes/totoras/'), params: { slug: 'totoras' }, props: rutas.find((r) => r.params.slug === 'totoras')!.props });
    expect(html).toContain('todavía no cobra');
    expect(html).not.toContain('Ficha completa');
  });
});
