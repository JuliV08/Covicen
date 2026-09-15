// Lo que la UI deriva del tarifario: filas por cabina (con excepciones aplicadas), precio al público, destacada e íconos.
import type { Cabina, IconoVehiculo, Tarifa, Tarifario } from '@/lib/datos/esquemas';
import { cabinaOperativa } from '@/lib/datos/esquemas';
import { conIva } from '@/lib/formato';

/** Una fila ya resuelta para una cabina: el sin IVA y el precio al público de cada columna.
 *  Se van a propósito `montoConIva` y `montoManualSinIva` del contrato: con una excepción por cabina el con-IVA del
 *  cuadro general deja de corresponder a esta fila, así que la UI tiene que leer siempre los campos resueltos. */
export type FilaTarifa = Omit<Tarifa, 'montoConIva' | 'montoManualSinIva'> & {
  telepaseSinIva: number | null;
  manualSinIva: number | null;
  telepaseConIva: number | null;
  manualConIva: number | null;
};

/** Precio al público (con IVA): el que manda el sistema si viene; si no, calculado con la alícuota y redondeado al peso. */
export const publico = (sinIva: number | null, conIvaSistema: number | null | undefined, alicuota: number): number | null =>
  sinIva === null ? null : (conIvaSistema ?? conIva(sinIva, alicuota));

/** Tarifas que rigen en una cabina: las generales, con las excepciones de esa cabina aplicadas (mismo modelo que el backend).
 *  Manual sin dato (undefined) = igual a TelePASE (Res. 248/2026: un solo precio); manual null = sin valor publicado. */
export const tarifasParaCabina = (t: Tarifario, cabina?: string): FilaTarifa[] =>
  t.tarifas.map(({ montoConIva, montoManualSinIva, ...f }) => {
    const ex = cabina ? t.excepciones?.find((e) => e.cabina === cabina && e.categoria === f.categoria) : undefined;
    const telepaseSinIva = ex ? ex.montoSinIva : f.montoSinIva;
    const manualCrudo = ex ? ex.montoManualSinIva : montoManualSinIva;
    const manualSinIva = manualCrudo === undefined ? telepaseSinIva : manualCrudo;
    // El con-IVA que publica el sistema es el del cuadro general: con excepción no vale para este sin IVA y se recalcula.
    const telepaseConIva = publico(telepaseSinIva, ex ? undefined : montoConIva, t.alicuotaIva);
    return {
      ...f,
      telepaseSinIva,
      manualSinIva,
      telepaseConIva,
      // Mismo sin IVA en las dos columnas (Res. 248/2026) = mismo precio al público: se reusa, no se recalcula, para que
      // un con-IVA del sistema que no siga el redondeo al peso no parta la fila en dos números distintos.
      manualConIva: manualSinIva === telepaseSinIva ? telepaseConIva : publico(manualSinIva, undefined, t.alicuotaIva),
    };
  });

export const tarifaDestacada = (t: Tarifario): Tarifa => t.tarifas.find((f) => f.categoria === t.categoriaDestacada) ?? t.tarifas[0]!;

/** Cabinas donde rige el cuadro: las listadas en el tarifario o, si no lista, todas las operativas. */
export const cabinasDelCuadro = (t: Tarifario, cabinas: Cabina[]): Cabina[] =>
  t.cabinas ? cabinas.filter((c) => t.cabinas!.includes(c.slug)) : cabinas.filter(cabinaOperativa);

// Para tarifarios sin `icono` (la API antes de mandarlo, fixtures viejos): categorías del esquema anterior.
const LEGADO: Record<string, IconoVehiculo> = { 'cat-1': 'moto', 'cat-2': 'auto', 'cat-3': 'camioneta', 'cat-4': 'camion-2', 'cat-5': 'camion-3-4', 'cat-6': 'camion-5-6' };
export const iconoDeTarifa = (f: Tarifa): IconoVehiculo => f.icono ?? LEGADO[f.categoria] ?? 'auto';
