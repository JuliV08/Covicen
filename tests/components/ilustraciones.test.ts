import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import MapaTramo from '@/components/ilustraciones/MapaTramo.astro';
import IconoVehiculo from '@/components/ilustraciones/IconoVehiculo.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('MapaTramo', () => {
  const render = async (props: Record<string, unknown> = {}) => (await AstroContainer.create()).renderToString(MapaTramo, { props: { tramo: await fuenteLocalJson.tramo(), modo: 'scroll', ...props } });
  it('dibuja las 3 rutas, las 6 estaciones como enlaces con nombre y etiqueta las ciudades principales', async () => {
    const html = await render();
    expect(html.match(/class="dibujar/g)?.length).toBe(6); // 3 rutas × 2 trazos sólidos (glow, línea)
    expect(html.match(/class="marcas-vivas/g)?.length).toBe(3);
    expect(html.match(/class="luz-viaja/g)?.length).toBe(3); // una luz por ruta
    expect(html.match(/data-estacion="/g)?.length).toBe(6);
    expect(html).toContain('aria-label="Estación Carcarañá, RN 9 km 340, operativa"');
    expect(html).toContain('aria-label="Estación Leones, RN 9 km 454, próxima · free flow"');
    expect(html).toContain('href="/peajes/carcarana/"');
    expect(html).toContain('role="group"');
    expect(html).not.toContain('role="img"');
    expect(html).toContain('>Rosario<');
    expect(html).toContain('>Córdoba<');
    expect(html).toContain('pathLength="1000"');
    expect(html).not.toContain('>Empalme RN 19<'); // los empalmes no llevan etiqueta
  });
  it('colores por estado y leyenda solo con los servicios que existen', async () => {
    const html = await render();
    expect(html.match(/data-estado-operativo="operativa"/g)?.length).toBe(3);
    expect(html.match(/data-estado-operativo="proxima"/g)?.length).toBe(3);
    expect(html).toContain('Estación operativa');
    expect(html).toContain('Estación próxima');
    expect(html).toContain('Área de descanso');
    expect(html).not.toContain('Sector de detención segura');
  });
  it('ubica incidentes sobre el trazo y los suma a la leyenda', async () => {
    const html = await render({ incidentes: [{ ruta: 'RN 9', km: 400, descripcion: 'Bacheo', severidad: 'precaucion' }] });
    expect(html).toContain('data-severidad="precaucion"');
    expect(html).toContain('Incidente informado');
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
