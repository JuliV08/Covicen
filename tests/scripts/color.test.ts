import { describe, expect, it } from 'vitest';
import { conAlfa, hexARgb, mezcla } from '@/scripts/lib/color';

describe('color (canvas)', () => {
  it('convierte hex a rgb, tolerando espacios y sin #', () => {
    expect(hexARgb(' #68BCE1 ')).toEqual({ r: 104, g: 188, b: 225 });
    expect(hexARgb('0B1526')).toEqual({ r: 11, g: 21, b: 38 });
  });
  it('cae a un gris medio si el valor no es hex (nunca rompe el canvas)', () => {
    expect(hexARgb('rgb(255 255 255 / 0.1)')).toEqual({ r: 128, g: 128, b: 128 });
    expect(hexARgb('')).toEqual({ r: 128, g: 128, b: 128 });
  });
  it('arma rgba y mezcla linealmente', () => {
    expect(conAlfa({ r: 1, g: 2, b: 3 }, 0.5)).toBe('rgba(1,2,3,0.500)');
    expect(mezcla({ r: 0, g: 0, b: 0, a: 0 }, { r: 100, g: 200, b: 50, a: 1 }, 0.5)).toBe('rgba(50,100,25,0.500)');
  });
});
