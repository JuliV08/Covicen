import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { esquemaTarifario, esquemaTramo } from '../../src/lib/datos/esquemas';
import { fuenteApi } from '../../src/lib/datos/fuentes/api';

// Fixtures capturados de la API real del sistema (demo local) el 2026-09-06.
const fixture = (nombre: string) => JSON.parse(readFileSync(`tests/fixtures/api/${nombre}.json`, 'utf8'));

const responder = (cuerpo: unknown, status = 200) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } }),
  );

afterEach(() => vi.restoreAllMocks());

describe('fuenteApi', () => {
  it('los fixtures capturados de la API cumplen el contrato', () => {
    esquemaTramo.parse(fixture('tramo'));
    esquemaTarifario.parse(fixture('tarifario'));
  });

  it('tarifario() devuelve datos validados, con el monto con IVA que manda el sistema', async () => {
    responder(fixture('tarifario'));
    const t = await fuenteApi.tarifario();
    const auto = t.tarifas.find((x) => x.categoria === 'cat-2');
    expect(auto?.montoSinIva).toBe(1399);
    expect(auto?.montoConIva).toBe(1693);
    expect(t.moneda).toBe('ARS');
  });

  it('tramo() devuelve cabinas con freeFlow y el mapa', async () => {
    responder(fixture('tramo'));
    const tramo = await fuenteApi.tramo();
    expect(tramo.cabinas.length).toBeGreaterThan(0);
    expect(typeof tramo.cabinas[0].freeFlow).toBe('boolean');
    expect(tramo.cabinas[0].mapa).toHaveProperty('x');
  });

  it('pide la URL de la API configurada', async () => {
    const espia = responder(fixture('tarifario'));
    await fuenteApi.tarifario();
    expect(String(espia.mock.calls[0][0])).toMatch(/\/api\/v1\/tarifario\/$/);
  });

  it('rompe con mensaje claro si el servidor devuelve otra forma', async () => {
    responder({ tarifas: 'no' });
    await expect(fuenteApi.tarifario()).rejects.toThrow(
      /FuenteApi: la respuesta de \/api\/v1\/tarifario\/ no cumple el contrato/,
    );
  });

  it('rompe ante 404 (sin cuadro vigente): no se publica basura', async () => {
    responder({ detail: 'No hay un cuadro tarifario vigente para esa fecha.' }, 404);
    await expect(fuenteApi.tarifario()).rejects.toThrow(/respondió 404/);
  });

  it('rompe con mensaje claro si no hay conexión', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'));
    await expect(fuenteApi.tramo()).rejects.toThrow(/no se pudo conectar/);
  });

  it('los textos del sistema llegan como texto (el contrato no los filtra; el componente los escapa)', async () => {
    responder({ ...fixture('tarifario'), avisos: ['<img src=x onerror=alert(1)>'] });
    const t = await fuenteApi.tarifario();
    expect(t.avisos[0]).toContain('<img');
  });
});
