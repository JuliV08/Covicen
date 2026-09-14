import type { Aviso, Consejo, Contacto, Empresa, EstadoRuta, Norma, Novedad, Obra, Pregunta, Servicio, Tarifario, Tramite, Tramo } from './esquemas';

/** Async desde el día 1: hoy se resuelve en build; mañana una isla lo consume en runtime. */
export interface FuenteDatos {
  empresa(): Promise<Empresa>;
  contacto(): Promise<Contacto>;
  tramo(): Promise<Tramo>;
  tarifario(): Promise<Tarifario>;
  obras(): Promise<Obra[]>;
  novedades(): Promise<Novedad[]>;
  novedad(slug: string): Promise<Novedad | null>;
  faq(): Promise<Pregunta[]>;
  estadoRutas(): Promise<EstadoRuta>;
  avisos(): Promise<Aviso[]>;
  servicios(): Promise<Servicio[]>;
  normativa(): Promise<Norma[]>;
  tramites(): Promise<Tramite[]>;
  consejos(): Promise<Consejo[]>;
}
