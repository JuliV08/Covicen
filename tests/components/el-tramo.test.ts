import { experimental_AstroContainer as AstroContainer } from 'astro/container';
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
});
