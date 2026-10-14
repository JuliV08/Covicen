// Google Analytics (GA4) de Covicen, desde el 14/10/2026. Va SOLO en /telepase/, la página a la que lleva el QR del
// folleto de TelePASE: cuenta cuántos entran por el folleto antes de pasar a la adhesión de Telepeaje Plus. El resto del
// sitio no lleva seguimiento, y la política de privacidad lo explica cuando el ID está cargado.
// El ID de medición no es secreto: va escrito en el HTML de la página. Con null, /telepase/ redirige igual pero no
// cuenta, y la política de privacidad no nombra a Google Analytics.
// Cargado el 14/10/2026: propiedad «covicen.com.ar», flujo «Web Covicen». Un ID mal escrito no se publica y la página
// deja de contar sin avisar: lo cuida tests/lib/redireccion.test.ts.
export const ID_GOOGLE_ANALYTICS: string | null = 'G-MSL9JZ23H0';

/** Un ID de medición de GA4: «G-» y de 6 a 12 letras mayúsculas o dígitos. Cualquier otra cosa no se publica: el ID
 *  termina adentro de la URL de un <script>. */
export const esIdAnalytics = (id: string | null): id is string => id !== null && /^G-[A-Z0-9]{6,12}$/.test(id);
