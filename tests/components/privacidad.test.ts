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
});
