import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Isotipo from '@/components/marca/Isotipo.astro';
import Logotipo from '@/components/marca/Logotipo.astro';
import { ISOTIPO, LOGO_CORTO, LOGO_LARGO } from '@/assets/marca/marca';

describe('Isotipo', () => {
  it('renderiza SVG inline con degradado y es decorativo por defecto', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Isotipo, { props: { size: 40 } });
    expect(html).toContain('<svg');
    expect(html).toContain('linearGradient');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('width="40"');
  });
  it('variante tinta usa currentColor', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Isotipo, { props: { variante: 'tinta' } });
    expect(html).toContain('fill="currentColor"');
    expect(html).not.toContain('linearGradient');
  });
});

// 06/10/2026: el logo del manual de marca de septiembre de 2026, con los trazos oficiales (scripts/extraer-marca.mjs).
describe('el logo del manual de marca de septiembre de 2026', () => {
  it('el isotipo es la C con la ruta: dos trazos con el degradado del manual', () => {
    expect(ISOTIPO.trazos).toHaveLength(2);
    expect(ISOTIPO.trazos.every((t) => t.degradado !== undefined)).toBe(true);
    expect(ISOTIPO.paradas.map(([, c]) => c)).toEqual(['#68b4da', '#62aad0', '#5290b6', '#39678d', '#27496f']);
  });
  it('el corto dice COVICEN SA y el largo suma el lema', () => {
    const papeles = (d: typeof LOGO_CORTO) => new Set(d.trazos.map((t) => t.papel).filter(Boolean));
    expect([...papeles(LOGO_CORTO)].sort()).toEqual(['palabra', 'sa']);
    expect([...papeles(LOGO_LARGO)].sort()).toEqual(['lema', 'palabra', 'sa']);
  });
  it('el header usa el corto, como link a la home con nombre accesible y sin texto tipeado', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Logotipo, {});
    expect(html).toContain('aria-label="Covicen, inicio"');
    expect(html).toContain('href="/"');
    expect(html).toContain(`viewBox="${LOGO_CORTO.viewBox}"`);
    expect(html, 'volvió el «COVICEN» tipeado con la letra del sitio').not.toMatch(/>\s*COVICEN\s*</);
  });
  it('el largo, sin enlace, es una imagen con su nombre', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Logotipo, { props: { version: 'largo', enlace: false } });
    expect(html).toContain(`viewBox="${LOGO_LARGO.viewBox}"`);
    expect(html).toContain('role="img"');
    expect(html).toContain('<title>Covicen S.A., Corredor Vial Centro</title>');
    expect(html).not.toContain('<a ');
  });
  it('el pie y la portada usan el largo; el favicon es el isotipo nuevo', () => {
    for (const archivo of ['src/components/Footer.astro', 'src/layouts/Proximamente.astro']) {
      expect(readFileSync(archivo, 'utf8'), archivo).toContain('<Logotipo version="largo" enlace={false}');
    }
    expect(readFileSync('public/favicon.svg', 'utf8')).toContain(`viewBox="${ISOTIPO.viewBox}"`);
  });
  it('los colores de la palabra, la SA y el lema están en los cuatro temas', () => {
    const tokens = readFileSync('src/styles/tokens.css', 'utf8');
    for (const t of ['palabra', 'sa', 'lema']) expect(tokens.match(new RegExp(`--color-logo-${t}:`, 'g'))?.length, t).toBe(4);
  });
});
