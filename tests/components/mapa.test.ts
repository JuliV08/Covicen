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
  // Fase C (05/10/2026), segunda vuelta: «para ver el título tengo que subir, para ver los detalles tengo que bajar».
  // Desde 1280 px, columna y mapa: a la izquierda lo que se lee (título, números, ficha compacta, botón) y a la derecha
  // el mapa, con el alto limitado al de la pantalla. La ficha ya no flota encima del dibujo.
  it('desde 1280 px: columna a la izquierda con la ficha compacta y el mapa a la derecha', async () => {
    const html = await (await AstroContainer.create()).renderToString(MapaInteractivo, { props: { tramo: await fuenteLocalJson.tramo() } });
    expect(html).toMatch(/class="mapa-interactivo[^"]*\bxl:grid-cols-\[22rem_minmax\(0,1fr\)\]/);
    expect(html).toMatch(/<section class="[^"]*\bxl:col-start-1\b[^"]*"[^>]*aria-label="Estación seleccionada"/);
    expect(html).not.toMatch(/xl:absolute|--ficha-x/);
    expect(html).toMatch(/class="[^"]*\bficha-detalle\b[^"]*\bxl:hidden\b/);
    expect(html).toMatch(/<svg[^>]*class="[^"]*xl:max-h-\[calc\(100svh-13rem\)\]/);
  });
});
