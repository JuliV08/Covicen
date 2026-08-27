import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import TablaTarifas from '@/components/TablaTarifas.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('TablaTarifas', () => {
  it('tabla accesible con vigencia visible, 6 filas y "a confirmar" donde no hay valor', async () => {
    const c = await AstroContainer.create();
    // Intl separa "$" del número con un espacio no separable (U+00A0 o U+202F): se normaliza con escapes, no con literales.
    const html = (await c.renderToString(TablaTarifas, { props: { tarifario: await fuenteLocalJson.tarifario() } })).replace(/[\u00A0\u202F]/g, ' ');
    expect(html).toContain('<caption');
    expect(html).toContain('scope="col"');
    expect(html.match(/<tr class="fila/g)?.length).toBe(6);
    expect(html).toContain('Vigencia');
    expect(html).toContain('$ 1.399');
    expect(html.match(/a confirmar/g)?.length).toBe(5);
  });
});
