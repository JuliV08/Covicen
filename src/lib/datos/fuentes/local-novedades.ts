import { getCollection, getEntry } from 'astro:content';
import type { Novedad } from '../esquemas';

const aNovedad = (entrada: { id: string; data: Omit<Novedad, 'slug'> }): Novedad => ({ slug: entrada.id, ...entrada.data });

export const novedadesLocal = async (): Promise<Novedad[]> =>
  (await getCollection('novedades')).map(aNovedad).sort((a, b) => b.fecha.localeCompare(a.fecha));

export const novedadLocal = async (slug: string): Promise<Novedad | null> => {
  const entrada = await getEntry('novedades', slug);
  return entrada ? aNovedad(entrada) : null;
};
