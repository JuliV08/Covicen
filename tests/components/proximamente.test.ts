import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Proximamente from '@/layouts/Proximamente.astro';

const render = async () => (await AstroContainer.create()).renderToString(Proximamente as never, {});

// Esta pantalla es lo único que ve el público hasta que salga la primera versión. Lo que se prueba acá no es cómo
// se ve: es que diga lo que tiene que decir y que NO traiga el resto del sitio colgando.
describe('portada de «Próximamente»', () => {
  it('dice Próximamente, con un solo h1', async () => {
    const html = await render();
    expect(html).toContain('Próximamente');
    expect(html.match(/<h1/g)?.length).toBe(1);
  });

  it('deja el 140 a un toque: es una concesionaria vial, no puede ser una pantalla muerta', async () => {
    const html = await render();
    expect(html).toContain('href="tel:140"');
    expect(html).toContain('Las 24 horas, los 365 días del año');
  });

  // Hasta el 04/10/2026 el 0800 no existía y la portada no lo anunciaba. Desde el 05/10 tiene número.
  it('anuncia la línea 0800 de atención al usuario', async () => {
    const html = await render();
    expect(html).toContain('href="tel:08005552224"');
    expect(html).toContain('0800 555 2224');
  });

  it('dice quién es Covicen y el largo oficial del tramo', async () => {
    const html = await render();
    expect(html).toContain('679,03');
    expect(html).toContain('Tramo Centro');
  });

  // El 28/09/2026 avisaron que el inicio de actividades es el 7 de octubre, no el 5. La fecha sale del dato
  // (empresa.concesion.inicioOperacion): esta es la pantalla que está en producción, así que se fija acá.
  // Se mira hasta «Última actualización», que lleva la fecha del build: «15 de octubre de 2026» contiene «5 de
  // octubre», y este test fallaba los días 5, 15 y 25 de octubre, también en el build de producción (amplify.yml
  // corre los tests). Lo encontró la revisión del 01/10/2026 simulando la fecha.
  it('anuncia el inicio de actividades el 7 de octubre', async () => {
    const html = (await render()).split('Última actualización')[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(html).toContain('Operación desde el 7 de octubre de 2026');
    expect(html).not.toContain('5 de octubre');
  });

  it('no trae el sitio colgando: ni menú, ni pie, ni cinta de avisos', async () => {
    const html = await render();
    // 'Trabajá con nosotros' era uno de los centinelas y esa página se eliminó del sitio el 20/09/2026: un
    // centinela que ya no existe en ningún lado no prueba nada. Se reemplaza por 'Proveedores', que sí existe.
    for (const rastro of ['nav-item', 'Preguntas frecuentes', 'marquesina', 'Proveedores', 'Medios de pago']) {
      expect(html).not.toContain(rastro);
    }
  });

  it('el único enlace interno es el salto al contenido: todo lo demás está despublicado', async () => {
    const html = await render();
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]!);
    const internos = hrefs.filter((h) => !h.startsWith('http') && !h.startsWith('tel:') && !h.startsWith('data:'));
    // Quedan los del <head> (canonical, iconos, sitemap, fuente) y el salto; ninguna página del sitio.
    expect(internos.filter((h) => h.endsWith('/') && h !== '/')).toEqual([]);
    expect(internos).toContain('#contenido');
  });

  it('conserva el salto al contenido y su destino', async () => {
    const html = await render();
    expect(html).toContain('href="#contenido"');
    expect(html).toContain('id="contenido"');
  });

  it('lleva la fecha de última actualización, como el resto del sitio', async () => {
    const html = await render();
    expect(html).toContain('Última actualización');
  });
});
