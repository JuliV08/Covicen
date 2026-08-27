// Único lugar que lee variables de entorno. El resto importa `config`.
// Acceso ESTÁTICO (import.meta.env.NOMBRE): desde Astro 6 los valores se inlinean en build;
// un acceso dinámico por clave no se reemplaza y queda undefined.
const oDefecto = (valor: string | undefined, porDefecto: string): string =>
  valor === undefined || valor === '' ? porDefecto : valor;

const fuente = oDefecto(import.meta.env.FUENTE_DATOS, 'local');
if (fuente !== 'local' && fuente !== 'api') {
  throw new Error(`FUENTE_DATOS inválida: "${fuente}" (esperaba local | api)`);
}

export const config = {
  /** Origen del sitio, sin base ni barra final. */
  sitio: oDefecto(import.meta.env.PUBLIC_SITE_URL, 'http://localhost:4321').replace(/\/+$/, ''),
  /** Base path con barra inicial y final. */
  base: `/${oDefecto(import.meta.env.PUBLIC_BASE_PATH, '/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/'),
  /** true = se puede indexar (hay dominio). false = demo, noindex. */
  indexable: oDefecto(import.meta.env.PUBLIC_INDEXABLE, 'false') === 'true',
  fuenteDatos: fuente as 'local' | 'api',
} as const;
