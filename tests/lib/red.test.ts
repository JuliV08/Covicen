import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { caminoEntre, continuarDesde, duracionViaje, necesitaVuelta, posicionEn, puntosDe, recorrido, suave, trazoRedondeado } from '@/lib/red';

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

// El ángulo más corto entre dos rumbos, en grados (0 a 180).
const giro = (a: number, b: number) => Math.abs(((b - a + 540) % 360) - 180);

describe('curvas y recorrido', () => {
  const L = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
  it('trazoRedondeado: línea, curva en el vértice y línea, sin pasar en seco por la esquina', () => {
    expect(trazoRedondeado(L, 10)).toBe('M0 0 L90 0 Q100 0 100 10 L100 100');
  });
  it('el radio nunca supera la mitad del tramo más corto', () => {
    expect(trazoRedondeado([{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 100 }], 10)).toBe('M0 0 L4 0 Q8 0 8 4 L8 100');
  });
  it('el recorrido arranca y termina en los extremos, con la distancia acumulada', () => {
    const m = recorrido(L, { radio: 10 });
    expect(m[0]).toMatchObject({ x: 0, y: 0, d: 0 });
    expect(m.at(-1)).toMatchObject({ x: 100, y: 100 });
    expect(m.at(-1)!.d).toBeGreaterThan(180);
    expect(m.at(-1)!.d).toBeLessThan(200);
  });
  it('el ángulo gira de forma continua: nunca salta más de 25° entre muestras', () => {
    const m = recorrido(L, { radio: 10 });
    for (let i = 1; i < m.length; i++) expect(giro(m[i - 1]!.angulo, m[i]!.angulo)).toBeLessThan(25);
  });
  it('necesitaVuelta: más de 100° entre el rumbo y el primer tramo', () => {
    expect(necesitaVuelta(0, { x: 0, y: 0 }, { x: -50, y: 0 })).toBe(true);
    expect(necesitaVuelta(0, { x: 0, y: 0 }, { x: 50, y: 10 })).toBe(false);
  });
  it('con vuelta en U: sale de frente, dobla por la izquierda y vuelve a la ruta mirando para el otro lado', () => {
    const m = recorrido([{ x: 0, y: 0 }, { x: -100, y: 0 }], { radio: 10, rumbo: 0 });
    expect(m[0]!.angulo).toBeCloseTo(0, 0);
    expect(Math.min(...m.map((p) => p.y))).toBeLessThan(-8); // la U va por la izquierda (y negativo en SVG = arriba)
    expect(m.at(-1)).toMatchObject({ x: -100, y: 0 });
    expect(giro(m.at(-1)!.angulo, 180)).toBeLessThan(5);
    for (let i = 1; i < m.length; i++) expect(giro(m[i - 1]!.angulo, m[i]!.angulo)).toBeLessThan(25);
  });
  // El auto frena antes del peaje: el próximo viaje pasa por la estación, y si tiene que volver, dobla ahí en U.
  it('una vuelta atrás en el medio del camino también es una U, sin girar en seco', () => {
    const m = recorrido([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 40, y: 0 }], { radio: 10, rumbo: 0 });
    expect(Math.min(...m.map((p) => p.y))).toBeLessThan(-8);
    expect(m.at(-1)).toMatchObject({ x: 40, y: 0 });
    for (let i = 1; i < m.length; i++) expect(giro(m[i - 1]!.angulo, m[i]!.angulo)).toBeLessThan(25);
  });
  it('posicionEn interpola entre muestras y se queda en los extremos', () => {
    const m = recorrido([{ x: 0, y: 0 }, { x: 100, y: 0 }], {});
    expect(posicionEn(m, 50)).toMatchObject({ x: 50, y: 0 });
    expect(posicionEn(m, -5)).toMatchObject({ x: 0, y: 0 });
    expect(posicionEn(m, 999)).toMatchObject({ x: 100, y: 0 });
  });
  it('duración entre medio segundo y dos, y la curva de velocidad empieza y termina quieta', () => {
    expect(duracionViaje(0)).toBe(500);
    expect(duracionViaje(5000)).toBe(2000);
    expect(suave(0)).toBe(0);
    expect(suave(1)).toBe(1);
    expect(suave(0.5)).toBe(0.5);
  });
});

// Tocar otra estación en pleno viaje: el auto termina el tramo en curso y de ahí toma el camino nuevo, sin saltar.
describe('continuarDesde', async () => {
  const red = await fuenteLocalJson.tramo();
  it('a mitad de Carcarañá → Rosario, pedir Leones: termina en Rosario y vuelve por la RN 9', () => {
    const viaje = ['carcarana', 'rosario'];
    const m = recorrido(puntosDe(red, viaje), {});
    const r = continuarDesde(red, viaje, m, m.at(-1)!.d / 2, 'leones');
    expect(r.camino).toEqual(['rosario', 'carcarana', 'leones']);
    expect(r.desde).toMatchObject({ x: 771, y: 465 });
  });
  it('pedir la estación a la que ya iba: sigue el mismo viaje', () => {
    const viaje = ['carcarana', 'rosario', 'totoras'];
    const m = recorrido(puntosDe(red, viaje), {});
    expect(continuarDesde(red, viaje, m, 10, 'totoras').camino).toEqual(['rosario', 'totoras']);
  });
});
