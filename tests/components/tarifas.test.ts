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

  it('solo enlaza la fuente si es http(s); con otra cosa muestra el nombre como texto', async () => {
    const c = await AstroContainer.create();
    const base = await fuenteLocalJson.tarifario();
    for (const url of ['javascript:alert(1)', 'data:text/html,hola']) {
      const html = await c.renderToString(TablaTarifas, { props: { tarifario: { ...base, fuente: { nombre: 'Res. 1/2026', url } } } });
      const { document } = parseHTML(html);
      expect([...document.querySelectorAll('a')].some((a) => a.getAttribute('href') === url)).toBe(false);
      expect(html).toContain('Res. 1/2026');
    }
    const ok = await c.renderToString(TablaTarifas, { props: { tarifario: { ...base, fuente: { nombre: 'Res. 1/2026', url: 'https://boletinoficial.gob.ar/x' } } } });
    expect(parseHTML(ok).document.querySelector('a[href="https://boletinoficial.gob.ar/x"]')).not.toBeNull();
  });

  it('muestra el "con IVA" que manda el sistema cuando viene, y lo calcula si no', async () => {
    const c = await AstroContainer.create();
    const base = await fuenteLocalJson.tarifario();
    const tarifas = base.tarifas.map((t) => (t.categoria === 'cat-2' ? { ...t, montoSinIva: 1399, montoConIva: 1692.79 } : t));
    const html = (await c.renderToString(TablaTarifas, { props: { tarifario: { ...base, tarifas } } })).replace(/[  ]/g, ' ');
    expect(html).toContain('1.692,79');
  });
});
