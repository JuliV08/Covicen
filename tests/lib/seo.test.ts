import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { jsonLdArticulo, jsonLdFaq, jsonLdMigas, jsonLdOrganizacion, jsonLdSitioWeb } from '@/lib/seo';

describe('JSON-LD', () => {
  it('Organization sin CUIT, con área servida y sin contactPoint si no hay teléfono', async () => {
    const o = jsonLdOrganizacion(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto(), 'https://covicen.test', 'https://covicen.test/isotipo.svg');
    expect(o['@type']).toBe('Organization');
    expect(o.name).toBe('Covicen');
    expect(o.areaServed).toEqual([
      { '@type': 'AdministrativeArea', name: 'Córdoba' },
      { '@type': 'AdministrativeArea', name: 'Santa Fe' },
    ]);
    expect(o).not.toHaveProperty('taxID');
    expect(o).not.toHaveProperty('contactPoint');
  });
  it('WebSite', () => expect(jsonLdSitioWeb('https://covicen.test')['@type']).toBe('WebSite'));
  it('FAQPage con mainEntity', async () => {
    const f = jsonLdFaq(await fuenteLocalJson.faq());
    expect(f['@type']).toBe('FAQPage');
    expect((f.mainEntity as unknown[]).length).toBeGreaterThan(10);
  });
  it('BreadcrumbList numera desde 1', () => {
    const m = jsonLdMigas([
      { nombre: 'Inicio', url: 'https://covicen.test/' },
      { nombre: 'Tarifas', url: 'https://covicen.test/tarifas/' },
    ]);
    expect((m.itemListElement as Array<{ position: number }>)[1]?.position).toBe(2);
  });
  it('Article', () => {
    const a = jsonLdArticulo({ slug: 'x', titulo: 'T', fecha: '2026-08-27', resumen: 'R', etiquetas: [], destacada: false }, 'https://covicen.test/novedades/x/', 'https://covicen.test');
    expect(a['@type']).toBe('Article');
    expect(a.datePublished).toBe('2026-08-27');
  });
});
