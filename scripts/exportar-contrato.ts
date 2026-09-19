// Exporta los esquemas Zod del front como JSON Schema. Los esquemas SON el contrato; esto es su
// forma portable: el backend (repo privado) valida cada respuesta de su API contra estos archivos.
//   pnpm contrato   → docs/contrato/{tramo,tarifario}.schema.json
// `io: 'input'` describe lo que la API tiene que MANDAR (los `.default()` quedan opcionales).
import { mkdirSync, writeFileSync } from 'node:fs';
import { z } from 'astro/zod';
import { esquemaTarifario, esquemaTramo } from '../src/lib/datos/esquemas.ts';

export function exportarContrato(): Record<string, unknown> {
  const opciones = { target: 'draft-2020-12', io: 'input', unrepresentable: 'any' } as const;
  return {
    tramo: z.toJSONSchema(esquemaTramo, opciones),
    tarifario: z.toJSONSchema(esquemaTarifario, opciones),
  };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/exportar-contrato.ts')) {
  mkdirSync('docs/contrato', { recursive: true });
  for (const [nombre, schema] of Object.entries(exportarContrato())) {
    writeFileSync(`docs/contrato/${nombre}.schema.json`, JSON.stringify(schema, null, 2) + '\n');
  }
  console.log('Contrato exportado a docs/contrato/');
}
