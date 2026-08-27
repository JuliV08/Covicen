import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import MapaTramo from '@/components/ilustraciones/MapaTramo.astro';
import IconoVehiculo from '@/components/ilustraciones/IconoVehiculo.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('MapaTramo', () => {
  it('dibuja las 3 rutas, las 6 balizas y etiqueta las ciudades principales', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(MapaTramo, { props: { tramo: await fuenteLocalJson.tramo(), modo: 'scroll' } });
    expect(html.match(/class="dibujar/g)?.length).toBe(9); // 3 rutas × 3 trazos (glow, línea, marcas)
    expect(html.match(/<g class="baliza/g)?.length).toBe(6);
    expect(html).toContain('>Rosario<');
    expect(html).toContain('>Córdoba<');
    expect(html).toContain('pathLength="1000"');
    expect(html).toContain('role="img"');
  });
});

describe('IconoVehiculo', () => {
  it('renderiza cada categoría y falla con una desconocida', async () => {
    const c = await AstroContainer.create();
    for (const cat of ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6']) {
      expect(await c.renderToString(IconoVehiculo, { props: { categoria: cat } })).toContain('<svg');
    }
    await expect(c.renderToString(IconoVehiculo, { props: { categoria: 'cat-9' } })).rejects.toThrow();
  });
});
