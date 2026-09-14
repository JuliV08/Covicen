// Fuente v1: JSON del repo, validado contra el contrato. Sin `astro:content` (eso vive en local-novedades.ts).
import { z } from 'astro/zod';
import avisosJson from '@/content/avisos.json';
import consejosJson from '@/content/consejos.json';
import empresaJson from '@/content/empresa.json';
import estadoJson from '@/content/estado-ruta.json';
import normativaJson from '@/content/normativa.json';
import serviciosJson from '@/content/servicios.json';
import contactoJson from '@/content/contacto.json';
import tramoJson from '@/content/tramo.json';
import tarifarioJson from '@/content/tarifario.json';
import tramitesJson from '@/content/tramites.json';
import { avisosVigentes, hoyArgentina } from '@/lib/avisos';
import {
  esquemaAviso,
  esquemaConsejo,
  esquemaContacto,
  esquemaEmpresa,
  esquemaEstadoRuta,
  esquemaNorma,
  esquemaObra,
  esquemaPregunta,
  esquemaServicio,
  esquemaTarifario,
  esquemaTramite,
  esquemaTramo,
  type Aviso,
  type Consejo,
  type Contacto,
  type Empresa,
  type EstadoRuta,
  type Norma,
  type Obra,
  type Pregunta,
  type Servicio,
  type Tarifario,
  type Tramite,
  type Tramo,
} from '../esquemas';
import type { FuenteDatos } from '../fuente';

const obrasJson = import.meta.glob('../../../content/obras/*.json', { eager: true, import: 'default' });
const faqJson = import.meta.glob('../../../content/faq/*.json', { eager: true, import: 'default' });

const parsearTodos = <T>(archivos: Record<string, unknown>, parsear: (x: unknown, origen: string) => T): T[] =>
  Object.entries(archivos).map(([ruta, contenido]) => parsear(contenido, ruta));

export const fuenteLocalJson: Omit<FuenteDatos, 'novedades' | 'novedad'> = {
  empresa: async (): Promise<Empresa> => esquemaEmpresa.parse(empresaJson),
  contacto: async (): Promise<Contacto> => esquemaContacto.parse(contactoJson),
  tramo: async (): Promise<Tramo> => esquemaTramo.parse(tramoJson),
  tarifario: async (): Promise<Tarifario> => esquemaTarifario.parse(tarifarioJson),
  obras: async (): Promise<Obra[]> =>
    parsearTodos(obrasJson, (x, origen) => {
      const r = esquemaObra.safeParse(x);
      if (!r.success) throw new Error(`Obra inválida en ${origen}: ${r.error.message}`);
      return r.data;
    }).sort((a, b) => a.orden - b.orden),
  faq: async (): Promise<Pregunta[]> =>
    parsearTodos(faqJson, (x, origen) => {
      const r = esquemaPregunta.safeParse(x);
      if (!r.success) throw new Error(`Pregunta inválida en ${origen}: ${r.error.message}`);
      return r.data;
    }).sort((a, b) => a.orden - b.orden),
  // Estado de la traza: hoy datos de ejemplo del repo (ejemplo: true); con estadoRutasEnVivo, una isla lo pide en runtime.
  estadoRutas: async (): Promise<EstadoRuta> => esquemaEstadoRuta.parse(estadoJson),
  // Barra superior: solo los vigentes hoy (el sitio se reconstruye a diario, así las fechas entran y salen solas).
  avisos: async (): Promise<Aviso[]> => avisosVigentes(z.array(esquemaAviso).parse(avisosJson), hoyArgentina()),
  servicios: async (): Promise<Servicio[]> => z.array(esquemaServicio).parse(serviciosJson),
  normativa: async (): Promise<Norma[]> => z.array(esquemaNorma).parse(normativaJson),
  tramites: async (): Promise<Tramite[]> => z.array(esquemaTramite).parse(tramitesJson),
  consejos: async (): Promise<Consejo[]> => z.array(esquemaConsejo).parse(consejosJson),
};
