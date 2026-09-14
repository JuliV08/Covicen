import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Asistencia from '@/pages/asistencia.astro';

describe('/asistencia/', () => {
  it('primero el 140, después la ubicación y los datos mínimos; sin canal, dice la verdad', async () => {
    const html = await (await AstroContainer.create()).renderToString(Asistencia, { request: new Request('https://covicen.test/asistencia/') });
    expect(html.indexOf('href="tel:140"')).toBeLessThan(html.indexOf('data-ubicar'));
    expect(html).toContain('data-asistencia');
    expect(html).toContain('data-copiar');
    expect(html).toMatch(/<input[^>]*id="campo-ubicacion"[^>]*readonly/);
    expect(html).toContain('Llamá al 140 y dictá tu ubicación');
    expect(html).toContain('no se guarda');
  });
});
