import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { estadoCabina, leyendaServicios, puntoEnRuta, serviciosDeCabina } from '@/lib/tramo';

describe('estadoCabina', async () => {
  const t = await fuenteLocalJson.tramo();
  const por = (slug: string) => t.cabinas.find((c) => c.slug === slug)!;
  it('operativa para las existentes, próxima (Free Flow) para las nuevas', () => {
    expect(estadoCabina(por('carcarana'))).toEqual({ clave: 'operativa', etiqueta: 'Operativa' });
    expect(estadoCabina(por('leones'))).toEqual({ clave: 'proxima', etiqueta: 'Próxima · Free Flow' });
  });
  it('servicios: solo los que la estación tiene; la leyenda, solo los que alguna tiene', () => {
    expect(serviciosDeCabina(por('franck')).map((s) => s.clave)).toEqual(['areaDescanso', 'gruaGratuita']);
    expect(serviciosDeCabina(por('totoras'))).toEqual([]);
    expect(leyendaServicios(t).map((s) => s.clave)).toEqual(['areaDescanso', 'gruaGratuita']);
  });
});

describe('puntoEnRuta', async () => {
  const t = await fuenteLocalJson.tramo();
  const ciudad = (slug: string) => t.ciudades.find((c) => c.slug === slug)!.mapa;
  it('en la progresiva inicial devuelve el primer nodo del trazado y en la final el último', () => {
    expect(puntoEnRuta(t, 'RN 9', 297)).toEqual(ciudad('rosario'));
    expect(puntoEnRuta(t, 'RN 9', 660.16)).toEqual(ciudad('cordoba'));
    expect(puntoEnRuta(t, 'RN 34', 188.68)).toEqual(ciudad('empalme-rn-19'));
  });
  it('recorta los km fuera del tramo y cae en el medio del trazo para un km intermedio', () => {
    expect(puntoEnRuta(t, 'RN 34', 999)).toEqual(ciudad('empalme-rn-19'));
    const p = puntoEnRuta(t, 'RN 34', 94)!;
    expect(p.y).toBeLessThan(ciudad('rosario').y);
    expect(p.y).toBeGreaterThan(ciudad('empalme-rn-19').y);
  });
  it('devuelve null si la ruta no tiene progresivas', () => {
    const sinPk = { ...t, rutas: t.rutas.map((r) => ({ ...r, pkInicial: undefined, pkFinal: undefined })) };
    expect(puntoEnRuta(sinPk, 'RN 9', 340)).toBeNull();
  });
});
