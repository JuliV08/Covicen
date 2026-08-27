import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contraste, leerTokens } from '../../scripts/lib/contraste.ts';

const tokens = leerTokens(readFileSync('src/styles/tokens.css', 'utf8'));

// Pares (texto, fondo) que el sitio usa. Si un componente usa un par nuevo, se agrega acá.
const pares: Array<[string, string]> = [
  ['texto', 'fondo'], ['texto-2', 'fondo'], ['texto-3', 'fondo'], ['acento', 'fondo'], ['vial', 'fondo'], ['error', 'fondo'],
  ['texto', 'fondo-2'], ['texto-2', 'fondo-2'], ['texto-3', 'fondo-2'], ['acento', 'fondo-2'],
  ['texto', 'superficie'], ['texto-2', 'superficie'], ['acento', 'superficie'], ['vial', 'superficie'],
  ['texto', 'superficie-2'], ['texto-2', 'superficie-2'],
  ['fondo', 'vial'], ['fondo', 'acento'],
];

describe('tokens', () => {
  it('define los 7 colores del manual de marca', () => {
    expect(tokens['marca-900']).toBe('#1E4870');
    expect(tokens['marca-700']).toBe('#2C688F');
    expect(tokens['marca-500']).toBe('#4A92BA');
    expect(tokens['marca-300']).toBe('#68BCE1');
    expect(tokens['gris-texto']).toBe('#5A6472');
    expect(tokens['gris-fondo']).toBe('#EEF1F4');
    expect(tokens['vial']).toBe('#F0C419');
  });
  it.each(pares)('%s sobre %s cumple AA (≥ 4.5)', (texto, fondo) => {
    expect(tokens[texto], `falta --color-${texto}`).toBeDefined();
    expect(tokens[fondo], `falta --color-${fondo}`).toBeDefined();
    expect(contraste(tokens[texto]!, tokens[fondo]!)).toBeGreaterThanOrEqual(4.5);
  });
});
