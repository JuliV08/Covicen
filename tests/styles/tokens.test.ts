import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { bloqueClaro, bloqueNoche, bloqueRoot, bloqueTheme, contraste, declaracionesDe, leerTemas, nombresDeTokens } from '../../scripts/lib/contraste.ts';
import { paresContraste } from '../../scripts/lib/pares.ts';

const css = readFileSync('src/styles/tokens.css', 'utf8');
const temas = leerTemas(css);
const marca = ['marca-900', 'marca-700', 'marca-500', 'marca-300', 'gris-texto', 'gris-fondo', 'vial'];
// Lo que el bloque claro TIENE que redefinir: los semánticos hex que cambian y los que no son hex (nadie más los mira).
const semanticosHex = ['fondo', 'fondo-2', 'superficie', 'superficie-2', 'texto', 'texto-2', 'texto-3', 'acento', 'acento-hover', 'vial-texto', 'sobre-acento', 'sobre-marca', 'ok', 'sobre-ok', 'error', 'tarjeta-interior-1', 'tarjeta-interior-2', 'tarjeta-interior-3'];
const semanticosNoHex = ['color-cabecera', 'color-borde', 'color-borde-fuerte', 'color-glow', 'color-sombra', 'color-plano', 'color-luz', 'brillo-foto'];

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
  it('el bloque claro no inventa tokens: cada uno existe en el oscuro (brillo-foto vive en :root)', () => {
    const enOscuro = new Set([...nombresDeTokens(bloqueTheme(css)), 'brillo-foto']);
    const claro = nombresDeTokens(bloqueClaro(css));
    expect(claro.length).toBeGreaterThan(20);
    for (const n of claro) expect(enOscuro.has(n), `--${n} solo existe en el claro`).toBe(true);
  });
  it('el claro redefine todos los semánticos, también los que no son hex (bordes, glow, sombra, plano, luz, cabecera, brillo)', () => {
    const claro = new Set(nombresDeTokens(bloqueClaro(css)));
    for (const n of [...semanticosHex.map((s) => `color-${s}`), ...semanticosNoHex]) expect(claro.has(n), `falta --${n} en el bloque claro`).toBe(true);
  });
  it('el claro cambia el fondo al gris del manual y el texto a navy', () => {
    expect(temas.claro['fondo']).toBe('#EEF1F4');
    expect(temas.claro['texto']).toBe('#16304E');
    expect(temas.claro['acento']).toBe('#2C688F');
    expect(temas.claro['sobre-marca']).toBe('#FFFFFF');
  });
  // `.zona-noche` es el hero (y el panel del consorcio) con la foto nocturna: en el tema claro la foto se muestra igual,
  // así que adentro se vuelve al tema oscuro. Si revirtiera solo algunos tokens quedaría mitad y mitad, y si alguien
  // cambia un color del oscuro sin copiarlo acá, la zona se desincroniza en silencio. Estas tres guardas lo impiden.
  describe('zona noche', () => {
    const oscuro = { ...declaracionesDe(bloqueTheme(css)), ...declaracionesDe(bloqueRoot(css)) };
    const noche = declaracionesDe(bloqueNoche(css));
    it('revierte todos los tokens que el tema claro redefine', () => {
      const claro = nombresDeTokens(bloqueClaro(css));
      expect(claro.length).toBeGreaterThan(20);
      for (const n of claro) expect(Object.keys(noche), `falta --${n} en .zona-noche`).toContain(n);
    });
    it('y cada uno con el valor del tema oscuro', () => {
      expect(Object.keys(noche).length).toBeGreaterThan(20);
      for (const [n, v] of Object.entries(noche)) expect(v, `--${n}`).toBe(oscuro[n]);
    });
    it('vive dentro de @media screen: en papel manda impresion.css', () => {
      expect(css).toMatch(/@media screen\s*\{\s*\.zona-noche\s*\{/);
    });
  });

  describe.each(Object.entries(temas))('tema %s', (_nombre, tokens) => {
    it.each(paresContraste)('%s sobre %s cumple AA (≥ 4.5)', (texto, fondo) => {
      expect(tokens[texto], `falta --color-${texto}`).toBeDefined();
      expect(tokens[fondo], `falta --color-${fondo}`).toBeDefined();
      expect(contraste(tokens[texto]!, tokens[fondo]!)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
