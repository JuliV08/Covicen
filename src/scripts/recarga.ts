// Cancelar la preparación de una navegación hace que Astro la complete con una carga entera (`location.href`), también
// con atrás y adelante. Qué páginas y por qué: src/lib/recarga.ts. Corre una vez por carga: el listener queda en el
// `document`, que el router no reemplaza.
import { recargaCompleta } from '@/lib/recarga';

document.addEventListener('astro:before-preparation', (e) => {
  if (recargaCompleta(e.to.pathname, import.meta.env.BASE_URL)) e.preventDefault();
});
export {};
