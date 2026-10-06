// Único lugar que lee variables de entorno. El resto importa `config`.
// Acceso ESTÁTICO (import.meta.env.NOMBRE): desde Astro 6 los valores se inlinean en build;
// un acceso dinámico por clave no se reemplaza y queda undefined.
const oDefecto = (valor: string | undefined, porDefecto: string): string =>
  valor === undefined || valor === '' ? porDefecto : valor;

const fuente = oDefecto(import.meta.env.FUENTE_DATOS, 'local');
if (fuente !== 'local' && fuente !== 'api') {
  throw new Error(`FUENTE_DATOS inválida: "${fuente}" (esperaba local | api)`);
}
const apiUrl = oDefecto(import.meta.env.API_URL, '').replace(/\/+$/, '');
if (fuente === 'api' && !apiUrl) {
  throw new Error('FUENTE_DATOS=api exige API_URL (ej. https://api.covicen.com.ar)');
}

// Se calcula antes del objeto porque `indexable` lo usa: una portada de «Próximamente» no se indexa nunca.
const sitioCompleto = oDefecto(import.meta.env.PUBLIC_SITIO_COMPLETO, 'true') === 'true';

export const config = {
  /** Origen del sitio, sin base ni barra final. */
  sitio: oDefecto(import.meta.env.PUBLIC_SITE_URL, 'http://localhost:4321').replace(/\/+$/, ''),
  /** Base path con barra inicial y final. */
  base: `/${oDefecto(import.meta.env.PUBLIC_BASE_PATH, '/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/'),
  /** true = se puede indexar (hay dominio Y se publica el sitio entero). false = demo o portada: noindex.
   *  Incluye `sitioCompleto` a propósito y en UN solo lugar: sin eso, el día que se prenda PUBLIC_INDEXABLE una
   *  portada de «Próximamente» saldría sin `noindex`, y Google indexaría el cartel en vez del sitio. */
  indexable: oDefecto(import.meta.env.PUBLIC_INDEXABLE, 'false') === 'true' && sitioCompleto,
  /** true = se publica el sitio entero. false = solo la portada de «Próximamente».
   *  Hasta el lanzamiento (06/10/2026) el default era `false`: olvidarse de la variable publicaba de menos, que antes
   *  de salir era el lado seguro. Con el sitio ya publicado, el lado seguro se dio vuelta: un olvido no puede volver a
   *  poner el cartel en lugar de la web. Ahora sin la variable sale el sitio entero, y la portada hay que pedirla con
   *  PUBLIC_SITIO_COMPLETO=false. La misma regla está en astro.config.mjs y en scripts/verificar.ts (lo mira
   *  tests/lib/config.test.ts). */
  sitioCompleto,
  fuenteDatos: fuente as 'local' | 'api',
  /** Origen de la API del sistema, sin barra final. Solo se usa con FUENTE_DATOS=api. */
  apiUrl,
} as const;
