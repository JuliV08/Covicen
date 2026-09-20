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
    expect(html).toContain('aria-label="Estación Leones, RN 9 km 454, próxima"');
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
    expect(html).toContain('Precaución'); // la leyenda nombra la severidad que hay
    expect(html).not.toContain('Corte'); // y solo esa
  });
  // Spec §7.1: en este mapa nada se comunica solo por color. La severidad va en el <title> y cambia la FORMA del marcador.
  it('nombra la severidad en el título y le da una forma distinta a cada una', async () => {
    const html = await render({ incidentes: [
      { ruta: 'RN 9', km: 400, descripcion: 'Bacheo', severidad: 'precaucion' },
      { ruta: 'RN 34', km: 118, descripcion: 'Vuelco de camión', severidad: 'corte' },
      { ruta: 'RN 19', km: 61, descripcion: 'Demoras', severidad: 'info' },
    ] });
    expect(html).toContain('<title>Corte — RN 34 km 118: Vuelco de camión</title>');
    expect(html).toContain('<title>Precaución — RN 9 km 400: Bacheo</title>');
    expect(html).toContain('<title>Información — RN 19 km 61: Demoras</title>');
    const forma = (sev: string) => new RegExp(`data-severidad="${sev}"[\\s\\S]*?<path d="([^"]+)"`).exec(html)?.[1];
    expect(new Set([forma('corte'), forma('precaucion'), forma('info')]).size).toBe(3);
    expect(html.match(/class="incidente-forma"/g)?.length).toBe(6); // 3 marcadores + 3 entradas de leyenda
    expect(html).toContain('role="img"'); // cada marcador se anuncia con su título
  });
});

describe('IconoVehiculo', () => {
  it('renderiza cada tipo y falla con uno desconocido', async () => {
    const c = await AstroContainer.create();
    for (const icono of ['moto', 'auto', 'camioneta', 'camion-2', 'camion-3-4', 'camion-5-6', 'camion-7']) {
      expect(await c.renderToString(IconoVehiculo, { props: { icono } })).toContain('<svg');
    }
    await expect(c.renderToString(IconoVehiculo, { props: { icono: 'nave' } })).rejects.toThrow();
  });
});
