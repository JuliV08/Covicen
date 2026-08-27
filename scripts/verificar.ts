// Chequeos sobre dist/ sin navegador. Uso: pnpm verificar (hace build antes).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { loadEnv } from 'vite';
import { contraste, leerTokens } from './lib/contraste.ts';
import { existeDestino, jsonLdDe, linksInternos, paginasDe } from './lib/html.ts';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const base = `/${(env.PUBLIC_BASE_PATH || '/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
const indexable = env.PUBLIC_INDEXABLE === 'true';
const DIST = 'dist';
const fallos: string[] = [];
const fallo = (m: string) => fallos.push(m);

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
  // 4. emergencias en toda página
  if (!/href="tel:/.test(html) && !/data-emergencias="a-confirmar"/.test(html)) fallo(`${nombre}: sin tel: de emergencias ni slot a confirmar`);
  // 5. vigencia en tarifas
  if (nombre.startsWith('tarifas') && !html.includes('Vigencia')) fallo(`${nombre}: la tabla de tarifas debe mostrar la vigencia`);
  // 7. indexabilidad
  const tieneNoindex = html.includes('content="noindex, nofollow"');
  if (indexable && tieneNoindex) fallo(`${nombre}: noindex presente con PUBLIC_INDEXABLE=true`);
  if (!indexable && !tieneNoindex) fallo(`${nombre}: falta noindex con PUBLIC_INDEXABLE=false`);
  // 8. accesibilidad básica estática
  for (const m of html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) fallo(`${nombre}: <img> sin alt → ${m[0].slice(0, 60)}`);
  if (!html.includes('href="#contenido"')) fallo(`${nombre}: falta skip link`);
  if (/[\u{1F300}-\u{1FAFF}]/u.test(html)) fallo(`${nombre}: hay emojis en la UI`);
}

// 6. contraste de tokens usados
const tokens = leerTokens(readFileSync('src/styles/tokens.css', 'utf8'));
const pares: Array<[string, string]> = [
  ['texto', 'fondo'], ['texto-2', 'fondo'], ['texto-3', 'fondo'], ['acento', 'fondo'], ['vial', 'fondo'],
  ['texto', 'superficie'], ['texto-2', 'superficie'], ['fondo', 'vial'], ['fondo', 'acento'], ['error', 'fondo'],
];
for (const [a, b] of pares) {
  const r = contraste(tokens[a]!, tokens[b]!);
  if (r < 4.5) fallo(`contraste ${a}/${b} = ${r.toFixed(2)} < 4.5`);
}

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
