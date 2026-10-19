// /telepase/: arranca la redirección con lo que la página dejó en el <main> (el destino y el ID de Analytics).
// La lógica está en lib/redireccion.ts.
import { redirigir } from '@/lib/redireccion';

declare global {
  interface Window { dataLayer: unknown[] }
}

const raiz = document.querySelector<HTMLElement>('[data-destino]');
if (raiz?.dataset.destino) {
  const idAnalytics = raiz.dataset.analytics || null;
  window.dataLayer = window.dataLayer || [];
  // gtag tiene que encolar el objeto `arguments` tal cual: con un array, gtag.js no lo reconoce.
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  }
  const ir = redirigir({
    destino: raiz.dataset.destino,
    idAnalytics,
    gtag: idAnalytics ? gtag : undefined,
    reemplazar: (url) => location.replace(url),
    esperar: (fn, ms) => { setTimeout(fn, ms); },
  });
  // El botón también reemplaza: con el enlace común, /telepase/ quedaba en el historial y el «atrás» desde Telepeaje
  // Plus volvía acá, que redirigía otra vez (revisión del 14/10/2026). El href queda para quien no tiene JS.
  raiz.querySelector<HTMLAnchorElement>('a.btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    ir();
  });
  // Si un bloqueador corta el script de Google, no tiene sentido esperar el tope: el `onerror` del <script> de la
  // página marca `data-ga-fallo` (si ya pasó) o avisa con `ga-fallo` (si pasa después).
  if (idAnalytics) {
    if (document.documentElement.dataset.gaFallo) ir();
    else addEventListener('ga-fallo', ir, { once: true });
  }
}
