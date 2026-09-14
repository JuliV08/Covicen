// Fuente v1: JSON del repo, validado contra el contrato. Sin `astro:content` (eso vive en local-novedades.ts).
import { z } from 'astro/zod';
import avisosJson from '@/content/avisos.json';
import empresaJson from '@/content/empresa.json';
import contactoJson from '@/content/contacto.json';
import tramoJson from '@/content/tramo.json';
import tarifarioJson from '@/content/tarifario.json';
import { avisosVigentes, hoyArgentina } from '@/lib/avisos';
import {
  esquemaAviso,
  esquemaContacto,
  esquemaEmpresa,
  esquemaEstadoRuta,
  esquemaObra,
  esquemaPregunta,
  esquemaTarifario,
  esquemaTramo,
  type Aviso,
  type Contacto,
  type Empresa,
  type EstadoRuta,
  type Obra,
  type Pregunta,
  type Tarifario,
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
  // v1: no hay sistema de estado de rutas. El slot del layout lee esto y muestra el hueco.
  estadoRutas: async (): Promise<EstadoRuta> => esquemaEstadoRuta.parse({ disponible: false }),
  // Barra superior: solo los vigentes hoy (el sitio se reconstruye a diario, así las fechas entran y salen solas).
  avisos: async (): Promise<Aviso[]> => avisosVigentes(z.array(esquemaAviso).parse(avisosJson), hoyArgentina()),
};
