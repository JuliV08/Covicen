import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import TarjetaEstacion from '@/components/TarjetaEstacion.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async (slug: string, props: Record<string, unknown> = {}) => {
  const cabina = (await fuenteLocalJson.tramo()).cabinas.find((c) => c.slug === slug)!;
  return (await AstroContainer.create()).renderToString(TarjetaEstacion, { props: { cabina, ...props } });
};

describe('TarjetaEstacion', () => {
  it('operativa: verde, vías, sentido, servicios con ícono, link a su cuadro y al 140', async () => {
    const html = await render('carcarana');
    expect(html).toContain('data-estacion-tarjeta="carcarana"');
    expect(html).toContain('>Operativa<');
    expect(html).toContain('bg-ok');
    expect(html).toContain('>10<');
    expect(html).toContain('Cobra en ambos sentidos');
    expect(html).toContain('Área de descanso');
    expect(html).toContain('href="/tarifas/#carcarana"');
    expect(html).toContain('href="/peajes/carcarana/"');
    expect(html).toContain('href="tel:140"');
  });
  it('próxima: amarilla, sin cuadro, con la aclaración de que todavía no cobra', async () => {
    const html = await render('leones');
    expect(html).toContain('Próxima · Free Flow');
    expect(html).not.toContain('href="/tarifas/#leones"');
    expect(html).toContain('Cobra cuando Vialidad Nacional la habilite');
    expect(html).not.toContain('Área de descanso');
  });
  it('completa: sin el link a la ficha, con h2', async () => {
    const html = await render('franck', { completa: true, nivel: 'h2' });
    expect(html).not.toContain('Ficha completa');
    expect(html).toContain('<h2');
  });
});
