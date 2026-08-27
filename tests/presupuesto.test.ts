import { existsSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const gz = (p: string) => (existsSync(p) ? gzipSync(readFileSync(p)).length : 0);
const animacion = ['src/scripts/revelar.ts', 'src/scripts/spotlight.ts', 'src/scripts/contador.ts', 'src/scripts/parallax-2d.ts', 'src/scripts/grilla-cinetica.ts', 'src/scripts/flip.ts'];
const todos = [...animacion, 'src/scripts/menu.ts', 'src/scripts/cuenta-regresiva.ts', 'src/scripts/formulario.ts'];

describe('presupuesto', () => {
  // 6 → 9 KB al sumar la grilla cinética y el flip (pedidos de Juli, 2026-08-27). Sigue muy por debajo de los 30 KB del spec.
  it('los scripts de animación pesan menos de 9 KB gz en total', () => {
    expect(animacion.reduce((s, p) => s + gz(p), 0)).toBeLessThan(9216);
  });
  it('todos los scripts de cliente (fuente) pesan menos de 12 KB gz en total', () => {
    expect(todos.reduce((s, p) => s + gz(p), 0)).toBeLessThan(12288);
  });
  it('el isotipo SVG pesa menos de 12 KB', () => {
    expect(statSync('src/assets/marca/isotipo.svg').size).toBeLessThan(12 * 1024);
  });
  it('el mapa de profundidad del hero pesa menos de 20 KB', () => {
    expect(statSync('src/assets/atmosfera/hero-ruta-nocturna.profundidad.png').size).toBeLessThan(20 * 1024);
  });
});
