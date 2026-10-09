import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Privacidad from '@/pages/privacidad.astro';

describe('/privacidad/', () => {
  // El pie de cada formulario manda a leer esta página, y /asistencia/ pide la ubicación del celular:
  // si no está enumerada acá, la política no dice todo lo que el sitio recibe.
  it('enumera la ubicación del celular que pide /asistencia/, con su condición y su límite', async () => {
    const html = await (await AstroContainer.create()).renderToString(Privacidad, { request: new Request('https://covicen.test/privacidad/') });
    expect(html).toMatch(/<h2[^>]*>Ubicación<\/h2>/);
    expect(html).toContain('href="/asistencia/"');
    expect(html).toContain('No se guarda en ningún lado');
    expect(html).toContain('permiso');
  });

  // 01/10/2026: el formulario de reclamos de /contacto/ es el de Bitrix24, que guarda un identificador en el navegador
  // y cuenta visitas. La política decía «no usa cookies de terceros ni herramientas de seguimiento» sin excepciones.
  it('dice que el formulario de Contacto es de Bitrix24 y qué guarda, en vez de negar todo seguimiento', async () => {
    const html = await (await AstroContainer.create()).renderToString(Privacidad, { request: new Request('https://covicen.test/privacidad/') });
    expect(html).toMatch(/<h2[^>]*>Formulario de Contacto<\/h2>/);
    expect(html, 'Proveedores está escondida').not.toContain('/proveedores/');
    expect(html).toContain('Bitrix24');
    expect(html).toContain('identificador');
    expect(html).toContain('href="/contacto/"');
    expect(html).not.toContain('no usa cookies de terceros ni herramientas de seguimiento');
  });
});
