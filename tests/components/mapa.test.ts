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
  // Fase C (05/10/2026): el mapa a todo el ancho; la ficha flota desde 1280 px (a 1024 el hueco no alcanza) y es
  // compacta: «Vías» y «Sentido» quedan en la página de la estación.
  it('el mapa a todo el ancho y la ficha flotante desde 1280 px, compacta (sin vías ni sentido)', async () => {
    const html = await (await AstroContainer.create()).renderToString(MapaInteractivo, { props: { tramo: await fuenteLocalJson.tramo() } });
    expect(html).toMatch(/class="mapa-interactivo[^"]*@container/);
    expect(html).toMatch(/<section class="[^"]*\bxl:absolute\b[^"]*"[^>]*aria-label="Estación seleccionada"/);
    expect(html).not.toMatch(/lg:grid-cols-\[1\.6fr_1fr\]/);
    expect(html).toMatch(/class="[^"]*\bficha-detalle\b[^"]*\bxl:hidden\b/);
    expect(html).toMatch(/--ficha-x: [\d.]+cqw; --ficha-y: [\d.]+cqw/);
  });
});
