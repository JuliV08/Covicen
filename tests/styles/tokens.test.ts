import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contraste, leerTemas } from '../../scripts/lib/contraste.ts';
import { paresContraste } from '../../scripts/lib/pares.ts';

const css = readFileSync('src/styles/tokens.css', 'utf8');
const temas = leerTemas(css);
const marca = ['marca-900', 'marca-700', 'marca-500', 'marca-300', 'gris-texto', 'gris-fondo', 'vial'];

describe('tokens', () => {
  it('define los 7 colores del manual de marca', () => {
    expect(temas.oscuro['marca-900']).toBe('#1E4870');
    expect(temas.oscuro['marca-700']).toBe('#2C688F');
    expect(temas.oscuro['marca-500']).toBe('#4A92BA');
    expect(temas.oscuro['marca-300']).toBe('#68BCE1');
    expect(temas.oscuro['gris-texto']).toBe('#5A6472');
    expect(temas.oscuro['gris-fondo']).toBe('#EEF1F4');
    expect(temas.oscuro['vial']).toBe('#F0C419');
  });
  it('el tema claro redefine solo la capa semántica: los de marca no cambian', () => {
    for (const k of marca) expect(temas.claro[k], k).toBe(temas.oscuro[k]);
  });
  it('los dos temas definen exactamente los mismos tokens', () => {
    expect(Object.keys(temas.claro).sort()).toEqual(Object.keys(temas.oscuro).sort());
  });
  it('el claro cambia el fondo al gris del manual y el texto a navy', () => {
    expect(temas.claro['fondo']).toBe('#EEF1F4');
    expect(temas.claro['texto']).toBe('#16304E');
    expect(temas.claro['acento']).toBe('#2C688F');
  });
  describe.each(Object.entries(temas))('tema %s', (_nombre, tokens) => {
    it.each(paresContraste)('%s sobre %s cumple AA (≥ 4.5)', (texto, fondo) => {
      expect(tokens[texto], `falta --color-${texto}`).toBeDefined();
      expect(tokens[fondo], `falta --color-${fondo}`).toBeDefined();
      expect(contraste(tokens[texto]!, tokens[fondo]!)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
