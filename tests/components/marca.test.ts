import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Isotipo from '@/components/marca/Isotipo.astro';
import Logotipo from '@/components/marca/Logotipo.astro';

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

describe('Logotipo', () => {
  it('es un link a Home con nombre accesible y descriptor', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Logotipo, { props: { conDescriptor: true } });
    expect(html).toContain('aria-label="Covicen, inicio"');
    expect(html).toContain('href="/"');
    expect(html).toContain('COVICEN');
    expect(html).toContain('Corredor Vial del Centro');
  });
});
