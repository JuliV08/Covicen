import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listar = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? listar(p) : [p]; });
const archivos = ['src/components', 'src/pages', 'src/layouts', 'src/styles'].flatMap(listar).map((p) => p.replace(/\\/g, '/')).filter((p) => /\.(astro|css)$/.test(p));
const lineasCon = (archivo: string, re: RegExp) => readFileSync(archivo, 'utf8').split('\n').map((l, i) => (re.test(l) ? `${archivo}:${i + 1}: ${l.trim()}` : null)).filter(Boolean) as string[];

// Pliego 61.7: cuerpo ≥ 14 px en contenido, 12 px solo en anotaciones (clase .anotacion), sin justificado, enlaces subrayados.
// "Menor a 12 px" = hasta 0,749rem o hasta 11px; 0,75rem (= 12 px, lo que usa .eyebrow) es válido y queda afuera a propósito.
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
  // El mapa es un SVG con viewBox de 820 unidades de ancho que el CSS escala: sus font-size NO son píxeles.
  // Ancho real más grande en el que se dibuja: El tramo, contenedor 80rem = 1280 px − 2 × 40 px del panel = 1200;
  // la grilla lg:[1.6fr_1fr] con gap de 2rem le deja 1168 × 1,6 / 2,6 ≈ 719 px. Escala 719/820 ≈ 0,877, así que
  // 12 unidades se ven a 10,5 px. Para no bajar de 12 px hacen falta 12 / 0,877 ≈ 13,7 ⇒ 14 unidades.
  const ANCHO_RENDER = 719;
  it('el texto del mapa, ya escalado por el viewBox, no baja de 12 px', () => {
    const fuente = readFileSync('src/components/ilustraciones/MapaTramo.astro', 'utf8');
    const ancho = Number(/viewBox="0 0 (\d+)/.exec(fuente)?.[1]);
    expect(ancho).toBeGreaterThan(0);
    const escala = ANCHO_RENDER / ancho;
    const tamanos = [...fuente.matchAll(/(\S+)\s*\{[^}]*font-size:\s*(\d+(?:\.\d+)?)px/g)];
    expect(tamanos.length).toBeGreaterThan(0);
    const culpables = tamanos.filter(([, , px]) => Number(px) * escala < 12).map(([, sel, px]) => `${sel}: ${px} unidades = ${(Number(px) * escala).toFixed(1)} px`);
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
