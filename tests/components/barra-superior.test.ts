import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BarraSuperior from '@/components/BarraSuperior.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async (avisos: unknown[]) => {
  const c = await AstroContainer.create();
  return c.renderToString(BarraSuperior, { props: { avisos, contacto: await fuenteLocalJson.contacto() } });
};

describe('BarraSuperior', () => {
  it('muestra el primer anuncio visible, los demás ocultos, y controles si hay más de uno', async () => {
    const html = await render([{ id: 'a', texto: 'Primero', tono: 'vial' }, { id: 'b', texto: 'Segundo', tono: 'info', url: '/tarifas' }]);
    expect(html).toContain('data-anuncios');
    expect(html.match(/data-anuncio[\s>]/g)?.length).toBe(2);
    expect(html).toMatch(/<li[^>]*data-anuncio[^>]*hidden/);
    expect(html).toContain('href="/tarifas/"');
    expect(html).toContain('aria-label="Anuncio siguiente"');
  });
  it('con un solo anuncio no hay controles; sin anuncios no hay sección de anuncios', async () => {
    expect(await render([{ id: 'a', texto: 'Solo', tono: 'info' }])).not.toContain('aria-label="Anuncio siguiente"');
    expect(await render([{ id: 'a', texto: 'Solo', tono: 'info' }])).not.toContain('data-pausa');
    expect(await render([])).not.toContain('data-anuncios');
  });
  // WCAG 2.2.2 (pausar, detener, ocultar): la barra rota sola cada 6 s, así que necesita un botón para frenarla.
  it('con más de un anuncio hay botón de pausa con etiqueta para cada estado y la lista anuncia el cambio', async () => {
    const html = await render([{ id: 'a', texto: 'Primero', tono: 'vial' }, { id: 'b', texto: 'Segundo', tono: 'info' }]);
    expect(html).toContain('data-pausa');
    expect(html).toContain('aria-label="Pausar los anuncios"');
    expect(html).toContain('data-reanudar="Reanudar los anuncios"');
    expect(html).toMatch(/data-pista[^>]*aria-live="polite"/);
  });
  it('accesos: TelePASE externo, Mi cuenta a Medios de pago mientras no haya oficina virtual, y el interruptor', async () => {
    const html = await render([]);
    expect(html).toMatch(/href="https:\/\/www\.telepase\.com\.ar\/"[^>]*target="_blank"/);
    expect(html).toContain('href="/medios-de-pago/#mi-cuenta"');
    expect(html).toContain('data-tema-boton');
  });
  it('los avisos del repo validan y hoy hay al menos el del 140', async () => {
    const avisos = await fuenteLocalJson.avisos();
    expect(avisos.map((a) => a.id)).toContain('emergencias-140');
  });
});
