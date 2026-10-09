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

export const esIndexable = ({ sitioCompleto, sitio, noIndexar }: { sitioCompleto: boolean; sitio: string; noIndexar?: string }): boolean => {
  // Una portada de «Próximamente» no se indexa nunca, ni en el dominio oficial.
  if (!sitioCompleto || noIndexar === 'true') return false;
  try {
    return (DOMINIOS_OFICIALES as readonly string[]).includes(new URL(sitio).hostname);
  } catch {
    return false;
  }
};
