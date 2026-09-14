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
    expect(await render([])).not.toContain('data-anuncios');
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
