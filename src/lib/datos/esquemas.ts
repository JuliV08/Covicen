// EL CONTRATO. Valida hoy el JSON del repo y mañana la respuesta de la API.
// Formas de dominio, no de pantalla: fechas ISO (YYYY-MM-DD), montos number en ARS sin IVA, ids = slugs.
import { z } from 'astro/zod';

export const fechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha en formato YYYY-MM-DD');
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug en minúsculas con guiones');
export const url = z.url();

export const RUTAS = ['RN 9', 'RN 19', 'RN 34'] as const;
export const esquemaNombreRuta = z.enum(RUTAS);
export type NombreRuta = z.infer<typeof esquemaNombreRuta>;

export const esquemaEmpresa = z.object({
  marca: z.literal('Covicen'),
  descriptor: z.string().min(1),
  razonSocial: z.string().min(1).nullable(),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d$/).nullable(),
  domicilioLegal: z.string().min(1).nullable(),
  enFormacion: z.boolean(),
  consorcio: z.array(z.object({ nombre: z.string().min(1), descripcion: z.string().min(1) })).min(1),
  concesion: z.object({
    tramo: z.literal('Centro'),
    km: z.number().positive(),
    rutas: z.array(esquemaNombreRuta).min(1),
    provincias: z.array(z.string().min(1)).min(1),
    plazoAnios: z.number().int().positive(),
    prorrogaAnios: z.number().int().nonnegative(),
    inicioOperacion: fechaIso,
    adjudicacion: z.object({ fecha: fechaIso, resolucion: z.string().min(1), url }),
    tarifaOfertadaSinIva: z.number().positive(),
    tarifaTopeSinIva: z.number().positive(),
    tramosEtapa: z.number().int().positive(),
  }),
});
export type Empresa = z.infer<typeof esquemaEmpresa>;

export const esquemaContacto = z.object({
  emergencias: z.object({ telefono: z.string().regex(/^[0-9+\- ]{6,20}$/).nullable(), etiqueta: z.string().min(1) }),
  /** E.164 sin '+', ej. 5493510000000 → wa.me/5493510000000 */
  whatsapp: z.object({ numero: z.string().regex(/^\d{10,15}$/).nullable() }),
  email: z.object({
    general: z.email().nullable(),
    rrhh: z.email().nullable(),
    proveedores: z.email().nullable(),
    etica: z.email().nullable(),
  }),
  redes: z.object({ instagram: url.optional(), x: url.optional(), linkedin: url.optional() }),
});
export type Contacto = z.infer<typeof esquemaContacto>;

export const esquemaRuta = z.object({
  nombre: esquemaNombreRuta,
  descripcion: z.string().min(1),
  desde: z.string().min(1),
  hasta: z.string().min(1),
  km: z.number().positive().nullable(),
  nota: z.string().optional(),
});
export type Ruta = z.infer<typeof esquemaRuta>;

/** Coordenadas dentro del SVG propio del mapa (viewBox 0 0 820 520), no geográficas. */
const puntoMapa = z.object({ x: z.number(), y: z.number() });

export const esquemaCiudad = z.object({
  slug,
  nombre: z.string().min(1),
  provincia: z.string().min(1),
  mapa: puntoMapa,
  principal: z.boolean().default(false),
});
export type Ciudad = z.infer<typeof esquemaCiudad>;

export const esquemaCabina = z.object({
  slug,
  nombre: z.string().min(1),
  ruta: esquemaNombreRuta,
  km: z.number().nonnegative().nullable(),
  localidad: z.string().min(1),
  provincia: z.string().min(1),
  situacion: z.enum(['existente', 'nueva']),
  estado: z.enum(['confirmada', 'a-confirmar']),
  mapa: puntoMapa,
  fuente: z.object({ nombre: z.string().min(1), url }).optional(),
});
export type Cabina = z.infer<typeof esquemaCabina>;

export const esquemaTramo = z.object({
  km: z.number().positive(),
  rutas: z.array(esquemaRuta).min(1),
  provincias: z.array(z.string().min(1)).min(1),
  ciudades: z.array(esquemaCiudad).min(1),
  cabinas: z.array(esquemaCabina),
  /** Trazado de cada ruta como lista de slugs de ciudad, en orden, para dibujar el mapa. */
  trazados: z.array(z.object({ ruta: esquemaNombreRuta, ciudades: z.array(slug).min(2) })),
  avisos: z.array(z.string()),
});
export type Tramo = z.infer<typeof esquemaTramo>;

export const esquemaTarifa = z.object({
  categoria: slug,
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  montoSinIva: z.number().positive().nullable(),
  nota: z.string().optional(),
});
export type Tarifa = z.infer<typeof esquemaTarifa>;

export const esquemaTarifario = z.object({
  publicadoEl: fechaIso,
  vigencia: z.object({ desde: fechaIso.nullable(), descripcion: z.string().min(1) }),
  moneda: z.literal('ARS'),
  alicuotaIva: z.number().min(0).max(1),
  origen: z.enum(['oferta', 'homologada']),
  tarifas: z.array(esquemaTarifa).min(1),
  fuente: z.object({ nombre: z.string().min(1), url }),
  avisos: z.array(z.string()),
});
export type Tarifario = z.infer<typeof esquemaTarifario>;

export const esquemaObra = z.object({
  slug,
  titulo: z.string().min(1),
  ruta: z.union([esquemaNombreRuta, z.literal('Todo el tramo')]),
  tramo: z.string().optional(),
  tipo: z.string().min(1),
  estado: z.enum(['planificada', 'en-ejecucion', 'terminada']),
  avance: z.number().min(0).max(100).nullable(),
  inicio: fechaIso.optional(),
  finEstimado: fechaIso.optional(),
  descripcion: z.string().min(1),
  orden: z.number().int(),
});
export type Obra = z.infer<typeof esquemaObra>;

export const esquemaNovedadFrontmatter = z.object({
  titulo: z.string().min(1),
  fecha: fechaIso,
  resumen: z.string().min(1),
  etiquetas: z.array(z.string().min(1)).default([]),
  destacada: z.boolean().default(false),
});
export type NovedadFrontmatter = z.infer<typeof esquemaNovedadFrontmatter>;
export type Novedad = NovedadFrontmatter & { slug: string };

export const esquemaPregunta = z.object({
  slug,
  pregunta: z.string().min(1),
  respuesta: z.string().min(1),
  tema: z.enum(['general', 'tarifas', 'peajes', 'pago', 'servicios', 'empresa']),
  orden: z.number().int(),
  enHome: z.boolean().default(false),
});
export type Pregunta = z.infer<typeof esquemaPregunta>;

export const esquemaEstadoRuta = z.object({
  disponible: z.boolean(),
  actualizado: z.iso.datetime().optional(),
  incidentes: z
    .array(
      z.object({
        ruta: esquemaNombreRuta,
        km: z.number().nullable(),
        descripcion: z.string(),
        severidad: z.enum(['info', 'precaucion', 'corte']),
      }),
    )
    .optional(),
});
export type EstadoRuta = z.infer<typeof esquemaEstadoRuta>;
