import { existsSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const gz = (p: string) => (existsSync(p) ? gzipSync(readFileSync(p)).length : 0);
const animacion = ['src/scripts/revelar.ts', 'src/scripts/spotlight.ts', 'src/scripts/contador.ts'];
const todos = [...animacion, 'src/scripts/menu.ts', 'src/scripts/cuenta-regresiva.ts', 'src/scripts/formulario.ts'];

describe('presupuesto', () => {
  it('los scripts de animación pesan menos de 3 KB gz en total', () => {
    expect(animacion.reduce((s, p) => s + gz(p), 0)).toBeLessThan(3072);
  });
  it('todos los scripts de cliente (fuente) pesan menos de 6 KB gz en total', () => {
    expect(todos.reduce((s, p) => s + gz(p), 0)).toBeLessThan(6144);
  });
  it('el isotipo SVG pesa menos de 12 KB', () => {
    expect(statSync('src/assets/marca/isotipo.svg').size).toBeLessThan(12 * 1024);
  });
});
