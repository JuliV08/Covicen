import { describe, expect, it } from 'vitest';
import { fuenteApi } from '@/lib/datos/fuentes/api';

describe('fuenteApi', () => {
  it('no está implementada en v1 y lo dice sin mockear nada', async () => {
    await expect(fuenteApi.tarifario()).rejects.toThrow(/FuenteApi: no implementado/);
    await expect(fuenteApi.estadoRutas()).rejects.toThrow(/FuenteApi: no implementado/);
  });
});
