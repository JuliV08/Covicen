import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it, vi } from 'vitest';
import Contacto from '@/pages/contacto.astro';

// El formulario de TelePASE está escondido desde el 24/09/2026 (publicado.formularioTelepase), pero el PETG 61.5 b lo
// exige desde la toma de posesión: el día que se prenda tiene que volver entero, sin sorpresas. Este archivo prende el
// interruptor con un mock (el módulo real está congelado a propósito) y mira la página como la vería el usuario.
// vi.mock se eleva por encima de los imports, así que la página de arriba ya se carga con el interruptor prendido.
vi.mock('@/lib/publicado', async (original) => {
  const real = await original<typeof import('@/lib/publicado')>();
  return { publicado: Object.freeze({ ...real.publicado, formularioTelepase: true }) };
});

describe('/contacto/ con el formulario de TelePASE prendido', () => {
  it('vuelve la sección con su formulario, al lado del de reclamos, y los fondos siguen alternando', async () => {
    const html = await (await AstroContainer.create()).renderToString(Contacto, { request: new Request('https://covicen.test/contacto/') });
    expect(html).toContain('id="telepase"');
    expect(html).toContain('Consultas sobre tu TelePASE.');
    expect(html).toContain('id="formulario-telepase"');
    expect(html).toContain('href="https://www.telepase.com.ar/"');
    expect(html).toContain('id="reclamos"');
    // Con TelePASE en el medio, TelePASE lleva la grilla y «Cómo hacer un reclamo» vuelve a liso.
    const telepase = /<section id="telepase"[^>]*class="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(telepase).toContain('seccion-cinetica');
    const reclamo = html.split('<section').find((s) => s.includes('Cuatro pasos, con plazos.')) ?? '';
    expect(/^[^>]*class="([^"]*)"/.exec(reclamo)?.[1], '«Cómo hacer un reclamo» no volvió a liso').not.toContain('seccion-cinetica');
  });
});
