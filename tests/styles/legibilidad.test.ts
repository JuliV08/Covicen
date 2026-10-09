import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listar = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? listar(p) : [p]; });
const archivos = ['src/components', 'src/pages', 'src/layouts', 'src/styles'].flatMap(listar).map((p) => p.replace(/\\/g, '/')).filter((p) => /\.(astro|css)$/.test(p));
const lineasCon = (archivo: string, re: RegExp) => readFileSync(archivo, 'utf8').split('\n').map((l, i) => (re.test(l) ? `${archivo}:${i + 1}: ${l.trim()}` : null)).filter(Boolean) as string[];

// Pliego 61.7: cuerpo ≥ 14 px en contenido, 12 px solo en anotaciones (clase .anotacion) y volantas (.eyebrow: una
// volanta es una anotación por definición), sin justificado, enlaces subrayados.
// "Menor a 12 px" = hasta 0,749rem o hasta 11px; 0,75rem (= 12 px) es válido, pero solo en esas dos clases.
const menorA12px = String.raw`0\.[0-6]\d*rem|0\.7[0-4]\d*rem|0\.7rem\b|1[01]px|[0-9]px`;
describe('legibilidad (pliego 61.7)', () => {
  it('no hay tamaños menores a 12 px', () => {
    const culpables = archivos.flatMap((a) => lineasCon(a, new RegExp(String.raw`text-\[(${menorA12px})\]|font-size:\s*(${menorA12px})\b`)));
    expect(culpables, culpables.join('\n')).toEqual([]);
  });
  it('text-xs (12 px) solo en anotaciones', () => {
    const culpables = archivos.flatMap((a) => lineasCon(a, /\btext-xs\b/)).filter((l) => !/\banotacion\b/.test(l));
    expect(culpables, culpables.join('\n')).toEqual([]);
  });
  // Misma regla del lado del CSS: sin esto, `font-size: 0.75rem` a mano se cuela sin marcar el texto como anotación.
  it('los 12 px escritos en CSS (0,75rem) solo en .anotacion o .eyebrow', () => {
    const culpables = archivos
      .flatMap((a) => lineasCon(a, /font-size:\s*0\.75rem|text-\[0\.75rem\]|text-\[12px\]/))
      .filter((l) => !/\b(anotacion|eyebrow)\b/.test(l));
    expect(culpables, culpables.join('\n')).toEqual([]);
  });
  // El mapa es un SVG que el CSS escala: sus font-size son unidades del dibujo, NO píxeles. Desde la fase C (05/10/2026)
  // se encuadra sobre lo dibujado (encuadreDelMapa) y ocupa todo el panel, así que se mira a la escala más chica de cada
  // tramo de pantalla. Fuera de @media, desde 768 px (más angosto, los rótulos de estación se esconden salvo el elegido):
  // el mapa mide 768 − 40 (contenedor) − 2 × 23 (relleno del panel) ≈ 682 px. En @media (min-width: 64rem), desde 1024:
  // 1024 − 40 − 2 × 30,7 ≈ 922 px. En @media (min-width: 80rem), desde 1280, el mapa comparte el panel (casi de borde a
  // borde) con la columna de 22rem: 1280 − 48 − 2 × 38,4 − 352 − 40 ≈ 763 px.
  it('el texto del mapa, ya escalado, no baja de 12 px en ningún tramo de pantalla', async () => {
    const { encuadreDelMapa } = await import('@/lib/tramo');
    const { fuenteLocalJson } = await import('@/lib/datos/fuentes/local-json');
    const ancho = encuadreDelMapa(await fuenteLocalJson.tramo()).ancho;
    const fuente = readFileSync('src/components/ilustraciones/MapaTramo.astro', 'utf8');
    const estilo = /<style>([\s\S]*)<\/style>/.exec(fuente)?.[1] ?? '';
    const grande = /@media \(min-width: 64rem\) \{([\s\S]*?)\n {2}\}/.exec(estilo)?.[1] ?? '';
    const columna = /@media \(min-width: 80rem\) \{([\s\S]*?)\n {2}\}/.exec(estilo)?.[1] ?? '';
    expect(grande, 'falta el bloque de pantalla grande').not.toBe('');
    expect(columna, 'falta el bloque de columna y mapa').not.toBe('');
    const medir = (css: string, escala: number) => [...css.matchAll(/(\S+)\s*\{[^}]*font-size:\s*(\d+(?:\.\d+)?)px/g)]
      .filter(([, , px]) => Number(px) * escala < 12)
      .map(([, sel, px]) => `${sel}: ${px} unidades = ${(Number(px) * escala).toFixed(1)} px`);
    const culpables = [...medir(estilo.replace(grande, '').replace(columna, ''), 682 / ancho), ...medir(grande, 922 / ancho), ...medir(columna, 763 / ancho)];
    expect(culpables, culpables.join('\n')).toEqual([]);
  });
  it('sin texto justificado', () => {
    const culpables = archivos.flatMap((a) => lineasCon(a, /text-justify|text-align:\s*justify/));
    expect(culpables).toEqual([]);
  });
  it('los enlaces de texto van subrayados por regla global y ya no existe link-crece', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toMatch(/a:not\([^)]*\)[^{]*\{[^}]*text-decoration:\s*underline/);
    expect(archivos.flatMap((a) => lineasCon(a, /link-crece/))).toEqual([]);
  });
  it('los párrafos largos se separan 1,5 veces el interlineado', () => {
    expect(readFileSync('src/styles/global.css', 'utf8')).toContain('margin-block-start: 1.5lh');
  });
});
