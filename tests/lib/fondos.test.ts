import { describe, expect, it } from 'vitest';
import { alternarFondos } from '@/lib/fondos';

// Lo que importa es que, entre las secciones que SE VEN, nunca queden dos fondos iguales seguidos, y que la primera
// lleve grilla (el encabezado de la página, liso, va arriba).
describe('alternarFondos', () => {
  const vistos = (visibles: boolean[]) => alternarFondos(visibles).filter((_, i) => visibles[i]);
  it('con todas visibles, alterna empezando por la grilla', () => {
    expect(alternarFondos([true, true, true, true])).toEqual(['fondo-2', 'fondo', 'fondo-2', 'fondo']);
  });
  it('las escondidas no cuentan: la alternancia sigue entre las que se ven', () => {
    expect(vistos([false, true, false, true, true])).toEqual(['fondo-2', 'fondo', 'fondo-2']);
  });
  it('cualquier combinación de escondidas deja las visibles alternadas', () => {
    for (let mascara = 0; mascara < 2 ** 6; mascara++) {
      const visibles = [...Array(6)].map((_, i) => Boolean(mascara & (1 << i)));
      const f = vistos(visibles);
      if (f.length > 0) expect(f[0]).toBe('fondo-2');
      f.slice(1).forEach((x, i) => expect(x, `máscara ${mascara}`).not.toBe(f[i]));
    }
  });
});
