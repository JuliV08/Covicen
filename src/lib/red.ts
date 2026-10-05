// La red de rutas del mapa y el viaje del auto (fase C, 05/10/2026). Módulo SIN dependencias a propósito: lo usan el
// componente (en el build) y scripts/mapa.ts (en el navegador). lib/tramo.ts importa el esquema de datos (zod) y no
// puede llegar al navegador.
export type Punto = { x: number; y: number };
export type Red = { ciudades: Array<{ slug: string; mapa: Punto }>; trazados: Array<{ ciudades: string[] }> };

const vecinos = (red: Red) => {
  const punto = new Map(red.ciudades.map((c) => [c.slug, c.mapa]));
  const g = new Map<string, Array<{ a: string; largo: number }>>();
  const unir = (de: string, a: string) => {
    const p = punto.get(de), q = punto.get(a);
    if (!p || !q) return;
    if (!g.has(de)) g.set(de, []);
    g.get(de)!.push({ a, largo: Math.hypot(q.x - p.x, q.y - p.y) });
  };
  for (const tr of red.trazados) {
    for (let i = 1; i < tr.ciudades.length; i++) {
      unir(tr.ciudades[i - 1]!, tr.ciudades[i]!);
      unir(tr.ciudades[i]!, tr.ciudades[i - 1]!);
    }
  }
  return g;
};

/** Camino más corto (Dijkstra) entre dos nodos de la red, como lista de slugs. [] si no hay camino. */
export const caminoEntre = (red: Red, desde: string, hasta: string): string[] => {
  if (desde === hasta) return [desde];
  const g = vecinos(red);
  if (!g.has(desde) || !g.has(hasta)) return [];
  const dist = new Map<string, number>([[desde, 0]]);
  const previo = new Map<string, string>();
  const abiertos = new Set(g.keys());
  while (abiertos.size) {
    let u: string | undefined;
    for (const n of abiertos) if (dist.has(n) && (u === undefined || dist.get(n)! < dist.get(u)!)) u = n;
    if (u === undefined || u === hasta) break;
    abiertos.delete(u);
    for (const { a, largo } of g.get(u) ?? []) {
      const d = dist.get(u)! + largo;
      if (d < (dist.get(a) ?? Infinity)) { dist.set(a, d); previo.set(a, u); }
    }
  }
  if (!dist.has(hasta)) return [];
  const camino = [hasta];
  while (camino[0] !== desde) camino.unshift(previo.get(camino[0]!)!);
  return camino;
};

export const puntosDe = (red: Red, slugs: string[]): Punto[] => {
  const punto = new Map(red.ciudades.map((c) => [c.slug, c.mapa]));
  return slugs.map((s) => punto.get(s)!);
};
