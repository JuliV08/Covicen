import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import QuienesSomos from '@/pages/quienes-somos.astro';
import { publicado } from '@/lib/publicado';

const render = async () => (await AstroContainer.create()).renderToString(QuienesSomos, { request: new Request('https://covicen.test/quienes-somos/') });

describe('/quienes-somos/', () => {
  // La sección se titulaba "Ocho compromisos que se pueden exigir": lo que diga tiene que ser exigible tal cual.
  // El PETG 54.5 compromete 30 minutos en al menos el 90 % de las ocurrencias mensuales y 40 como techo (livianos),
  // 60 y 72 (pesados). "30 para livianos, 60 para pesados" es una promesa incondicional que el contrato no da, y
  // además contradice lo que la misma web publica en /servicios/. Desde el 02/10/2026 la sección está escondida
  // (publicado.queAsumimos), así que el texto se mira en la fuente: es el que vuelve el día que se prenda.
  it('el compromiso de auxilio publica los tiempos de grúa como los publica servicios.json', () => {
    const fuente = readFileSync('src/pages/quienes-somos.astro', 'utf8');
    expect(fuente).toContain('30 minutos en al menos el 90 % de los casos, y nunca más de 40');
    expect(fuente).toContain('60 minutos en al menos el 90 % de los casos, y nunca más de 72');
    expect(fuente).not.toMatch(/30 minutos para livianos/);
  });

  // Reunión con el gerente del 01/10/2026: «Qué asume Covicen» y «Quién nos controla» se esconden, y la descripción
  // para buscadores deja de ofrecerlas.
  it('no publica «Qué asume» ni «Quién nos controla», ni las ofrece en Google', async () => {
    expect(publicado.queAsumimos || publicado.quienNosControla, 'se prendió una: revisar este test').toBe(false);
    const html = await render();
    for (const rastro of ['Qué asume Covicen', 'Quién nos controla', 'Vialidad Nacional, con indicadores', 'Misión.', 'Visión.']) {
      expect(html, `quedó «${rastro}»`).not.toContain(rastro);
    }
    const descripcion = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(descripcion).not.toMatch(/asum|controla/i);
  });

  // El texto de arriba se reescribió con Corresur de ejemplo: ni la resolución ni la «sociedad en formación».
  it('el texto de arriba es el nuevo, con los datos del contrato', async () => {
    const html = await render();
    expect(html).toContain('una ruta es mucho más que asfalto');
    expect(html).toContain('7 de octubre de 2026');
    expect(html).toContain('679,03 km de las rutas nacionales 9, 19 y 34');
    expect(html).not.toContain('Nacimos de tres empresas');
    expect(html).not.toContain('La sociedad está en formación');
  });

  // Pedido del 01/10/2026: cada tarjeta del consorcio lleva a la web de su empresa, en otra pestaña.
  it('las tres tarjetas del consorcio llevan a la web de cada empresa', async () => {
    const html = await render();
    for (const url of ['https://www.afema.com.ar/', 'https://pablofederico.com.ar/', 'https://www.guidomogetta.com.ar/']) {
      const enlace = new RegExp(`<a href="${url.replace(/[.]/g, '\\.')}"[^>]*>`).exec(html)?.[0] ?? '';
      expect(enlace, `falta el enlace a ${url}`).not.toBe('');
      expect(enlace).toContain('rel="noopener noreferrer"');
      expect(enlace).toContain('target="_blank"');
      expect(enlace).toContain('se abre en otra pestaña');
    }
  });
});
