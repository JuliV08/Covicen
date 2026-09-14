import type { Aviso } from '@/lib/datos/esquemas';

/** Fecha de hoy en Argentina como YYYY-MM-DD (el build corre en UTC en GitHub Actions). */
export const hoyArgentina = (): string => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

/** Los avisos cuya vigencia incluye `hoy` (fechas ISO se comparan como texto). */
export const avisosVigentes = (avisos: Aviso[], hoy: string): Aviso[] =>
  avisos.filter((a) => (a.desde === undefined || a.desde <= hoy) && (a.hasta === undefined || a.hasta >= hoy));
