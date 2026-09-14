import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { exportarContrato } from '../../scripts/exportar-contrato';

describe('contrato exportado (docs/contrato)', () => {
  it('los JSON Schema commiteados coinciden con los esquemas Zod (si falla: pnpm contrato)', () => {
    for (const [nombre, schema] of Object.entries(exportarContrato())) {
      const enDisco = JSON.parse(readFileSync(`docs/contrato/${nombre}.schema.json`, 'utf8'));
      expect(enDisco).toEqual(schema);
    }
  });

  it('el tarifario exige lo que la landing necesita y deja opcional lo nuevo', () => {
    const tarifario = exportarContrato().tarifario as {
      required: string[];
      properties: { tarifas: { items: { required: string[]; properties: Record<string, unknown> } } };
    };
    expect(tarifario.required).toEqual(
      expect.arrayContaining(['publicadoEl', 'vigencia', 'moneda', 'alicuotaIva', 'origen', 'tarifas', 'fuente', 'avisos']),
    );
    const tarifa = tarifario.properties.tarifas.items;
    expect(tarifa.required).toEqual(expect.arrayContaining(['categoria', 'nombre', 'descripcion', 'montoSinIva']));
    expect(tarifa.required).not.toContain('montoConIva');
    expect(tarifa.properties).toHaveProperty('montoConIva');
  });

  it('la cabina admite freeFlow opcional', () => {
    const tramo = exportarContrato().tramo as {
      properties: { cabinas: { items: { required: string[]; properties: Record<string, unknown> } } };
    };
    const cabina = tramo.properties.cabinas.items;
    expect(cabina.properties).toHaveProperty('freeFlow');
    expect(cabina.required).not.toContain('freeFlow');
  });

  it('los campos nuevos del tramo y del tarifario son opcionales (el backend no está obligado a mandarlos)', () => {
    const { tramo, tarifario } = exportarContrato() as {
      tramo: { properties: { cabinas: { items: { required: string[]; properties: Record<string, unknown> } }; rutas: { items: { required: string[]; properties: Record<string, unknown> } } } };
      tarifario: { required: string[]; properties: Record<string, unknown> & { tarifas: { items: { required: string[]; properties: Record<string, unknown> } }; origen: { enum: string[] } } };
    };
    for (const campo of ['vias', 'operativa', 'sentido', 'telefono', 'horarioAtencion', 'servicios']) {
      expect(tramo.properties.cabinas.items.properties).toHaveProperty(campo);
      expect(tramo.properties.cabinas.items.required).not.toContain(campo);
    }
    for (const campo of ['pkInicial', 'pkFinal']) expect(tramo.properties.rutas.items.required).not.toContain(campo);
    for (const campo of ['resolucion', 'cabinas', 'categoriaDestacada', 'excepciones']) {
      expect(tarifario.properties).toHaveProperty(campo);
      expect(tarifario.required).not.toContain(campo);
    }
    expect(tarifario.properties.tarifas.items.required).not.toContain('montoManualSinIva');
    expect(tarifario.properties.tarifas.items.required).not.toContain('icono');
    expect(tarifario.properties.origen.enum).toEqual(['oferta', 'homologada', 'heredado']);
  });
});
