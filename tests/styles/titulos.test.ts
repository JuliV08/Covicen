import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { paresContraste } from '../../scripts/lib/pares';

// Títulos con el degradé de Covicen (fase A, 05/10/2026). CSS puro: el GradientText de reactbits que propuso Juli usa
// React y `motion`, y el sitio no tiene React.
const global = readFileSync('src/styles/global.css', 'utf8');
const impresion = readFileSync('src/styles/impresion.css', 'utf8');
const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regla = (css: string, selector: string) => new RegExp(`(?:^|[\\s}])${escapar(selector)}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

describe('títulos con degradé', () => {
  it('.titulo pinta texto → acento → texto, recortado a las letras y al ancho del texto, solo con variables', () => {
    const r = regla(global, '.titulo');
    expect(r).toContain('--titulo-b: var(--color-acento)');
    expect(r).toContain('linear-gradient(90deg, var(--color-texto) 0%, var(--titulo-b) 50%, var(--color-texto) 100%)');
    expect(r).toContain('background-clip: text');
    expect(r).toContain('color: transparent');
    expect(r).toContain('width: fit-content');
    expect(r).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
  // Revisión del 05/10/2026: sin el diccionario de guiones, `fit-content` toma el ancho de la palabra más larga
  // («responsabilidad» en Transparencia) y el título corría la página de costado a 320 y 360 px.
  it('el título nunca es más ancho que su columna', () => {
    expect(regla(global, '.titulo')).toContain('max-width: 100%');
  });
  it('sobre la foto, la franja va hacia más contraste, no hacia el azul', () => {
    expect(regla(global, '.titulo-foto')).toContain('--titulo-b: var(--color-titulo-brillo)');
  });
  it('solo el h1 se mueve, lento, y se queda quieto con «reducir movimiento»', () => {
    expect(regla(global, 'h1.titulo')).toContain('animation: titulo-recorre 10s');
    expect(global).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*h1\.titulo\s*\{\s*animation: none;/);
    expect(global).not.toMatch(/h2\.titulo\s*\{[^}]*animation/);
  });
  it('con alto contraste de Windows va en el color del sistema, y lo seleccionado se lee', () => {
    expect(global).toMatch(/@media \(forced-colors: active\)\s*\{\s*\.titulo\s*\{\s*background: none; color: CanvasText;/);
    expect(regla(global, '.titulo::selection')).toContain('color: var(--color-fondo)');
  });
  it('al imprimir, color pleno y quieto', () => {
    const r = regla(impresion, '.titulo');
    expect(r).toContain('background: none !important');
    expect(r).toContain('color: var(--color-texto) !important');
    expect(r).toContain('animation: none !important');
  });
  it('--color-titulo-brillo existe en los cuatro bloques: blanco en oscuro, navy profundo en claro', () => {
    const valores = [...tokens.matchAll(/--color-titulo-brillo:\s*(#[0-9A-Fa-f]{6})/g)].map((m) => m[1]!.toUpperCase());
    expect(valores).toEqual(['#FFFFFF', '#0B1526', '#FFFFFF', '#FFFFFF']);
  });
  it('el build mide el brillo contra el fondo en los dos temas', () => {
    expect(paresContraste).toContainEqual(['titulo-brillo', 'fondo']);
  });
});
