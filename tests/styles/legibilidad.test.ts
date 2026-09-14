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
