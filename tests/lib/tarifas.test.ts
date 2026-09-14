import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { cabinasDelCuadro, iconoDeTarifa, publico, tarifaDestacada, tarifasParaCabina } from '@/lib/tarifas';

describe('tarifas', async () => {
  const t = await fuenteLocalJson.tarifario();
  const tramo = await fuenteLocalJson.tramo();
  it('sin excepciones, TelePASE y manual salen del cuadro general', () => {
    const filas = tarifasParaCabina(t, 'franck');
    expect(filas[0]).toMatchObject({ categoria: 'cat-1', telepaseSinIva: 1239.67, manualSinIva: 1239.67 });
  });
  it('una excepción por cabina reemplaza solo esa categoría; manual sin dato hereda el de TelePASE', () => {
    const conEx = { ...t, excepciones: [{ cabina: 'franck', categoria: 'cat-1', montoSinIva: 2000 }] };
    expect(tarifasParaCabina(conEx, 'franck')[0]).toMatchObject({ telepaseSinIva: 2000, manualSinIva: 2000 });
    expect(tarifasParaCabina(conEx, 'carcarana')[0]).toMatchObject({ telepaseSinIva: 1239.67 });
    const manualNulo = { ...t, tarifas: [{ ...t.tarifas[0]!, montoManualSinIva: null }] };
    expect(tarifasParaCabina(manualNulo, 'franck')[0]!.manualSinIva).toBeNull();
  });
  it('publico: el del sistema si viene; si no, redondeo al peso', () => {
    expect(publico(1239.67, undefined, 0.21)).toBe(1500);
    expect(publico(1239.67, 1500.5, 0.21)).toBe(1500.5);
    expect(publico(null, undefined, 0.21)).toBeNull();
  });
  it('destacada: la categoría marcada, o la primera', () => {
    expect(tarifaDestacada(t).categoria).toBe('cat-1');
    expect(tarifaDestacada({ ...t, categoriaDestacada: undefined }).categoria).toBe('cat-1');
  });
  it('cabinasDelCuadro: las listadas; sin lista, todas las operativas', () => {
    expect(cabinasDelCuadro(t, tramo.cabinas).map((c) => c.slug)).toEqual(['carcarana', 'james-craik', 'franck']);
    expect(cabinasDelCuadro({ ...t, cabinas: undefined }, tramo.cabinas).map((c) => c.slug).sort()).toEqual(['carcarana', 'franck', 'james-craik']);
  });
  it('iconoDeTarifa: el explícito, o el legado por categoría, o auto', () => {
    expect(iconoDeTarifa({ categoria: 'cat-1', nombre: 'x', descripcion: 'x', montoSinIva: 1, icono: 'camion-7' })).toBe('camion-7');
    expect(iconoDeTarifa({ categoria: 'cat-1', nombre: 'x', descripcion: 'x', montoSinIva: 1 })).toBe('moto');
    expect(iconoDeTarifa({ categoria: 'otra', nombre: 'x', descripcion: 'x', montoSinIva: 1 })).toBe('auto');
  });
});
