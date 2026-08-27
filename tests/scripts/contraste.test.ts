import { describe, expect, it } from 'vitest';
import { contraste, leerTokens } from '../../scripts/lib/contraste.ts';

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
});
