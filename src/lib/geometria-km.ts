// La posición de un km sobre el dibujo del mapa, sin el esquema de datos: lo usan el build (lib/tramo.ts, puntoEnRuta)
// y el navegador (lib/estado-dom.ts, para ubicar los avisos que llegan en vivo). El build la serializa en el SVG
// (data-geometria-km) y el cliente la lee de ahí. Solo `import type`: un valor de esquemas.ts arrastraría Zod al bundle.
import type { NombreRuta, Tramo } from '@/lib/datos/esquemas';

export type Punto = { x: number; y: number };
/** Por ruta: el km de inicio y de fin y la polilínea del trazado en el sentido de las progresivas. Una ruta sin km de
 *  inicio y de fin, o con menos de dos nodos ubicados, no está: sus avisos se leen en la lista, pero no van al mapa. */
export type GeometriaKm = Partial<Record<NombreRuta, { pkInicial: number; pkFinal: number; puntos: Punto[] }>>;

export const geometriaKm = (t: Tramo): GeometriaKm => {
  const coords = new Map(t.ciudades.map((c) => [c.slug, c.mapa]));
  const geo: GeometriaKm = {};
  for (const nombre of new Set(t.rutas.map((r) => r.nombre))) {
    const ruta = t.rutas.find((r) => r.nombre === nombre)!;
    const trazado = t.trazados.find((z) => z.ruta === nombre);
    if (!trazado || ruta.pkInicial === undefined || ruta.pkFinal === undefined || ruta.pkFinal <= ruta.pkInicial) continue;
    const puntos = trazado.ciudades.map((s) => coords.get(s)).filter((p): p is Punto => p !== undefined);
    if (puntos.length < 2) continue;
    geo[nombre] = { pkInicial: ruta.pkInicial, pkFinal: ruta.pkFinal, puntos: puntos.map(({ x, y }) => ({ x, y })) };
  }
  return geo;
};

/** Punto del SVG para un km de una ruta: interpola a lo largo de la polilínea (pkInicial en el primer nodo, pkFinal en
 *  el último). Fuera de rango, se pega al extremo. Es esquemático: el dibujo no está a escala. */
export const puntoEnGeometria = (geo: GeometriaKm, nombre: NombreRuta, km: number): Punto | null => {
  const ruta = geo[nombre];
  if (!ruta) return null;
  const { puntos } = ruta;
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
