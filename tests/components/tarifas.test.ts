import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
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

describe('TablaTarifas con textos del sistema', () => {
  it('escapa el HTML que venga en los textos cargados por un operador (nunca set:html)', async () => {
    const c = await AstroContainer.create();
    const base = await fuenteLocalJson.tarifario();
    const tarifario = {
      ...base,
      vigencia: { ...base.vigencia, descripcion: '<b>peligro</b> desde hoy' },
      fuente: { ...base.fuente, nombre: '<script>x()</script> Resolución' },
      tarifas: base.tarifas.map((t) => ({ ...t, nota: '<img src=x onerror=alert(1)>' })),
      avisos: ['<b>aviso</b>'],
    };
    const html = await c.renderToString(TablaTarifas, { props: { tarifario } });
    // Lo que importa es el DOM resultante: el HTML inyectado tiene que quedar como texto, nunca como elemento.
    const { document } = parseHTML(html);
    expect(document.querySelector('b')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
    expect([...document.querySelectorAll('script')].some((s) => s.textContent?.includes('x()'))).toBe(false);
    expect(html).toContain('&lt;b&gt;peligro&lt;/b&gt; desde hoy');
    expect(html).toContain('&lt;script&gt;x()&lt;/script&gt; Resolución');
  });
});
