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
  it('tarifario: el cuadro heredado de la Res. 248/2026, cinco categorías con precio, igual en las tres estaciones', async () => {
    const t = await fuenteLocalJson.tarifario();
    expect(t.origen).toBe('heredado');
    expect(t.vigencia.desde).toBe('2026-02-26');
    expect(t.resolucion).toContain('248/2026');
    expect(t.cabinas).toEqual(['carcarana', 'james-craik', 'franck']);
    expect(t.categoriaDestacada).toBe('cat-1');
    expect(t.tarifas).toHaveLength(5);
    expect(t.tarifas.every((x) => x.montoSinIva !== null && x.montoManualSinIva === x.montoSinIva)).toBe(true);
    expect(t.tarifas.map((x) => Math.round(x.montoSinIva! * 1.21))).toEqual([1500, 3000, 4500, 6000, 7500]);
    expect(t.tarifas.map((x) => x.icono)).toEqual(['auto', 'camioneta', 'camion-3-4', 'camion-5-6', 'camion-7']);
    expect(t.avisos.some((a) => a.includes('en oportunidad de contar con todas las vías automáticas'))).toBe(true);
  });
  it('servicios: gratuitos con los tiempos del pliego y onerosos separados', async () => {
    const s = await fuenteLocalJson.servicios();
    const grua = s.find((x) => x.id === 'grua-y-remolque')!;
    expect(grua.gratuito).toBe(true);
    expect(grua.tiempos).toEqual(['Vehículos livianos: 30 minutos en al menos el 90 % de los casos, y nunca más de 40.', 'Vehículos pesados: 60 minutos en al menos el 90 % de los casos, y nunca más de 72.']);
    expect(s.filter((x) => !x.gratuito).map((x) => x.id)).toEqual(['mecanica-general', 'remolque-extendido']);
  });
  it('servicios: la tarjeta de atención al usuario no contradice el cuadro del art. 58.1 (el 0800 acusa en el momento)', async () => {
    const [s, c] = await Promise.all([fuenteLocalJson.servicios(), fuenteLocalJson.contacto()]);
    // El cuadro del PETG 58.1 da acuse INMEDIATO a la línea gratuita 0800 y 24 horas a formulario web / correo y
    // ChatBot/WhatsApp. En /servicios/ esta tarjeta y la tabla de Canales conviven tres bloques aparte: si la tarjeta
    // mete el 0800 en la bolsa de las 24 horas, la página se desmiente sola.
    expect(c.canales.find((k) => k.id === 'linea-0800')?.acuse).toBe('Inmediato');
    const atencion = s.find((x) => x.id === 'atencion-al-usuario')!;
    const clausulaDel0800 = atencion.descripcion.split(/[.;]/).find((frase) => frase.includes('0800'));
    expect(clausulaDel0800, 'la tarjeta tiene que nombrar el 0800').toBeDefined();
    expect(clausulaDel0800).toMatch(/en el momento|inmediat/i);
    expect(clausulaDel0800).not.toMatch(/24 horas/);
    expect(atencion.descripcion).toContain('24 horas');
    expect(atencion.descripcion).toContain('5 días hábiles');
  });
  it('faq del desperfecto en ruta: los tiempos de grúa se publican como los del pliego, no como promesa lisa', async () => {
    const p = (await fuenteLocalJson.faq()).find((x) => x.slug === 'desperfecto-en-ruta')!;
    // PETG 54.5: 30 minutos en al menos el 90 % de las ocurrencias y nunca más de 40 (livianos), 60 y 72 (pesados).
    // Publicar "30 para livianos y 60 para pesados" a secas promete algo que el contrato no compromete.
    const grua = (await fuenteLocalJson.servicios()).find((x) => x.id === 'grua-y-remolque')!;
    // La redacción sale de servicios.json: si allá cambia, acá tiene que cambiar igual.
    for (const t of grua.tiempos ?? []) expect(p.respuesta).toContain(t.replace(/^Vehículos \w+: /, '').replace(/\.$/, ''));
    expect(grua.tiempos).toHaveLength(2);
    expect(p.respuesta).not.toMatch(/30 minutos para livianos/);
  });
  it('normativa: cada norma enlaza el aviso del Boletín Oficial que le corresponde', async () => {
    const n = await fuenteLocalJson.normativa();
    const porId = Object.fromEntries(n.map((x) => [x.id, x]));
    // Verificado contra el Boletín Oficial: el aviso 310150 es la Resolución 215/2024 de la Comisión Nacional de
    // Trabajo Agrario, no la ley. El PETG 61.6 obliga a dar acceso a la normativa aplicable: el enlace tiene que abrirla.
    expect(porId['ley-27742'].url).toBe('https://www.boletinoficial.gob.ar/detalleAviso/primera/310189/20240708');
    // El aviso 320610 es una notificación de la Aduana de Concepción del Uruguay; el Decreto 97/2025 salió el 17/02.
    expect(porId['decreto-97-2025'].url).toBe('https://www.boletinoficial.gob.ar/detalleAviso/primera/321201/20250217');
    expect(porId['decreto-97-2025'].descripcion).toContain('17/02/2025');
    expect(porId['decreto-97-2025'].descripcion).not.toContain('13/02/2025');
  });
  it('normativa, trámites y consejos cargan y tienen ids únicos', async () => {
    const [n, tr, co] = await Promise.all([fuenteLocalJson.normativa(), fuenteLocalJson.tramites(), fuenteLocalJson.consejos()]);
    expect(n.map((x) => x.id)).toContain('resolucion-248-2026');
    expect(n.filter((x) => x.descargable).every((x) => x.url !== null)).toBe(true);
    expect(tr.map((x) => x.id)).toEqual(['tarifa-diferencial-vecinal', 'tarifa-diferencial-docente', 'exencion-discapacidad', 'exencion-malvinas', 'alta-telepase']);
    expect(co.filter((c) => c.categoria === 'emergencia').length).toBeGreaterThanOrEqual(4);
    expect(new Set(co.map((c) => c.id)).size).toBe(co.length);
  });
  it('obras y faq: ordenadas y con slugs únicos', async () => {
    const obras = await fuenteLocalJson.obras();
    expect(obras.map((o) => o.orden)).toEqual([...obras.map((o) => o.orden)].sort((a, b) => a - b));
    const faq = await fuenteLocalJson.faq();
    expect(new Set(faq.map((p) => p.slug)).size).toBe(faq.length);
    expect(faq.filter((p) => p.enHome).length).toBeGreaterThanOrEqual(4);
  });
  it('estadoRutas: datos de ejemplo marcados como tales, con fecha y un incidente por tipo', async () => {
    const e = await fuenteLocalJson.estadoRutas();
    expect(e.disponible).toBe(true);
    expect(e.ejemplo).toBe(true);
    expect(e.actualizado).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Set(e.incidentes?.map((i) => i.tipo))).toEqual(new Set(['transito', 'obra', 'incidente', 'clima']));
  });
});
