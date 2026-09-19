import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import MapaInteractivo from '@/components/MapaInteractivo.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('MapaInteractivo', () => {
  it('mapa + una tarjeta por estación (todas visibles sin JS) en una región viva', async () => {
    const html = await (await AstroContainer.create()).renderToString(MapaInteractivo, { props: { tramo: await fuenteLocalJson.tramo() } });
    expect(html).toContain('data-mapa-interactivo');
    expect(html.match(/data-tarjeta-estacion="/g)?.length).toBe(6);
    expect(html).not.toMatch(/data-tarjeta-estacion="[^"]+" hidden/);
    expect(html).toContain('aria-live="polite"');
  });
});
