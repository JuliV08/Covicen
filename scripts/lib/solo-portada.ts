// Integración de Astro que deja el build en una sola página: la portada de «Próximamente».
//
// Por qué se poda el build en vez de no generar las páginas: Astro decide sus rutas por el filesystem y no expone
// ninguna forma de quitarlas. El hook `astro:routes:resolved` parece servir, pero recibe una COPIA del array
// (integrations/hooks.js: `routes: routes.map(...)`), así que es de solo lectura y mutarlo no hace nada. Podar el
// dist al final es la única vía que no obliga a reordenar src/pages.
//
// Qué queda en dist: index.html (la portada), 404.html (una copia de la portada, para el hosting que la use),
// robots.txt, los sitemaps, los estáticos de public/ y los archivos de _astro/ que la portada realmente referencia.
// Todo lo demás se borra: las otras 29 páginas generadas (23 archivos en src/pages, más las rutas dinámicas de
// los seis peajes y las novedades) y los assets que solo ellas usaban.
import type { AstroIntegration } from 'astro';
import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { archivosDe } from './html.ts';

/** Nombres de archivo de _astro/ que menciona un texto (HTML o CSS): `/_astro/index.CzQXI53W.css` → `index.CzQXI53W.css`. */
export const referenciasAstro = (texto: string): string[] =>
  [...texto.matchAll(/_astro\/([A-Za-z0-9._-]+)/g)].map((m) => m[1]!);

/** Cierre transitivo: de las semillas (el HTML que queda) a todo lo que se alcanza siguiendo los CSS y JS retenidos.
 *  Hace falta porque el CSS referencia las fuentes y las imágenes, que no aparecen en el HTML. */
export const alcanzables = (semillas: string[], leer: (archivo: string) => string | undefined): Set<string> => {
  const vistos = new Set<string>();
  const cola = semillas.flatMap((s) => referenciasAstro(s));
  while (cola.length) {
    const archivo = cola.pop()!;
    if (vistos.has(archivo)) continue;
    vistos.add(archivo);
    if (!/\.(css|js)$/.test(archivo)) continue;
    const contenido = leer(archivo);
    if (contenido) cola.push(...referenciasAstro(contenido));
  }
  return vistos;
};

/** Archivos de la raíz de dist que NO son páginas y se conservan siempre. */
const RAIZ_QUE_QUEDA = new Set(['index.html', '404.html', 'robots.txt', 'sitemap-index.xml', 'favicon.svg', 'og.png', 'apple-touch-icon.png']);
const esSitemap = (n: string) => /^sitemap-\d+\.xml$/.test(n);

export const soloPortada = (activa: boolean): AstroIntegration => ({
  name: 'covicen:solo-portada',
  hooks: {
    'astro:build:done': ({ dir, logger }) => {
      if (!activa) return;
      const dist = fileURLToPath(dir);

      // 1. El 404 pasa a ser la misma portada. El de Astro (404.astro) usa Base, con el menú y el pie enteros:
      //    enlaces a páginas que ya no existen y todos sus assets colgando.
      copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));

      // 2. Fuera las demás páginas. Una página es todo .html que no sea index.html ni 404.html de la raíz.
      const paginas = archivosDe(dist).filter((a) => {
        const rel = relative(dist, a).split(sep).join('/');
        return rel.endsWith('.html') && rel !== 'index.html' && rel !== '404.html';
      });
      for (const p of paginas) rmSync(p, { force: true });

      // 3. Fuera los assets que solo usaban esas páginas.
      const astroDir = join(dist, '_astro');
      const leer = (archivo: string) => {
        const r = join(astroDir, archivo);
        return existsSync(r) ? readFileSync(r, 'utf8') : undefined;
      };
      const usados = alcanzables([readFileSync(join(dist, 'index.html'), 'utf8')], leer);
      let borrados = 0;
      for (const n of readdirSync(astroDir)) {
        if (usados.has(n)) continue;
        rmSync(join(astroDir, n), { force: true, recursive: true });
        borrados++;
      }

      // 4. Fuera lo que quedó suelto en la raíz: las carpetas que se vaciaron al borrar sus .html (esperado) y
      //    cualquier otra cosa. `RAIZ_QUE_QUEDA` es una lista a mano, así que el día que alguien sume algo a
      //    public/ que la portada necesite, se va a ir de este build. Lo esperado se borra en silencio y lo demás
      //    se nombra en el log: si el aviso listara también las 19 carpetas de siempre, no lo leería nadie.
      const inesperado: string[] = [];
      for (const n of readdirSync(dist)) {
        if (n === '_astro' || RAIZ_QUE_QUEDA.has(n) || esSitemap(n)) continue;
        const ruta = join(dist, n);
        const carpetaVaciada = statSync(ruta).isDirectory() && archivosDe(ruta).length === 0;
        rmSync(ruta, { force: true, recursive: true });
        if (!carpetaVaciada) inesperado.push(n);
      }

      logger.warn(`portada sola: ${paginas.length} páginas y ${borrados} archivos de _astro borrados del build. Para publicar el sitio entero: PUBLIC_SITIO_COMPLETO=true`);
      if (inesperado.length) logger.warn(`portada sola: OJO, también se borró de la raíz algo que no es una página: ${inesperado.join(', ')}`);
    },
  },
});
