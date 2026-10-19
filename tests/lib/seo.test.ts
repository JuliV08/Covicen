import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { jsonLdArticulo, jsonLdFaq, jsonLdMigas, jsonLdOrganizacion, jsonLdSitioWeb } from '@/lib/seo';

describe('JSON-LD', () => {
  // Desde el 05/10/2026 hay CUIT (taxID) y la línea 0800 se suma como contacto de atención al usuario.
  it('Organization con CUIT, área servida, el 140 de emergencia y el 0800 de atención al usuario', async () => {
    const o = jsonLdOrganizacion(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto(), 'https://covicen.test', 'https://covicen.test/isotipo.svg');
    expect(o['@type']).toBe('Organization');
    expect(o.name).toBe('Covicen');
    expect(o.areaServed).toEqual([
      { '@type': 'AdministrativeArea', name: 'Córdoba' },
      { '@type': 'AdministrativeArea', name: 'Santa Fe' },
    ]);
    expect(o.taxID).toBe('30-71959948-2');
    expect(o.legalName).toBe('COVICEN S.A.');
    expect(o).not.toHaveProperty('alternateName');
    expect(o.contactPoint).toEqual([
      { '@type': 'ContactPoint', telephone: '140', contactType: 'emergency', areaServed: 'AR', availableLanguage: 'es' },
      { '@type': 'ContactPoint', telephone: '0800 444 7777', contactType: 'customer service', contactOption: 'TollFree', areaServed: 'AR', availableLanguage: 'es' },
    ]);
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
