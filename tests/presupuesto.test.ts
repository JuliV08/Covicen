import { existsSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const gz = (p: string) => (existsSync(p) ? gzipSync(readFileSync(p)).length : 0);
const animacion = ['src/scripts/revelar.ts', 'src/scripts/spotlight.ts', 'src/scripts/contador.ts', 'src/scripts/parallax-2d.ts', 'src/scripts/grilla-cinetica.ts', 'src/scripts/flip.ts'];
const todos = [...animacion, 'src/scripts/menu.ts', 'src/scripts/cuenta-regresiva.ts', 'src/scripts/formulario.ts', 'src/scripts/tema.ts', 'src/scripts/lib/color.ts', 'src/scripts/rotacion.ts', 'src/scripts/mapa.ts', 'src/scripts/imprimir.ts', 'src/scripts/asistencia.ts', 'src/lib/asistencia.ts', 'src/lib/formulario.ts'];

describe('presupuesto', () => {
  // 6 → 9 KB al sumar la grilla cinética y el flip (pedidos de Juli, 2026-08-27). Sigue muy por debajo de los 30 KB del spec.
  it('los scripts de animación pesan menos de 9 KB gz en total', () => {
    expect(animacion.reduce((s, p) => s + gz(p), 0)).toBeLessThan(9216);
  });
  // 12 → 16 KB (2026-09-13): la actualización de la web suma tema, anuncios, mapa interactivo, carrusel y asistencia
  // (~4 KB gz según la spec §12) sobre una base que ya pesaba ~10 KB. El gate real sigue siendo el emitido (30 KB, verificar.ts).
  // 16 → 17 KB (2026-09-15): el arreglo de la rotación (recordar puntero y foco para no rearrancar al tocar los
  // controles) suma 102 bytes gz de CÓDIGO; los otros ~250 son el comentario que explica por qué. Esto mide la fuente,
  // comentarios incluidos, así que documentar sale caro acá y no le cuesta un byte al usuario: lo emitido no se movió.
  it('todos los scripts de cliente (fuente) pesan menos de 17 KB gz en total', () => {
    expect(todos.reduce((s, p) => s + gz(p), 0)).toBeLessThan(17408);
  });
  it('el isotipo SVG pesa menos de 12 KB', () => {
    expect(statSync('src/assets/marca/isotipo.svg').size).toBeLessThan(12 * 1024);
  });
  it('el mapa de profundidad del hero pesa menos de 20 KB', () => {
    expect(statSync('src/assets/atmosfera/hero-ruta-nocturna.profundidad.png').size).toBeLessThan(20 * 1024);
  });
});
