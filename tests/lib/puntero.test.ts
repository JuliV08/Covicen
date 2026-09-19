import { describe, expect, it } from 'vitest';
import { punteroRelativo } from '@/lib/puntero';

const caja = (width: number, height: number, left = 0, top = 0) => ({ left, top, width, height });

describe('puntero relativo al elemento', () => {
  it('el centro es 0,0 y las esquinas son ±0,5', () => {
    expect(punteroRelativo(caja(1000, 500), 500, 250)).toEqual([0, 0]);
    expect(punteroRelativo(caja(1000, 500), 0, 0)).toEqual([-0.5, -0.5]);
    expect(punteroRelativo(caja(1000, 500), 1000, 500)).toEqual([0.5, 0.5]);
  });

  it('tiene en cuenta dónde arranca el elemento', () => {
    expect(punteroRelativo(caja(1000, 500, 200, 100), 700, 350)).toEqual([0, 0]);
  });

  // EL bug. Con una foto por tema, la que el tema esconde mide 0×0 y sigue recibiendo el pointermove de la sección.
  // Dividir por 0 da Infinity, el lerp del bucle de Infinity sigue siendo Infinity y no se recupera nunca: al cambiar
  // de tema esa foto aparecía pidiéndole a la GPU un punto imposible de la textura y pintaba un manchón liso.
  it('un elemento sin caja (escondido por el tema) no devuelve nada', () => {
    expect(punteroRelativo(caja(0, 0), 900, 500)).toBeNull();
    expect(punteroRelativo(caja(0, 500), 900, 500)).toBeNull();
    expect(punteroRelativo(caja(1000, 0), 900, 500)).toBeNull();
  });

  // La promesa que importa, escrita como propiedad y no como casos sueltos: pase lo que pase entre, de acá NUNCA sale
  // un valor que no sea un número acotado. Un solo Infinity o NaN que llegue al shader envenena el bucle para siempre.
  it('nunca devuelve algo que no sea un número acotado, con cualquier entrada', () => {
    const raros = [NaN, Infinity, -Infinity, 0, -0, -1000, 1e300];
    for (const w of raros) for (const h of raros) for (const x of raros) for (const y of raros) {
      const r = punteroRelativo(caja(w, h), x, y);
      if (r === null) continue;
      const donde = `caja ${w}x${h}, punto ${x},${y}`;
      expect(Number.isFinite(r[0]), `x no finito con ${donde}`).toBe(true);
      expect(Number.isFinite(r[1]), `y no finito con ${donde}`).toBe(true);
      expect(Math.abs(r[0]), `x fuera de rango con ${donde}`).toBeLessThanOrEqual(0.5);
      expect(Math.abs(r[1]), `y fuera de rango con ${donde}`).toBeLessThanOrEqual(0.5);
    }
  });

  // Un puntero fuera del elemento (la sección es más grande que el elemento, o el mouse sale rápido) no puede mandar
  // el desplazamiento más allá de lo que el shader espera.
  it('queda siempre dentro de ±0,5, aunque el puntero esté afuera del elemento', () => {
    const [x, y] = punteroRelativo(caja(1000, 500), 5000, -3000)!;
    expect(x).toBe(0.5);
    expect(y).toBe(-0.5);
  });
});
