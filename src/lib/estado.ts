// Estado "tipo subte": una fila por ruta con el peor nivel de sus incidentes.
import type { EstadoRuta, Incidente, NombreRuta } from '@/lib/datos/esquemas';
import { hora, kmTexto } from '@/lib/formato';

export type Nivel = 'normal' | 'precaucion' | 'corte';
export type FilaEstado = { ruta: NombreRuta; nivel: Nivel; etiqueta: string; incidentes: Incidente[] };
const ORDEN: Record<Nivel, number> = { normal: 0, precaucion: 1, corte: 2 };
// «Sin avisos», no «Normal»: la web muestra lo que informa Covicen, no puede asegurar que la ruta esté normal.
const ETIQUETA: Record<Nivel, string> = { normal: 'Sin avisos', precaucion: 'Precaución', corte: 'Corte' };
const nivelDe = (i: Incidente): Nivel => (i.severidad === 'corte' ? 'corte' : i.severidad === 'precaucion' ? 'precaucion' : 'normal');

export const estadoPorRuta = (estado: EstadoRuta, rutas: NombreRuta[]): FilaEstado[] =>
  rutas.map((ruta) => {
    const incidentes = estado.disponible ? (estado.incidentes ?? []).filter((i) => i.ruta === ruta) : [];
    const nivel = incidentes.reduce<Nivel>((peor, i) => (ORDEN[nivelDe(i)] > ORDEN[peor] ? nivelDe(i) : peor), 'normal');
    return { ruta, nivel, etiqueta: ETIQUETA[nivel], incidentes };
  });

// La severidad no se comunica solo por color (spec §7.1): cambia la FORMA del marcador (triángulo = corte, rombo =
// precaución, círculo = info), se nombra en el <title> y la leyenda repite forma y nombre. El relleno es el refuerzo.
// Las usan el mapa del build (MapaTramo.astro) y el del navegador (lib/estado-dom.ts).
export const SEVERIDAD: Record<Incidente['severidad'], string> = { corte: 'Corte', precaucion: 'Precaución', info: 'Información' };
export const FORMA: Record<Incidente['severidad'], string> = {
  corte: 'M0 -10 L9 6 L-9 6 Z',
  precaucion: 'M0 -9 L9 0 L0 9 L-9 0 Z',
  info: 'M-8 0 A8 8 0 1 0 8 0 A8 8 0 1 0 -8 0 Z',
};

const SENTIDOS = { ambos: 'ambos sentidos', ascendente: 'sentido ascendente', descendente: 'sentido descendente' } as const;
// `desde`/`hasta` son opcionales: sin ellos no se inventa ninguna hora. La hora es siempre la de Argentina (formato.ts).
const franja = (i: Incidente): string | null =>
  i.desde ? (i.hasta ? `de ${hora(new Date(i.desde))} a ${hora(new Date(i.hasta))}` : `desde las ${hora(new Date(i.desde))}`) : null;
const kms = (i: Incidente): string | null =>
  i.km === null ? null : i.kmHasta != null && i.kmHasta !== i.km ? `km ${kmTexto(i.km)} a ${kmTexto(i.kmHasta)}` : `km ${kmTexto(i.km)}`;

/** Spec §10.1: km (o tramo), sentido y hora en una sola línea. «km 340 a 352 · ambos sentidos · de 08:00 a 17:00». */
export const metaDeAviso = (i: Incidente): string => [kms(i), i.sentido ? SENTIDOS[i.sentido] : null, franja(i)].filter(Boolean).join(' · ');

