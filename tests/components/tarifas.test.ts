import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import TablaTarifas from '@/components/TablaTarifas.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('TablaTarifas', () => {
  it('por estación: cinco filas, TelePASE y pago manual con el mismo precio hoy, público grande y sin IVA como anotación', async () => {
    const c = await AstroContainer.create();
    const [tarifario, tramo] = await Promise.all([fuenteLocalJson.tarifario(), fuenteLocalJson.tramo()]);
    const cabina = tramo.cabinas.find((x) => x.slug === 'franck')!;
    // Intl separa "$" del número con un espacio no separable (U+00A0 o U+202F): se normaliza con escapes, no con literales.
    const html = (await c.renderToString(TablaTarifas, { props: { tarifario, cabina, id: 'franck' } })).replace(/[\u00A0\u202F]/g, ' ');
    expect(html).toContain('id="franck"');
    expect(html).toContain('Estación Franck · RN 19 km 19,95');
    expect(html).toContain('<caption');
    expect(html).toContain('>TelePASE<');
    expect(html).toContain('>Pago electrónico o manual<');
    expect(html.match(/<tr class="fila/g)?.length).toBe(5);
    expect(html.match(/\$ 1\.500</g)?.length).toBe(2);
    expect(html).toContain('$ 1.239,67 sin IVA');
    expect(html).toContain('Vigencia: desde el 26 de febrero de 2026');
    expect(html).toContain('Resolución 248/2026');
    expect(html).toContain('en oportunidad de contar con todas las vías automáticas');
    expect(html).not.toMatch(/a confirmar/i);
  });
  it('sin valor publicado: guion visible y texto solo para lectores, sin aria-label en spans', async () => {
    const c = await AstroContainer.create();
    const tarifario = await fuenteLocalJson.tarifario();
    const nulo = { ...tarifario, tarifas: [{ ...tarifario.tarifas[0]!, montoSinIva: null, montoManualSinIva: null }] };
    const html = await c.renderToString(TablaTarifas, { props: { tarifario: nulo } });
    expect(html.match(/sr-only[^>]*>Sin valor publicado</g)?.length).toBe(2);
    expect(html).not.toContain('aria-label="Sin valor publicado"');
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
