import { describe, expect, it } from 'vitest';
import { indices } from '@/lib/indices';

// Tarifas y El tramo pierden secciones según src/lib/publicado.ts, y los números de sección estaban escritos a mano
// en cada `indice=`. Con eso, apagar una sección dejaba la numeración salteada (01 · 03 · 05) y prenderla de vuelta
// obligaba a renumerar todo a mano otra vez. Acá se calcula.
describe('indices', () => {
  it('numera de corrido cuando se ven todas', () => {
    expect(indices([true, true, true])).toEqual(['01', '02', '03']);
  });
  it('la escondida no gasta número y las de abajo se corren', () => {
    expect(indices([false, true, false, true])).toEqual([undefined, '01', undefined, '02']);
  });
  it('dos dígitos siempre, y más de nueve también', () => {
    expect(indices([true])).toEqual(['01']);
    expect(indices(Array(11).fill(true)).at(-1)).toBe('11');
  });
  it('sin secciones visibles no hay números', () => {
    expect(indices([false, false])).toEqual([undefined, undefined]);
    expect(indices([])).toEqual([]);
  });
});
