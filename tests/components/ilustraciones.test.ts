import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import MapaTramo from '@/components/ilustraciones/MapaTramo.astro';
import IconoVehiculo from '@/components/ilustraciones/IconoVehiculo.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('MapaTramo', () => {
  const render = async (props: Record<string, unknown> = {}) => (await AstroContainer.create()).renderToString(MapaTramo, { props: { tramo: await fuenteLocalJson.tramo(), modo: 'scroll', ...props } });
  // Fase C (05/10/2026): «nada de líneas cortadas o dibujos SVG "así nomás"». Cada ruta es una cinta continua en tres
  // capas con curvas en los vértices; se van la grilla, las marcas viales que fluían y la luz que recorría las rutas.
  it('rutas en cinta continua con curvas, sin grilla, sin trazos discontinuos ni luces en loop', async () => {
    const html = await render();
    expect(html.match(/class="ruta-halo/g)?.length).toBe(3);
    expect(html.match(/class="ruta-cuerpo/g)?.length).toBe(3);
    expect(html.match(/class="ruta-filo/g)?.length).toBe(3);
    expect(html).toMatch(/<path d="M[^"]*Q[^"]*"[^>]*class="ruta-filo/);
    for (const viejo of ['marcas-vivas', 'luz-viaja', 'mapa-plano', 'stroke-dasharray']) expect(html, `quedó ${viejo}`).not.toContain(viejo);
    expect(html.match(/data-estacion="/g)?.length).toBe(6);
    expect(html).toContain('aria-label="Estación Carcarañá, RN 9 km 340, operativa"');
    expect(html).toContain('aria-label="Estación Leones, RN 9 km 454, próxima"');
    expect(html).toContain('href="/peajes/carcarana/"');
    expect(html).toContain('role="group"');
    expect(html).not.toContain('role="img"');
    expect(html).toContain('>Rosario<');
    expect(html).toContain('>Córdoba<');
    expect(html).not.toContain('>Empalme RN 19<'); // los empalmes no llevan etiqueta
  });
  // 05/10/2026: el dibujo atado al scroll (`.dibujar.al-scroll`) no llega al sitio armado: el minificador de CSS borra
  // el `animation` y el `animation-timeline` y las rutas quedaban escondidas (Juli: «no se ven las rutas de nada»).
  // Ahora se dibujan una vez al entrar en pantalla, y solo si scripts/mapa.ts lo pide: sin JS se ven siempre.
  it('las rutas no dependen del dibujo atado al scroll; lo dispara el script al entrar en pantalla', async () => {
    const html = await render();
    expect(html).not.toMatch(/class="ruta-[a-z]+ dibujar/);
    const estilo = readFileSync('src/components/ilustraciones/MapaTramo.astro', 'utf8');
    expect(estilo).toMatch(/svg\[data-dibujo\] \.ruta > path \{[^}]*stroke-dashoffset: 1000/);
    expect(estilo).toMatch(/svg\[data-dibujo="listo"\] \.ruta > path \{[^}]*animation: ruta-dibujar/);
    const script = readFileSync('src/scripts/mapa.ts', 'utf8');
    expect(script).toContain('IntersectionObserver');
    expect(script).toMatch(/dataset\.dibujo = 'listo'/);
  });
  it('encuadrado, con placas detrás de los rótulos de estación y el auto decorativo', async () => {
    const html = await render();
    expect(html).not.toContain('viewBox="0 0 820 520"');
    expect(html.match(/class="cabina-placa"/g)?.length).toBe(6);
    expect(html).toMatch(/<g class="auto"[^>]*aria-hidden="true"/);
    expect(html).toMatch(/data-red="\{/);
  });
  it('la próxima se distingue por la forma, no solo por el color: centro hueco', async () => {
    const html = await render();
    expect(html).toMatch(/data-estado-operativo="proxima"[\s\S]*?class="baliza-punto baliza-hueca"/);
    expect(html).not.toMatch(/data-estado-operativo="operativa"[^>]*>(?:(?!<\/a>)[\s\S])*baliza-hueca/);
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
