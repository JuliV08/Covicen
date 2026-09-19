import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Asistencia from '@/pages/asistencia.astro';

const render = async () => (await AstroContainer.create()).renderToString(Asistencia, { request: new Request('https://covicen.test/asistencia/') });

describe('/asistencia/', () => {
  it('primero el 140, después la ubicación y los datos mínimos; sin canal, dice la verdad', async () => {
    const html = await render();
    expect(html.indexOf('href="tel:140"')).toBeLessThan(html.indexOf('data-ubicar'));
    expect(html).toContain('data-asistencia');
    expect(html).toContain('data-copiar');
    expect(html).toMatch(/<input[^>]*id="formulario-asistencia-campo-ubicacion"[^>]*readonly/);
    expect(html).toContain('Llamá al 140 y dictá tu ubicación');
    expect(html).toContain('no se guarda');
  });
  // Spec §10.2 punto 3: la página promete que el formulario arma el texto para copiar. Tiene que poder escribirse.
  it('el formulario cumple lo que la página promete: campos habilitados y texto armado para copiar', async () => {
    const html = await render();
    expect(html).toContain('data-modo="copiar"');
    expect(html).not.toMatch(/<fieldset[^>]*\sdisabled[\s>]/);
    expect(html).not.toMatch(/<button type="submit" disabled/);
    expect(html).toContain('Armar el texto para copiar');
    expect(html).toContain('data-copiar-texto');
    expect(html).not.toContain('Los formularios se habilitan');
  });
});
