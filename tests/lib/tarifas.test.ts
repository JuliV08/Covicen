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
  // Con excepción, el `montoConIva` que publicó el sistema es el del cuadro general: si se arrastrara, la tabla
  // mostraría el precio al público de la general y justo debajo el sin IVA de la excepción.
  it('una excepción también manda sobre el con-IVA: no se arrastra el del cuadro general', () => {
    const conEx = {
      ...t,
      tarifas: [{ ...t.tarifas[0]!, montoConIva: 1500.5 }, ...t.tarifas.slice(1)],
      excepciones: [{ cabina: 'franck', categoria: 'cat-1', montoSinIva: 2000 }],
    };
    expect(tarifasParaCabina(conEx, 'franck')[0]).toMatchObject({ telepaseSinIva: 2000, telepaseConIva: 2420, manualConIva: 2420 });
    expect(tarifasParaCabina(conEx, 'carcarana')[0]).toMatchObject({ telepaseSinIva: 1239.67, telepaseConIva: 1500.5, manualConIva: 1500.5 });
  });
  it('mismo sin IVA en las dos columnas = mismo precio al público, aunque el con-IVA del sistema no siga el redondeo', () => {
    const desparejo = { ...t, tarifas: [{ ...t.tarifas[0]!, montoSinIva: 1399, montoManualSinIva: 1399, montoConIva: 1692.79 }] };
    expect(tarifasParaCabina(desparejo)[0]).toMatchObject({ telepaseConIva: 1692.79, manualConIva: 1692.79 });
  });
  it('sin IVA distinto en cada columna: cada una con su propio precio al público', () => {
    const distinto = { ...t, tarifas: [{ ...t.tarifas[0]!, montoSinIva: 1000, montoManualSinIva: 2000, montoConIva: undefined }] };
    expect(tarifasParaCabina(distinto)[0]).toMatchObject({ telepaseConIva: 1210, manualConIva: 2420 });
    const manualNulo = { ...t, tarifas: [{ ...t.tarifas[0]!, montoManualSinIva: null }] };
    expect(tarifasParaCabina(manualNulo)[0]!.manualConIva).toBeNull();
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
