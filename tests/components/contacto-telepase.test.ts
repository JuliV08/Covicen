import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it, vi } from 'vitest';
import Contacto from '@/pages/contacto.astro';

// El formulario de consultas de TelePASE está prendido desde el 25/09/2026 y es obligatorio (PETG 61.5 b). El
// interruptor `publicado.formularioTelepase` sigue existiendo, así que este archivo prueba que apagarlo todavía
// esconde la sección entera y deja las demás bien alternadas. Apaga el interruptor con un mock (el módulo real está
// congelado a propósito); vi.mock se eleva por encima de los imports, así que la página de arriba ya se carga apagada.
// (Apagarlo de verdad hace fallar el build: `verificar.ts` exige el formulario en /contacto/.)
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
    const reclamo = html.split('<section').find((s) => s.includes('Cuatro pasos, con plazos.')) ?? '';
    expect(/^[^>]*class="([^"]*)"/.exec(reclamo)?.[1]).toContain('seccion-cinetica');
  });
});
