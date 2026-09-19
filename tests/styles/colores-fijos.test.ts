import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listar = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? listar(p) : [p]; });
const raices = ['src/components', 'src/pages', 'src/layouts', 'src/styles', 'src/scripts'];
// Únicas excepciones: los tokens, el isotipo (es el logo) y el único módulo que arma cadenas rgb para canvas.
const permitidos = new Set(['src/styles/tokens.css', 'src/components/marca/Isotipo.astro', 'src/scripts/lib/color.ts']);
const archivos = raices.flatMap(listar).map((p) => p.replace(/\\/g, '/')).filter((p) => /\.(astro|css|ts)$/.test(p) && !permitidos.has(p));
const fijo = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

describe('colores fijos', () => {
  it.each(archivos)('%s no escribe colores a mano: usa tokens', (archivo) => {
    const culpables = readFileSync(archivo, 'utf8').split('\n').map((l, i) => (fijo.test(l) ? `${i + 1}: ${l.trim()}` : null)).filter(Boolean);
    expect(culpables, culpables.join('\n')).toEqual([]);
  });
});
