// Lo que hace /telepase/ al abrirse: cuenta la visita en Google Analytics y pasa a la adhesión de Telepeaje Plus.
// Separado del script de la página para probarlo sin navegador (tests/lib/redireccion.test.ts).
// La regla es que la persona llega SIEMPRE: si Google no contesta (un bloqueador, mala señal), pasa igual al tope.

/** Lo que Google Analytics tiene de margen para confirmar que contó la visita. */
export const ESPERA_GA_MS = 1500;
/** Lo máximo que alguien espera en esta pantalla, conteste Google o no. Menos de dos segundos contando desde que corre
 *  el script (la revisión del 14/10/2026 midió 2036 a 2085 ms con el tope en 2000). */
export const TOPE_MS = 1800;

type Gtag = (...args: unknown[]) => void;

interface Opciones {
  destino: string;
  /** El ID de medición, ya validado; null = no se cuenta. */
  idAnalytics: string | null;
  gtag?: Gtag;
  /** `location.replace`: la página del QR no queda en el historial y el «atrás» del celular no rebota acá. */
  reemplazar: (url: string) => void;
  esperar: (fn: () => void, ms: number) => void;
}

/** Arranca la redirección y devuelve `ir`, para que el botón y el aviso de que Google no cargó pasen por el mismo
 *  camino: una sola navegación, siempre con `reemplazar`. */
export const redirigir = ({ destino, idAnalytics, gtag, reemplazar, esperar }: Opciones): (() => void) => {
  let ido = false;
  const ir = () => {
    if (ido) return;
    ido = true;
    reemplazar(destino);
  };
  if (!idAnalytics || !gtag) {
    ir();
    return ir;
  }
  esperar(ir, TOPE_MS);
  gtag('js', new Date());
  // Sin señales de Google ni personalización de anuncios: el número sirve para contar, no para publicidad (y la
  // política de privacidad lo dice así).
  gtag('config', idAnalytics, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
  gtag('event', 'page_view', { event_callback: ir, event_timeout: ESPERA_GA_MS });
  return ir;
};
