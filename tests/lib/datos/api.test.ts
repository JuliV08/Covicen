import { describe, expect, it } from 'vitest';
import { datos } from '@/lib/datos';
import { fuenteApi } from '@/lib/datos/fuentes/api';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('fuenteApi (composición)', () => {
  it('implementa solo lo que el sistema tiene (tramo y tarifario) y no simula el resto', () => {
    expect(Object.keys(fuenteApi).sort()).toEqual(['tarifario', 'tramo']);
    expect('estadoRutas' in fuenteApi).toBe(false);
    expect('novedades' in fuenteApi).toBe(false);
  });

  it('con FUENTE_DATOS=local, datos es la fuente del repo', async () => {
    expect(datos.tarifario).toBe(fuenteLocalJson.tarifario);
    expect((await datos.tarifario()).moneda).toBe('ARS');
  });
});
