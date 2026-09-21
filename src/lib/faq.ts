// Qué preguntas frecuentes se publican.
//
// Existe porque el 20/09/2026 se escaparon tres. Se escondieron cinco secciones de Tarifas y dos trámites por falta
// de certificación del área, y las preguntas frecuentes siguieron publicando EXACTAMENTE esos mismos números —los
// porcentajes de descuento, los recargos por pasar sin pagar y la tarifa vecinal—, además de mandarlos al JSON-LD,
// o sea a Google. El dato quedaba escondido en una página y publicado en otra, que es peor que no esconderlo.
//
// El filtro vive acá y no en la página para que valga para cualquier cosa que consuma `datos.faq()`. Y el candado
// de verdad está en scripts/verificar.ts (chequeo 10c), que barre el dist entero: si mañana aparece una cuarta
// página con el mismo texto, se cae el build aunque no pase por esta función.
import type { Pregunta } from '@/lib/datos/esquemas';
import { publicado } from '@/lib/publicado';

/** Preguntas cuya RESPUESTA es un dato sin certificar. No se reescriben: la pregunta entera espera.
 *  `tarifa-vecinal` depende de LOS DOS interruptores porque su respuesta dice dos cosas: que el beneficio existe
 *  (`tarifaDiferencial`) y dónde se tramita (`tramiteVecinosFrentistas`). Son interruptores independientes a
 *  propósito —uno se puede confirmar antes que el otro—, así que atarla a uno solo la haría volver apuntando a
 *  fichas de la Guía de trámites que siguen escondidas. */
const ESPERA_CONFIRMACION: Record<string, boolean> = {
  'descuentos-por-frecuencia': !publicado.descuentosPorFrecuencia,
  'pase-sin-pagar': !publicado.pasasteSinPagar,
  'tarifa-vecinal': !(publicado.tarifaDiferencial && publicado.tramiteVecinosFrentistas),
};

export const preguntasPublicables = (preguntas: Pregunta[]): Pregunta[] =>
  preguntas.filter((p) => !ESPERA_CONFIRMACION[p.slug]);
