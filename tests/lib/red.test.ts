import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { caminoEntre, puntosDe } from '@/lib/red';

// Fase C (05/10/2026): el auto del mapa viaja por el camino más corto de la red. La RN 9 y la RN 34 se juntan en
// Rosario; la RN 34 y la RN 19, en el empalme.
describe('caminoEntre', async () => {
  const red = await fuenteLocalJson.tramo();
  it('vecinas sobre la misma ruta: directo', () => {
    expect(caminoEntre(red, 'carcarana', 'leones')).toEqual(['carcarana', 'leones']);
  });
  it('de la RN 9 a la RN 19: por Rosario, Totoras y el empalme', () => {
    expect(caminoEntre(red, 'carcarana', 'franck')).toEqual(['carcarana', 'rosario', 'totoras', 'empalme-rn-19', 'franck']);
  });
  it('de punta a punta', () => {
    expect(caminoEntre(red, 'james-craik', 'san-francisco')).toEqual(['james-craik', 'villa-maria', 'leones', 'carcarana', 'rosario', 'totoras', 'empalme-rn-19', 'san-francisco']);
  });
  it('a la misma estación: no hay viaje', () => {
    expect(caminoEntre(red, 'totoras', 'totoras')).toEqual(['totoras']);
  });
  it('a un nodo que no existe: camino vacío', () => {
    expect(caminoEntre(red, 'totoras', 'no-existe')).toEqual([]);
  });
  it('puntosDe da las coordenadas del contrato, sin tocarlas', () => {
    expect(puntosDe(red, ['carcarana', 'leones'])).toEqual([{ x: 677, y: 445 }, { x: 458, y: 399 }]);
  });
});
