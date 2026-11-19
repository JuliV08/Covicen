import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import EstadoTraza from '@/components/EstadoTraza.astro';

// Desde el 19/11/2026 el estado se consulta en vivo (spec del sistema 3, §8.6): el build emite el armazón y el navegador
// lo llena (scripts/estado-traza.ts → lib/estado-dom.ts, probado en tests/lib/estado-dom.test.ts con este mismo
// armazón). El estado nunca se decide en el build: una página estática que dijera «Sin avisos» lo seguiría diciendo
// horas después de un corte.
const URL_API = 'https://api.covicen.test/api/v1/estado-ruta/';
const FALLA = 'No pudimos consultar el estado de la ruta ahora. Probá de nuevo en unos minutos. Ante una emergencia, llamá al 140.';
const render = async (props: Record<string, unknown> = {}) =>
  (await AstroContainer.create()).renderToString(EstadoTraza, { props: { url: URL_API, rutas: ['RN 9', 'RN 19', 'RN 34'], ...props } });

describe('EstadoTraza', () => {
  it('el armazón trae la dirección, las rutas y los huecos que llena el navegador', async () => {
    const { document } = parseHTML(await render());
    const s = document.querySelector('section[aria-label="Estado de la traza"][data-estado-en-vivo]')!;
    expect(s).not.toBeNull();
    expect(s.getAttribute('data-url')).toBe(URL_API);
    expect(JSON.parse(s.getAttribute('data-rutas')!)).toEqual(['RN 9', 'RN 19', 'RN 34']);
    const lista = s.querySelector('[data-estado-lista]')!;
    expect(lista.getAttribute('aria-live')).toBe('polite');
    expect(lista.textContent).toContain('Consultando el estado de la ruta…');
    for (const hueco of ['[data-estado-error]', '[data-estado-programados]', '[data-estado-actualizado]']) {
      expect(s.querySelector(hueco)!.hasAttribute('hidden'), hueco).toBe(true);
    }
    expect(s.querySelector('[data-estado-programados] [data-estado-programados-lista]')).not.toBeNull();
    expect(s.querySelector('[data-estado-error]')!.textContent).toBe(FALLA);
    const iconos = [...s.querySelectorAll('template[data-icono]')].map((t) => t.getAttribute('data-icono'));
    expect(iconos.sort()).toEqual(['clima', 'incidente', 'mantenimiento', 'obra', 'transito']);
  });

  it('sin JS, el mensaje de falla; y debajo, siempre, qué se muestra y el 140', async () => {
    const html = await render();
    expect(html).toMatch(new RegExp(`<noscript>[\\s\\S]*${FALLA.replace(/[.?]/g, '\\$&')}[\\s\\S]*</noscript>`));
    const { document } = parseHTML(html);
    const aclaracion = [...document.querySelectorAll('p')].find((p) => p.textContent!.startsWith('Mostramos'))!;
    expect(aclaracion.textContent!.replace(/\s+/g, ' ')).toBe('Mostramos las obras, los cortes y los imprevistos que informa Covicen. Ante una emergencia, llamá al 140.');
    expect(aclaracion.querySelector('a[href="tel:140"]')).not.toBeNull();
    // Sin JS no hay consulta: «Consultando…» se esconde y queda solo el mensaje.
    expect(readFileSync('src/components/EstadoTraza.astro', 'utf8')).toMatch(/@media \(scripting: none\) \{ \[data-estado-consultando\] \{ display: none; \} \}/);
  });

  it('el build no decide el estado: ni «Normal», ni «Sin avisos», ni «Datos de ejemplo»', async () => {
    const html = await render();
    for (const t of ['Normal', 'Sin avisos', 'Datos de ejemplo', 'data-nivel=']) expect(html, t).not.toContain(t);
  });

  it('el título va en el nivel pedido y «Programado», uno más abajo', async () => {
    const enH2 = parseHTML(await render({ nivel: 'h2' })).document;
    expect(enH2.querySelector('h2')!.textContent).toBe('Estado de la traza');
    expect(enH2.querySelector('[data-estado-programados] h3')!.textContent).toBe('Programado');
    const enH3 = parseHTML(await render()).document;
    expect(enH3.querySelector('h3')!.textContent).toBe('Estado de la traza');
    expect(enH3.querySelector('[data-estado-programados] h4')!.textContent).toBe('Programado');
  });
});
