# Fase C · El mapa nuevo — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el mapa interactivo (home y El tramo): encuadrado y a todo el ancho, terminado como un mapa
profesional (cintas continuas con curvas, estaciones en anillos, rótulos con placa), con un auto que viaja por el camino
más corto hasta la estación elegida, con vuelta en U, y la ficha compacta flotando desde 1280 px.

**Architecture:** Las cuentas puras (red de rutas, camino más corto, curvas, recorrido del auto) van a un módulo nuevo
sin dependencias, `src/lib/red.ts`, que usan el componente (en el build) y el script del mapa (en el navegador). Lo que
necesita el esquema de datos (encuadre y lugar de la ficha, que usan los rótulos) queda en `src/lib/tramo.ts`.
`MapaTramo.astro` se reescribe con el dibujo nuevo y el auto; `MapaInteractivo.astro` cambia la disposición;
`src/scripts/mapa.ts` suma el viaje del auto.

**Tech Stack:** Astro 7, Tailwind v4, SVG, vitest + AstroContainer.

**Spec:** `docs/superpowers/specs/2026-10-05-fase-c-mapa-design.md`

## Global Constraints

- Worktree `C:\Users\Villex\dev\Covicen-detalles`, rama `web-detalles-2026-10-05`; no tocar `C:\Users\Villex\dev\Covicen`.
- Commit por tarea (autorizado en la fase A), `git add` con rutas explícitas. Publicar en Pages solo con OK de Juli.
- Las coordenadas de `src/content/tramo.json` no se tocan.
- Ningún texto visible cambia (las etiquetas de la leyenda describen formas: se ajusta solo la muestra de «Estación
  próxima», no su texto).
- Colores solo con tokens (`var(--color-*)`): la guarda `tests/styles/colores-fijos.test.ts` rechaza hex y rgb a mano.
- El script del navegador no puede importar `src/lib/tramo.ts` ni nada que traiga zod.
- `prefers-reduced-motion`: sin viaje ni pulso; el auto aparece en la estación.
- Sobrio: lo único que se mueve es el auto (y el pulso al llegar, una vez). El dibujo de las rutas al entrar en
  pantalla (`dibujar`) se queda: pasa una sola vez.
- Tests: TDD para la lógica; Juli pidió no correr baterías de más: por tarea se corren los archivos de la tarea, y la
  suite completa una vez al final.

## Review Focus

1. **Tocar estaciones rápido, una tras otra**: el auto no puede saltar ni quedar fuera de la ruta. Lo fija el test de
   `continuarDesde` (Tarea 3).
2. **Elegir la estación donde ya está el auto**: no hace nada raro (ni U ni viaje). Test en la Tarea 3.
3. **Cambiar de tema con la página abierta**: el auto, las cintas y las placas siguen al tema (solo tokens). Lo fija la
   guarda de colores fijos (Tarea 4).
4. **Sin JavaScript**: las estaciones siguen siendo enlaces y todas las fichas se ven (test existente de `mapa.test.ts`).
5. **Pantallas entre 1024 y 1279**: la ficha va debajo, no flotando encima del dibujo. Test de clases en la Tarea 5.

---

### Task 1: La red de rutas y el camino más corto (`src/lib/red.ts`)

**Files:**
- Create: `src/lib/red.ts`, `tests/lib/red.test.ts`

**Interfaces:**
- Produces: `type Punto = { x: number; y: number }`; `type Red = { ciudades: Array<{ slug: string; mapa: Punto }>; trazados: Array<{ ciudades: string[] }> }`; `caminoEntre(red: Red, desde: string, hasta: string): string[]`; `puntosDe(red: Red, slugs: string[]): Punto[]`.

- [ ] **Step 1: Test que falla** — `tests/lib/red.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { caminoEntre, puntosDe } from '@/lib/red';

// Fase C (05/10/2026): el auto del mapa viaja por el camino más corto de la red. La RN 9 y la RN 34 se juntan en
// Rosario; la RN 34 y la RN 19, en el empalme.
describe('caminoEntre', async () => {
  const red = await fuenteLocalJson.tramo();
  it('vecinas sobre la misma ruta: directo', () => {
    expect(caminoEntre(red, 'carcarana', 'leones')).toEqual(['carcarana', 'leones']);
  });
  it('de la RN 9 a la RN 19: por Rosario, Totoras y el empalme', () => {
    expect(caminoEntre(red, 'carcarana', 'franck')).toEqual(['carcarana', 'rosario', 'totoras', 'empalme-rn-19', 'franck']);
  });
  it('de punta a punta', () => {
    expect(caminoEntre(red, 'james-craik', 'san-francisco')).toEqual(['james-craik', 'villa-maria', 'leones', 'carcarana', 'rosario', 'totoras', 'empalme-rn-19', 'san-francisco']);
  });
  it('a la misma estación: no hay viaje', () => {
    expect(caminoEntre(red, 'totoras', 'totoras')).toEqual(['totoras']);
  });
  it('a un nodo que no existe: camino vacío', () => {
    expect(caminoEntre(red, 'totoras', 'no-existe')).toEqual([]);
  });
  it('puntosDe da las coordenadas del contrato, sin tocarlas', () => {
    expect(puntosDe(red, ['carcarana', 'leones'])).toEqual([{ x: 677, y: 445 }, { x: 458, y: 399 }]);
  });
});
```

- [ ] **Step 2:** `pnpm vitest run tests/lib/red.test.ts` → FAIL (no existe `@/lib/red`).

- [ ] **Step 3: Implementar** — `src/lib/red.ts`:

```ts
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
  for (const tr of red.trazados) for (let i = 1; i < tr.ciudades.length; i++) { unir(tr.ciudades[i - 1]!, tr.ciudades[i]!); unir(tr.ciudades[i]!, tr.ciudades[i - 1]!); }
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
```

- [ ] **Step 4:** `pnpm vitest run tests/lib/red.test.ts` → PASS. Si el camino de punta a punta da otro orden, revisar los
  slugs de `tramo.json` (el empalme es `empalme-rn-19`, Villa María `villa-maria`).

- [ ] **Step 5: Commit** — `git add src/lib/red.ts tests/lib/red.test.ts` · `feat(mapa): la red de rutas y el camino mas corto`.

---

### Task 2: Curvas y recorrido del auto (`src/lib/red.ts`)

**Interfaces:**
- Produces: `trazoRedondeado(pts: Punto[], radio?: number): string` (atributo `d` de SVG); `type Muestra = { x: number; y: number; angulo: number; d: number }` (ángulo en grados, 0 = hacia la derecha); `recorrido(pts: Punto[], opciones: { radio?: number; rumbo?: number }): Muestra[]` (si `rumbo` está y el primer tramo va a más de 100° de él, el recorrido empieza con la vuelta en U); `necesitaVuelta(rumbo: number, desde: Punto, hacia: Punto): boolean`; `posicionEn(muestras: Muestra[], d: number): Muestra`; `duracionViaje(largo: number): number` (ms, entre 500 y 2000); `suave(t: number): number` (ease-in-out cúbica).

- [ ] **Step 1: Tests que fallan** (sumar a `tests/lib/red.test.ts`):

```ts
import { duracionViaje, necesitaVuelta, posicionEn, recorrido, suave, trazoRedondeado } from '@/lib/red';

describe('curvas y recorrido', () => {
  const L = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
  it('trazoRedondeado: línea, curva en el vértice y línea, sin pasar en seco por la esquina', () => {
    expect(trazoRedondeado(L, 10)).toBe('M0 0 L90 0 Q100 0 100 10 L100 100');
  });
  it('el radio nunca supera la mitad del tramo más corto', () => {
    expect(trazoRedondeado([{ x: 0, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 100 }], 10)).toBe('M0 0 L4 0 Q8 0 8 4 L8 100');
  });
  it('el recorrido arranca y termina en los extremos, con la distancia acumulada', () => {
    const m = recorrido(L, { radio: 10 });
    expect(m[0]).toMatchObject({ x: 0, y: 0, d: 0 });
    expect(m.at(-1)).toMatchObject({ x: 100, y: 100 });
    expect(m.at(-1)!.d).toBeGreaterThan(180);
    expect(m.at(-1)!.d).toBeLessThan(200);
  });
  it('el ángulo gira de forma continua: nunca salta más de 25° entre muestras', () => {
    const m = recorrido(L, { radio: 10 });
    for (let i = 1; i < m.length; i++) expect(Math.abs(((m[i]!.angulo - m[i - 1]!.angulo + 540) % 360) - 180)).toBeLessThan(25);
  });
  it('necesitaVuelta: más de 100° entre el rumbo y el primer tramo', () => {
    expect(necesitaVuelta(0, { x: 0, y: 0 }, { x: -50, y: 0 })).toBe(true);
    expect(necesitaVuelta(0, { x: 0, y: 0 }, { x: 50, y: 10 })).toBe(false);
  });
  it('con vuelta en U: sale de frente, dobla a la izquierda y vuelve a la ruta mirando para el otro lado', () => {
    const m = recorrido([{ x: 0, y: 0 }, { x: -100, y: 0 }], { radio: 10, rumbo: 0 });
    expect(m[0]!.angulo).toBeCloseTo(0, 0);
    expect(Math.min(...m.map((p) => p.y))).toBeLessThan(-8); // la U va por la izquierda (y negativo en SVG = arriba)
    expect(m.at(-1)).toMatchObject({ x: -100, y: 0 });
    expect(Math.abs(Math.abs(m.at(-1)!.angulo) - 180)).toBeLessThan(5);
    for (let i = 1; i < m.length; i++) expect(Math.abs(((m[i]!.angulo - m[i - 1]!.angulo + 540) % 360) - 180)).toBeLessThan(25);
  });
  it('posicionEn interpola entre muestras y se queda en los extremos', () => {
    const m = recorrido([{ x: 0, y: 0 }, { x: 100, y: 0 }], {});
    expect(posicionEn(m, 50)).toMatchObject({ x: 50, y: 0 });
    expect(posicionEn(m, -5)).toMatchObject({ x: 0, y: 0 });
    expect(posicionEn(m, 999)).toMatchObject({ x: 100, y: 0 });
  });
  it('duración entre medio segundo y dos, y la curva de velocidad empieza y termina quieta', () => {
    expect(duracionViaje(0)).toBe(500);
    expect(duracionViaje(5000)).toBe(2000);
    expect(suave(0)).toBe(0); expect(suave(1)).toBe(1); expect(suave(0.5)).toBe(0.5);
  });
});
```

- [ ] **Step 2:** correr → FAIL.

- [ ] **Step 3: Implementar** (al final de `src/lib/red.ts`). Muestras cada 2 unidades; la curva de cada vértice es la
  cuadrática de `trazoRedondeado` (mismo radio), así el auto va exactamente por la cinta. La vuelta en U: medio círculo de
  radio 7 hacia la izquierda del rumbo (en SVG la izquierda de un rumbo θ es θ − 90°), que termina 14 unidades al costado
  mirando para el otro lado, y una curva en S (cúbica) de 30 unidades que la devuelve a la ruta. Ángulos con `atan2`
  entre muestras vecinas.

```ts
const r2 = (n: number) => Math.round(n * 100) / 100;
const hacia = (de: Punto, a: Punto, dist: number): Punto => {
  const l = Math.hypot(a.x - de.x, a.y - de.y) || 1;
  return { x: de.x + ((a.x - de.x) / l) * dist, y: de.y + ((a.y - de.y) / l) * dist };
};
const radioEn = (a: Punto, b: Punto, c: Punto, radio: number) => Math.min(radio, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2);

/** El `d` de la cinta: rectas, y en cada vértice una curva cuadrática con control en el vértice. */
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

export type Muestra = { x: number; y: number; angulo: number; d: number };
const grados = (a: Punto, b: Punto) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
const linea = (a: Punto, b: Punto, paso: number): Punto[] => {
  const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / paso));
  return Array.from({ length: n }, (_, i) => ({ x: a.x + ((b.x - a.x) * (i + 1)) / n, y: a.y + ((b.y - a.y) * (i + 1)) / n }));
};
const cuadratica = (p0: Punto, c: Punto, p1: Punto, n: number): Punto[] =>
  Array.from({ length: n }, (_, i) => { const t = (i + 1) / n, u = 1 - t; return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y }; });
const cubica = (p0: Punto, c1: Punto, c2: Punto, p1: Punto, n: number): Punto[] =>
  Array.from({ length: n }, (_, i) => { const t = (i + 1) / n, u = 1 - t; return { x: u ** 3 * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * p1.x, y: u ** 3 * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * p1.y }; });

export const necesitaVuelta = (rumbo: number, desde: Punto, hacia_: Punto): boolean =>
  Math.abs(((grados(desde, hacia_) - rumbo + 540) % 360) - 180) > 100;

const RADIO_U = 7;
/** La U: medio círculo hacia la izquierda del rumbo y una S que vuelve a la ruta, ya mirando para el otro lado. */
const vueltaEnU = (inicio: Punto, rumbo: number, siguiente: Punto): Punto[] => {
  const th = (rumbo * Math.PI) / 180;
  const izq = { x: Math.sin(th), y: -Math.cos(th) }; // normal izquierda en coordenadas SVG (y para abajo)
  const centro = { x: inicio.x + izq.x * RADIO_U, y: inicio.y + izq.y * RADIO_U };
  const arco = Array.from({ length: 12 }, (_, i) => {
    const a = th - Math.PI / 2 + Math.PI * ((i + 1) / 12) * -1 + Math.PI; // de -90° a +90° respecto del centro, por la izquierda
    return { x: centro.x + Math.cos(a) * RADIO_U, y: centro.y + Math.sin(a) * RADIO_U };
  });
  const fin = arco[arco.length - 1]!;
  const llegada = hacia(inicio, siguiente, Math.min(30, Math.hypot(siguiente.x - inicio.x, siguiente.y - inicio.y) / 2));
  const atras = { x: -Math.cos(th), y: -Math.sin(th) };
  return [...arco, ...cubica(fin, { x: fin.x + atras.x * 12, y: fin.y + atras.y * 12 }, hacia(llegada, inicio, 10), llegada, 12)];
};

export const recorrido = (pts: Punto[], { radio = 14, rumbo }: { radio?: number; rumbo?: number }): Muestra[] => {
  if (!pts.length) return [];
  let camino: Punto[] = [pts[0]!];
  let base = pts;
  if (rumbo !== undefined && pts.length > 1 && necesitaVuelta(rumbo, pts[0]!, pts[1]!)) {
    const u = vueltaEnU(pts[0]!, rumbo, pts[1]!);
    camino.push(...u);
    base = [u[u.length - 1]!, ...pts.slice(1)];
  }
  for (let i = 1; i < base.length; i++) {
    const a = base[i - 1]!, b = base[i]!, c = base[i + 1];
    if (!c) { camino.push(...linea(camino[camino.length - 1]!, b, 2)); break; }
    const r = radioEn(a, b, c, radio);
    const p1 = hacia(b, a, r), p2 = hacia(b, c, r);
    camino.push(...linea(camino[camino.length - 1]!, p1, 2), ...cuadratica(p1, b, p2, 8));
  }
  // Ángulo por muestras vecinas y distancia acumulada.
  let d = 0;
  return camino.map((p, i) => {
    if (i > 0) d += Math.hypot(p.x - camino[i - 1]!.x, p.y - camino[i - 1]!.y);
    const a = camino[Math.max(0, i - 1)]!, b = camino[Math.min(camino.length - 1, i + 1)]!;
    const angulo = i === 0 && rumbo !== undefined ? rumbo : grados(a, b);
    return { x: r2(p.x), y: r2(p.y), angulo, d };
  });
};

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

export const duracionViaje = (largo: number) => Math.max(500, Math.min(2000, 450 + largo * 1.6));
export const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
```

  Si el test de la U o el de giro continuo falla, corregir la parametrización del arco (es la parte delicada): el arco
  tiene que salir con el mismo ángulo que `rumbo`, girar 180° por la izquierda y la S terminar sobre la recta hacia
  `siguiente`. Ajustar ahí, no relajar el test.

- [ ] **Step 4:** correr → PASS. **Step 5:** commit `feat(mapa): curvas, recorrido del auto y vuelta en U`.

---

### Task 3: Viajes encadenados (`continuarDesde`) y el encuadre (`src/lib/tramo.ts`)

**Interfaces:**
- Produces (red.ts): `continuarDesde(red: Red, viaje: string[], recorrido: Muestra[], d: number, destino: string): { camino: string[]; desde: Muestra }` — si se elige otra estación en pleno viaje, el auto termina el tramo en curso (va hasta el próximo nodo del viaje) y desde ahí toma el camino nuevo.
- Produces (tramo.ts): `encuadreDelMapa(t: Tramo): { x: number; y: number; ancho: number; alto: number }` (todo lo dibujado + rótulos + 24 de margen); `LUGAR_FICHA = { x: 205, y: 40 }` y `TAM_FICHA_PX = { ancho: 304, alto: 260 }`; `fichaLibre(t: Tramo, anchoPantallaMapa: number): boolean`.

- [ ] **Step 1: Tests que fallan.** En `tests/lib/red.test.ts`:

```ts
import { continuarDesde } from '@/lib/red';
describe('continuarDesde', async () => {
  const red = await fuenteLocalJson.tramo();
  it('a mitad de Carcarañá → Rosario, pedir Leones: termina en Rosario y vuelve por la RN 9', () => {
    const viaje = ['carcarana', 'rosario'];
    const m = recorrido(puntosDe(red, viaje), {});
    const r = continuarDesde(red, viaje, m, m.at(-1)!.d / 2, 'leones');
    expect(r.camino).toEqual(['rosario', 'carcarana', 'leones']);
    expect(r.desde).toMatchObject({ x: 771, y: 465 });
  });
  it('pedir la estación a la que ya iba: sigue el mismo viaje', () => {
    const viaje = ['carcarana', 'rosario', 'totoras'];
    const m = recorrido(puntosDe(red, viaje), {});
    expect(continuarDesde(red, viaje, m, 10, 'totoras').camino).toEqual(['rosario', 'totoras']);
  });
});
```

  En `tests/lib/tramo.test.ts`:

```ts
import { encuadreDelMapa, fichaLibre } from '@/lib/tramo';
describe('encuadre y lugar de la ficha', async () => {
  const t = await fuenteLocalJson.tramo();
  it('el encuadre contiene todos los puntos con margen y no se sale del lienzo de 820 × 520', () => {
    const c = encuadreDelMapa(t);
    for (const p of [...t.ciudades.map((x) => x.mapa), ...t.cabinas.map((x) => x.mapa)]) {
      expect(p.x).toBeGreaterThan(c.x + 20); expect(p.x).toBeLessThan(c.x + c.ancho - 20);
      expect(p.y).toBeGreaterThan(c.y + 20); expect(p.y).toBeLessThan(c.y + c.alto - 20);
    }
    expect(c.x).toBeGreaterThanOrEqual(0); expect(c.y).toBeGreaterThanOrEqual(0);
    expect(c.x + c.ancho).toBeLessThanOrEqual(820); expect(c.y + c.alto).toBeLessThanOrEqual(520);
  });
  // A 1280 de pantalla el mapa mide 1280 − 40 (contenedor) − 2 × 38,4 (relleno del panel) ≈ 1163 px de ancho.
  it('a 1280 y 1440 px la ficha flotante no tapa rutas, estaciones ni rótulos; a 1024 no entra (va abajo)', () => {
    expect(fichaLibre(t, 1163)).toBe(true);
    expect(fichaLibre(t, 1200)).toBe(true);
    expect(fichaLibre(t, 922)).toBe(false);
  });
});
```

- [ ] **Step 2:** correr → FAIL.

- [ ] **Step 3: Implementar.**
  - `continuarDesde` (red.ts): el próximo nodo es el primero del `viaje` cuyo punto queda más adelante que `d` en el
    recorrido (el de menor índice con `d` del nodo ≥ `d`; la `d` de cada nodo es la de la muestra más cercana a su punto).
    `camino = caminoEntre(red, proximo, destino)` y `desde` = la muestra de ese nodo.
  - `encuadreDelMapa` (tramo.ts): mínimo y máximo de `x`/`y` sobre los puntos de ciudades y cabinas, las cajas de
    `rotulosDelMapa` (rutas y ciudades) y las de los rótulos de estación (`cajaTexto` como en `rotulosDelMapa`), más 24
    de margen, recortado a [0, 820] × [0, 520].
  - `fichaLibre`: escala = `anchoPantallaMapa / encuadre.ancho`; caja de la ficha en unidades =
    `{ x0: LUGAR_FICHA.x, y0: LUGAR_FICHA.y, x1: LUGAR_FICHA.x + TAM_FICHA_PX.ancho / escala, y1: LUGAR_FICHA.y + TAM_FICHA_PX.alto / escala }`;
    falso si choca (`chocan`) con algún halo de estación (radio 22), rótulo de estación, rótulo de ruta o de ciudad, o si
    algún segmento de trazado la cruza (intersección segmento–rectángulo: un extremo adentro, o cruce con alguno de los 4
    lados).

- [ ] **Step 4:** correr `tests/lib/red.test.ts tests/lib/tramo.test.ts` → PASS. Si `fichaLibre(t, 1163)` da falso,
  mover `LUGAR_FICHA` dentro del hueco entre Córdoba y San Francisco hasta que pase, sin tocar el test.

- [ ] **Step 5:** commit `feat(mapa): viajes encadenados, encuadre y lugar de la ficha`.

---

### Task 4: El dibujo nuevo (`MapaTramo.astro`) y el auto quieto

**Files:**
- Modify: `src/components/ilustraciones/MapaTramo.astro` (reescritura del SVG y su `<style>`), `src/styles/movimiento.css:27-44,66-70`, `tests/components/ilustraciones.test.ts:9-23`, `tests/styles/legibilidad.test.ts:29-43`

- [ ] **Step 1: Tests que fallan.** En `ilustraciones.test.ts`, reemplazar el primer caso por:

```ts
  it('rutas en cinta continua con curvas, sin grilla, sin trazos discontinuos ni luces en loop', async () => {
    const html = await render();
    expect(html.match(/class="ruta-halo/g)?.length).toBe(3);
    expect(html.match(/class="ruta-cuerpo/g)?.length).toBe(3);
    expect(html.match(/class="ruta-filo/g)?.length).toBe(3);
    expect(html).toMatch(/class="ruta-filo[^"]*"[^>]*d="M[^"]*Q/); // curvas en los vértices
    for (const viejo of ['marcas-vivas', 'luz-viaja', 'mapa-plano', 'stroke-dasharray="6 12"', 'stroke-dasharray="4 3"']) expect(html).not.toContain(viejo);
    expect(html.match(/data-estacion="/g)?.length).toBe(6);
    expect(html).toContain('aria-label="Estación Carcarañá, RN 9 km 340, operativa"');
    expect(html).toContain('href="/peajes/carcarana/"');
    expect(html).toContain('role="group"');
    expect(html).toContain('>Rosario<');
    expect(html).not.toContain('>Empalme RN 19<');
  });
  it('encuadrado, con placas detrás de los rótulos de estación y el auto decorativo', async () => {
    const html = await render();
    expect(html).not.toContain('viewBox="0 0 820 520"');
    expect(html.match(/class="cabina-placa"/g)?.length).toBe(6);
    expect(html).toMatch(/<g class="auto"[^>]*aria-hidden="true"/);
    expect(html).toMatch(/data-red="\{/);
  });
  it('la próxima se distingue por la forma: centro hueco', async () => {
    const html = await render();
    expect(html).toMatch(/data-estado-operativo="proxima"[\s\S]*?class="baliza-punto baliza-hueca"/);
  });
```

  En `legibilidad.test.ts`, reemplazar el caso del mapa por uno que importe `encuadreDelMapa` y `fuenteLocalJson`, tome
  `escalaChica = 682 / encuadre.ancho` (768 px de pantalla) y `escalaGrande = 922 / encuadre.ancho` (1024 px), y exija
  que cada `font-size` del `<style>` de MapaTramo fuera de `@media` por `escalaChica` y cada uno dentro de
  `@media (min-width: 64rem)` por `escalaGrande` den ≥ 12 px.

- [ ] **Step 2:** correr `tests/components/ilustraciones.test.ts tests/styles/legibilidad.test.ts` → FAIL.

- [ ] **Step 3: Implementar** `MapaTramo.astro`:
  - `viewBox` = `encuadreDelMapa(tramo)`; fondo: `<rect>` del encuadre con un `radialGradient` (centro `--color-superficie`
    al 35 %, borde transparente).
  - Por trazado, un `<g class="ruta">` con tres `<path d={trazoRedondeado(puntos)}>`: `ruta-halo` (stroke `--color-glow`,
    ancho 12, filtro de desenfoque 3, `pathLength="1000"`, clase `dibujar`), `ruta-cuerpo` (stroke `--color-superficie-2`,
    ancho 6) y `ruta-filo` (stroke `--color-acento`, ancho 1.6, `pathLength="1000"`, clase `dibujar`); todos
    `stroke-linecap="round" stroke-linejoin="round"`. Rótulo de ruta como hoy (`rotulosDelMapa`).
  - Ciudades: punto de radio 3 (principal 4.5) con relleno `--color-fondo` y borde `--color-acento` de 1.25; nombre con
    `font-weight: 500`.
  - Estaciones: halo (r 14, clase `baliza-halo`, opacidad 0.16), foco (r 19), anillo (r 10, stroke 1.5 del color del
    estado) y punto (r 5): operativa lleno `--color-ok`; próxima `baliza-punto baliza-hueca` (relleno `--color-fondo`,
    borde `--color-vial-texto` de 2). Rótulo en `<g class="cabina-rotulo">` con `<rect class="cabina-placa">` (de
    `cajaTexto` con 4 de aire, `rx` 4, relleno `--color-fondo-2`, borde `--color-borde` de 1) y el `<text>`.
  - Auto: `<g class="auto" aria-hidden="true" data-auto transform="translate(x y) rotate(a)">` dibujado mirando a la
    derecha y centrado en 0,0, unos 22 × 11: sombra (elipse `--color-sombra`, opacidad 0.5, desplazada 1.5 abajo),
    conos de faros (dos polígonos hacia adelante con `linearGradient` de `--color-acento` al 45 % a transparente),
    carrocería (`rect` 22 × 11, `rx` 4, `linearGradient` de `--color-sobre-marca` a `--color-texto-2`), parabrisas y
    luneta (`rect` `rx` 1.5 con `--color-marca-900`), brillo del techo (`rect` fino `--color-sobre-marca` al 60 %).
    Posición inicial: la primera estación operativa, rumbo hacia el siguiente nodo de su trazado.
  - `data-red` en el `<svg>` con `JSON.stringify({ ciudades: [{slug, mapa}], trazados: [{ciudades}] })`.
  - Leyenda: la muestra de «Estación próxima» pasa a anillo sin trazo cortado (`border-2 border-vial-texto` con centro
    del fondo), mismo texto.
  - Tamaños: `.cabina-etiqueta` 14, `.ruta-etiqueta` 15, `.ciudad-etiqueta` 17 (unidades); en `@media (min-width: 64rem)`
    11, 11.5 y 13. `.auto { pointer-events: none; }`.
  - `movimiento.css`: borrar `.marcas-vivas`, `.luz-viaja` y la animación continua de `.baliza-halo` (`latir`); sumar
    `.baliza.llegada .baliza-halo { animation: latir 1.1s var(--ease-suave) 1; }` y quitarlos de la lista de
    `prefers-reduced-motion` donde ya no existen.

- [ ] **Step 4:** correr los dos archivos + `tests/styles/colores-fijos.test.ts tests/components/mapa.test.ts tests/components/el-tramo.test.ts` → PASS.

- [ ] **Step 5:** captura propia (Chrome sin ventana, modo escritorio) de El tramo a 1440 y 390 en los dos temas para
  controlar la terminación del dibujo y del auto; ajustar proporciones si algo se ve tosco. Commit `feat(mapa): el dibujo nuevo y el auto`.

---

### Task 5: La disposición y la ficha compacta flotante

**Files:**
- Modify: `src/components/MapaInteractivo.astro`, `src/components/TarjetaEstacion.astro`, `tests/components/mapa.test.ts`

- [ ] **Step 1: Test que falla** (en `mapa.test.ts`):

```ts
  it('el mapa a todo el ancho y la ficha flotante desde 1280 px, compacta (sin vías ni sentido)', async () => {
    const html = await render();
    expect(html).toMatch(/class="mapa-interactivo[^"]*@container/);
    expect(html).toMatch(/<section class="[^"]*\bxl:absolute\b[^"]*"[^>]*aria-label="Estación seleccionada"/);
    expect(html).not.toMatch(/lg:grid-cols-\[1\.6fr_1fr\]/);
    expect(html).toMatch(/class="[^"]*\bficha-detalle\b[^"]*\bxl:hidden\b/); // vías y sentido, fuera en el modo flotante
  });
```

- [ ] **Step 2:** correr → FAIL.

- [ ] **Step 3: Implementar.**
  - `MapaInteractivo`: contenedor `mapa-interactivo @container relative grid grid-cols-1 gap-8 *:min-w-0` sin la grilla de
    dos columnas; el `<section>` de las fichas con `xl:absolute xl:w-[19rem]` y `style` con
    `--ficha-x` / `--ficha-y` en `cqw` calculados de `LUGAR_FICHA` y `encuadreDelMapa`
    (`(LUGAR_FICHA.x − encuadre.x) / encuadre.ancho × 100cqw`, ídem `y` con el ancho, porque el SVG escala por el ancho),
    usados como `xl:left-[var(--ficha-x)] xl:top-[var(--ficha-y)]`. Ficha flotante: borde de luz de `.tarjeta` y
    `xl:shadow-2xl`.
  - `TarjetaEstacion`: las filas de «Vías» y «Sentido» llevan la clase `ficha-detalle` y, cuando la tarjeta está dentro
    del mapa interactivo, `xl:hidden` (prop `enMapa`, que pasa `MapaInteractivo`; la página de la estación las muestra
    siempre).
- [ ] **Step 4:** correr `tests/components/mapa.test.ts tests/components/estacion.test.ts tests/components/tercera-tanda.test.ts` → PASS.
- [ ] **Step 5:** captura propia a 1280 y 1440 (ficha flotante sin tapar nada) y a 1024 (ficha abajo). Commit `feat(mapa): todo el ancho y la ficha compacta flotante`.

---

### Task 6: El viaje del auto (`src/scripts/mapa.ts`)

**Files:**
- Modify: `src/scripts/mapa.ts`, `tests/presupuesto.test.ts:12`

- [ ] **Step 1:** sumar `'src/lib/red.ts'` al arreglo `todos` de `tests/presupuesto.test.ts` y correrlo: tiene que seguir
  bajo los 14 KB gz (si no, revisar `red.ts` antes de subir el techo).
- [ ] **Step 2: Implementar** en `mapa.ts`, sobre lo que ya hay (`elegir` sigue cambiando ficha y `aria-current` en el
  acto):
  - Al montar: leer `data-red` del `<svg>`, el `<g data-auto>`, y el estado `{ slug, rumbo }` inicial de la estación
    inicial (el `transform` que dejó el componente).
  - `viajar(destino)`: si hay viaje en curso, `continuarDesde(...)`; si no, `caminoEntre(red, actual, destino)`. Con
    `reducirMovimiento` (matchMedia), ubicar el auto en el destino con el rumbo del último tramo y salir. Si no,
    `recorrido(puntosDe(red, camino), { rumbo })`, `duracionViaje(largo)`, y un `requestAnimationFrame` que en cada
    cuadro hace `posicionEn(muestras, suave(t) × largo)` y escribe `transform="translate(x y) rotate(angulo)"`. Al
    terminar: guardar `{ slug: destino, rumbo }` y poner la clase `llegada` en la baliza (sacarla al terminar su
    animación, `animationend`).
  - Un solo viaje a la vez (`cancelAnimationFrame` del anterior).
- [ ] **Step 3:** correr `tests/presupuesto.test.ts tests/components/mapa.test.ts` → PASS; `pnpm check` sin errores.
- [ ] **Step 4:** captura propia: elegir Leones, Franck y James Craik seguido, y una vuelta en U (Carcarañá → Leones con el
  auto mirando a Rosario), a 1440 en los dos temas; controlar que el auto vaya sobre la cinta, gire suave y no salte.
  Commit `feat(mapa): el auto viaja por el camino mas corto, con vuelta en U`.

---

### Task 7: Cierre

- [ ] `pnpm test` completo una vez y `pnpm check`. `pnpm verificar` (sitio completo) y, al final, `pnpm verificar:portada`.
- [ ] `docs/guia-de-revision.md`: sección «Mapa nuevo (fase C)» con qué mirar (compu ≥ 1280 con la ficha flotante, 1024 con
  la ficha abajo, celular, los dos temas, tocar estaciones seguido, una vuelta en U, «reducir movimiento»).
  `obsidian/Home.md`: entrada con `red.ts` sin dependencias, encuadre, ficha desde 1280, el auto.
- [ ] Commit `docs(mapa): que mirar y lo aprendido` y preguntarle a Juli si se sube a Pages.
