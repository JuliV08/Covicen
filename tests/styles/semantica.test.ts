import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listar = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? listar(p) : [p]; });
const archivos = ['src/components', 'src/pages', 'src/layouts'].flatMap(listar).map((p) => p.replace(/\\/g, '/')).filter((p) => p.endsWith('.astro'));
// `text-fondo` sobre amarillo/acento se vuelve invisible en claro: el texto encima de vial es sobre-vial, encima de acento es sobre-acento.
// `text-vial` como color de texto no llega a 4.5:1 en claro: el amarillo como texto es vial-texto.
const prohibido = /\btext-fondo(?:-2)?(?:\/\d+)?\b|\btext-vial(?!-texto)\b/;

describe('semántica de color', () => {
  it.each(archivos)('%s no usa text-fondo ni text-vial como color de texto', (archivo) => {
    const culpables = readFileSync(archivo, 'utf8').split('\n').map((l, i) => (prohibido.test(l) ? `${i + 1}: ${l.trim()}` : null)).filter(Boolean);
    expect(culpables, culpables.join('\n')).toEqual([]);
  });
});
