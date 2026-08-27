import { existsSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const gz = (p: string) => (existsSync(p) ? gzipSync(readFileSync(p)).length : 0);

describe('presupuesto', () => {
  it('los scripts de animación pesan menos de 2 KB gz en total', () => {
    const total = ['src/scripts/revelar.ts', 'src/scripts/menu.ts'].reduce((s, p) => s + gz(p), 0);
    expect(total).toBeLessThan(2048);
  });
  it('todos los scripts de cliente (fuente) pesan menos de 4 KB gz en total', () => {
    const total = ['src/scripts/revelar.ts', 'src/scripts/menu.ts', 'src/scripts/cuenta-regresiva.ts', 'src/scripts/formulario.ts'].reduce((s, p) => s + gz(p), 0);
    expect(total).toBeLessThan(4096);
  });
  it('el isotipo SVG pesa menos de 12 KB', () => {
    expect(statSync('src/assets/marca/isotipo.svg').size).toBeLessThan(12 * 1024);
  });
});
