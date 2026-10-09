import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Isotipo from '@/components/marca/Isotipo.astro';
import Logotipo from '@/components/marca/Logotipo.astro';
import { ISOTIPO, ISOTIPO_UN_COLOR, LOGO_CORTO, LOGO_LARGO } from '@/assets/marca/marca';

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
  // 06/10/2026, «quieren este logo»: la versión «ruta», con la ruta rellena y sus marcas blancas encima (la «color»
  // las tenía caladas y sobre un fondo oscuro se veían oscuras).
  it('el isotipo es la C con la ruta, con el degradado del manual y las marcas de la ruta en blanco', async () => {
    expect(ISOTIPO.trazos.filter((t) => t.degradado !== undefined)).toHaveLength(2);
    expect(ISOTIPO.trazos.filter((t) => t.papel === 'marcas').length).toBeGreaterThan(0);
    expect(ISOTIPO.paradas.map(([, c]) => c)).toEqual(['#68b4da', '#62aad0', '#5290b6', '#39678d', '#27496f']);
    const html = await (await AstroContainer.create()).renderToString(Isotipo, { props: { size: 40 } });
    expect(html).toContain('class="logo-marcas"');
  });
  it('en un solo color, las marcas son huecos: no se dibujan aparte', async () => {
    expect(ISOTIPO_UN_COLOR.trazos.some((t) => t.papel === 'marcas')).toBe(false);
    const html = await (await AstroContainer.create()).renderToString(Isotipo, { props: { variante: 'tinta' } });
    expect(html).not.toContain('logo-marcas');
  });
  it('los dos logotipos llevan el isotipo «ruta»; el corto dice COVICEN SA y el largo suma el lema', () => {
    const papeles = (d: typeof LOGO_CORTO) => new Set(d.trazos.map((t) => t.papel).filter(Boolean));
    expect([...papeles(LOGO_CORTO)].sort()).toEqual(['marcas', 'palabra', 'sa']);
    expect([...papeles(LOGO_LARGO)].sort()).toEqual(['lema', 'marcas', 'palabra', 'sa']);
    // El manual no trae el corto «ruta»: se arma con el isotipo del largo, ubicado donde el corto tiene el suyo.
    expect(LOGO_CORTO.transformIsotipo).toMatch(/^translate\([\d.]+ [\d.]+\) scale\(0\.\d+\)$/);
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
