import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it, vi } from 'vitest';
import Contacto from '@/pages/contacto.astro';

// El formulario de consultas de TelePASE estuvo prendido del 25/09 al 04/10/2026; desde el 05/10 está apagado de
// verdad (el único formulario es el del CRM). El mock queda para que este archivo pruebe el estado apagado aunque
// alguien vuelva a prender el interruptor: esconde la sección entera y deja las demás bien alternadas. vi.mock se
// eleva por encima de los imports, así que la página de arriba ya se carga apagada.
vi.mock('@/lib/publicado', async (original) => {
  const real = await original<typeof import('@/lib/publicado')>();
  return { publicado: Object.freeze({ ...real.publicado, formularioTelepase: false }) };
});

describe('/contacto/ con el formulario de TelePASE apagado', () => {
  it('no queda ni la sección ni su formulario, sigue el de reclamos, y los fondos siguen alternando', async () => {
    const html = await (await AstroContainer.create()).renderToString(Contacto, { request: new Request('https://covicen.test/contacto/') });
    for (const marca of ['id="telepase"', 'id="formulario-telepase"', 'Consultas sobre tu TelePASE', 'Consultas de TelePASE']) {
      expect(html, `quedó ${marca}`).not.toContain(marca);
    }
    expect(html).toContain('id="reclamos"');
    // Sin TelePASE en el medio, «Cómo hacer un reclamo» pasa a llevar la grilla.
    const reclamo = html.split('<section').find((s) => s.includes('Cuatro pasos.')) ?? '';
    expect(/^[^>]*class="([^"]*)"/.exec(reclamo)?.[1]).toContain('seccion-cinetica');
  });
});
