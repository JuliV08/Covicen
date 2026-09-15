import { describe, expect, it } from 'vitest';
import { cabinaOperativa, esquemaCabina, esquemaCiudad, esquemaContacto, esquemaEmpresa, esquemaRuta, esquemaTarifario, url } from '@/lib/datos/esquemas';

// El contrato es la única puerta de entrada de los datos del backend: si acá pasa un `javascript:`, después
// hay que acordarse de filtrarlo en cada href. Se filtra una sola vez, acá.
describe('url (el tipo del contrato)', () => {
  it('acepta http y https', () => {
    expect(url.parse('https://www.boletinoficial.gob.ar/detalleAviso/primera/1/2026')).toContain('boletinoficial');
    expect(() => url.parse('http://covicen.com.ar')).not.toThrow();
  });
  it('rechaza los esquemas que ejecutan código o embeben contenido, aunque sean URLs válidas', () => {
    for (const v of ['javascript:alert(1)', 'data:text/html,<script>x()</script>', 'vbscript:msgbox(1)', 'file:///c:/x'])
      expect(() => url.parse(v), v).toThrow();
  });
  it('sigue rechazando lo que no es una URL', () => {
    expect(() => url.parse('boletinoficial.gob.ar')).toThrow();
  });
});

describe('esquemaTarifario', () => {
  const base = {
    publicadoEl: '2026-08-27',
    vigencia: { desde: null, descripcion: 'A partir de la habilitación del cobro' },
    moneda: 'ARS',
    alicuotaIva: 0.21,
    origen: 'oferta',
    tarifas: [{ categoria: 'cat-2', nombre: 'Autos y camionetas', descripcion: '2 ejes, hasta 2,10 m', montoSinIva: 1399 }],
    fuente: { nombre: 'Resolución 1379/2026', url: 'https://www.boletinoficial.gob.ar/detalleAviso/primera/346271/20260824' },
    avisos: [],
  };
  it('acepta un tarifario válido', () => {
    expect(esquemaTarifario.parse(base).tarifas[0]?.montoSinIva).toBe(1399);
  });
  it('acepta montoSinIva null (sin valor publicado) pero no un string', () => {
    expect(() => esquemaTarifario.parse({ ...base, tarifas: [{ ...base.tarifas[0], montoSinIva: null }] })).not.toThrow();
    expect(() => esquemaTarifario.parse({ ...base, tarifas: [{ ...base.tarifas[0], montoSinIva: '$1.399' }] })).toThrow();
  });
  it('rechaza fechas que no sean YYYY-MM-DD', () => {
    expect(() => esquemaTarifario.parse({ ...base, publicadoEl: '27/08/2026' })).toThrow();
  });
  it('rechaza una fuente con URL que no sea http(s): el tarifario lo manda el backend y su URL va a un href', () => {
    expect(() => esquemaTarifario.parse({ ...base, fuente: { nombre: 'Res. 1/2026', url: 'javascript:alert(1)' } })).toThrow();
    expect(() => esquemaTarifario.parse({ ...base, fuente: { nombre: 'Res. 1/2026', url: 'data:text/html,hola' } })).toThrow();
  });
  it('admite origen heredado, resolución, cabinas, excepciones y monto manual, todos opcionales salvo origen', () => {
    const t = esquemaTarifario.parse({
      ...base, origen: 'heredado', resolucion: 'Resolución 248/2026 de la DNV', cabinas: ['carcarana', 'james-craik', 'franck'], categoriaDestacada: 'cat-1',
      tarifas: [{ ...base.tarifas[0], montoManualSinIva: 1239.67, multiplicador: 1 }],
      excepciones: [{ cabina: 'franck', categoria: 'cat-2', montoSinIva: 2000, montoManualSinIva: null }],
    });
    expect(t.origen).toBe('heredado');
    expect(t.excepciones?.[0]?.cabina).toBe('franck');
    expect(() => esquemaTarifario.parse({ ...base, origen: 'inventado' })).toThrow();
  });
});

describe('esquemaCabina', () => {
  const base = { slug: 'totoras', nombre: 'Totoras', ruta: 'RN 34', km: 60, localidad: 'Totoras', provincia: 'Santa Fe', situacion: 'nueva', estado: 'confirmada', mapa: { x: 1, y: 2 } };
  it('exige slug, ruta conocida y estado', () => {
    expect(() => esquemaCabina.parse(base)).not.toThrow();
    expect(() => esquemaCabina.parse({ ...base, ruta: 'RN 7' })).toThrow();
  });
  it('admite vías, operativa, sentido, teléfono, horario y servicios, todos opcionales', () => {
    const c = esquemaCabina.parse({ ...base, vias: 10, operativa: true, sentido: 'ambos', telefono: '0341 000000', horarioAtencion: 'Lunes a viernes de 8 a 20', servicios: { areaDescanso: true, colocacionTelepase: true } });
    expect(c.vias).toBe(10);
    expect(c.servicios?.areaDescanso).toBe(true);
    expect(c.servicios?.detencionSegura).toBeUndefined();
  });
  it('cabinaOperativa: explícito si está, si no deriva de la situación', () => {
    expect(cabinaOperativa(esquemaCabina.parse(base))).toBe(false);
    expect(cabinaOperativa(esquemaCabina.parse({ ...base, situacion: 'existente' }))).toBe(true);
    expect(cabinaOperativa(esquemaCabina.parse({ ...base, situacion: 'existente', operativa: false }))).toBe(false);
  });
});

describe('esquemaContacto', () => {
  const vacio = {
    emergencias: { telefono: '140', etiqueta: 'Emergencias' }, lineaGratuita: null, atencionUsuario: null, whatsapp: { numero: null },
    email: { general: null, rrhh: null, proveedores: null, etica: null }, redes: {},
    enlaces: { telepase: 'https://www.telepase.com.ar/', oficinaVirtual: null, atencionDnv: null },
    canales: [{ id: 'emergencias-140', nombre: 'Emergencias 140', tipo: 'telefono', valor: '140', disponibilidad: '24 horas, los 365 días', acuse: 'Inmediato', respuesta: 'Inmediata', fuente: 'PETG art. 58 y 59' }],
    cuentaRegularizacion: null,
  };
  it('admite los canales comerciales en null, pero el 140 es obligatorio', () => {
    expect(esquemaContacto.parse(vacio).whatsapp.numero).toBeNull();
    expect(() => esquemaContacto.parse({ ...vacio, emergencias: { telefono: null, etiqueta: 'Emergencias' } })).toThrow();
  });
  it('rechaza un WhatsApp con signos (debe ser E.164 sin +) y un canal con tipo desconocido', () => {
    expect(() => esquemaContacto.parse({ ...vacio, whatsapp: { numero: '+54 9 351' } })).toThrow();
    expect(() => esquemaContacto.parse({ ...vacio, canales: [{ ...vacio.canales[0], tipo: 'fax' }] })).toThrow();
  });
});

describe('esquemaEmpresa', () => {
  const base = {
    marca: 'Covicen', razonSocial: null, cuit: null, domicilioLegal: null, domicilioComercial: null, constanciaUrl: null, polizaRc: null, enFormacion: true,
    consorcio: [{ nombre: 'AFEMA S.A.', descripcion: 'Constructora vial.' }],
    concesion: { tramo: 'Centro', km: 679.03, rutas: ['RN 9'], provincias: ['Córdoba'], plazoAnios: 20, prorrogaAnios: 10, inicioOperacion: '2026-10-05', adjudicacion: { fecha: '2026-08-24', resolucion: 'R', url: 'https://x' }, tarifaOfertadaSinIva: 1399, tarifaTopeSinIva: 3200, tramosEtapa: 8 },
  };
  it('exige consorcio no vacío y ya no acepta descriptor', () => {
    expect(() => esquemaEmpresa.parse({ ...base, consorcio: [] })).toThrow();
    expect(esquemaEmpresa.parse(base)).not.toHaveProperty('descriptor');
  });
  it('la póliza de RC es opcional (null) y, si viene, exige aseguradora, número y vigencia', () => {
    expect(esquemaEmpresa.parse(base).polizaRc).toBeNull();
    expect(() => esquemaEmpresa.parse({ ...base, polizaRc: { aseguradora: 'X Seguros', numero: '1', vigenciaHasta: '2027-10-05', url: null } })).not.toThrow();
    expect(() => esquemaEmpresa.parse({ ...base, polizaRc: { aseguradora: 'X Seguros' } })).toThrow();
  });
});

describe('esquemaRuta y esquemaCiudad', () => {
  it('admiten progresivas y tipo de nodo, opcionales', () => {
    expect(esquemaRuta.parse({ nombre: 'RN 34', descripcion: 'x', desde: 'a', hasta: 'b', km: 188.68, pkInicial: 0, pkFinal: 188.68 }).pkFinal).toBe(188.68);
    expect(esquemaCiudad.parse({ slug: 'empalme-rn-19', nombre: 'Empalme RN 19', provincia: 'Santa Fe', mapa: { x: 1, y: 1 }, tipo: 'empalme' }).tipo).toBe('empalme');
    expect(esquemaCiudad.parse({ slug: 'rosario', nombre: 'Rosario', provincia: 'Santa Fe', mapa: { x: 1, y: 1 } }).tipo).toBe('ciudad');
  });
});
