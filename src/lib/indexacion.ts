// Cuándo se deja indexar la web por Google. Sin variables de entorno ni nada de Vite: lo usan src/lib/config.ts (el
// `noindex` de Seo.astro y el robots.txt) y scripts/verificar.ts (que controla el build), así los dos no pueden decidir
// distinto.
//
// Desde el lanzamiento (06/10/2026) se indexa el sitio entero publicado en el dominio oficial, y nada más: Pages
// (github.io) y la rama de revisión de Amplify (amplifyapp.com) siguen con `noindex`, para que Google no las tome como
// copias de la web. Antes lo decidía PUBLIC_INDEXABLE, cargada en la consola de Amplify; en producción estaba en false
// y desde el repo no había forma de cambiarla, así que esa variable dejó de usarse. Para apagar la indexación en una
// emergencia: PUBLIC_NO_INDEXAR=true en la rama que corresponda.

export const DOMINIOS_OFICIALES = ['covicen.com.ar', 'www.covicen.com.ar'] as const;

const enDominioOficial = (sitio: string): boolean => {
  try {
    return (DOMINIOS_OFICIALES as readonly string[]).includes(new URL(sitio).hostname);
  } catch {
    return false;
  }
};

/** El sitio entero, publicado en el dominio oficial. Desde el 14/10/2026 es lo que decide si se carga Google Analytics:
 *  en Pages, la rama de revisión o la máquina de uno no se cuenta nada, para no mezclar las visitas del equipo con las
 *  del público. PUBLIC_NO_INDEXAR no lo apaga: sacar la web de Google en una emergencia no tiene por qué dejar de contar. */
export const esProduccion = ({ sitioCompleto, sitio }: { sitioCompleto: boolean; sitio: string }): boolean =>
  sitioCompleto && enDominioOficial(sitio);

export const esIndexable = ({ sitioCompleto, sitio, noIndexar }: { sitioCompleto: boolean; sitio: string; noIndexar?: string }): boolean =>
  // Una portada de «Próximamente» no se indexa nunca, ni en el dominio oficial.
  noIndexar !== 'true' && esProduccion({ sitioCompleto, sitio });
