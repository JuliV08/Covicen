// Chequeos sobre dist/ sin navegador. Uso: pnpm verificar (hace build antes).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { loadEnv } from 'vite';
import { contraste, leerTemas } from './lib/contraste.ts';
import { existeDestino, jsonLdDe, linksInternos, paginasDe, textoVisible } from './lib/html.ts';
import { paresContraste } from './lib/pares.ts';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const base = `/${(env.PUBLIC_BASE_PATH || '/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
const indexable = env.PUBLIC_INDEXABLE === 'true';
const DIST = 'dist';
const fallos: string[] = [];
const fallo = (m: string) => fallos.push(m);

const PROHIBIDOS = [/a confirmar/i, /corredor vial del centro/i, /\b681\b/];
const paginas = paginasDe(DIST).filter((p) => !p.includes('404'));
console.log(`Verificando ${paginas.length} páginas (base ${base}, indexable ${indexable})…`);

for (const ruta of paginas) {
  const html = readFileSync(ruta, 'utf8');
  const nombre = relative(DIST, ruta).replace(/\\/g, '/');
  // 1. links internos
  for (const href of new Set(linksInternos(html))) if (!existeDestino(DIST, base, href)) fallo(`${nombre}: link roto → ${href}`);
  // 2. metadatos (el <title> se cuenta solo en <head>: los SVG del mapa tienen <title> de tooltip)
  const head = /<head>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? '';
  if ((head.match(/<title>/g) ?? []).length !== 1) fallo(`${nombre}: debe haber exactamente un <title> en <head>`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) fallo(`${nombre}: falta description (≥ 20 chars)`);
  if (!/<link rel="canonical" href="https?:\/\//.test(html)) fallo(`${nombre}: falta canonical absoluta`);
  if (indexable && /<link rel="canonical" href="http:\/\/localhost/.test(html)) fallo(`${nombre}: canonical apunta a localhost con PUBLIC_INDEXABLE=true (falta PUBLIC_SITE_URL)`);
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) fallo(`${nombre}: debe haber exactamente un <h1>`);
  if (!html.includes('<html lang="es-AR"')) fallo(`${nombre}: falta lang="es-AR"`);
  // 3. JSON-LD
  let bloques: unknown[] = [];
  try {
    bloques = jsonLdDe(html);
  } catch (e) {
    fallo(`${nombre}: JSON-LD inválido (${(e as Error).message})`);
  }
  const tipos = bloques.map((b) => (b as { '@type'?: string })['@type']);
  if (!tipos.includes('Organization')) fallo(`${nombre}: falta Organization`);
  if (nombre.startsWith('preguntas-frecuentes') && !tipos.includes('FAQPage')) fallo(`${nombre}: falta FAQPage`);
  for (const b of bloques) if (!(b as Record<string, unknown>)['@context']) fallo(`${nombre}: bloque JSON-LD sin @context`);
  // 4. emergencias: el 140 (número corto del pliego) en toda página
  if (!/href="tel:140"/.test(html)) fallo(`${nombre}: falta el tel:140 de emergencias`);
  // 5. vigencia en tarifas
  if (nombre.startsWith('tarifas') && !html.includes('Vigencia')) fallo(`${nombre}: la tabla de tarifas debe mostrar la vigencia`);
  // 10. textos prohibidos y datos oficiales (spec 2026-09-13 §2, §3, §12.1.2): criterio "esconder", marca y 679 km.
  // Los prohibidos se buscan en el HTML crudo (meta, alt, aria-label, JSON-LD incluidos); los obligatorios, en el texto visible.
  for (const p of PROHIBIDOS) if (p.test(html)) fallo(`${nombre}: contiene ${p}`);
  const visible = textoVisible(html);
  if ((nombre === 'index.html' || nombre.startsWith('el-tramo')) && !/\b679\b/.test(visible)) fallo(`${nombre}: falta la longitud oficial (679 km)`);
  if (!visible.includes('Última actualización')) fallo(`${nombre}: falta "Última actualización" en el pie`);
  // 7. indexabilidad
  const tieneNoindex = html.includes('content="noindex, nofollow"');
  if (indexable && tieneNoindex) fallo(`${nombre}: noindex presente con PUBLIC_INDEXABLE=true`);
  if (!indexable && !tieneNoindex) fallo(`${nombre}: falta noindex con PUBLIC_INDEXABLE=false`);
  // 8. accesibilidad básica estática
  // `alt` vacío es válido (imagen decorativa); Astro lo puede emitir como `alt` a secas o `alt=""`.
  for (const m of html.matchAll(/<img\b(?![^>]*\balt(?:[\s=>/]))[^>]*>/g)) fallo(`${nombre}: <img> sin alt → ${m[0].slice(0, 60)}`);
  if (!html.includes('href="#contenido"')) fallo(`${nombre}: falta skip link`);
  if (/[\u{1F300}-\u{1FAFF}]/u.test(html)) fallo(`${nombre}: hay emojis en la UI`);
}

// 6. contraste de tokens usados, en los dos temas (la lista de pares vive en scripts/lib/pares.ts)
const temas = leerTemas(readFileSync('src/styles/tokens.css', 'utf8'));
for (const [tema, tokens] of Object.entries(temas)) {
  for (const [a, b] of paresContraste) {
    if (!tokens[a] || !tokens[b]) { fallo(`tema ${tema}: falta el token --color-${tokens[a] ? b : a}`); continue; }
    const r = contraste(tokens[a]!, tokens[b]!);
    if (r < 4.5) fallo(`tema ${tema}: contraste ${a}/${b} = ${r.toFixed(2)} < 4.5`);
  }
}

// 10b. textos prohibidos también en los json y xml emitidos (sitemap, datos): "ausentes en todo dist/".
// No se miran js/css/svg: ahí \b681\b haría match en hashes de assets o valores numéricos (`.681;`), y ningún texto de
// usuario vive en esos archivos.
const archivosDe = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const r = join(dir, n); return statSync(r).isDirectory() ? archivosDe(r) : [r]; });
for (const archivo of archivosDe(DIST).filter((a) => /\.(json|xml)$/.test(a))) {
  const contenido = readFileSync(archivo, 'utf8');
  for (const p of PROHIBIDOS) if (p.test(contenido)) fallo(`${relative(DIST, archivo)}: contiene ${p}`);
}

// 11. páginas que tienen que existir (una por estación de peaje)
for (const slug of ['carcarana', 'james-craik', 'franck', 'leones', 'san-francisco', 'totoras']) {
  if (!existsSync(join(DIST, 'peajes', slug, 'index.html'))) fallo(`falta la página /peajes/${slug}/`);
}
for (const p of ['asistencia', 'tramites']) if (!existsSync(join(DIST, p, 'index.html'))) fallo(`falta la página /${p}/`);

// 9. presupuesto de JS enviado
const archivosJs = readdirSync(join(DIST, '_astro')).filter((f) => f.endsWith('.js'));
const totalJs = archivosJs.reduce((s, f) => s + gzipSync(readFileSync(join(DIST, '_astro', f))).length, 0);
console.log(`JS total: ${archivosJs.length} archivos, ${(totalJs / 1024).toFixed(1)} KB gz`);
if (totalJs > 30 * 1024) fallo(`JS enviado ${(totalJs / 1024).toFixed(1)} KB gz > 30 KB`);
const og = statSync(join(DIST, 'og.png')).size;
if (og > 300 * 1024) fallo(`og.png pesa ${(og / 1024).toFixed(0)} KB > 300 KB`);

if (fallos.length) {
  console.error(`\n${fallos.length} fallo(s):\n- ${fallos.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nOK: ${paginas.length} páginas verificadas, 0 fallos.`);
