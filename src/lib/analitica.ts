// Google Analytics (GA4) de Covicen. Desde el 14/10/2026 cuenta las visitas de TODA la web (antes, solo /telepase/, la
// página del QR del folleto de TelePASE), y solo en el build de producción: en Pages, la rama de revisión o la máquina
// de uno no se carga, para no mezclar las visitas del equipo con las del público. La política de privacidad lo explica
// cuando está activo.
// El ID de medición no es secreto: va escrito en el HTML. Con null no se cuenta nada y la política no nombra a Google.
// Cargado el 14/10/2026: propiedad «covicen.com.ar», flujo «Web Covicen». Un ID mal escrito no se publica y la web
// deja de contar sin avisar: lo cuida tests/lib/redireccion.test.ts.
export const ID_GOOGLE_ANALYTICS: string | null = 'G-MSL9JZ23H0';

/** Un ID de medición de GA4: «G-» y de 6 a 12 letras mayúsculas o dígitos. Cualquier otra cosa no se publica: el ID
 *  termina adentro de la URL de un <script>. */
export const esIdAnalytics = (id: string | null): id is string => id !== null && /^G-[A-Z0-9]{6,12}$/.test(id);

/** El ID que de verdad se carga: uno válido y en producción. Recibe las dos cosas en vez de importarlas para que cada
 *  página las lea de sus propios imports (y los tests puedan cambiarlas). */
export const idAnalyticsActivo = (id: string | null, enProduccion: boolean): string | null =>
  enProduccion && esIdAnalytics(id) ? id : null;
