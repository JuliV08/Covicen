import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('contenido del repo', () => {
  it('empresa: datos verificables de la adjudicación', async () => {
    const e = await fuenteLocalJson.empresa();
    expect(e.concesion.km).toBe(681.92);
    expect(e.concesion.rutas).toEqual(['RN 9', 'RN 19', 'RN 34']);
    expect(e.concesion.inicioOperacion).toBe('2026-10-05');
    expect(e.concesion.tarifaOfertadaSinIva).toBe(1399);
    expect(e.enFormacion).toBe(true);
    expect(e.cuit).toBeNull();
    expect(e.consorcio.map((c) => c.nombre)).toEqual(['AFEMA S.A.', 'Pablo Federico e Hijos S.A.', 'Guido Mogetta S.A.']);
  });
  it('tramo: seis cabinas confirmadas por fuentes públicas y trazados que referencian ciudades existentes', async () => {
    const t = await fuenteLocalJson.tramo();
    expect(t.cabinas.map((c) => c.slug).sort()).toEqual(['carcarana', 'franck', 'james-craik', 'leones', 'san-francisco', 'totoras']);
    const slugs = new Set(t.ciudades.map((c) => c.slug));
    for (const tr of t.trazados) for (const s of tr.ciudades) expect(slugs.has(s), `ciudad ${s} no existe`).toBe(true);
    for (const c of t.cabinas) expect(c.fuente?.url).toMatch(/^https:\/\//);
  });
  it('tarifario: solo la categoría auto tiene valor; el resto es null (a confirmar)', async () => {
    const t = await fuenteLocalJson.tarifario();
    expect(t.origen).toBe('oferta');
    expect(t.tarifas.find((x) => x.categoria === 'cat-2')?.montoSinIva).toBe(1399);
    expect(t.tarifas.filter((x) => x.montoSinIva !== null)).toHaveLength(1);
    expect(t.vigencia.descripcion.length).toBeGreaterThan(10);
  });
  it('obras y faq: ordenadas y con slugs únicos', async () => {
    const obras = await fuenteLocalJson.obras();
    expect(obras.map((o) => o.orden)).toEqual([...obras.map((o) => o.orden)].sort((a, b) => a - b));
    const faq = await fuenteLocalJson.faq();
    expect(new Set(faq.map((p) => p.slug)).size).toBe(faq.length);
    expect(faq.filter((p) => p.enHome).length).toBeGreaterThanOrEqual(4);
  });
  it('estadoRutas: no disponible en v1', async () => {
    expect((await fuenteLocalJson.estadoRutas()).disponible).toBe(false);
  });
});
