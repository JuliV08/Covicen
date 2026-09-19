import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import TablaTarifas from '@/components/TablaTarifas.astro';
import TarifaDestacada from '@/components/home/TarifaDestacada.astro';
import Tarifas from '@/pages/tarifas.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('TablaTarifas', () => {
  it('por estación: cinco filas, TelePASE y pago manual con el mismo precio hoy, público grande y sin IVA como anotación', async () => {
    const c = await AstroContainer.create();
    const [tarifario, tramo] = await Promise.all([fuenteLocalJson.tarifario(), fuenteLocalJson.tramo()]);
    const cabina = tramo.cabinas.find((x) => x.slug === 'franck')!;
    // Intl separa "$" del número con un espacio no separable (U+00A0 o U+202F): se normaliza con escapes, no con literales.
    const html = (await c.renderToString(TablaTarifas, { props: { tarifario, cabina, id: 'franck' } })).replace(/[\u00A0\u202F]/g, ' ');
    expect(html).toContain('id="franck"');
    // El header es fijo (--alto-header: 7rem): sin scroll-margin, al llegar por la nav interna o por "Ver su cuadro
    // tarifario" el nombre de la estación y la vigencia quedan tapados y se aterriza sobre un thead idéntico al de las otras.
    expect(html).toMatch(/<div class="[^"]*\bscroll-mt-32\b[^"]*" id="franck"/);
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

  // Hoy las dos columnas son el mismo precio (spec §2 y §8.1). Si TelePASE usa el con-IVA del sistema y la columna
  // manual siempre lo recalcula, un con-IVA que no siga el redondeo al peso parte la fila en dos números distintos.
  it('con el mismo sin IVA en las dos columnas, las dos celdas muestran el mismo precio al público', async () => {
    const c = await AstroContainer.create();
    const base = await fuenteLocalJson.tarifario();
    const tarifas = base.tarifas.map((t) => (t.categoria === 'cat-2' ? { ...t, montoSinIva: 1399, montoManualSinIva: 1399, montoConIva: 1692.79 } : t));
    const html = (await c.renderToString(TablaTarifas, { props: { tarifario: { ...base, tarifas } } })).replace(/[  ]/g, ' ');
    const fila = /<tr class="fila[\s\S]*?Categoría 2[\s\S]*?<\/tr>/.exec(html)?.[0] ?? '';
    expect(fila.match(/\$ 1\.692,79</g)?.length).toBe(2);
    expect(fila).not.toMatch(/\$ 1\.693</);
  });
});

// La URL de la fuente del tarifario la va a mandar el backend (FUENTE_DATOS=api). Además del contrato, cada
// componente que la mete en un href pasa por esHttp: la misma regla que ya cumplía TablaTarifas.
describe('TarifaDestacada', () => {
  const render = async (tarifario: unknown) => (await AstroContainer.create()).renderToString(TarifaDestacada, { props: { tarifario } });

  it('enlaza la resolución cuando la fuente es http(s)', async () => {
    const base = await fuenteLocalJson.tarifario();
    const html = await render({ ...base, fuente: { nombre: 'Res. 1/2026', url: 'https://boletinoficial.gob.ar/x' } });
    expect(parseHTML(html).document.querySelector('a[href="https://boletinoficial.gob.ar/x"]')).not.toBeNull();
  });

  it('con una URL que no es http(s) no emite el enlace', async () => {
    const base = await fuenteLocalJson.tarifario();
    for (const url of ['javascript:alert(1)', 'data:text/html,hola']) {
      const html = await render({ ...base, fuente: { nombre: 'Res. 1/2026', url } });
      expect([...parseHTML(html).document.querySelectorAll('a')].some((a) => a.getAttribute('href') === url), url).toBe(false);
      expect(html).toContain('Tarifario completo por categoría');
    }
  });

  // La tarjeta que gira es foco de teclado y los dos enlaces del dorso también: con :focus-visible la tarjeta volvía
  // al frente al tabular hacia ellos (foco sobre una cara con backface-visibility: hidden) y `outline: none` le ganaba
  // por especificidad al anillo global. Se prueba sobre la fuente porque el giro es CSS puro, sin navegador.
  it('el giro se sostiene mientras el foco esté adentro y la tarjeta conserva su anillo de foco', () => {
    const estilo = /<style>([\s\S]*)<\/style>/.exec(readFileSync('src/components/home/TarifaDestacada.astro', 'utf8'))?.[1] ?? '';
    expect(estilo).not.toMatch(/\.flip\s*\{[^}]*outline:\s*none/);
    expect(estilo).toContain('.flip:focus-within .flip-caras');
    expect(estilo).toContain('.flip:focus-within .flip-item');
    expect(estilo).not.toContain('.flip:focus-visible');
  });
});

describe('/tarifas/', () => {
  const render = async () => (await AstroContainer.create()).renderToString(Tarifas, { request: new Request('https://covicen.test/tarifas/') });

  // Spec §3.4: el exceso de carga (PETG 83) es el único dato de esa lista que no estaba publicado.
  it('publica el exceso de carga con los dos multiplicadores y su artículo', async () => {
    const visible = (await render()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    expect(visible).toContain('50 veces');
    expect(visible).toContain('100 veces');
    expect(visible).toContain('PETG art. 83');
    expect(visible).toContain('24.449');
  });

  it('enlaza el Boletín Oficial de la resolución vigente', async () => {
    const html = await render();
    expect(html).toContain('Ver en el Boletín Oficial');
    expect(html).toMatch(/href="https:\/\/[^"]*boletinoficial[^"]*"/i);
  });

  // No se puede inyectar un tarifario envenenado en la página (lee `datos`), así que se verifica que el href pase por
  // la guarda. El barrido de dist/ de scripts/verificar.ts es el otro candado, sobre el sitio entero.
  it('la URL de la fuente pasa por esHttp antes de ir a un href', () => {
    const fuente = readFileSync('src/pages/tarifas.astro', 'utf8');
    expect(fuente).toContain("import { esHttp, ruta } from '@/lib/rutas'");
    expect(fuente).toMatch(/esHttp\(tarifario\.fuente\.url\)/);
  });
});
