import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import type { EstadoRuta } from '@/lib/datos/esquemas';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { aplicarEstado } from '@/lib/estado-dom';
import { geometriaKm, puntoEnGeometria } from '@/lib/geometria-km';

// El armazón que emite EstadoTraza.astro (tests/components/estado-traza.test.ts comprueba que el componente trae estos
// mismos ganchos). Los íconos llegan del build como <template>, para no copiar los dibujos de lucide en el cliente.
const TIPOS = ['transito', 'obra', 'incidente', 'clima', 'mantenimiento'];
const ARMAZON = `
<section data-estado-en-vivo data-url="https://api.test/api/v1/estado-ruta/" data-rutas='["RN 9","RN 19","RN 34"]'>
  <ul data-estado-lista aria-live="polite"><li>Consultando el estado de la ruta…</li></ul>
  <p data-estado-error hidden>No pudimos consultar el estado de la ruta ahora. Probá de nuevo en unos minutos. Ante una emergencia, llamá al 140.</p>
  <div data-estado-programados hidden><h3>Programado</h3><ul data-estado-programados-lista></ul></div>
  <p data-estado-actualizado hidden></p>
  ${TIPOS.map((t) => `<template data-icono="${t}"><svg data-ic="${t}"></svg></template>`).join('')}
</section>
<svg><g data-marcadores-estado></g></svg>`;

const montar = () => {
  const { document } = parseHTML(`<!doctype html><html><body>${ARMAZON}</body></html>`);
  return {
    seccion: document.querySelector('[data-estado-en-vivo]') as unknown as HTMLElement,
    capa: document.querySelector('[data-marcadores-estado]') as unknown as SVGGElement,
    q: <T extends Element = HTMLElement>(sel: string) => document.querySelector(sel) as unknown as T,
    qq: (sel: string) => [...document.querySelectorAll(sel)] as unknown as HTMLElement[],
  };
};
const estado = (e: Partial<EstadoRuta>): EstadoRuta => ({ disponible: true, ejemplo: false, ...e });
const aviso = { ruta: 'RN 9', km: 400, descripcion: 'Corte de pasto en banquina.', severidad: 'precaucion', tipo: 'mantenimiento' } as const;

describe('aplicarEstado', async () => {
  const geo = geometriaKm(await fuenteLocalJson.tramo());

  it('una fila por ruta con data-nivel y «Sin avisos» cuando no hay nada', () => {
    const { seccion, capa, qq } = montar();
    aplicarEstado(seccion, capa, estado({ incidentes: [] }), geo);
    const filas = qq('[data-estado-lista] > li[data-ruta]');
    expect(filas.map((f) => [f.getAttribute('data-ruta'), f.getAttribute('data-nivel')])).toEqual([['RN 9', 'normal'], ['RN 19', 'normal'], ['RN 34', 'normal']]);
    expect(filas.every((f) => f.textContent!.includes('Sin avisos'))).toBe(true);
    expect(seccion.textContent).not.toContain('Consultando');
    expect(seccion.textContent).not.toContain('Normal');
  });

  it('el peor aviso manda en la fila, con la cuenta de avisos y el ícono de su tipo', () => {
    const { seccion, capa, q } = montar();
    aplicarEstado(seccion, capa, estado({ incidentes: [aviso, { ...aviso, severidad: 'corte', tipo: 'obra', desvio: 'Por colectora.' }] }), geo);
    const fila = q('li[data-ruta="RN 9"]');
    expect(fila.getAttribute('data-nivel')).toBe('corte');
    expect(fila.textContent).toContain('Corte · 2 avisos');
    expect(fila.querySelector('svg[data-ic="mantenimiento"]')).not.toBeNull();
    expect(fila.querySelector('svg[data-ic="obra"]')).not.toBeNull();
  });

  it('un texto con HTML se ve como texto', () => {
    const { seccion, capa } = montar();
    const html = '<img src=x onerror=alert(1)>';
    aplicarEstado(seccion, capa, estado({ incidentes: [{ ...aviso, descripcion: html, titulo: '<b>t</b>', desvio: '<a href="x">y</a>' }] }), geo);
    expect(seccion.querySelector('img')).toBeNull();
    expect(seccion.querySelector('b')).toBeNull();
    expect(seccion.querySelector('a')).toBeNull();
    expect(seccion.textContent).toContain(html);
    expect(capa.querySelector('title')!.textContent).toContain(html);
  });

  it('km de tramo: «km 340 a 352»', () => {
    const { seccion, capa } = montar();
    aplicarEstado(seccion, capa, estado({ incidentes: [{ ...aviso, km: 340, kmHasta: 352 }] }), geo);
    expect(seccion.textContent).toContain('km 340 a 352');
  });

  it('el título va en negrita arriba y el desvío en su propia línea, empezando con «Desvío:»', () => {
    const { seccion, capa, qq } = montar();
    aplicarEstado(seccion, capa, estado({ incidentes: [{ ...aviso, titulo: 'Corte de pasto', desvio: 'Por colectora.' }] }), geo);
    const parrafos = qq('li[data-ruta="RN 9"] p').map((p) => p.textContent);
    expect(parrafos[0]).toBe('Corte de pasto');
    expect(parrafos).toContain('Desvío: Por colectora.');
  });

  it('los programados van aparte bajo «Programado» con su fecha', () => {
    const { seccion, capa, q } = montar();
    const programado = { ...aviso, ruta: 'RN 34', km: 12, descripcion: 'Bacheo de calzada.', tipo: 'obra', fecha: '2026-11-30', desde: '2026-11-30T08:00:00-03:00', hasta: '2026-11-30T12:00:00-03:00' } as const;
    aplicarEstado(seccion, capa, estado({ incidentes: [], programados: [programado] }), geo);
    const bloque = q('[data-estado-programados]');
    expect(bloque.hasAttribute('hidden')).toBe(false);
    expect(bloque.textContent).toContain('30 de noviembre de 2026');
    expect(bloque.textContent).toContain('Bacheo de calzada.');
    expect(q('li[data-ruta="RN 34"]').textContent).toContain('Sin avisos');
    expect(capa.querySelectorAll('g.incidente')).toHaveLength(0);
  });

  it('sin programados, el bloque queda escondido', () => {
    const { seccion, capa, q } = montar();
    aplicarEstado(seccion, capa, estado({ incidentes: [] }), geo);
    expect(q('[data-estado-programados]').hasAttribute('hidden')).toBe(true);
  });

  it('marcadores: uno por aviso ubicable; ninguno sin km ni en una ruta sin km de inicio y fin', () => {
    const { seccion, capa } = montar();
    const { ['RN 19']: _sinKm, ...geoSinRn19 } = geo;
    aplicarEstado(seccion, capa, estado({ incidentes: [aviso, { ...aviso, ruta: 'RN 34', km: null }, { ...aviso, ruta: 'RN 19', km: 50 }] }), geoSinRn19);
    const marcas = [...capa.querySelectorAll('g.incidente')];
    expect(marcas).toHaveLength(1);
    expect(marcas[0]!.getAttribute('role')).toBe('img');
    expect(marcas[0]!.getAttribute('data-severidad')).toBe('precaucion');
    expect(marcas[0]!.querySelector('title')!.textContent).toContain('Precaución — RN 9 km 400');
    // La lista no depende del mapa: los tres avisos se leen igual.
    expect(seccion.textContent).toContain('km 50');
  });

  it('un tramo se marca en el punto medio', () => {
    const { seccion, capa } = montar();
    aplicarEstado(seccion, capa, estado({ incidentes: [{ ...aviso, km: 340, kmHasta: 352 }] }), geo);
    const p = puntoEnGeometria(geo, 'RN 9', 346)!;
    expect(capa.querySelector('g.incidente')!.getAttribute('transform')).toBe(`translate(${p.x} ${p.y})`);
  });

  it('sin datos: el mensaje con el 140, la lista vacía, y ni «Sin avisos» ni «Normal»', () => {
    for (const sinDatos of [null, estado({ disponible: false })]) {
      const { seccion, capa, q } = montar();
      aplicarEstado(seccion, capa, sinDatos, geo);
      expect(q('[data-estado-error]').hasAttribute('hidden')).toBe(false);
      expect(q('[data-estado-lista]').children).toHaveLength(0);
      expect(q('[data-estado-programados]').hasAttribute('hidden')).toBe(true);
      expect(q('[data-estado-actualizado]').hasAttribute('hidden')).toBe(true);
      expect(seccion.textContent).not.toContain('Sin avisos');
      expect(seccion.textContent).not.toContain('Normal');
      expect(capa.children).toHaveLength(0);
    }
  });

  it('después de una falla, una respuesta buena saca el mensaje y pinta', () => {
    const { seccion, capa, q } = montar();
    aplicarEstado(seccion, capa, estado({ incidentes: [aviso] }), geo);
    aplicarEstado(seccion, capa, null, geo);
    expect(capa.children).toHaveLength(0);
    aplicarEstado(seccion, capa, estado({ actualizado: '2026-11-26T10:05:00-03:00', incidentes: [aviso] }), geo);
    expect(q('[data-estado-error]').hasAttribute('hidden')).toBe(true);
    expect(q('li[data-ruta="RN 9"]').getAttribute('data-nivel')).toBe('precaucion');
    expect(capa.querySelectorAll('g.incidente')).toHaveLength(1);
    const actualizado = q('[data-estado-actualizado]');
    expect(actualizado.hasAttribute('hidden')).toBe(false);
    expect(actualizado.textContent).toContain('26 de noviembre de 2026');
  });

  it('el código de cliente no usa innerHTML, outerHTML ni insertAdjacentHTML', () => {
    for (const archivo of ['src/lib/estado-dom.ts', 'src/lib/estado-en-vivo.ts', 'src/lib/geometria-km.ts']) {
      expect(readFileSync(archivo, 'utf8'), archivo).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML/);
    }
  });
});
