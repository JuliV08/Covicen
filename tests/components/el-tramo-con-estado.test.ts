import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ElTramo from '@/pages/el-tramo.astro';

// El estado de la traza está apagado (capacidades.estadoRutasEnVivo y publicado.estadoDeLaTraza en false hasta que la
// API del sistema esté en el aire). Este archivo prueba el otro estado, el que vuelve al prenderlo: desde el 19/11/2026
// la página no trae ningún aviso armado en el build, sino el armazón que el navegador llena consultando la API (spec del
// sistema 3, §8.6). Los datos de muestra de src/content/estado-ruta.json no pueden llegar nunca a la página: un corte
// inventado que se lee como real es el peor error posible. vi.mock se eleva por encima de los imports; `ajuste` deja
// cambiar la dirección de la API entre un test y otro.
const ajuste = vi.hoisted(() => ({ apiPublicaUrl: 'https://api.covicen.test' }));
vi.mock('@/lib/publicado', async (original) => {
  const real = await original<typeof import('@/lib/publicado')>();
  return { publicado: Object.freeze({ ...real.publicado, estadoDeLaTraza: true }) };
});
vi.mock('@/lib/datos/capacidades', async (original) => {
  const real = await original<typeof import('@/lib/datos/capacidades')>();
  return { ...real, capacidades: { ...real.capacidades, estadoRutasEnVivo: true } };
});
vi.mock('@/lib/config', async (original) => {
  const real = await original<typeof import('@/lib/config')>();
  return { config: { ...real.config, get apiPublicaUrl() { return ajuste.apiPublicaUrl; } } };
});

const render = async () => (await AstroContainer.create()).renderToString(ElTramo, { request: new Request('https://covicen.test/el-tramo/') });

describe('/el-tramo/ con el estado de la traza prendido', () => {
  afterEach(() => {
    ajuste.apiPublicaUrl = 'https://api.covicen.test';
  });

  it('el bloque en vivo con la dirección de la API, y en el mapa la capa vacía y la geometría', async () => {
    const html = await render();
    const { document } = parseHTML(html);
    const seccion = document.querySelector('section[aria-label="Estado de la traza"][data-estado-en-vivo]')!;
    expect(seccion.getAttribute('data-url')).toBe('https://api.covicen.test/api/v1/estado-ruta/');
    expect(document.querySelector('g[data-marcadores-estado]')!.children).toHaveLength(0);
    const geo = JSON.parse(document.querySelector('svg[data-geometria-km]')!.getAttribute('data-geometria-km')!);
    expect(Object.keys(geo).sort()).toEqual(['RN 19', 'RN 34', 'RN 9']);
    expect(html.match(/<h1/g)?.length).toBe(1);
  });

  it('nada de los datos de muestra llega a la página', async () => {
    const html = await render();
    expect(html).not.toContain('Datos de ejemplo');
    const muestra = JSON.parse(readFileSync('src/content/estado-ruta.json', 'utf8')) as { incidentes: { descripcion: string }[] };
    for (const i of muestra.incidentes) expect(html).not.toContain(i.descripcion);
  });

  it('sin PUBLIC_API_URL el build se frena, en vez de publicar un bloque que nunca va a cargar', async () => {
    ajuste.apiPublicaUrl = '';
    await expect(render()).rejects.toThrow('El estado de la traza en vivo necesita PUBLIC_API_URL');
  });
});
