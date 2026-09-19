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
const sitioCompleto = oDefecto(import.meta.env.PUBLIC_SITIO_COMPLETO, 'false') === 'true';

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
   *  El default es `false` A PROPÓSITO, al revés que las otras variables. Hoy el sitio lo sube una persona que
   *  clona el repo y corre `pnpm build` sin configurar nada (no hay ninguna cañería entre git y el hosting, ver
   *  README «Cómo se publica hoy»): con el default al revés, ese build a ciegas publica la portada y no las 30
   *  páginas. Olvidarse de la variable falla hacia el lado seguro. Para publicar el sitio real hay que pedirlo. */
  sitioCompleto,
  fuenteDatos: fuente as 'local' | 'api',
  /** Origen de la API del sistema, sin barra final. Solo se usa con FUENTE_DATOS=api. */
  apiUrl,
} as const;
