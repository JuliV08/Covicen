import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contraste } from '../../scripts/lib/contraste.ts';

// Pliego 61.7: la web tiene que imprimirse legible. La hoja vive en src/styles/impresion.css, un solo @media print,
// y global.css la importa. Colores: los tokens de papel y tinta del :root de tokens.css (nada de hex acá).
const css = readFileSync('src/styles/impresion.css', 'utf8');
const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const hexDeToken = (nombre: string) => new RegExp(String.raw`--color-${nombre}:\s*(#[0-9a-fA-F]{6})`).exec(tokens)?.[1];
// `selector { … declaración }` dentro de la hoja, sin importar el orden de las declaraciones
const regla = (selector: string, declaracion: string) => new RegExp(`${selector}[^{]*\\{[^}]*${declaracion}`);

describe('impresión (pliego 61.7)', () => {
  it('hay una hoja de impresión que oculta la navegación, muestra las URL y todas las tarjetas', () => {
    expect(css).toContain('@media print');
    expect(css).toMatch(/header[^{]*\{[^}]*display:\s*none/);
    expect(css).toContain('attr(href)');
    expect(css).toContain('[data-tarjeta-estacion][hidden]');
  });
  it('global.css la importa y ya no tiene un bloque de impresión propio (una sola hoja)', () => {
    const global = readFileSync('src/styles/global.css', 'utf8');
    expect(global).toContain('@import "./impresion.css"');
    expect(global).not.toContain('@media print');
  });
  it('las seis tarjetas de estación y las diapositivas del hero salen aunque el JS las haya escondido', () => {
    // Tailwind pone `display: none !important` en [hidden]: la excepción necesita !important y más especificidad.
    expect(css).toMatch(regla(String.raw`\[data-tarjeta-estacion\]\[hidden\]`, String.raw`display:\s*block\s*!important`));
    expect(css).toMatch(regla(String.raw`\[data-slide\]\[hidden\]`, String.raw`display:\s*block\s*!important`));
  });
  it('la tabla de tarifas se imprime completa: sin scroll horizontal ni corte de página adentro', () => {
    expect(css).toMatch(regla(String.raw`\.overflow-x-auto`, String.raw`overflow:\s*visible`));
    expect(css).toMatch(regla('table', String.raw`break-inside:\s*avoid`));
  });
  it('lo que en pantalla entra animado se ve en papel: revelar, escalonar y el trazo del mapa', () => {
    expect(css).toMatch(regla(String.raw`\.revelar`, String.raw`opacity:\s*1\s*!important`));
    expect(css).toMatch(regla(String.raw`\.escalonar > \*`, String.raw`opacity:\s*1\s*!important`));
    expect(css).toMatch(regla(String.raw`\.dibujar`, String.raw`stroke-dashoffset:\s*0`));
  });
  it('el encabezado de la hoja sale del <body>: sitio y fecha', () => {
    expect(css).toContain('attr(data-sitio)');
    expect(css).toContain('attr(data-fecha)');
  });
  it('usa los tokens de papel y tinta y pisa los semánticos: nada se pinta a mano', () => {
    for (const t of ['papel', 'tinta', 'tinta-2', 'tinta-media', 'tinta-suave']) expect(css, `usa --color-${t}`).toContain(`var(--color-${t})`);
    for (const t of ['fondo', 'superficie', 'texto', 'texto-2', 'acento', 'borde']) expect(css, `pisa --color-${t}`).toMatch(new RegExp(String.raw`--color-${t}:\s*var\(--color-(papel|tinta)`));
  });
  it('los grises de impresión leen sobre el papel (AA, ≥ 4.5)', () => {
    const papel = hexDeToken('papel');
    expect(papel).toBeDefined();
    for (const t of ['tinta', 'tinta-2']) {
      const hex = hexDeToken(t);
      expect(hex, `falta --color-${t} en tokens.css`).toBeDefined();
      expect(contraste(hex!, papel!), t).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('la fecha del encabezado se refresca al imprimir; la del build es solo el fallback sin JS', () => {
    const script = readFileSync('src/scripts/imprimir.ts', 'utf8');
    expect(script).toContain('beforeprint');
    expect(script).toContain('dataset.fecha');
    // el script lo carga Base (la fecha vale en toda página), no solo Tarifas
    expect(readFileSync('src/layouts/Base.astro', 'utf8')).toContain('scripts/imprimir.ts');
    expect(readFileSync('src/pages/tarifas.astro', 'utf8')).not.toContain('scripts/imprimir.ts');
  });
});
