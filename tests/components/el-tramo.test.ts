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
  // Call del 20/09/2026: los cuadros tarifarios salen de acá («es reiterativo», y viven en /tarifas/). Y las áreas
  // de descanso no se muestran hasta que existan los datos de qué hay en cada una. La nav de anclas se arma con los
  // bloques que quedan: un ancla a una sección que no existe es un link roto, y verificar.ts lo canta.
  it('la nav de anclas lista exactamente las secciones que existen, y todas arrancan debajo del header', async () => {
    const { document } = parseHTML(await render());
    const anclas = [...document.querySelectorAll('nav[aria-label="Secciones de El tramo"] a')].map((a) => a.getAttribute('href'));
    expect(anclas).toEqual(['#rutas', '#estaciones']);
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
  it('no repite los cuadros tarifarios: eso vive en Tarifas', async () => {
    const html = await render();
    expect(html.includes('id="tarifas"'), 'volvió la sección de cuadros tarifarios').toBe(false);
    expect(html.includes('Cuánto cuesta en cada estación'), 'volvió el título de la sección').toBe(false);
    // Pero el puente a Tarifas no se pierde: vivía adentro de esa sección.
    expect(html.includes('href="/tarifas/"'), 'se perdió la salida a Tarifas').toBe(true);
  });

  // La sección 01 la dio por perfecta el gerente: no se toca más que lo que exige sacar la cita del pliego.
  it('la sección 01 conserva su título', async () => {
    expect(await render()).toContain('Tres rutas nacionales bajo una misma concesión.');
  });

  it('los índices quedan corridos, sin huecos', async () => {
    const visible = (await render()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(visible).toContain(' 01 ');
    expect(visible).toContain(' 02 ');
    expect(visible.includes(' 03 '), 'quedó un índice de una sección que ya no está').toBe(false);
  });

  // Lo que el gerente pidió el 20/09/2026 es que esta sección diga QUÉ HAY DE VERDAD en cada área de descanso
  // (agua, baños). Ese dato no existe. Lo único cargado es grueso —«tiene área de descanso» y «grúa gratuita», igual
  // para las tres operativas, y la grúa ni siquiera es de la estación: es de toda la red—, así que la sección se
  // leía como tres tarjetas idénticas que no responden nada. Se esconde entera hasta que el dato exista.
  // Este test fija las DOS mitades: que hoy no se renderiza, y que el dato fino sigue faltando (si alguien lo carga,
  // el test se cae y avisa que hay que prender el interruptor en vez de dejar la sección escondida con datos).
  it('sin el detalle de qué hay en cada área, la sección no se renderiza', async () => {
    const tramo = await fuenteLocalJson.tramo();
    const detalle = tramo.cabinas.some((c) => c.servicios?.sanitarios || c.servicios?.detencionSegura || c.servicios?.colocacionTelepase);
    expect(detalle, 'se cargó el detalle por estación: hay que prender publicado.serviciosDeAreaDescanso').toBe(false);
    const html = await render();
    expect(html.includes('id="servicios"'), 'encabezado de servicios sin nada debajo').toBe(false);
    expect(html.includes('Qué encontrás en la ruta'), 'quedó el título de servicios').toBe(false);
    // La salida a /servicios/, que sí tiene contenido, no se pierde con la sección.
    expect(html.includes('href="/servicios/"'), 'se perdió la salida a Servicios').toBe(true);
  });

});
