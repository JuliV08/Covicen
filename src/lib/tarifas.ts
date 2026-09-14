// Lo que la UI deriva del tarifario: filas por cabina (con excepciones aplicadas), precio al público, destacada e íconos.
import type { Cabina, IconoVehiculo, Tarifa, Tarifario } from '@/lib/datos/esquemas';
import { cabinaOperativa } from '@/lib/datos/esquemas';
import { conIva } from '@/lib/formato';

export type FilaTarifa = Tarifa & { telepaseSinIva: number | null; manualSinIva: number | null };

/** Tarifas que rigen en una cabina: las generales, con las excepciones de esa cabina aplicadas (mismo modelo que el backend).
 *  Manual sin dato (undefined) = igual a TelePASE (Res. 248/2026: un solo precio); manual null = sin valor publicado. */
export const tarifasParaCabina = (t: Tarifario, cabina: string): FilaTarifa[] =>
  t.tarifas.map((f) => {
    const ex = t.excepciones?.find((e) => e.cabina === cabina && e.categoria === f.categoria);
    const telepase = ex ? ex.montoSinIva : f.montoSinIva;
    const manualCrudo = ex ? ex.montoManualSinIva : f.montoManualSinIva;
    return { ...f, telepaseSinIva: telepase, manualSinIva: manualCrudo === undefined ? telepase : manualCrudo };
  });

/** Precio al público (con IVA): el que manda el sistema si viene; si no, calculado con la alícuota y redondeado al peso. */
export const publico = (sinIva: number | null, conIvaSistema: number | null | undefined, alicuota: number): number | null =>
  sinIva === null ? null : (conIvaSistema ?? conIva(sinIva, alicuota));

export const tarifaDestacada = (t: Tarifario): Tarifa => t.tarifas.find((f) => f.categoria === t.categoriaDestacada) ?? t.tarifas[0]!;

/** Cabinas donde rige el cuadro: las listadas en el tarifario o, si no lista, todas las operativas. */
export const cabinasDelCuadro = (t: Tarifario, cabinas: Cabina[]): Cabina[] =>
  t.cabinas ? cabinas.filter((c) => t.cabinas!.includes(c.slug)) : cabinas.filter(cabinaOperativa);

// Para tarifarios sin `icono` (la API antes de mandarlo, fixtures viejos): categorías del esquema anterior.
const LEGADO: Record<string, IconoVehiculo> = { 'cat-1': 'moto', 'cat-2': 'auto', 'cat-3': 'camioneta', 'cat-4': 'camion-2', 'cat-5': 'camion-3-4', 'cat-6': 'camion-5-6' };
export const iconoDeTarifa = (f: Tarifa): IconoVehiculo => f.icono ?? LEGADO[f.categoria] ?? 'auto';
