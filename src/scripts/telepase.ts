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
  redirigir({
    destino: raiz.dataset.destino,
    idAnalytics,
    gtag: idAnalytics ? gtag : undefined,
    reemplazar: (url) => location.replace(url),
    esperar: (fn, ms) => { setTimeout(fn, ms); },
  });
}
