import { describe, expect, it } from 'vitest';
import { esquemaCabina, esquemaContacto, esquemaEmpresa, esquemaTarifario } from '@/lib/datos/esquemas';

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
  it('acepta montoSinIva null (a confirmar) pero no un string', () => {
    expect(() => esquemaTarifario.parse({ ...base, tarifas: [{ ...base.tarifas[0], montoSinIva: null }] })).not.toThrow();
    expect(() => esquemaTarifario.parse({ ...base, tarifas: [{ ...base.tarifas[0], montoSinIva: '$1.399' }] })).toThrow();
  });
  it('rechaza fechas que no sean YYYY-MM-DD', () => {
    expect(() => esquemaTarifario.parse({ ...base, publicadoEl: '27/08/2026' })).toThrow();
  });
});

describe('esquemaCabina', () => {
  it('exige slug, ruta conocida y estado', () => {
    expect(() =>
      esquemaCabina.parse({ slug: 'totoras', nombre: 'Totoras', ruta: 'RN 34', km: 60, localidad: 'Totoras', provincia: 'Santa Fe', situacion: 'nueva', estado: 'confirmada', mapa: { x: 1, y: 2 } }),
    ).not.toThrow();
    expect(() =>
      esquemaCabina.parse({ slug: 'x', nombre: 'X', ruta: 'RN 7', km: null, localidad: 'X', provincia: 'Córdoba', situacion: 'nueva', estado: 'confirmada', mapa: { x: 1, y: 2 } }),
    ).toThrow();
  });
});

describe('esquemaContacto', () => {
  const vacio = { emergencias: { telefono: null, etiqueta: 'Emergencias' }, whatsapp: { numero: null }, email: { general: null, rrhh: null, proveedores: null, etica: null }, redes: {} };
  it('admite todos los canales en null', () => {
    expect(esquemaContacto.parse(vacio).whatsapp.numero).toBeNull();
  });
  it('rechaza un WhatsApp con signos (debe ser E.164 sin +)', () => {
    expect(() => esquemaContacto.parse({ ...vacio, whatsapp: { numero: '+54 9 351' } })).toThrow();
  });
});

describe('esquemaEmpresa', () => {
  it('exige inicioOperacion ISO y consorcio no vacío', () => {
    expect(() =>
      esquemaEmpresa.parse({
        marca: 'Covicen', descriptor: 'Corredor Vial del Centro', razonSocial: null, cuit: null, domicilioLegal: null, enFormacion: true, consorcio: [],
        concesion: { tramo: 'Centro', km: 681.92, rutas: ['RN 9'], provincias: ['Córdoba'], plazoAnios: 20, prorrogaAnios: 10, inicioOperacion: '2026-10-05', adjudicacion: { fecha: '2026-08-24', resolucion: 'R', url: 'https://x' }, tarifaOfertadaSinIva: 1399, tarifaTopeSinIva: 3200, tramosEtapa: 8 },
      }),
    ).toThrow();
  });
});
