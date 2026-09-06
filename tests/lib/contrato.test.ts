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
});
