import { existsSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

// Los comentarios no se descargan: el bundler los tira y al usuario no le cuestan un byte. Medirlos acá era premiar
// borrarlos, en un repo donde explicar el porqué es regla de la casa (llegaron a ser el 25 % del "presupuesto" y el
// techo se subió dos veces por eso). Se mide el código, y así el número vuelve a decir lo que dice que dice.
const sinComentarios = (fuente: string) =>
  fuente.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/^\s*[\r\n]/gm, '');
const gz = (p: string) => (existsSync(p) ? gzipSync(sinComentarios(readFileSync(p, 'utf8'))).length : 0);
const animacion = ['src/scripts/revelar.ts', 'src/scripts/spotlight.ts', 'src/scripts/contador.ts', 'src/scripts/parallax-2d.ts', 'src/scripts/grilla-cinetica.ts', 'src/scripts/flip.ts'];
const todos = [...animacion, 'src/scripts/menu.ts', 'src/scripts/formulario.ts', 'src/scripts/tema.ts', 'src/scripts/lib/color.ts', 'src/scripts/marquesina.ts', 'src/scripts/mapa.ts', 'src/scripts/imprimir.ts', 'src/scripts/asistencia.ts', 'src/lib/asistencia.ts', 'src/lib/formulario.ts', 'src/lib/disolvencia.ts', 'src/lib/puntero.ts'];

describe('presupuesto', () => {
  // 6 → 9 KB al sumar la grilla cinética y el flip (pedidos de Juli, 2026-08-27). Sigue muy por debajo de los 30 KB del spec.
  it('los scripts de animación pesan menos de 9 KB gz en total', () => {
    expect(animacion.reduce((s, p) => s + gz(p), 0)).toBeLessThan(9216);
  });
  // La spec §10.5 fijó 12 KB gz de fuente. La actualización de septiembre sumó tema, anuncios, mapa interactivo,
  // carrusel, asistencia, imprimir y la disolvencia del hero, y el techo se subió dos veces (a 16 y a 17 KB) porque la
  // medición contaba los comentarios. Midiendo solo código son 13 KB, así que el límite vuelve cerca de lo prometido.
  // El gate que le importa al usuario es el otro: el JS emitido, 30 KB en verificar.ts, hoy en 6,3.
  it('todos los scripts de cliente (código, sin comentarios) pesan menos de 14 KB gz en total', () => {
    expect(todos.reduce((s, p) => s + gz(p), 0)).toBeLessThan(14336);
  });
  it('el isotipo SVG pesa menos de 12 KB', () => {
    expect(statSync('src/assets/marca/isotipo.svg').size).toBeLessThan(12 * 1024);
  });
  it('el mapa de profundidad del hero pesa menos de 20 KB', () => {
    expect(statSync('src/assets/atmosfera/hero-ruta-nocturna.profundidad.png').size).toBeLessThan(20 * 1024);
  });
});
