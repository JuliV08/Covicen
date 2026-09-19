// Estado "tipo subte": una fila por ruta con el peor nivel de sus incidentes.
import type { EstadoRuta, Incidente, NombreRuta } from '@/lib/datos/esquemas';

export type Nivel = 'normal' | 'precaucion' | 'corte';
export type FilaEstado = { ruta: NombreRuta; nivel: Nivel; etiqueta: string; incidentes: Incidente[] };
const ORDEN: Record<Nivel, number> = { normal: 0, precaucion: 1, corte: 2 };
const ETIQUETA: Record<Nivel, string> = { normal: 'Normal', precaucion: 'Precaución', corte: 'Corte' };
const nivelDe = (i: Incidente): Nivel => (i.severidad === 'corte' ? 'corte' : i.severidad === 'precaucion' ? 'precaucion' : 'normal');

export const estadoPorRuta = (estado: EstadoRuta, rutas: NombreRuta[]): FilaEstado[] =>
  rutas.map((ruta) => {
    const incidentes = estado.disponible ? (estado.incidentes ?? []).filter((i) => i.ruta === ruta) : [];
    const nivel = incidentes.reduce<Nivel>((peor, i) => (ORDEN[nivelDe(i)] > ORDEN[peor] ? nivelDe(i) : peor), 'normal');
    return { ruta, nivel, etiqueta: ETIQUETA[nivel], incidentes };
  });
