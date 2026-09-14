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
  razonSocial: z.string().min(1).nullable(),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d$/).nullable(),
  domicilioLegal: z.string().min(1).nullable(),
  /** El pliego (PETG 61.6) pide legal Y comercial. */
  domicilioComercial: z.string().min(1).nullable(),
  /** Adónde lleva el QR de Data Fiscal (constancia de inscripción). */
  constanciaUrl: url.nullable(),
  /** Póliza de responsabilidad civil (PETG 61.6). null hasta que Covicen la mande. */
  polizaRc: z.object({ aseguradora: z.string().min(1), numero: z.string().min(1), vigenciaHasta: fechaIso, url: url.nullable() }).nullable(),
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
    /** Tarifa ofertada en la adjudicación. Es un dato histórico para explicar cómo se fija la tarifa; NO es el precio vigente. */
    tarifaOfertadaSinIva: z.number().positive(),
    tarifaTopeSinIva: z.number().positive(),
    tramosEtapa: z.number().int().positive(),
  }),
});
export type Empresa = z.infer<typeof esquemaEmpresa>;

/** Un canal de atención con los plazos del pliego (PETG 58). `valor` null = existe por pliego, todavía no habilitado. */
export const esquemaCanal = z.object({
  id: slug,
  nombre: z.string().min(1),
  tipo: z.enum(['telefono', 'web', 'correo', 'whatsapp', 'presencial']),
  valor: z.string().min(1).nullable(),
  disponibilidad: z.string().min(1),
  acuse: z.string().min(1),
  respuesta: z.string().min(1),
  fuente: z.string().min(1),
});
export type Canal = z.infer<typeof esquemaCanal>;

export const esquemaContacto = z.object({
  /** Número corto de emergencia (PETG 59): obligatorio. */
  emergencias: z.object({ telefono: z.string().regex(/^[0-9+\- ]{3,20}$/), etiqueta: z.string().min(1) }),
  /** Línea gratuita 0800 (PETG 61.1). */
  lineaGratuita: z.string().regex(/^[0-9+\- ]{6,20}$/).nullable(),
  /** atencionalusuario@covicen.com.ar (PETG 61.5). Se publica cuando la casilla funcione. */
  atencionUsuario: z.email().nullable(),
  /** E.164 sin '+', ej. 5493510000000 → wa.me/5493510000000 */
  whatsapp: z.object({ numero: z.string().regex(/^\d{10,15}$/).nullable() }),
  email: z.object({
    general: z.email().nullable(),
    rrhh: z.email().nullable(),
    proveedores: z.email().nullable(),
    etica: z.email().nullable(),
  }),
  redes: z.object({ instagram: url.optional(), x: url.optional(), linkedin: url.optional(), facebook: url.optional(), youtube: url.optional() }),
  /** oficinaVirtual: Telepeaje Plus, cuando exista. atencionDnv: canales de atención al usuario de la DNV (PETG 61.6), cuando indiquen la URL. */
  enlaces: z.object({ telepase: url, oficinaVirtual: url.nullable(), atencionDnv: url.nullable() }),
  canales: z.array(esquemaCanal),
  /** Cuenta bancaria para regularizar peajes impagos (PETG 51.1.4 c). */
  cuentaRegularizacion: z.string().min(1).nullable(),
});
export type Contacto = z.infer<typeof esquemaContacto>;

export const esquemaRuta = z.object({
  nombre: esquemaNombreRuta,
  descripcion: z.string().min(1),
  desde: z.string().min(1),
  hasta: z.string().min(1),
  km: z.number().positive().nullable(),
  /** Progresivas del PETP art. 1. Sirven para ubicar incidentes por km sobre el trazo del mapa. */
  pkInicial: z.number().nonnegative().optional(),
  pkFinal: z.number().positive().optional(),
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
  /** 'empalme' = nodo del trazado que no es una ciudad (ej. el empalme RN 34 / RN 19 donde termina la concesión). */
  tipo: z.enum(['ciudad', 'empalme']).default('ciudad'),
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
  /** Peaje sin barrera. Lo informa el sistema; opcional para el JSON del repo. */
  freeFlow: z.boolean().optional(),
  /** Cobra hoy (verde en el mapa). Si falta, se deriva de `situacion` (ver cabinaOperativa). */
  operativa: z.boolean().optional(),
  vias: z.number().int().positive().optional(),
  sentido: z.enum(['ambos', 'ascendente', 'descendente']).optional(),
  telefono: z.string().min(3).optional(),
  horarioAtencion: z.string().min(1).optional(),
  servicios: z
    .object({
      areaDescanso: z.boolean().optional(),
      detencionSegura: z.boolean().optional(),
      gruaGratuita: z.boolean().optional(),
      sanitarios: z.boolean().optional(),
      colocacionTelepase: z.boolean().optional(),
    })
    .optional(),
  mapa: puntoMapa,
  fuente: z.object({ nombre: z.string().min(1), url }).optional(),
});
export type Cabina = z.infer<typeof esquemaCabina>;
export const cabinaOperativa = (c: Cabina): boolean => c.operativa ?? c.situacion === 'existente';

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

/** Familia propia de íconos de vehículo (IconoVehiculo). Opcional: si falta, se deriva de la categoría. */
export const ICONOS_VEHICULO = ['moto', 'auto', 'camioneta', 'camion-2', 'camion-3-4', 'camion-5-6', 'camion-7'] as const;
export type IconoVehiculo = (typeof ICONOS_VEHICULO)[number];

export const esquemaTarifa = z.object({
  categoria: slug,
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  icono: z.enum(ICONOS_VEHICULO).optional(),
  /** Con TelePASE (la columna principal). */
  montoSinIva: z.number().positive().nullable(),
  /** Lo calcula el sistema (IVA + redondeo). La UI sigue formateando con lib/formato.ts. */
  montoConIva: z.number().positive().nullable().optional(),
  /** Pago electrónico o manual en la vía. Hoy igual al de TelePASE (Res. 248/2026); rige distinto cuando haya vías 100% automáticas. */
  montoManualSinIva: z.number().positive().nullable().optional(),
  /** Múltiplo de la tarifa básica (PETG 53.2). Informativo. */
  multiplicador: z.number().positive().optional(),
  nota: z.string().optional(),
});
export type Tarifa = z.infer<typeof esquemaTarifa>;

export const esquemaTarifario = z.object({
  publicadoEl: fechaIso,
  vigencia: z.object({ desde: fechaIso.nullable(), descripcion: z.string().min(1) }),
  moneda: z.literal('ARS'),
  alicuotaIva: z.number().min(0).max(1),
  /** 'heredado' = cuadro de la concesionaria saliente que rige desde la toma de posesión (PETP art. 3). */
  origen: z.enum(['oferta', 'homologada', 'heredado']),
  resolucion: z.string().min(1).optional(),
  /** Slugs de las cabinas donde rige. Ausente = todas las operativas. */
  cabinas: z.array(slug).optional(),
  /** Tarifa que muestra el home. Ausente = la primera. */
  categoriaDestacada: slug.optional(),
  tarifas: z.array(esquemaTarifa).min(1),
  /** Una fila con cabina reemplaza la general para esa cabina y categoría (mismo modelo que el backend). */
  excepciones: z
    .array(z.object({ cabina: slug, categoria: slug, montoSinIva: z.number().positive().nullable(), montoManualSinIva: z.number().positive().nullable().optional() }))
    .optional(),
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
  /** Artículo del pliego que obliga la obra (PETP 5, 6, 7…). */
  fuente: z.string().min(1).optional(),
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

export const esquemaIncidente = z.object({
  ruta: esquemaNombreRuta,
  km: z.number().nullable(),
  descripcion: z.string(),
  severidad: z.enum(['info', 'precaucion', 'corte']),
  tipo: z.enum(['transito', 'obra', 'incidente', 'clima']).default('incidente'),
  sentido: z.enum(['ambos', 'ascendente', 'descendente']).optional(),
  desde: z.iso.datetime({ offset: true }).optional(),
  hasta: z.iso.datetime({ offset: true }).optional(),
});
export type Incidente = z.infer<typeof esquemaIncidente>;

export const esquemaEstadoRuta = z.object({
  disponible: z.boolean(),
  /** true = datos de muestra para ver el módulo funcionando; el componente lo dice con un cartel. */
  ejemplo: z.boolean().default(false),
  /** ISO 8601 con zona (el backoffice manda hora argentina, -03:00). */
  actualizado: z.iso.datetime({ offset: true }).optional(),
  incidentes: z.array(esquemaIncidente).optional(),
});
export type EstadoRuta = z.infer<typeof esquemaEstadoRuta>;

/** Aviso de la barra superior. `url` interna ('/tarifas') o externa (https). Sin fechas = siempre vigente. */
export const esquemaAviso = z.object({
  id: slug,
  texto: z.string().min(1).max(160),
  url: z.string().regex(/^(\/|https?:\/\/)/).optional(),
  desde: fechaIso.optional(),
  hasta: fechaIso.optional(),
  tono: z.enum(['info', 'vial']).default('info'),
});
export type Aviso = z.infer<typeof esquemaAviso>;

/** Servicio al usuario (PETG 54 y 55). Los gratuitos publican alcance y tiempos comprometidos. */
export const esquemaServicio = z.object({
  id: slug,
  nombre: z.string().min(1),
  gratuito: z.boolean(),
  descripcion: z.string().min(1),
  alcance: z.string().optional(),
  tiempos: z.array(z.string().min(1)).optional(),
  fuente: z.string().min(1),
});
export type Servicio = z.infer<typeof esquemaServicio>;

/** Normativa aplicable (PETG 61.6: "disponible para descargar"). descargable=false: se cita y se dice por qué no está. */
export const esquemaNorma = z.object({
  id: slug,
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  url: url.nullable(),
  descargable: z.boolean(),
});
export type Norma = z.infer<typeof esquemaNorma>;

/** Trámite del usuario (PETG 61.5 c). */
export const esquemaTramite = z.object({
  id: slug,
  nombre: z.string().min(1),
  quien: z.string().min(1),
  requisitos: z.array(z.string().min(1)),
  pasos: z.array(z.string().min(1)),
  plazo: z.string().optional(),
  url: url.optional(),
  fuente: z.string().min(1),
});
export type Tramite = z.infer<typeof esquemaTramite>;

/** Consejo de seguridad vial o de qué hacer ante una emergencia. */
export const esquemaConsejo = z.object({
  id: slug,
  titulo: z.string().min(1),
  texto: z.string().min(1),
  categoria: z.enum(['conducir', 'emergencia']),
});
export type Consejo = z.infer<typeof esquemaConsejo>;
