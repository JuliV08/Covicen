import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it, vi } from 'vitest';
import ElTramo from '@/pages/el-tramo.astro';

// El estado de la traza está escondido desde el 02/10/2026 (publicado.estadoDeLaTraza, «comentar hasta que tengamos
// info»). Este archivo prueba el otro estado, el que vuelve al prenderlo: con datos de ejemplo, el cartel va ARRIBA de
// los marcadores del mapa —un corte inventado que se lee como real es el peor error posible— y los incidentes quedan
// también en texto, que es la única forma de leerlos con teclado o lector de pantalla. Mock como en
// contacto-telepase.test.ts: vi.mock se eleva por encima de los imports.
vi.mock('@/lib/publicado', async (original) => {
  const real = await original<typeof import('@/lib/publicado')>();
  return { publicado: Object.freeze({ ...real.publicado, estadoDeLaTraza: true }) };
});

describe('/el-tramo/ con el estado de la traza prendido', () => {
  it('el cartel va arriba del mapa y el estado queda en texto, como h2', async () => {
    const html = await (await AstroContainer.create()).renderToString(ElTramo, { request: new Request('https://covicen.test/el-tramo/') });
    expect(html).toContain('data-severidad="corte"');
    expect(html).toContain('Datos de ejemplo: el módulo se activa con la operación');
    expect(html.indexOf('Datos de ejemplo')).toBeLessThan(html.indexOf('data-severidad="'));
    expect(html).toContain('aria-label="Estado de la traza"');
    expect(html).toContain('Corte total por vuelco de un camión');
    expect(html.match(/<h1/g)?.length).toBe(1);
  });
});
