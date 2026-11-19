import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import MapaTramo from '@/components/ilustraciones/MapaTramo.astro';
import IconoVehiculo from '@/components/ilustraciones/IconoVehiculo.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { geometriaKm } from '@/lib/geometria-km';

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
  // Desde el 19/11/2026 los avisos llegan en vivo (spec del sistema 3, §8.6): el build deja la capa vacía y la geometría
  // de los km, y el navegador pone los marcadores (lib/estado-dom.ts, en tests/lib/estado-dom.test.ts). Spec §7.1: nada
  // se comunica solo por color, así que la leyenda trae las tres formas con su nombre.
  it('con el estado de la traza: capa de marcadores vacía, geometría de los km y las tres severidades en la leyenda', async () => {
    const tramo = await fuenteLocalJson.tramo();
    const { document } = parseHTML(await render({ conEstado: true }));
    expect(document.querySelector('svg g[data-marcadores-estado]')!.children).toHaveLength(0);
    expect(JSON.parse(document.querySelector('svg[data-geometria-km]')!.getAttribute('data-geometria-km')!)).toEqual(geometriaKm(tramo));
    const leyenda = document.querySelector('[aria-label="Leyenda"]')!;
    for (const s of ['Corte', 'Precaución', 'Información']) expect(leyenda.textContent).toContain(s);
    const formas = [...leyenda.querySelectorAll('svg.incidente path')].map((p) => p.getAttribute('d'));
    expect(new Set(formas).size).toBe(3);
  });
  it('sin el estado de la traza: ni capa, ni geometría, ni severidades en la leyenda', async () => {
    const html = await render();
    for (const t of ['data-marcadores-estado', 'data-geometria-km', 'incidente-forma', 'Precaución']) expect(html, t).not.toContain(t);
  });
  // Los marcadores los crea el navegador, sin el atributo con que Astro acota los estilos del componente: sin :global
  // saldrían sin color.
  it('los estilos de los marcadores alcanzan a los que crea el navegador', () => {
    const estilo = readFileSync('src/components/ilustraciones/MapaTramo.astro', 'utf8');
    expect(estilo).toMatch(/:global\(\.incidente-forma\)/);
    expect(estilo).toMatch(/:global\(\.incidente\[data-severidad="corte"\] \.incidente-forma\)/);
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
