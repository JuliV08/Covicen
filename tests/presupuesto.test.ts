import { existsSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const gz = (p: string) => (existsSync(p) ? gzipSync(readFileSync(p)).length : 0);
const animacion = ['src/scripts/revelar.ts', 'src/scripts/spotlight.ts', 'src/scripts/contador.ts', 'src/scripts/parallax-2d.ts'];
const todos = [...animacion, 'src/scripts/menu.ts', 'src/scripts/cuenta-regresiva.ts', 'src/scripts/formulario.ts'];

describe('presupuesto', () => {
  // Subió de 3 a 6 KB al sumar el parallax 2.5D (WebGL) del hero, pedido por Juli el 2026-08-27.
  it('los scripts de animación pesan menos de 6 KB gz en total', () => {
    expect(animacion.reduce((s, p) => s + gz(p), 0)).toBeLessThan(6144);
  });
  it('todos los scripts de cliente (fuente) pesan menos de 9 KB gz en total', () => {
    expect(todos.reduce((s, p) => s + gz(p), 0)).toBeLessThan(9216);
  });
  it('el isotipo SVG pesa menos de 12 KB', () => {
    expect(statSync('src/assets/marca/isotipo.svg').size).toBeLessThan(12 * 1024);
  });
  it('el mapa de profundidad del hero pesa menos de 20 KB', () => {
    expect(statSync('src/assets/atmosfera/hero-ruta-nocturna.profundidad.png').size).toBeLessThan(20 * 1024);
  });
});
