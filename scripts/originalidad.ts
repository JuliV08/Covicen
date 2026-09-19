// Compara el texto de Quiénes somos (dist/) contra páginas institucionales de otras concesionarias: ninguna secuencia de
// 6 palabras puede coincidir. Uso: node scripts/originalidad.ts https://www.corresur.com.ar/ https://cvsa.com.ar/nosotros …
// Se corre a mano después de `pnpm build`. No va en CI: depende de sitios ajenos.
import { readFileSync } from 'node:fs';
import { textoVisible } from './lib/html.ts';

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ').split(/\s+/).filter(Boolean);
const ngramas = (palabras: string[], n = 6) => new Set(palabras.slice(0, Math.max(0, palabras.length - n + 1)).map((_, i) => palabras.slice(i, i + n).join(' ')));

// Solo el <main>: header y footer son cromo compartido (fecha de actualización, links institucionales), no texto propio.
const pagina = readFileSync('dist/quienes-somos/index.html', 'utf8');
const main = /<main[\s\S]*?<\/main>/.exec(pagina)?.[0] ?? pagina;
// Nombres propios que inevitablemente se repiten entre concesionarias del mismo programa.
const NOMBRES_PROPIOS = ['red federal de concesiones', 'direccion nacional de vialidad'];
const propio = new Set([...ngramas(normalizar(textoVisible(main)))].filter((g) => !NOMBRES_PROPIOS.some((n) => g.includes(n))));
const urls = process.argv.slice(2);
if (urls.length === 0) { console.error('Pasá al menos una URL institucional para comparar.'); process.exit(2); }
let coincidencias = 0;
let comparadas = 0;
for (const url of urls) {
  // Un host caído o que no resuelve no corta la corrida: se avisa y se salta. Timeout de 20 s por pedido.
  let cuerpo: string;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Covicen-originalidad)' }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) { console.warn(`${url}: ${r.status}, se salta`); continue; }
    cuerpo = await r.text();
  } catch (e) {
    console.warn(`${url}: no responde (${(e as Error).message}), se salta`);
    continue;
  }
  const ajeno = ngramas(normalizar(textoVisible(cuerpo)));
  const comunes = [...propio].filter((g) => ajeno.has(g));
  comparadas += 1;
  coincidencias += comunes.length;
  console.log(`${url}: ${comunes.length} secuencias de 6 palabras en común${comunes.length ? `\n  - ${comunes.join('\n  - ')}` : ''}`);
}
if (comparadas === 0) { console.error('No se pudo comparar contra ningún sitio: nada que concluir.'); process.exit(2); }
process.exit(coincidencias > 0 ? 1 : 0);
