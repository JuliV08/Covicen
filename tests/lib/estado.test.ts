import { describe, expect, it } from 'vitest';
import { estadoPorRuta } from '@/lib/estado';

const inc = (ruta: 'RN 9' | 'RN 19' | 'RN 34', severidad: 'info' | 'precaucion' | 'corte') => ({ ruta, km: 10, descripcion: 'x', severidad, tipo: 'obra' as const });

describe('estadoPorRuta', () => {
  it('una fila por ruta, con el peor nivel de sus incidentes; sin incidentes es normal', () => {
    const filas = estadoPorRuta({ disponible: true, ejemplo: false, incidentes: [inc('RN 9', 'info'), inc('RN 9', 'corte'), inc('RN 34', 'precaucion')] }, ['RN 9', 'RN 19', 'RN 34']);
    expect(filas.map((f) => [f.ruta, f.nivel])).toEqual([['RN 9', 'corte'], ['RN 19', 'normal'], ['RN 34', 'precaucion']]);
    expect(filas[0]!.etiqueta).toBe('Corte');
    expect(filas[1]!.etiqueta).toBe('Normal');
    expect(filas[0]!.incidentes).toHaveLength(2);
  });
  it('no disponible: todo normal y sin incidentes', () => {
    expect(estadoPorRuta({ disponible: false, ejemplo: false }, ['RN 9']).map((f) => f.nivel)).toEqual(['normal']);
  });
});
