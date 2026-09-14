import { describe, expect, it } from 'vitest';
import { cabinaOperativa } from '@/lib/datos/esquemas';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('contenido del repo', () => {
  it('empresa: datos verificables de la adjudicación y del pliego', async () => {
    const e = await fuenteLocalJson.empresa();
    expect(e.concesion.km).toBe(679.03);
    expect(e.concesion.rutas).toEqual(['RN 9', 'RN 19', 'RN 34']);
    expect(e.concesion.inicioOperacion).toBe('2026-10-05');
    expect(e.concesion.tarifaOfertadaSinIva).toBe(1399);
    expect(e.enFormacion).toBe(true);
    expect(e.cuit).toBeNull();
    expect(e.domicilioComercial).toBeNull();
    expect(e).not.toHaveProperty('descriptor');
    expect(e.consorcio.map((c) => c.nombre)).toEqual(['AFEMA S.A.', 'Pablo Federico e Hijos S.A.', 'Guido Mogetta S.A.']);
  });
  it('contacto: el 140 está, los canales comerciales todavía no, y la tabla de canales trae los plazos del pliego', async () => {
    const c = await fuenteLocalJson.contacto();
    expect(c.emergencias.telefono).toBe('140');
    expect(c.lineaGratuita).toBeNull();
    expect(c.atencionUsuario).toBeNull();
    expect(c.enlaces.telepase).toMatch(/^https:\/\/www\.telepase\.com\.ar/);
    expect(c.enlaces.oficinaVirtual).toBeNull();
    expect(c.canales.map((k) => k.id)).toEqual(['emergencias-140', 'asistencia', 'formulario', 'correo', 'linea-0800', 'whatsapp']);
    expect(c.canales.find((k) => k.id === 'formulario')).toMatchObject({ acuse: '24 horas', respuesta: '5 días hábiles' });
  });
  it('tramo: 679,03 km, tres rutas con progresivas oficiales, seis cabinas con km y las tres existentes operativas', async () => {
    const t = await fuenteLocalJson.tramo();
    expect(t.km).toBe(679.03);
    expect(t.rutas.map((r) => [r.nombre, r.km, r.pkInicial, r.pkFinal])).toEqual([['RN 9', 363.16, 297, 660.16], ['RN 19', 127.19, 0, 127.19], ['RN 34', 188.68, 0, 188.68]]);
    expect(t.rutas.find((r) => r.nombre === 'RN 34')?.hasta).toBe('Empalme con la RN 19');
    expect(t.cabinas.map((c) => c.slug).sort()).toEqual(['carcarana', 'franck', 'james-craik', 'leones', 'san-francisco', 'totoras']);
    for (const c of t.cabinas) expect(c.km, c.slug).not.toBeNull();
    expect(t.cabinas.filter(cabinaOperativa).map((c) => c.slug).sort()).toEqual(['carcarana', 'franck', 'james-craik']);
    expect(t.cabinas.filter((c) => !cabinaOperativa(c)).every((c) => c.freeFlow === true)).toBe(true);
    expect(t.cabinas.filter(cabinaOperativa).every((c) => c.servicios?.areaDescanso === true)).toBe(true);
    const slugs = new Set(t.ciudades.map((c) => c.slug));
    for (const tr of t.trazados) for (const s of tr.ciudades) expect(slugs.has(s), `ciudad ${s} no existe`).toBe(true);
    expect(t.trazados.find((x) => x.ruta === 'RN 34')?.ciudades.at(-1)).toBe('empalme-rn-19');
    expect(t.trazados.find((x) => x.ruta === 'RN 19')?.ciudades[0]).toBe('santo-tome');
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
