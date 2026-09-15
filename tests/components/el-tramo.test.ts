import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import ElTramo from '@/pages/el-tramo.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

// El mapa de esta página pinta los incidentes del estado de la traza, y hoy los datos son de muestra: incluyen un corte
// total por vuelco en RN 34. Anunciar un corte que no existe es el error más caro del sitio, así que el cartel de
// "datos de ejemplo" tiene que leerse ANTES del marcador rojo (spec §10.1), y los incidentes también van en texto.
describe('/el-tramo/', () => {
  const render = async () => (await AstroContainer.create()).renderToString(ElTramo, { request: new Request('https://covicen.test/el-tramo/') });
  it('con estado.ejemplo, el cartel va arriba del mapa y el estado de la traza queda en texto', async () => {
    const estado = await fuenteLocalJson.estadoRutas();
    expect(estado.ejemplo).toBe(true); // si el dato deja de ser de muestra, este test pierde sentido y hay que revisarlo
    const html = await render();
    expect(html).toContain('data-severidad="corte"');
    expect(html).toContain('Datos de ejemplo: el módulo se activa con la operación');
    expect(html.indexOf('Datos de ejemplo')).toBeLessThan(html.indexOf('data-severidad="'));
    expect(html).toContain('aria-label="Estado de la traza"');
    expect(html).toContain('Corte total por vuelco de un camión');
    expect(html.match(/<h1/g)?.length).toBe(1); // EstadoTraza entra como h2, no agrega otro h1
  });

  // El header es fijo (--alto-header: 7rem = 112 px) y encima la nav de anclas es sticky en top: var(--alto-header) y
  // mide ~53 px: los primeros ~165 px del viewport están tapados. Sin scroll-margin, tocar un ancla deja el encabezado
  // de la sección debajo de las dos barras y se aterriza sobre el cuerpo del bloque sin saber a dónde se llegó.
  it('los cuatro bloques de la nav de anclas arrancan debajo del header fijo y de la barra sticky', async () => {
    const { document } = parseHTML(await render());
    const anclas = [...document.querySelectorAll('nav[aria-label="Secciones de El tramo"] a')].map((a) => a.getAttribute('href'));
    expect(anclas).toEqual(['#rutas', '#estaciones', '#tarifas', '#servicios']);
    for (const href of anclas) {
      const destino = document.querySelector(`section${href}`);
      expect(destino, `falta la sección ${href}`).not.toBeNull();
      expect(destino!.getAttribute('class'), `${href} sin scroll-margin`).toContain('scroll-mt-[calc(var(--alto-header)+4.5rem)]');
    }
  });

  // El mapa renderiza seis TarjetaEstacion en h3. Sin un encabezado propio de la sección, quien navega por encabezados
  // con lector de pantalla salta del h1 a un h3 con el nombre de una estación, colgando de un nivel que no existe.
  it('la sección del mapa tiene encabezado propio y ningún nivel queda salteado', async () => {
    const { document } = parseHTML(await render());
    const mapa = document.querySelector('section#mapa')!;
    const idTitulo = mapa.getAttribute('aria-labelledby');
    expect(idTitulo).toBeTruthy();
    // MapaTramo ya usa id="mapa-titulo" para describir el SVG: si el encabezado repite un id, el nombre de la región
    // apunta al primero que aparezca y el verificador de HTML marca duplicado.
    expect(document.querySelectorAll(`#${idTitulo}`).length, `id ${idTitulo} duplicado`).toBe(1);
    expect(mapa.getAttribute('aria-label')).toBeNull(); // una sola fuente de nombre accesible
    const titulo = document.getElementById(idTitulo!)!;
    expect(titulo.tagName.toLowerCase()).toBe('h2');
    expect(titulo.getAttribute('class')).toContain('sr-only');
    expect(titulo.textContent).toBe('Mapa del tramo y estaciones de peaje');
    const niveles = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((h) => Number(h.tagName[1]));
    expect(niveles[0]).toBe(1);
    expect(niveles[1]).toBe(2); // el h2 del mapa, antes de los h3 de las estaciones
    const saltos = niveles.map((n, i) => (i > 0 && n - niveles[i - 1]! > 1 ? `h${niveles[i - 1]} → h${n} (encabezado ${i + 1})` : null)).filter(Boolean);
    expect(saltos, saltos.join('; ')).toEqual([]);
  });
});
