import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Lista recursiva de archivos .html bajo un directorio. */
export const paginasDe = (dir: string): string[] => {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...paginasDe(ruta));
    else if (nombre.endsWith('.html')) salida.push(ruta);
  }
  return salida;
};

/** hrefs internos (empiezan con "/"), sin ancla, sin duplicar el protocolo. */
export const linksInternos = (html: string): string[] =>
  [...html.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1]!)
    .filter((h) => h.startsWith('/') && !h.startsWith('//'))
    .map((h) => h.split('#')[0]!)
    .filter((h) => h !== '');

/** Los únicos esquemas de href que el sitio usa. Todo lo demás (javascript:, data:, vbscript:…) es un fallo. */
const ESQUEMAS_HREF = new Set(['http', 'https', 'tel', 'mailto']);

/** hrefs de dist/ cuyo esquema no está permitido. Las anclas (#x) y las rutas (/x) no tienen esquema: pasan.
 * El navegador descarta espacios y saltos de línea antes de leer el esquema, así que acá también. */
export const hrefsConEsquemaProhibido = (html: string): string[] =>
  [...html.matchAll(/href="([^"]*)"/g)]
    .map((m) => m[1]!.replace(/[\t\n\r]/g, '').trim())
    .filter((h) => {
      const esquema = /^([a-z][a-z0-9+.-]*):/i.exec(h)?.[1];
      return esquema !== undefined && !ESQUEMAS_HREF.has(esquema.toLowerCase());
    });

/** '/covicen/tarifas/' + base '/covicen/' → 'tarifas/index.html' */
export const normalizarHref = (href: string, base: string): string => {
  const sinBase = href.startsWith(base) ? href.slice(base.length) : href.replace(/^\//, '');
  if (sinBase === '' || sinBase.endsWith('/')) return `${sinBase}index.html`;
  return sinBase;
};

export const existeDestino = (dist: string, base: string, href: string): boolean =>
  existsSync(join(dist, normalizarHref(href, base)));

export const jsonLdDe = (html: string): unknown[] =>
  [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]!));

/** Solo lo que un lector ve: sin <script>, <style> ni etiquetas (los atributos y los hashes de assets no cuentan). */
export const textoVisible = (html: string): string =>
  html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
