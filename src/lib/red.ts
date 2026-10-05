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

const r2 = (n: number) => Math.round(n * 100) / 100;
const hacia = (de: Punto, a: Punto, dist: number): Punto => {
  const l = Math.hypot(a.x - de.x, a.y - de.y) || 1;
  return { x: de.x + ((a.x - de.x) / l) * dist, y: de.y + ((a.y - de.y) / l) * dist };
};
// En cada vértice la curva arranca y termina a `radio` del vértice, sin pasar la mitad de ninguno de los dos tramos.
const radioEn = (a: Punto, b: Punto, c: Punto, radio: number) => Math.min(radio, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2);

/** El `d` de la cinta: rectas, y en cada vértice una curva cuadrática con control en el vértice (no se quiebra). */
export const trazoRedondeado = (pts: Punto[], radio = 14): string => {
  if (pts.length < 2) return '';
  let d = `M${r2(pts[0]!.x)} ${r2(pts[0]!.y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1]!, b = pts[i]!, c = pts[i + 1]!;
    const r = radioEn(a, b, c, radio);
    const p1 = hacia(b, a, r), p2 = hacia(b, c, r);
    d += ` L${r2(p1.x)} ${r2(p1.y)} Q${r2(b.x)} ${r2(b.y)} ${r2(p2.x)} ${r2(p2.y)}`;
  }
  const z = pts[pts.length - 1]!;
  return `${d} L${r2(z.x)} ${r2(z.y)}`;
};

/** Un punto del recorrido del auto: posición, rumbo en grados (0 = hacia la derecha) y distancia desde el arranque. */
export type Muestra = { x: number; y: number; angulo: number; d: number };
const grados = (a: Punto, b: Punto) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
const linea = (a: Punto, b: Punto, paso: number): Punto[] => {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / paso));
  return Array.from({ length: n }, (_, i) => ({ x: a.x + ((b.x - a.x) * (i + 1)) / n, y: a.y + ((b.y - a.y) * (i + 1)) / n }));
};
const cuadratica = (p0: Punto, c: Punto, p1: Punto, n: number): Punto[] =>
  Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n, u = 1 - t;
    return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y };
  });
const cubica = (p0: Punto, c1: Punto, c2: Punto, p1: Punto, n: number): Punto[] =>
  Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n, u = 1 - t;
    return {
      x: u ** 3 * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * p1.x,
      y: u ** 3 * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * p1.y,
    };
  });

/** ¿El primer tramo va a contramano de hacia dónde mira el auto? Más de 100° = vuelta en U. */
export const necesitaVuelta = (rumbo: number, desde: Punto, destino: Punto): boolean =>
  Math.abs(((grados(desde, destino) - rumbo + 540) % 360) - 180) > 100;

const RADIO_U = 7;
// La vuelta en U (Juli, 05/10/2026: «no que vaya marcha atrás»): medio círculo por la izquierda, que arranca tangente
// a la ruta y termina 2 × RADIO_U al costado mirando para el otro lado, y una curva en S que lo devuelve a la cinta.
// En SVG la `y` crece hacia abajo: la izquierda de un rumbo θ es (sen θ, −cos θ), y doblar a la izquierda es que el
// ángulo alrededor del centro baje.
const vueltaEnU = (inicio: Punto, rumbo: number, siguiente: Punto): Punto[] => {
  const th = (rumbo * Math.PI) / 180;
  const adelante = { x: Math.cos(th), y: Math.sin(th) };
  const izq = { x: Math.sin(th), y: -Math.cos(th) };
  const centro = { x: inicio.x + izq.x * RADIO_U, y: inicio.y + izq.y * RADIO_U };
  const a0 = Math.atan2(inicio.y - centro.y, inicio.x - centro.x);
  const arco = Array.from({ length: 12 }, (_, i) => {
    const a = a0 - Math.PI * ((i + 1) / 12);
    return { x: centro.x + Math.cos(a) * RADIO_U, y: centro.y + Math.sin(a) * RADIO_U };
  });
  const fin = arco[arco.length - 1]!;
  const llegada = hacia(inicio, siguiente, Math.min(30, Math.hypot(siguiente.x - inicio.x, siguiente.y - inicio.y) / 2));
  const sentido = hacia({ x: 0, y: 0 }, { x: siguiente.x - inicio.x, y: siguiente.y - inicio.y }, 1);
  const curva = cubica(
    fin,
    { x: fin.x - adelante.x * 12, y: fin.y - adelante.y * 12 },
    { x: llegada.x - sentido.x * 10, y: llegada.y - sentido.y * 10 },
    llegada,
    12,
  );
  return [...arco, ...curva];
};

/** El recorrido del auto por una lista de puntos de la red, muestreado cada ~2 unidades, por las mismas curvas que la
 *  cinta. Con `rumbo`, si el primer tramo va a contramano, arranca con la vuelta en U. */
export const recorrido = (pts: Punto[], { radio = 14, rumbo }: { radio?: number; rumbo?: number }): Muestra[] => {
  if (!pts.length) return [];
  const camino: Punto[] = [pts[0]!];
  let base = pts;
  if (rumbo !== undefined && pts.length > 1 && necesitaVuelta(rumbo, pts[0]!, pts[1]!)) {
    const u = vueltaEnU(pts[0]!, rumbo, pts[1]!);
    camino.push(...u);
    base = [u[u.length - 1]!, ...pts.slice(1)];
  }
  for (let i = 1; i < base.length; i++) {
    const a = base[i - 1]!, b = base[i]!, c = base[i + 1];
    if (!c) {
      camino.push(...linea(camino[camino.length - 1]!, b, 2));
      break;
    }
    const r = radioEn(a, b, c, radio);
    const p1 = hacia(b, a, r), p2 = hacia(b, c, r);
    camino.push(...linea(camino[camino.length - 1]!, p1, 2), ...cuadratica(p1, b, p2, 8));
  }
  let d = 0;
  return camino.map((p, i) => {
    if (i > 0) d += Math.hypot(p.x - camino[i - 1]!.x, p.y - camino[i - 1]!.y);
    const a = camino[Math.max(0, i - 1)]!, b = camino[Math.min(camino.length - 1, i + 1)]!;
    const angulo = i === 0 && rumbo !== undefined ? rumbo : grados(a, b);
    return { x: r2(p.x), y: r2(p.y), angulo, d };
  });
};

/** La posición a una distancia dada del arranque, interpolando entre muestras (el ángulo, por el giro más corto). */
export const posicionEn = (m: Muestra[], d: number): Muestra => {
  if (d <= 0) return m[0]!;
  const ultimo = m[m.length - 1]!;
  if (d >= ultimo.d) return ultimo;
  let i = 1;
  while (m[i]!.d < d) i++;
  const a = m[i - 1]!, b = m[i]!, t = (d - a.d) / (b.d - a.d || 1);
  const giro = ((b.angulo - a.angulo + 540) % 360) - 180;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angulo: a.angulo + giro * t, d };
};

/** Tocar otra estación en pleno viaje: el auto termina el tramo en curso (sigue hasta el próximo nodo del viaje) y de
 *  ahí toma el camino más corto a la nueva. Así nunca salta ni queda fuera de la ruta. */
export const continuarDesde = (red: Red, viaje: string[], muestras: Muestra[], d: number, destino: string): { camino: string[]; desde: Muestra } => {
  const cercana = (p: Punto) => muestras.reduce((mejor, m) => (Math.hypot(m.x - p.x, m.y - p.y) < Math.hypot(mejor.x - p.x, mejor.y - p.y) ? m : mejor));
  const enNodos = puntosDe(red, viaje).map(cercana);
  let i = enNodos.findIndex((m) => m.d >= d);
  if (i === -1) i = viaje.length - 1;
  return { camino: caminoEntre(red, viaje[i]!, destino), desde: enNodos[i]! };
};

/** Cuánto dura un viaje, en milisegundos: rápido pero que se vea (entre 0,5 y 2 segundos según el largo). */
export const duracionViaje = (largo: number) => Math.max(500, Math.min(2000, 450 + largo * 1.6));
/** Arranque y frenada suaves (ease-in-out cúbica). */
export const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
