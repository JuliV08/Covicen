// Lo que el mapa y las tarjetas derivan del contrato: estado operativo, servicios y la posición de un km sobre el trazo.
import type { Cabina, NombreRuta, Tramo } from '@/lib/datos/esquemas';
import { cabinaOperativa } from '@/lib/datos/esquemas';

export type EstadoOperativo = { clave: 'operativa' | 'proxima'; etiqueta: string };

/** Verde (cobra hoy) o amarillo (cobra cuando Vialidad la habilite). Las nuevas nacen con Free Flow (PETP art. 2). */
export const estadoCabina = (c: Cabina): EstadoOperativo =>
  cabinaOperativa(c) ? { clave: 'operativa', etiqueta: 'Operativa' } : { clave: 'proxima', etiqueta: c.freeFlow ? 'Próxima · Free Flow' : 'Próxima' };

export const SERVICIOS = [
  ['areaDescanso', 'Área de descanso'],
  ['detencionSegura', 'Sector de detención segura'],
  ['gruaGratuita', 'Grúa y remolque gratuitos'],
  ['sanitarios', 'Sanitarios'],
  ['colocacionTelepase', 'Colocación de TelePASE'],
] as const;
export type ClaveServicio = (typeof SERVICIOS)[number][0];
type ItemServicio = { clave: ClaveServicio; etiqueta: string };

export const serviciosDeCabina = (c: Cabina): ItemServicio[] =>
  SERVICIOS.filter(([k]) => c.servicios?.[k] === true).map(([clave, etiqueta]) => ({ clave, etiqueta }));

/** Ítems de la leyenda: solo los servicios que alguna estación tiene (detención segura hoy no aparece: nadie sabe dónde están). */
export const leyendaServicios = (t: Tramo): ItemServicio[] =>
  SERVICIOS.filter(([k]) => t.cabinas.some((c) => c.servicios?.[k] === true)).map(([clave, etiqueta]) => ({ clave, etiqueta }));

/** Punto del SVG para un km de una ruta. Interpola a lo largo de la polilínea del trazado, que va en el sentido de las
 *  progresivas (pkInicial en el primer nodo, pkFinal en el último). Es esquemático: el dibujo no está a escala. */
export const puntoEnRuta = (t: Tramo, nombre: NombreRuta, km: number): { x: number; y: number } | null => {
  const ruta = t.rutas.find((r) => r.nombre === nombre);
  const trazado = t.trazados.find((z) => z.ruta === nombre);
  if (!ruta || !trazado || ruta.pkInicial === undefined || ruta.pkFinal === undefined || ruta.pkFinal <= ruta.pkInicial) return null;
  const coords = new Map(t.ciudades.map((c) => [c.slug, c.mapa]));
  const puntos = trazado.ciudades.map((s) => coords.get(s)).filter((p): p is { x: number; y: number } => p !== undefined);
  if (puntos.length < 2) return null;
  const largos = puntos.slice(1).map((p, i) => Math.hypot(p.x - puntos[i]!.x, p.y - puntos[i]!.y));
  const total = largos.reduce((a, b) => a + b, 0);
  const fraccion = Math.min(1, Math.max(0, (km - ruta.pkInicial) / (ruta.pkFinal - ruta.pkInicial)));
  let resta = fraccion * total;
  for (let i = 0; i < largos.length; i++) {
    const l = largos[i]!;
    if (resta <= l || i === largos.length - 1) {
      const u = l === 0 ? 0 : Math.min(1, resta / l);
      const a = puntos[i]!;
      const b = puntos[i + 1]!;
      return { x: Math.round(a.x + (b.x - a.x) * u), y: Math.round(a.y + (b.y - a.y) * u) };
    }
    resta -= l;
  }
  return null;
};
