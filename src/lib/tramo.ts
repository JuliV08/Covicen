// Lo que el mapa y las tarjetas derivan del contrato: estado operativo, servicios y la posición de un km sobre el trazo.
import type { Cabina, NombreRuta, Tramo } from '@/lib/datos/esquemas';
import { cabinaOperativa } from '@/lib/datos/esquemas';
import type { Punto } from '@/lib/red';

export type EstadoOperativo = { clave: 'operativa' | 'proxima'; etiqueta: string };

/** Verde (cobra hoy) o amarillo (cobra cuando Vialidad la habilite).
 *  La modalidad de cobro de las nuevas NO se anuncia: al 20/09/2026 no está definida («no está asegurado que sea de
 *  esa manera y no se sabe cómo va a ser»), y la web no publica lo que no está confirmado. El campo `freeFlow` sigue
 *  en el contrato porque el backend lo va a mandar igual: se apaga la UI, no se rompe el contrato. */
export const estadoCabina = (c: Cabina): EstadoOperativo =>
  cabinaOperativa(c) ? { clave: 'operativa', etiqueta: 'Operativa' } : { clave: 'proxima', etiqueta: 'Próxima' };

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

// Rótulos del mapa sin pisarse (05/10/2026: «en RN19 se tapa por Franck y parecido abajo con el punto, que dice Santa
// Fe»). Las coordenadas de ciudades y estaciones son contrato con el backend y no se tocan: se elige solo dónde va cada
// rótulo. Los anchos son estimados por arriba (caracteres × tamaño × factor de Archivo, con el espaciado de cada
// rótulo); las unidades son las del dibujo, 820 × 520.
export type Rotulo = { x: number; y: number; ancla: 'start' | 'middle' | 'end' };
export type Caja = { x0: number; y0: number; x1: number; y1: number };
const ANCHO_MAPA = 820;
const ALTO_MAPA = 520;
export const TAM_ROTULO = { ruta: { tam: 15, factor: 0.78 }, ciudad: { tam: 17, factor: 0.6 }, cabina: { tam: 14, factor: 0.74 } } as const;
export const cajaTexto = (r: Rotulo, texto: string, tam: number, factor: number): Caja => {
  const ancho = texto.length * tam * factor;
  const x0 = r.ancla === 'start' ? r.x : r.ancla === 'end' ? r.x - ancho : r.x - ancho / 2;
  return { x0, y0: r.y - tam * 0.8, x1: x0 + ancho, y1: r.y + tam * 0.25 };
};
export const cajaCirculo = (x: number, y: number, radio: number): Caja => ({ x0: x - radio, y0: y - radio, x1: x + radio, y1: y + radio });
export const chocan = (a: Caja, b: Caja): boolean => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const adentro = (c: Caja) => c.x0 >= 0 && c.y0 >= 0 && c.x1 <= ANCHO_MAPA && c.y1 <= ALTO_MAPA;

export const rotulosDelMapa = (t: Tramo) => {
  const punto = new Map(t.ciudades.map((c) => [c.slug, c.mapa]));
  // Lo que un rótulo no puede tapar: el halo de cada estación (radio 19, con margen), su nombre, y los puntos de ciudades
  // y empalmes. Cada rótulo elegido se suma, para que el siguiente tampoco lo pise.
  const ocupado: Caja[] = [
    ...t.cabinas.map((c) => cajaCirculo(c.mapa.x, c.mapa.y, 22)),
    ...t.cabinas.map((c) => cajaTexto({ x: c.mapa.x, y: c.mapa.y - 18, ancla: 'middle' }, c.nombre.toUpperCase(), TAM_ROTULO.cabina.tam, TAM_ROTULO.cabina.factor)),
    ...t.ciudades.map((c) => cajaCirculo(c.mapa.x, c.mapa.y, 8)),
  ];
  const libre = (c: Caja) => adentro(c) && !ocupado.some((o) => chocan(c, o));

  // Ruta: arriba del medio de su segmento más largo; si ahí choca, el siguiente más largo.
  const rutas = t.trazados.map((tr) => {
    const pts = tr.ciudades.map((s) => punto.get(s)!);
    const candidatos: Rotulo[] = pts.slice(1)
      .map((b, i) => ({ a: pts[i]!, b }))
      .sort((p, q) => Math.hypot(q.b.x - q.a.x, q.b.y - q.a.y) - Math.hypot(p.b.x - p.a.x, p.b.y - p.a.y))
      .map(({ a, b }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 10, ancla: 'middle' }));
    const elegido = candidatos.find((r) => libre(cajaTexto(r, tr.ruta, TAM_ROTULO.ruta.tam, TAM_ROTULO.ruta.factor))) ?? candidatos[0]!;
    ocupado.push(cajaTexto(elegido, tr.ruta, TAM_ROTULO.ruta.tam, TAM_ROTULO.ruta.factor));
    return { ruta: tr.ruta, ...elegido };
  });

  // Ciudad: del lado de siempre (hacia el centro del dibujo); si choca, el otro lado, abajo, arriba, y más lejos.
  const ciudades = t.ciudades.filter((c) => c.principal).map((c) => {
    const { x, y } = c.mapa;
    const haciaElCentro: Rotulo = x > ANCHO_MAPA / 2 ? { x: x - 12, y: y + 6, ancla: 'end' } : { x: x + 12, y: y + 6, ancla: 'start' };
    const candidatos: Rotulo[] = [
      haciaElCentro,
      x > ANCHO_MAPA / 2 ? { x: x + 12, y: y + 6, ancla: 'start' } : { x: x - 12, y: y + 6, ancla: 'end' },
      { x, y: y + 26, ancla: 'middle' },
      { x, y: y - 14, ancla: 'middle' },
      { x, y: y + 40, ancla: 'middle' },
      { x, y: y - 28, ancla: 'middle' },
    ];
    const elegido = candidatos.find((r) => libre(cajaTexto(r, c.nombre, TAM_ROTULO.ciudad.tam, TAM_ROTULO.ciudad.factor))) ?? haciaElCentro;
    ocupado.push(cajaTexto(elegido, c.nombre, TAM_ROTULO.ciudad.tam, TAM_ROTULO.ciudad.factor));
    return { slug: c.slug, nombre: c.nombre, ...elegido };
  });
  return { rutas, ciudades };
};

// --- Fase C (05/10/2026): encuadre del mapa y lugar de la ficha flotante ---

// Lo que ocupa el dibujo: halos de estación, puntos de ciudad, y los rótulos de rutas, ciudades y estaciones.
const ocupacion = (t: Tramo): Caja[] => {
  const { rutas, ciudades } = rotulosDelMapa(t);
  return [
    ...t.cabinas.map((c) => cajaCirculo(c.mapa.x, c.mapa.y, 22)),
    ...t.cabinas.map((c) => cajaTexto({ x: c.mapa.x, y: c.mapa.y - 18, ancla: 'middle' }, c.nombre.toUpperCase(), TAM_ROTULO.cabina.tam, TAM_ROTULO.cabina.factor)),
    ...t.ciudades.map((c) => cajaCirculo(c.mapa.x, c.mapa.y, 8)),
    ...rutas.map((r) => cajaTexto(r, r.ruta, TAM_ROTULO.ruta.tam, TAM_ROTULO.ruta.factor)),
    ...ciudades.map((c) => cajaTexto(c, c.nombre, TAM_ROTULO.ciudad.tam, TAM_ROTULO.ciudad.factor)),
  ];
};

/** El encuadre del mapa: la caja de todo lo dibujado con 24 unidades de margen, dentro del lienzo de 820 × 520. Las
 *  coordenadas no cambian (son contrato con el backend): cambia qué parte del lienzo se muestra. */
export const encuadreDelMapa = (t: Tramo): { x: number; y: number; ancho: number; alto: number } => {
  const cajas = ocupacion(t);
  const x0 = Math.max(0, Math.floor(Math.min(...cajas.map((c) => c.x0)) - 24));
  const y0 = Math.max(0, Math.floor(Math.min(...cajas.map((c) => c.y0)) - 24));
  const x1 = Math.min(ANCHO_MAPA, Math.ceil(Math.max(...cajas.map((c) => c.x1)) + 24));
  const y1 = Math.min(ALTO_MAPA, Math.ceil(Math.max(...cajas.map((c) => c.y1)) + 24));
  return { x: x0, y: y0, ancho: x1 - x0, alto: y1 - y0 };
};

/** Tamaño de la ficha compacta en pantalla (21rem de ancho, con los servicios como íconos; el alto, el de la más larga:
 *  Carcarañá, medido el 05/10/2026). */
export const TAM_FICHA_PX = { ancho: 336, alto: 260 } as const;
/** Dónde flota: en el hueco entre Córdoba y San Francisco, por encima de la RN 9, a 12 unidades del borde de arriba. */
export const lugarDeLaFicha = (t: Tramo): { x: number; y: number } => ({ x: 205, y: encuadreDelMapa(t).y + 12 });

const cruzaSegmento = (a: Punto, b: Punto, c: Caja): boolean => {
  const adentro = (p: Punto) => p.x >= c.x0 && p.x <= c.x1 && p.y >= c.y0 && p.y <= c.y1;
  if (adentro(a) || adentro(b)) return true;
  const corta = (p: Punto, q: Punto, r: Punto, s: Punto) => {
    const d = (q.x - p.x) * (s.y - r.y) - (q.y - p.y) * (s.x - r.x);
    if (d === 0) return false;
    const u = ((r.x - p.x) * (s.y - r.y) - (r.y - p.y) * (s.x - r.x)) / d;
    const v = ((r.x - p.x) * (q.y - p.y) - (r.y - p.y) * (q.x - p.x)) / d;
    return u >= 0 && u <= 1 && v >= 0 && v <= 1;
  };
  const esq = [{ x: c.x0, y: c.y0 }, { x: c.x1, y: c.y0 }, { x: c.x1, y: c.y1 }, { x: c.x0, y: c.y1 }];
  return esq.some((p, i) => corta(a, b, p, esq[(i + 1) % 4]!));
};

/** ¿La ficha flotante entra sin tapar nada, con el mapa dibujado a `anchoPx` de ancho en pantalla? */
export const fichaLibre = (t: Tramo, anchoPx: number): boolean => {
  const encuadre = encuadreDelMapa(t);
  const escala = anchoPx / encuadre.ancho;
  const lugar = lugarDeLaFicha(t);
  const ficha: Caja = { x0: lugar.x, y0: lugar.y, x1: lugar.x + TAM_FICHA_PX.ancho / escala, y1: lugar.y + TAM_FICHA_PX.alto / escala };
  if (ficha.x1 > encuadre.x + encuadre.ancho || ficha.y1 > encuadre.y + encuadre.alto) return false;
  if (ocupacion(t).some((o) => chocan(ficha, o))) return false;
  const punto = new Map(t.ciudades.map((c) => [c.slug, c.mapa]));
  return !t.trazados.some((tr) => tr.ciudades.slice(1).some((s, i) => cruzaSegmento(punto.get(tr.ciudades[i]!)!, punto.get(s)!, ficha)));
};
