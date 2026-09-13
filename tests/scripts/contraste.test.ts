import { describe, expect, it } from 'vitest';
import { contraste, leerTemas, leerTokens, leerTokensClaro } from '../../scripts/lib/contraste.ts';

describe('contraste', () => {
  it('blanco sobre negro es 21', () => {
    expect(contraste('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
  });
  it('es simétrico', () => {
    expect(contraste('#E8EEF5', '#0B1526')).toBeCloseTo(contraste('#0B1526', '#E8EEF5'), 5);
  });
  it('texto sobre fondo del tema oscuro supera 4.5', () => {
    expect(contraste('#E8EEF5', '#0B1526')).toBeGreaterThan(4.5);
  });
});

describe('leerTokens', () => {
  it('extrae --color-* con valor hex', () => {
    const css = `@theme {\n  --color-fondo: #0B1526;\n  --color-borde: rgb(255 255 255 / 0.10);\n}`;
    expect(leerTokens(css)).toEqual({ fondo: '#0B1526' });
  });
  it('lee solo el bloque @theme para el oscuro y lo pisa con html[data-tema="claro"] para el claro', () => {
    const css = `@theme static {\n  --color-fondo: #0B1526;\n  --color-vial: #F0C419;\n}\n:root { color-scheme: dark; }\nhtml[data-tema="claro"] {\n  --color-fondo: #EEF1F4;\n}`;
    expect(leerTokens(css)).toEqual({ fondo: '#0B1526', vial: '#F0C419' });
    expect(leerTokensClaro(css)).toEqual({ fondo: '#EEF1F4', vial: '#F0C419' });
    expect(leerTemas(css)).toEqual({ oscuro: { fondo: '#0B1526', vial: '#F0C419' }, claro: { fondo: '#EEF1F4', vial: '#F0C419' } });
  });
});
