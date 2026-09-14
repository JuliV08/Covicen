# Actualización de la web de Covicen (sept. 2026) — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Llevar la landing de Covicen a cumplir lo que el pliego exige a la web desde la toma de posesión (5/10/2026) y lo pedido por el cliente: tema claro/oscuro, header de dos filas con anuncios y accesos, datos oficiales del pliego, mapa interactivo con tarjetas, tarifas por estación con el cuadro heredado, contenido obligatorio, asistencia en ruta y estado de la traza.

**Architecture:** Sitio estático Astro 7 con Tailwind 4, sin islas React ni backend. Los colores viven en tokens semánticos (`tokens.css`); el tema claro redefine solo esa capa en `html[data-tema="claro"]`. Todo el contenido está en `src/content/` (JSON/Markdown) detrás de un contrato Zod (`src/lib/datos/esquemas.ts`) y una interfaz `FuenteDatos`; los componentes solo importan de `@/lib/datos`. El JS de cliente es vanilla, bundleado por Astro, registrado en `astro:page-load` (hay `<ClientRouter />`).

**Tech Stack:** Astro 7.2, Tailwind 4.3 (`@tailwindcss/vite`), `@lucide/astro`, `@fontsource-variable/archivo`, Zod (de `astro/zod`), Vitest 4 + `experimental_AstroContainer` + linkedom, `@resvg/resvg-js` (OG), pnpm 10, Node ≥ 22.12.

**Spec:** `docs/superpowers/specs/2026-09-13-actualizacion-web-design.md` (esta la implementa; cuando dude, manda la spec). Spec anterior de la landing: `docs/superpowers/specs/2026-08-27-landing-covicen-design.md`.

## Global Constraints

- **Solo la web.** Nada de backoffice ni sistemas. Lo "administrable" = JSON en `src/content/` + método en `FuenteDatos` (solo fuente local).
- **Contrato compartido con el backend (`esquemaTramo`, `esquemaTarifario` y lo que anidan): solo campos opcionales y, en `origen`, un valor más en el enum.** Después de tocar Zod: `pnpm contrato` y commitear `docs/contrato/*.schema.json` (`tests/lib/contrato.test.ts` compara byte a byte).
- **Esconder, no "a confirmar".** Todo dato `null` deja de mostrar texto de relleno; el slot queda en el código. Al final del plan, `dist/` no contiene "a confirmar", "681" ni "Corredor Vial del Centro".
- **"Tramo Centro" queda.** "Corredor Vial del Centro" se elimina de todo el sitio.
- **Emergencias = 140**, `tel:140` en toda página.
- **Solo afirmaciones verificables**, cada dato con su fuente (artículo del pliego, resolución, URL). No se publican estimaciones ni los PDF preliminares de los pliegos.
- **Colores solo desde tokens.** Prohibido `#hex`/`rgb(`/`hsl(` fuera de `src/styles/tokens.css`, `src/components/marca/Isotipo.astro`, `src/scripts/lib/color.ts` y `src/lib/tema.ts`. Ningún `text-fondo` ni `text-vial` como color de texto: `text-sobre-vial`, `text-sobre-acento`, `text-vial-texto`.
- **Legibilidad (pliego 61.7):** párrafos ≥ 16 px, contenido ≥ 14 px, anotaciones 12 px con `.anotacion`; enlaces de texto subrayados en reposo; sin `text-align: justify`; contraste ≥ 4,5:1 en los dos temas.
- **Presupuestos:** JS emitido ≤ 30 KB gz (`scripts/verificar.ts`), scripts fuente ≤ 12 KB gz (`tests/presupuesto.test.ts`), `og.png` ≤ 300 KB. Se mantienen.
- **Convenciones:** español rioplatense en código, comentarios y copy (voseo sobrio: "Consultá", nunca "Consulte"); nombres en castellano; cero emojis en la UI; un `h1` por página; `alt` en toda imagen; todo interactivo con hover/focus definidos.
- **Scripts de cliente:** `<script src="…">` (bundleado) salvo el snippet de tema, que es `is:inline` en el `<head>`. Todo registra `document.addEventListener('astro:page-load', …)` y es idempotente (bandera `data-*` o `let instalado`).
- **Comandos:** `pnpm check` (astro check), `pnpm test` (vitest), `pnpm verificar` (build + `scripts/verificar.ts`), `pnpm contrato`, `pnpm og`. Ejecutar desde `C:\Users\Villex\dev\Covicen`.
- **Commits:** un commit por tarea **solo si Juli lo autorizó para la fase**; si no, se acumulan y se commitean al cerrar la fase. `git add` siempre con rutas explícitas. Mensajes en castellano con prefijo (`feat`, `fix`, `test`, `docs`, `refactor`) y las dos líneas de atribución de la sesión. Sin push.
- **Cierre de fase:** `pnpm check && pnpm test && pnpm verificar` en verde, y revisión de `rev-bro` (agente del proyecto) sobre el código de la fase antes de pasar a la siguiente.

---

## Fase 0 — Tema claro/oscuro y tokens

Resultado: el sitio se ve igual que hoy en oscuro, tiene un interruptor que lo pasa a claro sin destello, no queda ningún color escrito a mano fuera de los tokens, y la guarda de contraste corre para los dos temas.

### Tarea 0.1: Tokens nuevos, bloque del tema claro y guarda de contraste para los dos temas

**Files:**
- Modify: `src/styles/tokens.css` (todo el archivo)
- Modify: `scripts/lib/contraste.ts:23-30` (`leerTokens` acotado al bloque `@theme`; nuevos `leerTokensClaro`, `leerTemas`)
- Create: `scripts/lib/pares.ts`
- Modify: `scripts/verificar.ts:58-67`
- Modify: `tests/styles/tokens.test.ts` (todo el archivo)
- Modify: `tests/scripts/contraste.test.ts`

**Interfaces:**
- Produces: tokens CSS `--color-vial-texto`, `--color-sobre-vial`, `--color-sobre-acento`, `--color-ok`, `--color-sobre-ok`, `--color-cabecera`, `--color-tarjeta-interior-1|2|3`, `--color-sombra`, `--color-plano`, `--color-luz`, variable `--brillo-foto`; selector `html[data-tema="claro"]`. Funciones `leerTokens(css): Record<string,string>` (oscuro), `leerTokensClaro(css)`, `leerTemas(css): { oscuro, claro }`, constante `paresContraste: Array<[string, string]>`.

- [x] **Step 1: Escribir la lista de pares compartida**

Crear `scripts/lib/pares.ts`:

```ts
// Pares (texto, fondo) que el sitio usa. Los verifica verificar.ts (en el build) y tests/styles/tokens.test.ts, en LOS DOS temas.
// Regla: `vial` es solo fondo (texto encima: sobre-vial); el amarillo como texto es `vial-texto`. `texto-3` nunca va sobre superficies.
export const paresContraste: Array<[string, string]> = [
  ['texto', 'fondo'], ['texto-2', 'fondo'], ['texto-3', 'fondo'], ['acento', 'fondo'], ['vial-texto', 'fondo'], ['error', 'fondo'], ['ok', 'fondo'],
  ['texto', 'fondo-2'], ['texto-2', 'fondo-2'], ['texto-3', 'fondo-2'], ['acento', 'fondo-2'], ['ok', 'fondo-2'],
  ['texto', 'superficie'], ['texto-2', 'superficie'], ['acento', 'superficie'], ['vial-texto', 'superficie'], ['ok', 'superficie'], ['error', 'superficie'],
  ['texto', 'superficie-2'], ['texto-2', 'superficie-2'],
  ['sobre-vial', 'vial'], ['sobre-acento', 'acento'], ['sobre-ok', 'ok'],
];
```

- [x] **Step 2: Escribir los tests que fallan (tokens en los dos temas, lectura por bloque)**

Reemplazar `tests/styles/tokens.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contraste, leerTemas } from '../../scripts/lib/contraste.ts';
import { paresContraste } from '../../scripts/lib/pares.ts';

const css = readFileSync('src/styles/tokens.css', 'utf8');
const temas = leerTemas(css);
const marca = ['marca-900', 'marca-700', 'marca-500', 'marca-300', 'gris-texto', 'gris-fondo', 'vial'];

describe('tokens', () => {
  it('define los 7 colores del manual de marca', () => {
    expect(temas.oscuro['marca-900']).toBe('#1E4870');
    expect(temas.oscuro['marca-700']).toBe('#2C688F');
    expect(temas.oscuro['marca-500']).toBe('#4A92BA');
    expect(temas.oscuro['marca-300']).toBe('#68BCE1');
    expect(temas.oscuro['gris-texto']).toBe('#5A6472');
    expect(temas.oscuro['gris-fondo']).toBe('#EEF1F4');
    expect(temas.oscuro['vial']).toBe('#F0C419');
  });
  it('el tema claro redefine solo la capa semántica: los de marca no cambian', () => {
    for (const k of marca) expect(temas.claro[k], k).toBe(temas.oscuro[k]);
  });
  it('los dos temas definen exactamente los mismos tokens', () => {
    expect(Object.keys(temas.claro).sort()).toEqual(Object.keys(temas.oscuro).sort());
  });
  it('el claro cambia el fondo al gris del manual y el texto a navy', () => {
    expect(temas.claro['fondo']).toBe('#EEF1F4');
    expect(temas.claro['texto']).toBe('#16304E');
    expect(temas.claro['acento']).toBe('#2C688F');
  });
  describe.each(Object.entries(temas))('tema %s', (_nombre, tokens) => {
    it.each(paresContraste)('%s sobre %s cumple AA (≥ 4.5)', (texto, fondo) => {
      expect(tokens[texto], `falta --color-${texto}`).toBeDefined();
      expect(tokens[fondo], `falta --color-${fondo}`).toBeDefined();
      expect(contraste(tokens[texto]!, tokens[fondo]!)).toBeGreaterThanOrEqual(4.5);
    });
  });
});
```

Agregar al final de `tests/scripts/contraste.test.ts`, dentro de `describe('leerTokens', …)`:

```ts
  it('lee solo el bloque @theme para el oscuro y lo pisa con html[data-tema="claro"] para el claro', () => {
    const css = `@theme static {\n  --color-fondo: #0B1526;\n  --color-vial: #F0C419;\n}\n:root { color-scheme: dark; }\nhtml[data-tema="claro"] {\n  --color-fondo: #EEF1F4;\n}`;
    expect(leerTokens(css)).toEqual({ fondo: '#0B1526', vial: '#F0C419' });
    expect(leerTokensClaro(css)).toEqual({ fondo: '#EEF1F4', vial: '#F0C419' });
    expect(leerTemas(css)).toEqual({ oscuro: { fondo: '#0B1526', vial: '#F0C419' }, claro: { fondo: '#EEF1F4', vial: '#F0C419' } });
  });
```

y cambiar el import de ese archivo a `import { contraste, leerTemas, leerTokens, leerTokensClaro } from '../../scripts/lib/contraste.ts';`.

- [x] **Step 3: Correr los tests y ver que fallan**

Run: `pnpm vitest run tests/styles/tokens.test.ts tests/scripts/contraste.test.ts`
Expected: FAIL — `leerTemas is not a function` / `falta --color-vial-texto`.

- [x] **Step 4: Implementar la lectura por bloque**

Reemplazar desde el comentario `/** Devuelve { nombre: '#HEX' } …` hasta el final de `scripts/lib/contraste.ts`:

```ts
/** Contenido del primer bloque `{ … }` que sigue a `inicio`. Ni @theme ni el bloque del tema claro anidan llaves. */
const bloque = (css: string, inicio: RegExp): string => {
  const m = inicio.exec(css);
  if (!m) return '';
  const desde = m.index + m[0].length;
  const hasta = css.indexOf('}', desde);
  return hasta === -1 ? '' : css.slice(desde, hasta);
};

const hexDe = (css: string): Record<string, string> => {
  const tokens: Record<string, string> = {};
  for (const m of css.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) tokens[m[1]!] = m[2]!.toUpperCase();
  return tokens;
};

/** Tokens del tema oscuro: `{ nombre: '#HEX' }` por cada `--color-<nombre>: #hex` del bloque `@theme`. Ignora valores no hex. */
export const leerTokens = (css: string): Record<string, string> => hexDe(bloque(css, /@theme(?:\s+static)?\s*\{/));

/** Tokens del tema claro: los del oscuro, pisados por los de `html[data-tema="claro"] { … }`. */
export const leerTokensClaro = (css: string): Record<string, string> => ({ ...leerTokens(css), ...hexDe(bloque(css, /html\[data-tema="claro"\]\s*\{/)) });

export const leerTemas = (css: string): { oscuro: Record<string, string>; claro: Record<string, string> } => ({ oscuro: leerTokens(css), claro: leerTokensClaro(css) });
```

- [x] **Step 5: Reescribir `src/styles/tokens.css`**

Contenido completo del archivo (`@theme static` para que Tailwind emita **todos** los tokens, también los que solo se usan con `var()` dentro de `<style>` de componentes, que Tailwind no ve):

```css
/* Tokens de Covicen. Dos capas: marca (manual "Covicen Marca 9b1", fijos) y semánticos (los usan los componentes).
   El tema oscuro "La ruta, de noche" es el de @theme. El tema claro redefine SOLO la capa semántica, abajo, en
   html[data-tema="claro"]. Regla: los componentes usan solo semánticos; ningún color se escribe a mano fuera de acá. */
@theme static {
  /* --- reset de la paleta por defecto de Tailwind: solo existen nuestros colores --- */
  --color-*: initial;
  --color-white: #ffffff;
  --color-black: #000000;

  /* --- marca (no usar en componentes) --- */
  --color-marca-900: #1E4870;
  --color-marca-700: #2C688F;
  --color-marca-500: #4A92BA;
  --color-marca-300: #68BCE1;
  --color-gris-texto: #5A6472;
  --color-gris-fondo: #EEF1F4;

  /* --- semánticos, tema oscuro --- */
  --color-fondo: #0B1526;
  --color-fondo-2: #10203A;
  --color-superficie: #16304E;
  --color-superficie-2: #1E4870;
  --color-texto: #E8EEF5;
  --color-texto-2: #A9C4D8;
  --color-texto-3: #8593A0; /* ≥ 4.5:1 sobre fondo y fondo-2; NUNCA sobre superficie ni superficie-2 */
  --color-acento: #68BCE1;
  --color-acento-hover: #8FCDE8;
  --color-vial: #F0C419;         /* señalética: SOLO como fondo; el texto encima es sobre-vial */
  --color-vial-texto: #F0C419;   /* el amarillo usado como texto (en claro se oscurece para llegar a 4.5:1) */
  --color-sobre-vial: #0B1526;   /* texto sobre amarillo */
  --color-sobre-acento: #0B1526; /* texto sobre acento (botón de envío, badges) */
  --color-ok: #7BD389;           /* estación operativa */
  --color-sobre-ok: #0B1526;
  --color-error: #FF8A80;
  --color-cabecera: rgb(16 32 58 / 0.85);      /* fondo del header al scrollear */
  --color-tarjeta-interior-1: #17334F;         /* degradé interior de .tarjeta, de arriba a abajo */
  --color-tarjeta-interior-2: #10203A;
  --color-tarjeta-interior-3: #0B1526;
  --color-borde: rgb(255 255 255 / 0.10);
  --color-borde-fuerte: rgb(255 255 255 / 0.18);
  --color-glow: rgb(104 188 225 / 0.35);
  --color-sombra: rgb(0 0 0 / 0.6);
  --color-plano: rgb(255 255 255 / 0.04);     /* grilla de fondo */
  --color-luz: rgb(104 188 225 / 0.09);       /* resplandores suaves */

  /* --- tipografía --- */
  --font-sans: "Archivo Variable", "Archivo", system-ui, -apple-system, "Segoe UI", sans-serif;
  --tracking-eyebrow: 0.15em;
  --tracking-titulo: -0.02em;

  /* --- radios: sobrio --- */
  --radius-*: initial;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* --- movimiento --- */
  --ease-salida: cubic-bezier(0.25, 1, 0.5, 1);   /* ease-out-quart: entradas */
  --ease-suave: cubic-bezier(0.65, 0, 0.35, 1);   /* ease-in-out-cubic: scrub */
}

:root {
  --dur-micro: 120ms;
  --dur-ui: 240ms;
  --dur-entrada: 600ms;
  --dur-narrativa: 900ms;
  --stagger: 60ms;
  --alto-header: 4.5rem;
  --ancho-max: 80rem;
  --brillo-foto: 0.62; /* las fotos de atmósfera se oscurecen para que el texto gane */
  color-scheme: dark;
}

/* Tema claro: mismos nombres, valores del manual (gris-fondo, gris-texto, marca-900 en títulos, marca-700 en links).
   Sin @layer a propósito: lo no-layered le gana a la capa `theme` de Tailwind, y html[...] es más específico que :root. */
html[data-tema="claro"] {
  --color-fondo: #EEF1F4;
  --color-fondo-2: #F7F9FB;
  --color-superficie: #FFFFFF;
  --color-superficie-2: #DDE6EE;
  --color-texto: #16304E;
  --color-texto-2: #5A6472;
  --color-texto-3: #546070;
  --color-acento: #2C688F;
  --color-acento-hover: #1E4870;
  --color-vial-texto: #6E5A00;
  --color-sobre-acento: #FFFFFF;
  --color-ok: #1B6B35;
  --color-sobre-ok: #FFFFFF;
  --color-error: #B3261E;
  --color-cabecera: rgb(238 241 244 / 0.85);
  --color-tarjeta-interior-1: #FFFFFF;
  --color-tarjeta-interior-2: #F7F9FB;
  --color-tarjeta-interior-3: #EEF1F4;
  --color-borde: rgb(30 72 112 / 0.14);
  --color-borde-fuerte: rgb(30 72 112 / 0.28);
  --color-glow: rgb(44 104 143 / 0.25);
  --color-sombra: rgb(30 72 112 / 0.18);
  --color-plano: rgb(30 72 112 / 0.06);
  --color-luz: rgb(44 104 143 / 0.08);
  --brillo-foto: 1;
  color-scheme: light;
}
```

- [x] **Step 6: Hacer que `verificar.ts` chequee los dos temas**

En `scripts/verificar.ts`, cambiar el import de la línea 6 por `import { contraste, leerTemas } from './lib/contraste.ts';`, agregar `import { paresContraste } from './lib/pares.ts';`, y reemplazar el bloque `// 6. contraste de tokens usados` (líneas 58–67) por:

```ts
// 6. contraste de tokens usados, en los dos temas (la lista de pares vive en scripts/lib/pares.ts)
const temas = leerTemas(readFileSync('src/styles/tokens.css', 'utf8'));
for (const [tema, tokens] of Object.entries(temas)) {
  for (const [a, b] of paresContraste) {
    if (!tokens[a] || !tokens[b]) { fallo(`tema ${tema}: falta el token --color-${tokens[a] ? b : a}`); continue; }
    const r = contraste(tokens[a]!, tokens[b]!);
    if (r < 4.5) fallo(`tema ${tema}: contraste ${a}/${b} = ${r.toFixed(2)} < 4.5`);
  }
}
```

- [x] **Step 7: Correr los tests y ver que pasan**

Run: `pnpm vitest run tests/styles/tokens.test.ts tests/scripts/contraste.test.ts`
Expected: PASS (7 + 23×2 casos de tokens; contraste 5 casos).

- [x] **Step 8: Typecheck y suite completa**

Run: `pnpm check && pnpm test`
Expected: todo en verde (los tests existentes no dependen de los tokens nuevos).

- [x] **Step 9: Commit**

```bash
git add src/styles/tokens.css scripts/lib/contraste.ts scripts/lib/pares.ts scripts/verificar.ts tests/styles/tokens.test.ts tests/scripts/contraste.test.ts
git commit -m "feat(tema): tokens semánticos nuevos, bloque del tema claro y contraste verificado en los dos temas"
```

### Tarea 0.2: Constantes de tema, snippet sin destello, interruptor y `theme-color`

**Files:**
- Create: `src/lib/tema.ts`
- Create: `src/scripts/tema.ts`
- Create: `src/components/InterruptorTema.astro`
- Modify: `src/layouts/Base.astro:31-36` (snippet inline en `<head>`)
- Modify: `src/components/Seo.astro:2-3,33` (`theme-color` desde la constante)
- Modify: `src/components/Header.astro:57-70,73-79` (interruptor junto al botón de emergencias y en el menú mobile; en la Fase 1 se muda a la barra superior)
- Modify: `tests/presupuesto.test.ts:7`
- Create: `tests/lib/tema.test.ts`
- Create: `tests/components/tema.test.ts`

**Interfaces:**
- Produces: `src/lib/tema.ts` → `type Tema = 'oscuro' | 'claro'`, `type PreferenciaTema = Tema | 'sistema'`, `TEMA_POR_DEFECTO: PreferenciaTema`, `CLAVE_TEMA: string`, `COLOR_TEMA: Record<Tema, string>`, `esTema(v): v is Tema`, `resolverTema(guardado, porDefecto, prefiereClaro): Tema`, `otroTema(t): Tema`. Evento DOM `tema:cambio` (`CustomEvent<{ tema: Tema }>`) en `document`. Atributo `data-tema-boton` en los botones. Componente `<InterruptorTema class? />`.

- [x] **Step 1: Test unitario de `resolverTema`**

Crear `tests/lib/tema.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { COLOR_TEMA, otroTema, resolverTema, TEMA_POR_DEFECTO } from '@/lib/tema';

describe('resolverTema', () => {
  it('respeta lo guardado si es válido', () => {
    expect(resolverTema('claro', 'oscuro', false)).toBe('claro');
    expect(resolverTema('oscuro', 'claro', true)).toBe('oscuro');
  });
  it('ignora basura guardada y usa el default', () => {
    expect(resolverTema('rosa', 'oscuro', true)).toBe('oscuro');
    expect(resolverTema(null, 'claro', false)).toBe('claro');
  });
  it("'sistema' sigue la preferencia del aparato", () => {
    expect(resolverTema(null, 'sistema', true)).toBe('claro');
    expect(resolverTema(null, 'sistema', false)).toBe('oscuro');
  });
  it('el default actual es oscuro y cada tema tiene su theme-color', () => {
    expect(TEMA_POR_DEFECTO).toBe('oscuro');
    expect(COLOR_TEMA.oscuro).toBe('#0B1526');
    expect(COLOR_TEMA.claro).toBe('#EEF1F4');
    expect(otroTema('oscuro')).toBe('claro');
  });
});
```

- [x] **Step 2: Test de componentes (snippet en el head, interruptor)**

Crear `tests/components/tema.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import InterruptorTema from '@/components/InterruptorTema.astro';
import Base from '@/layouts/Base.astro';

describe('tema', () => {
  it('Base aplica el tema antes de pintar y lo reaplica en cada navegación', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Base, { request: new Request('https://covicen.test/'), props: { titulo: 'Inicio', descripcion: 'x' }, slots: { default: '<p>x</p>' } });
    const head = /<head>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? '';
    expect(head).toContain('dataset.tema');
    expect(head).toContain('astro:after-swap');
    expect(head).toContain('prefers-color-scheme: light');
    expect(head).toContain('<meta name="theme-color" content="#0B1526"');
  });
  it('el interruptor es un botón con estado y nombre', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(InterruptorTema, {});
    expect(html).toContain('data-tema-boton');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Cambiar a tema claro"');
  });
});
```

- [x] **Step 3: Correr y ver que fallan**

Run: `pnpm vitest run tests/lib/tema.test.ts tests/components/tema.test.ts`
Expected: FAIL — no existe `@/lib/tema` ni `InterruptorTema.astro`.

- [x] **Step 4: Crear `src/lib/tema.ts`**

```ts
/** Tema visual del sitio. El cliente elige el default cambiando TEMA_POR_DEFECTO ('sistema' sigue la preferencia del aparato).
 *  Único lugar del código con colores fijos fuera de tokens.css: el theme-color es el fondo de cada tema. */
export type Tema = 'oscuro' | 'claro';
export type PreferenciaTema = Tema | 'sistema';

export const TEMA_POR_DEFECTO: PreferenciaTema = 'oscuro';
export const CLAVE_TEMA = 'covicen:tema';
export const COLOR_TEMA: Record<Tema, string> = { oscuro: '#0B1526', claro: '#EEF1F4' };

export const esTema = (v: unknown): v is Tema => v === 'oscuro' || v === 'claro';

/** Lo guardado si es válido; si no, el default; 'sistema' se resuelve con prefers-color-scheme. */
export const resolverTema = (guardado: string | null, porDefecto: PreferenciaTema, prefiereClaro: boolean): Tema => {
  if (esTema(guardado)) return guardado;
  if (porDefecto === 'sistema') return prefiereClaro ? 'claro' : 'oscuro';
  return porDefecto;
};

export const otroTema = (t: Tema): Tema => (t === 'oscuro' ? 'claro' : 'oscuro');

/** Tema que se renderiza en el HTML estático (el que ve un cliente sin JS o antes del snippet). */
export const temaInicial = (): Tema => (TEMA_POR_DEFECTO === 'claro' ? 'claro' : 'oscuro');
```

- [x] **Step 5: Snippet inline en `Base.astro` y `theme-color` en `Seo.astro`**

En `src/layouts/Base.astro`, agregar al frontmatter `import { CLAVE_TEMA, COLOR_TEMA, TEMA_POR_DEFECTO } from '@/lib/tema';` y reemplazar el `<head>` (líneas 31–36) por:

```astro
  <head>
    <Seo {titulo} {descripcion} jsonLd={bloques} {tipo} {imagen} {empresa} {contacto} />
    <!-- Tema ANTES de pintar (sin destello) y en cada navegación: ClientRouter reemplaza los atributos de <html>.
         Es una copia mínima de resolverTema() de src/lib/tema.ts: un script inline no puede importar. -->
    <script is:inline define:vars={{ porDefecto: TEMA_POR_DEFECTO, clave: CLAVE_TEMA, colores: COLOR_TEMA }}>
      const aplicarTema = () => {
        let guardado = null;
        try { guardado = localStorage.getItem(clave); } catch { /* sin storage: se usa el default */ }
        const valido = guardado === 'oscuro' || guardado === 'claro';
        const prefiereClaro = matchMedia('(prefers-color-scheme: light)').matches;
        const tema = valido ? guardado : porDefecto === 'sistema' ? (prefiereClaro ? 'claro' : 'oscuro') : porDefecto;
        document.documentElement.dataset.tema = tema;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', colores[tema]);
      };
      aplicarTema();
      document.addEventListener('astro:after-swap', aplicarTema);
    </script>
    <ClientRouter />
    <!-- Sin JS y sin scroll-driven animations, el fallback de reveal dejaría todo en opacity:0. -->
    <noscript><style>.revelar, .escalonar > * { opacity: 1 !important; transform: none !important; }</style></noscript>
  </head>
```

En `src/components/Seo.astro`: agregar `import { COLOR_TEMA, temaInicial } from '@/lib/tema';` después de la línea 3 y reemplazar la línea 33 por `<meta name="theme-color" content={COLOR_TEMA[temaInicial()]} />`.

- [x] **Step 6: Script del interruptor `src/scripts/tema.ts`**

```ts
// Interruptor claro/oscuro. El snippet inline de Base.astro ya aplicó el tema antes de pintar; acá solo se conmuta,
// se persiste y se avisa (`tema:cambio`) a los canvas y al parallax, que leen colores o montan fotos según el tema.
import { CLAVE_TEMA, COLOR_TEMA, otroTema, type Tema } from '@/lib/tema';

const temaActual = (): Tema => (document.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro');

const pintarBotones = () => {
  const tema = temaActual();
  document.querySelectorAll<HTMLButtonElement>('[data-tema-boton]').forEach((b) => {
    b.setAttribute('aria-pressed', String(tema === 'claro'));
    b.setAttribute('aria-label', `Cambiar a tema ${otroTema(tema)}`);
  });
};

const aplicar = (tema: Tema) => {
  document.documentElement.dataset.tema = tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_TEMA[tema]);
  try { localStorage.setItem(CLAVE_TEMA, tema); } catch { /* modo privado o sin storage: el tema dura la visita */ }
  pintarBotones();
  document.dispatchEvent(new CustomEvent('tema:cambio', { detail: { tema } }));
};

const iniciar = () => {
  pintarBotones();
  document.querySelectorAll<HTMLButtonElement>('[data-tema-boton]:not([data-listo])').forEach((b) => {
    b.dataset.listo = '';
    b.addEventListener('click', () => aplicar(otroTema(temaActual())));
  });
};
document.addEventListener('astro:page-load', iniciar);

export {};
```

- [x] **Step 7: Componente `src/components/InterruptorTema.astro`**

```astro
---
// Botón sol/luna. En oscuro ofrece el sol (pasar a claro); en claro, la luna. El estado real lo pinta scripts/tema.ts.
import { Moon, Sun } from '@lucide/astro';
interface Props { class?: string }
const { class: clase = '' } = Astro.props;
---
<button type="button" class:list={['interruptor-tema inline-flex h-11 w-11 items-center justify-center rounded-md border border-borde text-texto transition-colors hover:border-borde-fuerte hover:bg-superficie', clase]} data-tema-boton aria-pressed="false" aria-label="Cambiar a tema claro">
  <Sun size={20} aria-hidden="true" class="sol" />
  <Moon size={20} aria-hidden="true" class="luna" />
</button>
<script src="../scripts/tema.ts"></script>
<style>
  .interruptor-tema :global(.sol) { display: block; }
  .interruptor-tema :global(.luna) { display: none; }
  :global(html[data-tema="claro"]) .interruptor-tema :global(.sol) { display: none; }
  :global(html[data-tema="claro"]) .interruptor-tema :global(.luna) { display: block; }
</style>
```

- [x] **Step 8: Colocar el interruptor en el header (provisorio hasta la Fase 1)**

En `src/components/Header.astro`: agregar `import InterruptorTema from '@/components/InterruptorTema.astro';` después de la línea 3. En el `div` de la línea 57 (`<div class="flex items-center gap-3">`), insertar `<InterruptorTema class="hidden lg:inline-flex" />` justo antes del `<button type="button" … popovertarget="menu-mobile"` (línea 67). En el menú mobile, reemplazar la línea 75 (`<span class="eyebrow">Menú</span>`) por:

```astro
      <div class="flex items-center gap-3"><span class="eyebrow">Menú</span><InterruptorTema /></div>
```

- [x] **Step 9: Sumar el script al presupuesto**

En `tests/presupuesto.test.ts` línea 7: `const todos = [...animacion, 'src/scripts/menu.ts', 'src/scripts/cuenta-regresiva.ts', 'src/scripts/formulario.ts', 'src/scripts/tema.ts'];`

- [x] **Step 10: Correr los tests y ver que pasan**

Run: `pnpm vitest run tests/lib/tema.test.ts tests/components/tema.test.ts tests/presupuesto.test.ts tests/components/layout.test.ts`
Expected: PASS.

- [x] **Step 11: Probar a mano el destello y la persistencia**

Run: `pnpm dev`, abrir `http://localhost:4321/`, tocar el interruptor: el sitio pasa a claro (todavía con colores fijos en tarjetas y botones: se arreglan en la 0.3), recargar la página y comprobar que **arranca en claro sin parpadeo oscuro**, navegar a `/tarifas/` y comprobar que sigue en claro. Volver a oscuro. Cerrar el dev server.

- [x] **Step 12: Commit**

```bash
git add src/lib/tema.ts src/scripts/tema.ts src/components/InterruptorTema.astro src/layouts/Base.astro src/components/Seo.astro src/components/Header.astro tests/presupuesto.test.ts tests/lib/tema.test.ts tests/components/tema.test.ts
git commit -m "feat(tema): interruptor claro/oscuro sin destello, persistente y con theme-color por tema"
```

### Tarea 0.3: Migrar todos los colores fijos a tokens (con guarda)

**Files:**
- Create: `tests/styles/colores-fijos.test.ts`
- Create: `src/scripts/lib/color.ts`
- Create: `tests/scripts/color.test.ts`
- Modify: `src/styles/tarjetas.css` (todo), `src/styles/global.css:46-71`, `src/components/ui/Boton.astro:39-63`, `src/components/Header.astro:90-101,121-129,138`, `src/components/home/Hero.astro:49`, `src/components/home/TarifaDestacada.astro:87-89`, `src/components/ilustraciones/MapaTramo.astro:28,40`, `src/components/ilustraciones/HeroRuta.astro:28-30,37,44-52,59-66`, `src/components/BarraEmergencias.astro`, `src/layouts/Base.astro:54`, `src/scripts/grilla-cinetica.ts:1-11,57-91,113-117`
- Modify: `tests/presupuesto.test.ts:7`

**Interfaces:**
- Produces: `src/scripts/lib/color.ts` → `type Rgb = { r; g; b }`, `type Color = Rgb & { a }`, `hexARgb(hex): Rgb`, `colorDeToken(nombre): Rgb`, `conAlfa(rgb, a): string`, `mezcla(a: Color, b: Color, t): string`. Clase global `.btn-vial` en `global.css`.

- [x] **Step 1: Escribir la guarda de colores fijos**

Crear `tests/styles/colores-fijos.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listar = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? listar(p) : [p]; });
const raices = ['src/components', 'src/pages', 'src/layouts', 'src/styles', 'src/scripts'];
// Únicas excepciones: los tokens, el isotipo (es el logo) y el único módulo que arma cadenas rgb para canvas.
const permitidos = new Set(['src/styles/tokens.css', 'src/components/marca/Isotipo.astro', 'src/scripts/lib/color.ts']);
const archivos = raices.flatMap(listar).map((p) => p.replace(/\\/g, '/')).filter((p) => /\.(astro|css|ts)$/.test(p) && !permitidos.has(p));
const fijo = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;

describe('colores fijos', () => {
  it.each(archivos)('%s no escribe colores a mano: usa tokens', (archivo) => {
    const culpables = readFileSync(archivo, 'utf8').split('\n').map((l, i) => (fijo.test(l) ? `${i + 1}: ${l.trim()}` : null)).filter(Boolean);
    expect(culpables, culpables.join('\n')).toEqual([]);
  });
});
```

- [x] **Step 2: Test del helper de color para canvas**

Crear `tests/scripts/color.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { conAlfa, hexARgb, mezcla } from '@/scripts/lib/color';

describe('color (canvas)', () => {
  it('convierte hex a rgb, tolerando espacios y sin #', () => {
    expect(hexARgb(' #68BCE1 ')).toEqual({ r: 104, g: 188, b: 225 });
    expect(hexARgb('0B1526')).toEqual({ r: 11, g: 21, b: 38 });
  });
  it('cae a un gris medio si el valor no es hex (nunca rompe el canvas)', () => {
    expect(hexARgb('rgb(255 255 255 / 0.1)')).toEqual({ r: 128, g: 128, b: 128 });
    expect(hexARgb('')).toEqual({ r: 128, g: 128, b: 128 });
  });
  it('arma rgba y mezcla linealmente', () => {
    expect(conAlfa({ r: 1, g: 2, b: 3 }, 0.5)).toBe('rgba(1,2,3,0.500)');
    expect(mezcla({ r: 0, g: 0, b: 0, a: 0 }, { r: 100, g: 200, b: 50, a: 1 }, 0.5)).toBe('rgba(50,100,25,0.500)');
  });
});
```

- [x] **Step 3: Correr y ver que fallan**

Run: `pnpm vitest run tests/styles/colores-fijos.test.ts tests/scripts/color.test.ts`
Expected: FAIL — ~12 archivos con colores fijos; `@/scripts/lib/color` no existe.

- [x] **Step 4: Crear `src/scripts/lib/color.ts`**

```ts
// Colores para canvas, leídos de los tokens del tema activo. Es el ÚNICO módulo que arma cadenas rgb (ver tests/styles/colores-fijos.test.ts).
export type Rgb = { r: number; g: number; b: number };
export type Color = Rgb & { a: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** #RRGGBB (con o sin #, con espacios) → {r,g,b}. Cualquier otra cosa cae a gris medio: un token mal leído no rompe el canvas. */
export const hexARgb = (hex: string): Rgb => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return { r: 128, g: 128, b: 128 };
  const n = parseInt(m[1]!, 16);
  return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 };
};

/** Valor actual de un token `--color-*` del <html> (cambia con data-tema). Solo para tokens hex. */
export const colorDeToken = (nombre: string): Rgb => hexARgb(getComputedStyle(document.documentElement).getPropertyValue(nombre));

export const conAlfa = ({ r, g, b }: Rgb, a: number): string => `rgba(${r},${g},${b},${a.toFixed(3)})`;

export const mezcla = (a: Color, b: Color, t: number): string =>
  conAlfa({ r: Math.round(lerp(a.r, b.r, t)), g: Math.round(lerp(a.g, b.g, t)), b: Math.round(lerp(a.b, b.b, t)) }, lerp(a.a, b.a, t));
```

- [x] **Step 5: La grilla cinética lee los tokens y se repinta al cambiar de tema**

En `src/scripts/grilla-cinetica.ts` reemplazar las líneas 1–11 por:

```ts
// Grilla cinética: nodos cada 55 px unidos por líneas; se deforman hacia el puntero (radio 260, fuerza 24)
// y las ondas de cada clic los empujan. Colores desde los tokens del tema activo: la trama con el color del texto,
// los nodos activos y el glow con el acento. Se releen y repintan en `tema:cambio`.
import { colorDeToken, conAlfa, mezcla, type Color, type Rgb } from './lib/color';
const CELDA = 55, RADIO = 260, FUERZA = 24, PUNTOS = 28, SUAVE = 0.35; // SUAVE 0.35: sigue al puntero sin retraso perceptible
let BASE: Color = { r: 255, g: 255, b: 255, a: 0.11 };
let ACTIVA: Color = { r: 104, g: 188, b: 225, a: 0.9 };
let GLOW: Rgb = { r: 104, g: 188, b: 225 };
const releerColores = () => {
  BASE = { ...colorDeToken('--color-texto'), a: 0.11 };
  ACTIVA = { ...colorDeToken('--color-acento'), a: 0.9 };
  GLOW = colorDeToken('--color-acento');
};
const repintar: Array<() => void> = [];
type Onda = { x: number; y: number; radio: number; opacidad: number; nacida: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const suavizar = (t: number) => t * t * (3 - 2 * t);
```

Dentro de `dibujar`, reemplazar la línea 59 (`ctx.fillStyle = 'rgba(255,255,255,0.045)';`) por `ctx.fillStyle = conAlfa(BASE, 0.045);`; en la línea 85 reemplazar `g.addColorStop(0, \`rgba(${GLOW},${(s * 0.3).toFixed(3)})\`); g.addColorStop(1, \`rgba(${GLOW},0)\`);` por `g.addColorStop(0, conAlfa(GLOW, s * 0.3)); g.addColorStop(1, conAlfa(GLOW, 0));`; en la línea 89 reemplazar `ctx.fillStyle = mezcla({ r: 255, g: 255, b: 255, a: 0.2 }, { ...ACTIVA, a: 1 }, s);` por `ctx.fillStyle = mezcla({ ...BASE, a: 0.2 }, { ...ACTIVA, a: 1 }, s);`; en la línea 91 reemplazar `ctx.strokeStyle = \`rgba(${GLOW},${(o.opacidad * 0.28).toFixed(3)})\`;` por `ctx.strokeStyle = conAlfa(GLOW, o.opacidad * 0.28);`. Después de la línea `const medir = () => { … };` (línea 27), agregar `repintar.push(() => dibujar(performance.now()));`. Reemplazar las líneas 113–117 por:

```ts
const iniciar = () => {
  releerColores();
  const interactivo = matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-grilla]:not([data-montada])').forEach((c) => { c.dataset.montada = ''; montar(c, interactivo); });
};
document.addEventListener('astro:page-load', iniciar);
document.addEventListener('tema:cambio', () => { releerColores(); repintar.forEach((f) => f()); });
```

Nota: `mezcla` ya no se define en este archivo (viene de `./lib/color`); borrar la definición local de la línea 10 si quedó.

- [x] **Step 6: `tarjetas.css` con tokens**

Reemplazar todo `src/styles/tarjetas.css` por:

```css
/* Tarjetas con halo en el borde (adaptación propia a la paleta de Covicen).
   Capas, de atrás hacia adelante:
     ::before (z -2)  gradiente cónico de azules desenfocado  → halo SOLO alrededor del borde
     fondo del elemento  el mismo cónico, nítido               → anillo de 1,5 px (el borde)
     ::after (z -1)   interior opaco (tokens tarjeta-interior)  → tapa el interior: nada de brillo sobre el texto
     contenido        en flujo, por encima de todo
   El cónico gira con @property --angulo. Variantes: .tarjeta-vial (amarillo), .tarjeta-hueco, .tarjeta-panel.
   Los halos usan los tokens de MARCA (fijos en los dos temas); el interior y la sombra, semánticos (cambian con el tema). */
@property --angulo { syntax: '<angle>'; initial-value: 0deg; inherits: false; }

@layer components {
  .tarjeta {
    --halo-1: var(--color-marca-300);
    --halo-2: var(--color-marca-700);
    --halo-3: var(--color-acento-hover);
    --halo-4: var(--color-marca-900);
    --halo-5: var(--color-marca-500);
    --halo-opacidad: 0.5;
    --halo-conico: conic-gradient(from var(--angulo), var(--halo-1), var(--halo-2), var(--halo-3), var(--halo-4), var(--halo-5), var(--halo-1));
    --tarjeta-radio: 16px;
    --tarjeta-interior: linear-gradient(180deg, var(--color-tarjeta-interior-1) 0%, var(--color-tarjeta-interior-2) 55%, var(--color-tarjeta-interior-3) 100%);
    position: relative;
    isolation: isolate;
    border: 1.5px solid transparent;
    border-radius: var(--tarjeta-radio);
    background: var(--halo-conico) border-box;
    box-shadow: 0 20px 30px -18px var(--color-sombra);
    animation: halo-girar 9s linear infinite;
    transition: transform var(--dur-ui) var(--ease-salida), box-shadow var(--dur-ui) var(--ease-salida);
  }
  .tarjeta::after {
    content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
    border-radius: calc(var(--tarjeta-radio) - 1.5px);
    background: var(--tarjeta-interior);
  }
  .tarjeta::before {
    content: ""; position: absolute; inset: -4px; z-index: -2; pointer-events: none;
    border-radius: calc(var(--tarjeta-radio) + 4px);
    background: var(--halo-conico);
    filter: blur(12px);
    opacity: var(--halo-opacidad);
    animation: halo-girar 9s linear infinite;
    transition: opacity var(--dur-ui) var(--ease-salida);
  }
  .tarjeta:hover, .tarjeta:focus-visible, .tarjeta:focus-within { animation-duration: 4s; }
  .tarjeta:hover::before, .tarjeta:focus-visible::before, .tarjeta:focus-within::before { animation-duration: 4s; opacity: calc(var(--halo-opacidad) * 1.6); }
  a.tarjeta:hover, a.tarjeta:focus-visible { transform: translateY(-3px); }

  /* Halo amarillo: el vial y sus variantes oscura/clara derivadas con color-mix. Interior levemente cálido. */
  .tarjeta-vial {
    --halo-1: var(--color-vial);
    --halo-2: color-mix(in srgb, var(--color-vial) 75%, black);
    --halo-3: color-mix(in srgb, var(--color-vial) 80%, white);
    --halo-4: color-mix(in srgb, var(--color-vial) 62%, black);
    --halo-5: color-mix(in srgb, var(--color-vial) 92%, black);
    --tarjeta-interior: linear-gradient(180deg, color-mix(in srgb, var(--color-tarjeta-interior-1) 88%, var(--color-vial)) 0%, var(--color-tarjeta-interior-2) 50%, var(--color-tarjeta-interior-3) 100%);
  }

  /* Hueco de capacidad: mismo lenguaje, más apagado y lento. */
  .tarjeta-hueco { --halo-opacidad: 0.28; animation-duration: 16s; }
  .tarjeta-hueco::before { animation-duration: 16s; }

  /* Panel grande para contener secciones enteras: halo más suave y giro más lento. */
  .tarjeta-panel { --halo-opacidad: 0.35; --tarjeta-radio: 24px; padding: clamp(1.25rem, 3vw, 2.5rem); animation-duration: 18s; }
  .tarjeta-panel::before { animation-duration: 18s; filter: blur(18px); }

  /* Caja de ícono */
  .tarjeta-icono { display: inline-flex; align-items: center; justify-content: center; width: 3.25rem; height: 3.25rem; border-radius: 12px; border: 1px solid color-mix(in srgb, var(--color-acento) 30%, transparent); background: color-mix(in srgb, var(--color-superficie-2) 50%, transparent); color: var(--color-acento); }
  .tarjeta-vial .tarjeta-icono { border-color: color-mix(in srgb, var(--color-vial) 35%, transparent); background: color-mix(in srgb, var(--color-vial) 12%, transparent); color: var(--color-vial-texto); }

  @keyframes halo-girar { to { --angulo: 360deg; } }

  /* En táctil el halo queda quieto (sin repintado constante); con reduced-motion, todo quieto. */
  @media (hover: none) { .tarjeta::before { animation: none; } }
  @media (prefers-reduced-motion: reduce) { .tarjeta, .tarjeta::before { animation: none; } }
}
```

- [x] **Step 7: `global.css`: grilla, costura, y el `.btn-vial` global (una sola definición)**

En `src/styles/global.css`:
- Líneas 49–50: reemplazar los dos `rgb(255 255 255 / 0.04)` por `var(--color-plano)`.
- Líneas 60–61: reemplazar los dos `#000` por `black` (es una máscara: opaco/transparente, no un color de marca).
- Línea 64: reemplazar `rgb(104 188 225 / 0.55)` por `color-mix(in srgb, var(--color-acento) 55%, transparent)`.
- Línea 71: reemplazar `rgb(104 188 225 / 0.07)` por `var(--color-luz)`.
- Al final de `@layer components` (antes del `}` de la línea 89), agregar:

```css
  /* Botón de señalética (amarillo vial): header, barra inferior y <Boton variante="vial">. ÚNICA definición. */
  .btn-vial {
    display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border-radius: var(--radius-md);
    background: var(--color-vial); color: var(--color-sobre-vial); font-weight: 600; text-decoration: none;
    transition: box-shadow var(--dur-ui) var(--ease-salida), transform var(--dur-ui) var(--ease-salida);
  }
  .btn-vial:hover { box-shadow: 0 8px 24px -6px color-mix(in srgb, var(--color-vial) 45%, transparent); transform: translateY(-1px); }
  .btn-vial:hover .telefono { animation: oscilar 0.5s var(--ease-suave) 1; }
  .btn-vial:focus-visible { outline-color: var(--color-vial); }
  @keyframes oscilar { 25% { transform: rotate(-12deg); } 75% { transform: rotate(12deg); } }
```

- [x] **Step 8: `Boton.astro`, `Header.astro`, `Hero.astro`, `TarifaDestacada.astro`, `Base.astro`, `BarraEmergencias.astro`**

`src/components/ui/Boton.astro`, reemplazar las líneas 39–63 por:

```css
  /* Primario: gradiente azul de marca con luz interior, puntos que flotan y flecha que se dibuja en hover. */
  .btn-primario {
    overflow: hidden; color: var(--color-sobre-acento);
    background: linear-gradient(135deg, var(--color-marca-700) 0%, var(--color-marca-900) 100%);
    box-shadow: inset 0 1px 0 color-mix(in srgb, white 18%, transparent), 0 10px 24px -12px var(--color-glow);
  }
  .btn-primario::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background: linear-gradient(135deg, color-mix(in srgb, var(--color-marca-300) 28%, transparent), transparent 60%); }
  .btn-primario:hover, .btn-primario:focus-visible { transform: translateY(-1px); background: linear-gradient(135deg, color-mix(in srgb, var(--color-marca-700) 80%, var(--color-marca-300)) 0%, color-mix(in srgb, var(--color-marca-900) 85%, var(--color-marca-700)) 100%); box-shadow: inset 0 1px 0 color-mix(in srgb, white 22%, transparent), 0 14px 30px -12px var(--color-glow); }
  .btn-puntos { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
  .btn-puntos i {
    position: absolute; bottom: -4px; left: calc(5% + var(--i) * 9.5%); width: 3px; height: 3px; border-radius: 50%;
    background: var(--color-sobre-acento); opacity: 0;
    animation: puntos-flotan calc(2.4s + var(--i) * 0.22s) linear infinite;
    animation-delay: calc(var(--i) * -0.45s);
  }
  .btn-puntos i:nth-child(odd) { width: 2px; height: 2px; background: var(--color-marca-300); }
  @keyframes puntos-flotan { 0% { transform: translateY(0); opacity: 0; } 12% { opacity: 0.9; } 85% { opacity: 0; } 100% { transform: translateY(-55px); opacity: 0; } }
  .btn-primario:hover :global(svg path) { stroke-dasharray: 20; animation: flecha-dibujar 0.7s ease forwards; }
  @keyframes flecha-dibujar { 0% { stroke-dasharray: 0 20; stroke-dashoffset: 0; } 50% { stroke-dasharray: 10 10; stroke-dashoffset: -5; } 100% { stroke-dasharray: 20 0; stroke-dashoffset: -10; } }

  .btn-secundario { border: 1px solid var(--color-borde); color: var(--color-texto); background: transparent; }
  .btn-secundario:hover { border-color: var(--color-borde-fuerte); background: var(--color-superficie); }
  /* .btn-vial vive en global.css (una sola definición para header, barra y botón). */
```

El botón primario en claro: el texto blanco (`sobre-acento` claro) sobre el degradé navy de marca da 6:1 o más.

`src/components/Header.astro`:
- Líneas 96 y 100: reemplazar `rgb(16 32 58 / 0.85)` por `var(--color-cabecera)`.
- Borrar las líneas 121–129 (el bloque `.btn-vial` … `@keyframes oscilar`): ahora es global.
- Línea 138: reemplazar `rgb(11 21 38 / 0.6)` por `color-mix(in srgb, var(--color-fondo) 60%, transparent)`.

`src/components/home/Hero.astro` línea 49: reemplazar `rgb(104 188 225 / 0.09)` por `var(--color-luz)`.

`src/components/home/TarifaDestacada.astro`:
- Línea 88: `.flip-cta:hover { transform: scale(1.02); background: linear-gradient(90deg, color-mix(in srgb, var(--color-acento) 18%, transparent), color-mix(in srgb, var(--color-acento) 6%, transparent), transparent); border-color: color-mix(in srgb, var(--color-acento) 30%, transparent); }`
- Línea 89: reemplazar `rgb(104 188 225 / 0.25)` por `color-mix(in srgb, var(--color-acento) 25%, transparent)`.

`src/layouts/Base.astro` línea 54: reemplazar `color: var(--color-fondo)` por `color: var(--color-sobre-vial)`.

`src/components/BarraEmergencias.astro`: no tiene colores fijos; queda para la 0.5.

- [x] **Step 9: `MapaTramo.astro` y `HeroRuta.astro` (SVG con tokens)**

`src/components/ilustraciones/MapaTramo.astro`: línea 28, `stroke="rgb(255 255 255 / 0.05)"` → `stroke="var(--color-plano)"`; línea 40, `stroke="#E8EEF5"` → `stroke="var(--color-texto)"`.

`src/components/ilustraciones/HeroRuta.astro` (los atributos de presentación aceptan `var()` en los navegadores actuales, y el archivo ya lo hace en MapaTramo):
- Línea 28: los dos `stop-color="#16304E"` → `stop-color="var(--color-superficie)"`.
- Línea 29: los dos `stop-color="#68BCE1"` → `stop-color="var(--color-acento)"`.
- Línea 30: los dos `stop-color="#68BCE1"` → `stop-color="var(--color-acento)"`.
- Línea 37: `stroke="rgb(255 255 255 / 0.06)"` → `stroke="var(--color-plano)"`.
- Líneas 44, 45, 47, 48, 49, 50, 60, 65, 66: `#E8EEF5` → `var(--color-texto)`.
- Líneas 46 y 59: `#F0C419` → `var(--color-vial)`.
- Líneas 51, 52, 62, 63: `#FF8A80` → `var(--color-error)`.

- [x] **Step 10: Presupuesto y tests**

En `tests/presupuesto.test.ts` línea 7 agregar `'src/scripts/lib/color.ts'` a `todos`.

Run: `pnpm vitest run tests/styles/colores-fijos.test.ts tests/scripts/color.test.ts tests/presupuesto.test.ts`
Expected: PASS (si `colores-fijos` lista algún archivo, la salida dice archivo y línea: migrarlo al token que corresponda y volver a correr).

- [x] **Step 11: Verificación visual de los dos temas**

Run: `pnpm dev`. Recorrer `/`, `/tarifas/`, `/el-tramo/`, `/emergencias/`, `/contacto/` en oscuro (debe verse idéntico a antes) y en claro (tarjetas blancas, header gris claro al scrollear, botones navy con texto blanco, grilla cinética con trama navy). Cerrar.

- [x] **Step 12: Suite completa y commit**

Run: `pnpm check && pnpm test`
Expected: PASS.

```bash
git add tests/styles/colores-fijos.test.ts src/scripts/lib/color.ts tests/scripts/color.test.ts src/styles/tarjetas.css src/styles/global.css src/components/ui/Boton.astro src/components/Header.astro src/components/home/Hero.astro src/components/home/TarifaDestacada.astro src/components/ilustraciones/MapaTramo.astro src/components/ilustraciones/HeroRuta.astro src/layouts/Base.astro src/scripts/grilla-cinetica.ts tests/presupuesto.test.ts
git commit -m "refactor(tema): todos los colores salen de los tokens; btn-vial único; la grilla lee el tema"
```

### Tarea 0.4: Fotos por tema y hero con versión de día

**Files:**
- Modify: `src/lib/atmosfera.ts`
- Modify: `src/components/home/Hero.astro:9,14-26`
- Modify: `src/components/ilustraciones/ParallaxProfundidad.astro:7-8,17-18,24`
- Modify: `src/components/ilustraciones/ImagenAtmosfera.astro:5-6,10,13`
- Modify: `src/components/home/Consorcio.astro:16`
- Modify: `src/scripts/parallax-2d.ts:131-136`
- Modify: `src/styles/global.css` (regla `.solo-oscuro`/`.solo-claro`)
- Create: `tests/lib/atmosfera.test.ts`

**Interfaces:**
- Produces: `variantesHero(hayNoche: boolean, hayDia: boolean, porDefecto?: PreferenciaTema): VarianteHero[]` con `VarianteHero = { nombre: string; clase: '' | 'solo-oscuro' | 'solo-claro'; prioridad: boolean }`. Clases globales `.solo-oscuro` y `.solo-claro`. Prop `prioridad?: boolean` en `ParallaxProfundidad`. La prop `brillo` de `ParallaxProfundidad` e `ImagenAtmosfera` pasa a ser opcional sin default (usa `--brillo-foto`).

- [x] **Step 1: Test de `variantesHero`**

Crear `tests/lib/atmosfera.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { variantesHero } from '@/lib/atmosfera';

describe('variantesHero', () => {
  it('sin foto nocturna no hay fotos (cae al vector)', () => {
    expect(variantesHero(false, true)).toEqual([]);
  });
  it('solo nocturna: una sola foto, visible en los dos temas y con prioridad', () => {
    expect(variantesHero(true, false)).toEqual([{ nombre: 'hero-ruta-nocturna', clase: '', prioridad: true }]);
  });
  it('con foto de día: una por tema; la del tema por defecto carga primero', () => {
    expect(variantesHero(true, true, 'oscuro')).toEqual([
      { nombre: 'hero-ruta-nocturna', clase: 'solo-oscuro', prioridad: true },
      { nombre: 'hero-ruta-diurna', clase: 'solo-claro', prioridad: false },
    ]);
    expect(variantesHero(true, true, 'claro').find((v) => v.nombre === 'hero-ruta-diurna')?.prioridad).toBe(true);
    expect(variantesHero(true, true, 'sistema').find((v) => v.nombre === 'hero-ruta-nocturna')?.prioridad).toBe(true);
  });
});
```

- [x] **Step 2: Correr y ver que falla**

Run: `pnpm vitest run tests/lib/atmosfera.test.ts`
Expected: FAIL — `variantesHero` no existe.

- [x] **Step 3: Implementar en `src/lib/atmosfera.ts`**

Agregar al final del archivo:

```ts
import { TEMA_POR_DEFECTO, type PreferenciaTema } from '@/lib/tema';

export type VarianteHero = { nombre: string; clase: '' | 'solo-oscuro' | 'solo-claro'; prioridad: boolean };

/** Qué fotos renderiza el hero: ninguna (vector), una sola si no hay versión de día, o una por tema si la hay.
 *  La del tema por defecto carga con prioridad; la otra, lazy y oculta hasta que el usuario cambie de tema. */
export const variantesHero = (hayNoche: boolean, hayDia: boolean, porDefecto: PreferenciaTema = TEMA_POR_DEFECTO): VarianteHero[] => {
  if (!hayNoche) return [];
  if (!hayDia) return [{ nombre: 'hero-ruta-nocturna', clase: '', prioridad: true }];
  const claroPrimero = porDefecto === 'claro';
  return [
    { nombre: 'hero-ruta-nocturna', clase: 'solo-oscuro', prioridad: !claroPrimero },
    { nombre: 'hero-ruta-diurna', clase: 'solo-claro', prioridad: claroPrimero },
  ];
};
```

(Mover el `import` junto a los demás imports del archivo, arriba de `const todas`.)

- [x] **Step 4: Hero con una foto por tema**

En `src/components/home/Hero.astro`: línea 9 → `import { imagenAtmosfera, variantesHero } from '@/lib/atmosfera';`. Reemplazar las líneas 14–16 por:

```ts
// Con foto: parallax 2.5D con mapa de profundidad (WebGL en desktop; en mobile, la foto con un dolly lento). Si existe
// hero-ruta-diurna.jpg hay una foto por tema (mismo encuadre: el mapa de profundidad es procedural y sirve para las dos).
// Sin foto: la calzada vectorial en perspectiva.
const fotos = variantesHero(imagenAtmosfera('hero-ruta-nocturna') !== undefined, imagenAtmosfera('hero-ruta-diurna') !== undefined);
const hayFoto = fotos.length > 0;
```

y las líneas 19–25 por:

```astro
  {hayFoto ? fotos.map((f) => (
    <div class:list={['parallax absolute inset-0 -z-20', f.clase]} aria-hidden="true">
      <ParallaxProfundidad nombre={f.nombre} profundidad="hero-ruta-nocturna.profundidad" vp={[0.78, 0.595]} prioridad={f.prioridad} />
    </div>
  )) : (
    <HeroRuta class="-z-10 parallax" />
  )}
```

- [x] **Step 5: `ParallaxProfundidad` e `ImagenAtmosfera` con brillo del tema y prioridad**

`src/components/ilustraciones/ParallaxProfundidad.astro`:
- Líneas 7–8 → `interface Props { nombre: string; profundidad: string; alt?: string; brillo?: number; vp?: [number, number]; prioridad?: boolean }` y `const { nombre, profundidad, alt = '', brillo, vp = [0.78, 0.595], prioridad = true } = Astro.props;`
- Línea 17: reemplazar `style={\`--brillo: ${brillo}; --vpx: …\`}` por `style={\`${brillo !== undefined ? \`--brillo: ${brillo}; \` : ''}--vpx: ${vp[0] * 100}%; --vpy: ${vp[1] * 100}%\`}`.
- Línea 18: reemplazar `loading="eager" fetchpriority="high"` por `loading={prioridad ? 'eager' : 'lazy'} fetchpriority={prioridad ? 'high' : undefined}`.
- Línea 24: `filter: saturate(0.85) brightness(var(--brillo, var(--brillo-foto)));`

`src/components/ilustraciones/ImagenAtmosfera.astro`:
- Líneas 5–6: `brillo?: number` sin default (`const { …, brillo } = Astro.props;`).
- Línea 10: `style={brillo !== undefined ? \`--brillo: ${brillo}\` : undefined}`.
- Línea 13: `filter: saturate(0.85) brightness(var(--brillo, var(--brillo-foto)));`

`src/components/home/Consorcio.astro` línea 16: quitar `brillo={0.5}` (el velo `from-fondo` ya asegura la legibilidad y en claro no queda una foto negra).

- [x] **Step 6: Reglas `.solo-oscuro` / `.solo-claro` y parallax remontable**

En `src/styles/global.css`, después del bloque `@layer base { … }` (línea 42) y antes de `@layer components`, agregar (sin layer):

```css
/* Piezas exclusivas de un tema: el hero tiene una foto por tema. Un elemento sin caja no carga su <img loading="lazy">. */
html[data-tema="claro"] .solo-oscuro, html:not([data-tema="claro"]) .solo-claro { display: none; }
```

En `src/scripts/parallax-2d.ts`, reemplazar las líneas 131–136 por:

```ts
const iniciarTodo = () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (min-width: 64rem)').matches) return;
  // Lo oculto por el tema (display: none) no se monta; al cambiar de tema se vuelve a pasar por acá y se monta lo visible.
  document.querySelectorAll<HTMLElement>('[data-parallax]:not([data-montado])').forEach((r) => {
    if (r.getClientRects().length === 0) return;
    r.dataset.montado = '';
    montar(r);
  });
};
document.addEventListener('astro:page-load', iniciarTodo);
document.addEventListener('tema:cambio', iniciarTodo);
```

- [x] **Step 7: Tests y prueba manual**

Run: `pnpm vitest run tests/lib/atmosfera.test.ts tests/components/home.test.ts tests/presupuesto.test.ts`
Expected: PASS.

Run: `pnpm dev`. En `/`: oscuro igual que antes; claro → la foto nocturna sin oscurecer con el velo claro (hasta que exista `hero-ruta-diurna.jpg`). Copiar temporalmente `src/assets/atmosfera/hero-ruta-nocturna.jpg` como `hero-ruta-diurna.jpg`, recargar: en claro el parallax se monta al cambiar de tema (canvas visible, `.activo`), en oscuro sigue el original. **Borrar la copia** antes de seguir. Cerrar.

- [x] **Step 8: Commit**

```bash
git add src/lib/atmosfera.ts src/components/home/Hero.astro src/components/ilustraciones/ParallaxProfundidad.astro src/components/ilustraciones/ImagenAtmosfera.astro src/components/home/Consorcio.astro src/scripts/parallax-2d.ts src/styles/global.css tests/lib/atmosfera.test.ts
git commit -m "feat(tema): brillo de fotos por tema y hero con foto de día cuando exista"
```

### Tarea 0.5: Semántica de color invertida, bug de Emergencias y auditoría de `texto-3`

**Files:**
- Create: `tests/styles/semantica.test.ts`
- Modify: `src/components/ui/Senal.astro:5`, `src/components/BarraEmergencias.astro:10,14-15`, `src/components/Formulario.astro:30,44`, `src/pages/emergencias.astro:19-26`, `src/components/ilustraciones/MapaTramo.astro:70,79`, `src/components/home/TarifaDestacada.astro:40,63`, `src/components/home/AccesosRapidos.astro:22`

- [x] **Step 1: Guarda de semántica**

Crear `tests/styles/semantica.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listar = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? listar(p) : [p]; });
const archivos = ['src/components', 'src/pages', 'src/layouts'].flatMap(listar).map((p) => p.replace(/\\/g, '/')).filter((p) => p.endsWith('.astro'));
// `text-fondo` sobre amarillo/acento se vuelve invisible en claro: el texto encima de vial es sobre-vial, encima de acento es sobre-acento.
// `text-vial` como color de texto no llega a 4.5:1 en claro: el amarillo como texto es vial-texto.
const prohibido = /\btext-fondo(?:-2)?(?:\/\d+)?\b|\btext-vial(?!-texto)\b/;

describe('semántica de color', () => {
  it.each(archivos)('%s no usa text-fondo ni text-vial como color de texto', (archivo) => {
    const culpables = readFileSync(archivo, 'utf8').split('\n').map((l, i) => (prohibido.test(l) ? `${i + 1}: ${l.trim()}` : null)).filter(Boolean);
    expect(culpables, culpables.join('\n')).toEqual([]);
  });
});
```

- [x] **Step 2: Correr y ver que falla**

Run: `pnpm vitest run tests/styles/semantica.test.ts`
Expected: FAIL en Senal, BarraEmergencias, Formulario, emergencias, MapaTramo.

- [x] **Step 3: Corregir cada uso**

- `src/components/ui/Senal.astro` línea 5: `'bg-vial text-fondo'` → `'bg-vial text-sobre-vial'`.
- `src/components/BarraEmergencias.astro`: línea 10 `text-fondo` → `text-sobre-vial`; línea 14 `text-fondo` → `text-sobre-vial`.
- `src/components/Formulario.astro`: línea 30 `text-vial` → `text-vial-texto`; línea 44 `text-fondo` → `text-sobre-acento`.
- `src/pages/emergencias.astro` (bug vigente: texto navy sobre tarjeta navy), reemplazar las líneas 19–27 por:

```astro
    <div class="revelar tarjeta tarjeta-vial p-8">
      <p class="eyebrow">{contacto.emergencias.etiqueta} · 24 horas</p>
      {tel ? (
        <a href={`tel:${tel.replace(/[^\d+]/g, '')}`} class="mt-3 inline-flex items-center gap-4 font-extrabold tabular-nums text-vial-texto no-underline" style="font-size: clamp(2.5rem, 2rem + 4vw, 5rem)"><Phone size={40} aria-hidden="true" /> {tel}</a>
      ) : (
        <p class="mt-3 font-extrabold text-texto" style="font-size: clamp(1.75rem, 1.25rem + 2vw, 3rem)" data-emergencias="a-confirmar">Número a confirmar antes del inicio de la operación.</p>
      )}
      <p class="mt-4 max-w-prose text-texto-2">Auxilio mecánico, asistencia en accidentes, animales u objetos en la calzada. {contacto.whatsapp.numero && <a href={enlaceWhatsapp(contacto.whatsapp.numero, 'EMERGENCIA en ruta. Ruta: / Km: / Sentido: ')} class="inline-flex items-center gap-1 font-semibold text-texto underline" target="_blank" rel="noopener"><MessageCircle size={16} aria-hidden="true" /> También por WhatsApp</a>}</p>
    </div>
```

- `src/components/ilustraciones/MapaTramo.astro`: línea 70 `text-vial` → `text-vial-texto`; línea 79 `fill: var(--color-vial)` → `fill: var(--color-vial-texto)` (la etiqueta es texto; las balizas siguen con `--color-vial`).
- `src/components/home/TarifaDestacada.astro`: líneas 40 y 63, `text-texto-3` → `text-texto-2` (están dentro de `.tarjeta`, cuyo interior arranca en `superficie`; `texto-3` no llega a 4.5 ahí).
- `src/components/home/AccesosRapidos.astro` línea 22: `a.vial && 'text-vial'` → `a.vial && 'text-vial-texto'`.

- [x] **Step 4: Tests y verificación visual de `/emergencias/`**

Run: `pnpm vitest run tests/styles/semantica.test.ts tests/components`
Expected: PASS.

Run: `pnpm dev`, abrir `/emergencias/`: el bloque amarillo ahora es una tarjeta con halo vial, texto legible en los dos temas. Cerrar.

- [x] **Step 5: Commit**

```bash
git add tests/styles/semantica.test.ts src/components/ui/Senal.astro src/components/BarraEmergencias.astro src/components/Formulario.astro src/pages/emergencias.astro src/components/ilustraciones/MapaTramo.astro src/components/home/TarifaDestacada.astro src/components/home/AccesosRapidos.astro
git commit -m "fix(tema): texto sobre amarillo y acento con sus tokens; tarjeta de emergencias legible"
```

### Tarea 0.6: Cierre de la Fase 0

- [x] **Step 1: Todo en verde**

Run: `pnpm check && pnpm test && pnpm verificar`
Expected: `astro check` sin errores; vitest todo PASS; `verificar` termina con `OK: N páginas verificadas, 0 fallos.` (incluye contraste de los dos temas y presupuesto de JS ≤ 30 KB).

- [x] **Step 2: Revisión en carril separado**

Dispatch de `rev-bro` con: la spec (§4), este plan (Fase 0), `git diff <commit anterior a la fase>..HEAD`, y la instrucción de correr él mismo `pnpm check && pnpm test && pnpm verificar`. Atender los hallazgos; volver a correr.

- [x] **Step 3: Vault**

En `obsidian/Sistema de diseno.md` agregar la sección "Tema claro (2026-09-13)": mecanismo `data-tema`, tokens nuevos y sus valores, `TEMA_POR_DEFECTO`, regla de no colores fijos. En `obsidian/Home.md`, línea de estado: "Fase 0 (tema y tokens) cerrada".

- [x] **Step 4: Commit (si no se hizo por tarea)**

```bash
git add -A -- src scripts tests obsidian
git commit -m "feat(tema): Fase 0 completa — tema claro/oscuro con interruptor y tokens verificados"
```

## Fase 1 — Marca, datos oficiales, header de dos filas, anuncios y footer

Resultado: el sitio dice 679 km y los extremos oficiales, muestra el 140 en todo lado, no dice "Corredor Vial del Centro" ni "a confirmar" en ninguna página, tiene la barra superior con anuncios y accesos (TelePASE, Mi cuenta, tema) y el footer con logos institucionales y "Última actualización".

### Tarea 1.1: Contrato — campos nuevos opcionales, contacto ampliado y exportación

**Files:**
- Modify: `src/lib/datos/esquemas.ts` (Empresa, Contacto, Ruta, Ciudad, Cabina, Tarifa, Tarifario)
- Modify: `tests/lib/datos/esquemas.test.ts`, `tests/lib/contrato.test.ts`
- Regenerate: `docs/contrato/tramo.schema.json`, `docs/contrato/tarifario.schema.json` (`pnpm contrato`)

**Interfaces:**
- Produces (tipos exportados desde `@/lib/datos/esquemas`): `Empresa` sin `descriptor`, con `domicilioComercial: string | null` y `constanciaUrl: string | null`; `Contacto.emergencias.telefono: string` (ya no nulo), `Contacto.lineaGratuita: string | null`, `Contacto.atencionUsuario: string | null`, `Contacto.enlaces: { telepase: string; oficinaVirtual: string | null; atencionDnv: string | null }`, `Contacto.canales: Canal[]`, `Contacto.redes` con `facebook?` y `youtube?`; `Canal = { id, nombre, tipo: 'telefono'|'web'|'correo'|'whatsapp'|'presencial', valor: string | null, disponibilidad, acuse, respuesta, fuente }`; `Ruta.pkInicial?`, `Ruta.pkFinal?`; `Ciudad.tipo?: 'ciudad' | 'empalme'`; `Cabina.vias?`, `Cabina.operativa?`, `Cabina.sentido?`, `Cabina.telefono?`, `Cabina.horarioAtencion?`, `Cabina.servicios?: { areaDescanso?, detencionSegura?, gruaGratuita?, sanitarios?, colocacionTelepase? }`; `Tarifa.montoManualSinIva?: number | null`, `Tarifa.multiplicador?`; `Tarifario.origen: 'oferta' | 'homologada' | 'heredado'`, `Tarifario.resolucion?`, `Tarifario.cabinas?: string[]`, `Tarifario.categoriaDestacada?`, `Tarifario.excepciones?: { cabina, categoria, montoSinIva: number | null, montoManualSinIva?: number | null }[]`. Helper `cabinaOperativa(c: Cabina): boolean`.

- [x] **Step 1: Tests del contrato**

En `tests/lib/datos/esquemas.test.ts` reemplazar el `describe('esquemaCabina', …)` (líneas 27–36) y el `describe('esquemaContacto', …)` (38–46) y el `describe('esquemaEmpresa', …)` (48–57) por:

```ts
describe('esquemaCabina', () => {
  const base = { slug: 'totoras', nombre: 'Totoras', ruta: 'RN 34', km: 60, localidad: 'Totoras', provincia: 'Santa Fe', situacion: 'nueva', estado: 'confirmada', mapa: { x: 1, y: 2 } };
  it('exige slug, ruta conocida y estado', () => {
    expect(() => esquemaCabina.parse(base)).not.toThrow();
    expect(() => esquemaCabina.parse({ ...base, ruta: 'RN 7' })).toThrow();
  });
  it('admite vías, operativa, sentido, teléfono, horario y servicios, todos opcionales', () => {
    const c = esquemaCabina.parse({ ...base, vias: 10, operativa: true, sentido: 'ambos', telefono: '0341 000000', horarioAtencion: 'Lunes a viernes de 8 a 20', servicios: { areaDescanso: true, colocacionTelepase: true } });
    expect(c.vias).toBe(10);
    expect(c.servicios?.areaDescanso).toBe(true);
    expect(c.servicios?.detencionSegura).toBeUndefined();
  });
  it('cabinaOperativa: explícito si está, si no deriva de la situación', () => {
    expect(cabinaOperativa(esquemaCabina.parse(base))).toBe(false);
    expect(cabinaOperativa(esquemaCabina.parse({ ...base, situacion: 'existente' }))).toBe(true);
    expect(cabinaOperativa(esquemaCabina.parse({ ...base, situacion: 'existente', operativa: false }))).toBe(false);
  });
});

describe('esquemaContacto', () => {
  const vacio = {
    emergencias: { telefono: '140', etiqueta: 'Emergencias' }, lineaGratuita: null, atencionUsuario: null, whatsapp: { numero: null },
    email: { general: null, rrhh: null, proveedores: null, etica: null }, redes: {},
    enlaces: { telepase: 'https://www.telepase.com.ar/', oficinaVirtual: null, atencionDnv: null },
    canales: [{ id: 'emergencias-140', nombre: 'Emergencias 140', tipo: 'telefono', valor: '140', disponibilidad: '24 horas, los 365 días', acuse: 'Inmediato', respuesta: 'Inmediata', fuente: 'PETG art. 58 y 59' }],
  };
  it('admite los canales comerciales en null, pero el 140 es obligatorio', () => {
    expect(esquemaContacto.parse(vacio).whatsapp.numero).toBeNull();
    expect(() => esquemaContacto.parse({ ...vacio, emergencias: { telefono: null, etiqueta: 'Emergencias' } })).toThrow();
  });
  it('rechaza un WhatsApp con signos (debe ser E.164 sin +) y un canal con tipo desconocido', () => {
    expect(() => esquemaContacto.parse({ ...vacio, whatsapp: { numero: '+54 9 351' } })).toThrow();
    expect(() => esquemaContacto.parse({ ...vacio, canales: [{ ...vacio.canales[0], tipo: 'fax' }] })).toThrow();
  });
});

describe('esquemaEmpresa', () => {
  const base = {
    marca: 'Covicen', razonSocial: null, cuit: null, domicilioLegal: null, domicilioComercial: null, constanciaUrl: null, enFormacion: true,
    consorcio: [{ nombre: 'AFEMA S.A.', descripcion: 'Constructora vial.' }],
    concesion: { tramo: 'Centro', km: 679.03, rutas: ['RN 9'], provincias: ['Córdoba'], plazoAnios: 20, prorrogaAnios: 10, inicioOperacion: '2026-10-05', adjudicacion: { fecha: '2026-08-24', resolucion: 'R', url: 'https://x' }, tarifaOfertadaSinIva: 1399, tarifaTopeSinIva: 3200, tramosEtapa: 8 },
  };
  it('exige consorcio no vacío y ya no acepta descriptor', () => {
    expect(() => esquemaEmpresa.parse({ ...base, consorcio: [] })).toThrow();
    expect(esquemaEmpresa.parse(base)).not.toHaveProperty('descriptor');
  });
});

describe('esquemaRuta y esquemaCiudad', () => {
  it('admiten progresivas y tipo de nodo, opcionales', () => {
    expect(esquemaRuta.parse({ nombre: 'RN 34', descripcion: 'x', desde: 'a', hasta: 'b', km: 188.68, pkInicial: 0, pkFinal: 188.68 }).pkFinal).toBe(188.68);
    expect(esquemaCiudad.parse({ slug: 'empalme-rn-19', nombre: 'Empalme RN 19', provincia: 'Santa Fe', mapa: { x: 1, y: 1 }, tipo: 'empalme' }).tipo).toBe('empalme');
    expect(esquemaCiudad.parse({ slug: 'rosario', nombre: 'Rosario', provincia: 'Santa Fe', mapa: { x: 1, y: 1 } }).tipo).toBe('ciudad');
  });
});
```

Cambiar el import de la línea 2 por `import { cabinaOperativa, esquemaCabina, esquemaCiudad, esquemaContacto, esquemaEmpresa, esquemaRuta, esquemaTarifario } from '@/lib/datos/esquemas';`. En el `describe('esquemaTarifario', …)` agregar:

```ts
  it('admite origen heredado, resolución, cabinas, excepciones y monto manual, todos opcionales salvo origen', () => {
    const t = esquemaTarifario.parse({
      ...base, origen: 'heredado', resolucion: 'Resolución 248/2026 de la DNV', cabinas: ['carcarana', 'james-craik', 'franck'], categoriaDestacada: 'cat-1',
      tarifas: [{ ...base.tarifas[0], montoManualSinIva: 1239.67, multiplicador: 1 }],
      excepciones: [{ cabina: 'franck', categoria: 'cat-2', montoSinIva: 2000, montoManualSinIva: null }],
    });
    expect(t.origen).toBe('heredado');
    expect(t.excepciones?.[0]?.cabina).toBe('franck');
    expect(() => esquemaTarifario.parse({ ...base, origen: 'inventado' })).toThrow();
  });
```

En `tests/lib/contrato.test.ts`, agregar al final del `describe`:

```ts
  it('los campos nuevos del tramo y del tarifario son opcionales (el backend no está obligado a mandarlos)', () => {
    const { tramo, tarifario } = exportarContrato() as {
      tramo: { properties: { cabinas: { items: { required: string[]; properties: Record<string, unknown> } }; rutas: { items: { required: string[]; properties: Record<string, unknown> } } } };
      tarifario: { required: string[]; properties: Record<string, unknown> & { tarifas: { items: { required: string[]; properties: Record<string, unknown> } }; origen: { enum: string[] } } };
    };
    for (const campo of ['vias', 'operativa', 'sentido', 'telefono', 'horarioAtencion', 'servicios']) {
      expect(tramo.properties.cabinas.items.properties).toHaveProperty(campo);
      expect(tramo.properties.cabinas.items.required).not.toContain(campo);
    }
    for (const campo of ['pkInicial', 'pkFinal']) expect(tramo.properties.rutas.items.required).not.toContain(campo);
    for (const campo of ['resolucion', 'cabinas', 'categoriaDestacada', 'excepciones']) {
      expect(tarifario.properties).toHaveProperty(campo);
      expect(tarifario.required).not.toContain(campo);
    }
    expect(tarifario.properties.tarifas.items.required).not.toContain('montoManualSinIva');
    expect(tarifario.properties.origen.enum).toEqual(['oferta', 'homologada', 'heredado']);
  });
```

- [x] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/lib/datos/esquemas.test.ts tests/lib/contrato.test.ts`
Expected: FAIL (`cabinaOperativa` no existe; `descriptor` sigue siendo obligatorio; `lineaGratuita` desconocido, etc.).

- [x] **Step 3: Cambiar `src/lib/datos/esquemas.ts`**

Reemplazar `esquemaEmpresa` (líneas 13–34) por:

```ts
export const esquemaEmpresa = z.object({
  marca: z.literal('Covicen'),
  razonSocial: z.string().min(1).nullable(),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d$/).nullable(),
  domicilioLegal: z.string().min(1).nullable(),
  /** El pliego (PETG 61.6) pide legal Y comercial. */
  domicilioComercial: z.string().min(1).nullable(),
  /** Adónde lleva el QR de Data Fiscal (constancia de inscripción). */
  constanciaUrl: url.nullable(),
  enFormacion: z.boolean(),
  consorcio: z.array(z.object({ nombre: z.string().min(1), descripcion: z.string().min(1) })).min(1),
  concesion: z.object({
    tramo: z.literal('Centro'),
    km: z.number().positive(),
    rutas: z.array(esquemaNombreRuta).min(1),
    provincias: z.array(z.string().min(1)).min(1),
    plazoAnios: z.number().int().positive(),
    prorrogaAnios: z.number().int().nonnegative(),
    inicioOperacion: fechaIso,
    adjudicacion: z.object({ fecha: fechaIso, resolucion: z.string().min(1), url }),
    /** Tarifa ofertada en la adjudicación. Es un dato histórico para explicar cómo se fija la tarifa; NO es el precio vigente. */
    tarifaOfertadaSinIva: z.number().positive(),
    tarifaTopeSinIva: z.number().positive(),
    tramosEtapa: z.number().int().positive(),
  }),
});
```

Reemplazar `esquemaContacto` (líneas 37–49) por:

```ts
/** Un canal de atención con los plazos del pliego (PETG 58). `valor` null = existe por pliego, todavía no habilitado. */
export const esquemaCanal = z.object({
  id: slug,
  nombre: z.string().min(1),
  tipo: z.enum(['telefono', 'web', 'correo', 'whatsapp', 'presencial']),
  valor: z.string().min(1).nullable(),
  disponibilidad: z.string().min(1),
  acuse: z.string().min(1),
  respuesta: z.string().min(1),
  fuente: z.string().min(1),
});
export type Canal = z.infer<typeof esquemaCanal>;

export const esquemaContacto = z.object({
  /** Número corto de emergencia (PETG 59): obligatorio. */
  emergencias: z.object({ telefono: z.string().regex(/^[0-9+\- ]{3,20}$/), etiqueta: z.string().min(1) }),
  /** Línea gratuita 0800 (PETG 61.1). */
  lineaGratuita: z.string().regex(/^[0-9+\- ]{6,20}$/).nullable(),
  /** atencionalusuario@covicen.com.ar (PETG 61.5). Se publica cuando la casilla funcione. */
  atencionUsuario: z.email().nullable(),
  /** E.164 sin '+', ej. 5493510000000 → wa.me/5493510000000 */
  whatsapp: z.object({ numero: z.string().regex(/^\d{10,15}$/).nullable() }),
  email: z.object({
    general: z.email().nullable(),
    rrhh: z.email().nullable(),
    proveedores: z.email().nullable(),
    etica: z.email().nullable(),
  }),
  redes: z.object({ instagram: url.optional(), x: url.optional(), linkedin: url.optional(), facebook: url.optional(), youtube: url.optional() }),
  /** oficinaVirtual: Telepeaje Plus, cuando exista. atencionDnv: canales de atención al usuario de la DNV (PETG 61.6), cuando indiquen la URL. */
  enlaces: z.object({ telepase: url, oficinaVirtual: url.nullable(), atencionDnv: url.nullable() }),
  canales: z.array(esquemaCanal),
});
export type Contacto = z.infer<typeof esquemaContacto>;
```

Reemplazar `esquemaRuta` (51–59) por:

```ts
export const esquemaRuta = z.object({
  nombre: esquemaNombreRuta,
  descripcion: z.string().min(1),
  desde: z.string().min(1),
  hasta: z.string().min(1),
  km: z.number().positive().nullable(),
  /** Progresivas del PETP art. 1. Sirven para ubicar incidentes por km sobre el trazo del mapa. */
  pkInicial: z.number().nonnegative().optional(),
  pkFinal: z.number().positive().optional(),
  nota: z.string().optional(),
});
export type Ruta = z.infer<typeof esquemaRuta>;
```

Reemplazar `esquemaCiudad` (64–71) por:

```ts
export const esquemaCiudad = z.object({
  slug,
  nombre: z.string().min(1),
  provincia: z.string().min(1),
  mapa: puntoMapa,
  principal: z.boolean().default(false),
  /** 'empalme' = nodo del trazado que no es una ciudad (ej. el empalme RN 34 / RN 19 donde termina la concesión). */
  tipo: z.enum(['ciudad', 'empalme']).default('ciudad'),
});
export type Ciudad = z.infer<typeof esquemaCiudad>;
```

Reemplazar `esquemaCabina` (73–87) por:

```ts
export const esquemaCabina = z.object({
  slug,
  nombre: z.string().min(1),
  ruta: esquemaNombreRuta,
  km: z.number().nonnegative().nullable(),
  localidad: z.string().min(1),
  provincia: z.string().min(1),
  situacion: z.enum(['existente', 'nueva']),
  estado: z.enum(['confirmada', 'a-confirmar']),
  /** Peaje sin barrera. Lo informa el sistema; opcional para el JSON del repo. */
  freeFlow: z.boolean().optional(),
  /** Cobra hoy (verde en el mapa). Si falta, se deriva de `situacion` (ver cabinaOperativa). */
  operativa: z.boolean().optional(),
  vias: z.number().int().positive().optional(),
  sentido: z.enum(['ambos', 'ascendente', 'descendente']).optional(),
  telefono: z.string().min(3).optional(),
  horarioAtencion: z.string().min(1).optional(),
  servicios: z
    .object({
      areaDescanso: z.boolean().optional(),
      detencionSegura: z.boolean().optional(),
      gruaGratuita: z.boolean().optional(),
      sanitarios: z.boolean().optional(),
      colocacionTelepase: z.boolean().optional(),
    })
    .optional(),
  mapa: puntoMapa,
  fuente: z.object({ nombre: z.string().min(1), url }).optional(),
});
export type Cabina = z.infer<typeof esquemaCabina>;
export const cabinaOperativa = (c: Cabina): boolean => c.operativa ?? c.situacion === 'existente';
```

Reemplazar `esquemaTarifa` y `esquemaTarifario` (101–122) por:

```ts
export const esquemaTarifa = z.object({
  categoria: slug,
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  /** Con TelePASE (la columna principal). */
  montoSinIva: z.number().positive().nullable(),
  /** Lo calcula el sistema (IVA + redondeo). La UI sigue formateando con lib/formato.ts. */
  montoConIva: z.number().positive().nullable().optional(),
  /** Pago electrónico o manual en la vía. Hoy igual al de TelePASE (Res. 248/2026); rige distinto cuando haya vías 100% automáticas. */
  montoManualSinIva: z.number().positive().nullable().optional(),
  /** Múltiplo de la tarifa básica (PETG 53.2). Informativo. */
  multiplicador: z.number().positive().optional(),
  nota: z.string().optional(),
});
export type Tarifa = z.infer<typeof esquemaTarifa>;

export const esquemaTarifario = z.object({
  publicadoEl: fechaIso,
  vigencia: z.object({ desde: fechaIso.nullable(), descripcion: z.string().min(1) }),
  moneda: z.literal('ARS'),
  alicuotaIva: z.number().min(0).max(1),
  /** 'heredado' = cuadro de la concesionaria saliente que rige desde la toma de posesión (PETP art. 3). */
  origen: z.enum(['oferta', 'homologada', 'heredado']),
  resolucion: z.string().min(1).optional(),
  /** Slugs de las cabinas donde rige. Ausente = todas las operativas. */
  cabinas: z.array(slug).optional(),
  /** Tarifa que muestra el home. Ausente = la primera. */
  categoriaDestacada: slug.optional(),
  tarifas: z.array(esquemaTarifa).min(1),
  /** Una fila con cabina reemplaza la general para esa cabina y categoría (mismo modelo que el backend). */
  excepciones: z
    .array(z.object({ cabina: slug, categoria: slug, montoSinIva: z.number().positive().nullable(), montoManualSinIva: z.number().positive().nullable().optional() }))
    .optional(),
  fuente: z.object({ nombre: z.string().min(1), url }),
  avisos: z.array(z.string()),
});
export type Tarifario = z.infer<typeof esquemaTarifario>;
```

- [x] **Step 4: Regenerar el contrato exportado**

Run: `pnpm contrato`
Expected: `Contrato exportado a docs/contrato/`. `git diff --stat docs/contrato` muestra los dos archivos cambiados.

- [x] **Step 5: Correr los tests**

Run: `pnpm vitest run tests/lib/datos/esquemas.test.ts tests/lib/contrato.test.ts`
Expected: PASS. (`pnpm check` va a fallar hasta la 1.2 porque `contacto.json` y `empresa.json` todavía no tienen la forma nueva: se arregla ahí.)

- [x] **Step 6: Commit**

```bash
git add src/lib/datos/esquemas.ts docs/contrato/tramo.schema.json docs/contrato/tarifario.schema.json tests/lib/datos/esquemas.test.ts tests/lib/contrato.test.ts
git commit -m "feat(contrato): campos opcionales para estaciones, rutas y tarifas por estación; contacto con canales y enlaces"
```

### Tarea 1.2: Datos oficiales del pliego en `src/content/`

**Files:**
- Modify: `src/content/empresa.json`, `src/content/contacto.json`, `src/content/tramo.json` (los tres completos)
- Modify: `tests/lib/datos/local-json.test.ts:5-21`

- [x] **Step 1: Tests de los datos**

En `tests/lib/datos/local-json.test.ts` reemplazar los dos primeros `it` (líneas 5–21) por:

```ts
  it('empresa: datos verificables de la adjudicación y del pliego', async () => {
    const e = await fuenteLocalJson.empresa();
    expect(e.concesion.km).toBe(679.03);
    expect(e.concesion.rutas).toEqual(['RN 9', 'RN 19', 'RN 34']);
    expect(e.concesion.inicioOperacion).toBe('2026-10-05');
    expect(e.concesion.tarifaOfertadaSinIva).toBe(1399);
    expect(e.enFormacion).toBe(true);
    expect(e.cuit).toBeNull();
    expect(e.domicilioComercial).toBeNull();
    expect(e).not.toHaveProperty('descriptor');
    expect(e.consorcio.map((c) => c.nombre)).toEqual(['AFEMA S.A.', 'Pablo Federico e Hijos S.A.', 'Guido Mogetta S.A.']);
  });
  it('contacto: el 140 está, los canales comerciales todavía no, y la tabla de canales trae los plazos del pliego', async () => {
    const c = await fuenteLocalJson.contacto();
    expect(c.emergencias.telefono).toBe('140');
    expect(c.lineaGratuita).toBeNull();
    expect(c.atencionUsuario).toBeNull();
    expect(c.enlaces.telepase).toMatch(/^https:\/\/www\.telepase\.com\.ar/);
    expect(c.enlaces.oficinaVirtual).toBeNull();
    expect(c.canales.map((k) => k.id)).toEqual(['emergencias-140', 'asistencia', 'formulario', 'correo', 'linea-0800', 'whatsapp']);
    expect(c.canales.find((k) => k.id === 'formulario')).toMatchObject({ acuse: '24 horas', respuesta: '5 días hábiles' });
  });
  it('tramo: 679,03 km, tres rutas con progresivas oficiales, seis cabinas con km y las tres existentes operativas', async () => {
    const t = await fuenteLocalJson.tramo();
    expect(t.km).toBe(679.03);
    expect(t.rutas.map((r) => [r.nombre, r.km, r.pkInicial, r.pkFinal])).toEqual([['RN 9', 363.16, 297, 660.16], ['RN 19', 127.19, 0, 127.19], ['RN 34', 188.68, 0, 188.68]]);
    expect(t.rutas.find((r) => r.nombre === 'RN 34')?.hasta).toBe('Empalme con la RN 19');
    expect(t.cabinas.map((c) => c.slug).sort()).toEqual(['carcarana', 'franck', 'james-craik', 'leones', 'san-francisco', 'totoras']);
    for (const c of t.cabinas) expect(c.km, c.slug).not.toBeNull();
    expect(t.cabinas.filter(cabinaOperativa).map((c) => c.slug).sort()).toEqual(['carcarana', 'franck', 'james-craik']);
    expect(t.cabinas.filter((c) => !cabinaOperativa(c)).every((c) => c.freeFlow === true)).toBe(true);
    expect(t.cabinas.filter(cabinaOperativa).every((c) => c.servicios?.areaDescanso === true)).toBe(true);
    const slugs = new Set(t.ciudades.map((c) => c.slug));
    for (const tr of t.trazados) for (const s of tr.ciudades) expect(slugs.has(s), `ciudad ${s} no existe`).toBe(true);
    expect(t.trazados.find((x) => x.ruta === 'RN 34')?.ciudades.at(-1)).toBe('empalme-rn-19');
    expect(t.trazados.find((x) => x.ruta === 'RN 19')?.ciudades[0]).toBe('santo-tome');
    for (const c of t.cabinas) expect(c.fuente?.url).toMatch(/^https:\/\//);
  });
```

Cambiar el import de la línea 2 por `import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';` más `import { cabinaOperativa } from '@/lib/datos/esquemas';`.

- [x] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/lib/datos/local-json.test.ts`
Expected: FAIL (el JSON viejo no valida contra el contrato nuevo).

- [x] **Step 3: `src/content/empresa.json`**

```json
{
  "marca": "Covicen",
  "razonSocial": null,
  "cuit": null,
  "domicilioLegal": null,
  "domicilioComercial": null,
  "constanciaUrl": null,
  "enFormacion": true,
  "consorcio": [
    { "nombre": "AFEMA S.A.", "descripcion": "Constructora vial con base en Córdoba." },
    { "nombre": "Pablo Federico e Hijos S.A.", "descripcion": "Construcción y obras de hormigón." },
    { "nombre": "Guido Mogetta S.A.", "descripcion": "Construcción, obra pública, transporte y minería." }
  ],
  "concesion": {
    "tramo": "Centro",
    "km": 679.03,
    "rutas": ["RN 9", "RN 19", "RN 34"],
    "provincias": ["Córdoba", "Santa Fe"],
    "plazoAnios": 20,
    "prorrogaAnios": 10,
    "inicioOperacion": "2026-10-05",
    "adjudicacion": {
      "fecha": "2026-08-24",
      "resolucion": "Resolución 1379/2026 del Ministerio de Economía",
      "url": "https://www.boletinoficial.gob.ar/detalleAviso/primera/346271/20260824"
    },
    "tarifaOfertadaSinIva": 1399,
    "tarifaTopeSinIva": 3200,
    "tramosEtapa": 8
  }
}
```

- [x] **Step 4: `src/content/contacto.json`**

```json
{
  "emergencias": { "telefono": "140", "etiqueta": "Emergencias" },
  "lineaGratuita": null,
  "atencionUsuario": null,
  "whatsapp": { "numero": null },
  "email": { "general": null, "rrhh": null, "proveedores": null, "etica": null },
  "redes": {},
  "enlaces": { "telepase": "https://www.telepase.com.ar/", "oficinaVirtual": null, "atencionDnv": null },
  "canales": [
    { "id": "emergencias-140", "nombre": "Emergencias 140", "tipo": "telefono", "valor": "140", "disponibilidad": "24 horas, los 365 días del año", "acuse": "Inmediato", "respuesta": "Inmediata", "fuente": "PETG art. 58 y 59" },
    { "id": "asistencia", "nombre": "Botón de asistencia en ruta", "tipo": "web", "valor": "/asistencia", "disponibilidad": "24 horas", "acuse": "Inmediato", "respuesta": "Inmediata", "fuente": "PETG art. 58 y 60.5" },
    { "id": "formulario", "nombre": "Formulario web de reclamos, consultas y sugerencias", "tipo": "web", "valor": "/contacto", "disponibilidad": "Siempre disponible; se gestiona en días hábiles", "acuse": "24 horas", "respuesta": "5 días hábiles", "fuente": "PETG art. 58 y 61.5" },
    { "id": "correo", "nombre": "Correo de atención al usuario", "tipo": "correo", "valor": null, "disponibilidad": "Siempre disponible; se gestiona en días hábiles", "acuse": "24 horas", "respuesta": "5 días hábiles", "fuente": "PETG art. 58 y 61.5" },
    { "id": "linea-0800", "nombre": "Línea gratuita 0800", "tipo": "telefono", "valor": null, "disponibilidad": "Al menos 8 horas en días hábiles, entre las 8 y las 20", "acuse": "Inmediato", "respuesta": "5 días hábiles", "fuente": "PETG art. 58 y 61.1" },
    { "id": "whatsapp", "nombre": "WhatsApp", "tipo": "whatsapp", "valor": null, "disponibilidad": "Se habilita a los 90 días de la toma de posesión", "acuse": "24 horas", "respuesta": "5 días hábiles", "fuente": "PETG art. 58 y 61.5" }
  ]
}
```

- [x] **Step 5: `src/content/tramo.json`**

Las coordenadas son del SVG (viewBox 820×520). `santo-tome` queda al sudoeste de Santa Fe; `empalme-rn-19` es la intersección de los trazos RN 34 (Totoras→Rafaela) y RN 19 (Franck→San Francisco) calculada sobre el dibujo: (624, 136). Rafaela y Santa Fe siguen como referencia, fuera de los trazos.

```json
{
  "km": 679.03,
  "provincias": ["Córdoba", "Santa Fe"],
  "rutas": [
    { "nombre": "RN 9", "descripcion": "Autopista Rosario–Córdoba", "desde": "Empalme con la RN A-008 (Rosario)", "hasta": "Inicio de la Red de Accesos a Córdoba (Pilar)", "km": 363.16, "pkInicial": 297, "pkFinal": 660.16 },
    { "nombre": "RN 19", "descripcion": "Santo Tomé – límite con Córdoba", "desde": "Empalme con la RN 11 (Santo Tomé)", "hasta": "Límite entre Santa Fe y Córdoba", "km": 127.19, "pkInicial": 0, "pkFinal": 127.19 },
    { "nombre": "RN 34", "descripcion": "Rosario – empalme con la RN 19", "desde": "Empalme con la RN A-008 (Rosario)", "hasta": "Empalme con la RN 19", "km": 188.68, "pkInicial": 0, "pkFinal": 188.68 }
  ],
  "ciudades": [
    { "slug": "rosario", "nombre": "Rosario", "provincia": "Santa Fe", "mapa": { "x": 771, "y": 465 }, "principal": true },
    { "slug": "carcarana", "nombre": "Carcarañá", "provincia": "Santa Fe", "mapa": { "x": 677, "y": 445 } },
    { "slug": "leones", "nombre": "Leones", "provincia": "Córdoba", "mapa": { "x": 458, "y": 399 } },
    { "slug": "villa-maria", "nombre": "Villa María", "provincia": "Córdoba", "mapa": { "x": 279, "y": 341 } },
    { "slug": "james-craik", "nombre": "James Craik", "provincia": "Córdoba", "mapa": { "x": 238, "y": 284 } },
    { "slug": "pilar", "nombre": "Pilar", "provincia": "Córdoba", "mapa": { "x": 158, "y": 173 } },
    { "slug": "cordoba", "nombre": "Córdoba", "provincia": "Córdoba", "mapa": { "x": 101, "y": 114 }, "principal": true },
    { "slug": "san-francisco", "nombre": "San Francisco", "provincia": "Córdoba", "mapa": { "x": 500, "y": 116 } },
    { "slug": "empalme-rn-19", "nombre": "Empalme RN 19", "provincia": "Santa Fe", "mapa": { "x": 624, "y": 136 }, "tipo": "empalme" },
    { "slug": "rafaela", "nombre": "Rafaela", "provincia": "Santa Fe", "mapa": { "x": 612, "y": 74 }, "principal": true },
    { "slug": "franck", "nombre": "Franck", "provincia": "Santa Fe", "mapa": { "x": 715, "y": 150 } },
    { "slug": "santo-tome", "nombre": "Santo Tomé", "provincia": "Santa Fe", "mapa": { "x": 748, "y": 178 } },
    { "slug": "santa-fe", "nombre": "Santa Fe", "provincia": "Santa Fe", "mapa": { "x": 762, "y": 162 }, "principal": true },
    { "slug": "totoras", "nombre": "Totoras", "provincia": "Santa Fe", "mapa": { "x": 673, "y": 380 } }
  ],
  "trazados": [
    { "ruta": "RN 9", "ciudades": ["rosario", "carcarana", "leones", "villa-maria", "james-craik", "pilar", "cordoba"] },
    { "ruta": "RN 19", "ciudades": ["santo-tome", "franck", "empalme-rn-19", "san-francisco"] },
    { "ruta": "RN 34", "ciudades": ["rosario", "totoras", "empalme-rn-19"] }
  ],
  "cabinas": [
    { "slug": "carcarana", "nombre": "Carcarañá", "ruta": "RN 9", "km": 340, "vias": 10, "sentido": "ambos", "localidad": "Carcarañá", "provincia": "Santa Fe", "situacion": "existente", "operativa": true, "estado": "confirmada", "servicios": { "areaDescanso": true, "gruaGratuita": true }, "mapa": { "x": 677, "y": 445 }, "fuente": { "nombre": "El Litoral, 25/08/2026", "url": "https://www.ellitoral.com/politica/peajes-santafe-rutanacional11-vialidadnacional-tramocentro-llambicampbell-rutanacional34-totoras-chacosantafe-resolucion1379-franck-vera-rutanacional9_0_g0HSrixqTt.html" } },
    { "slug": "james-craik", "nombre": "James Craik", "ruta": "RN 9", "km": 588, "vias": 8, "sentido": "ambos", "localidad": "James Craik", "provincia": "Córdoba", "situacion": "existente", "operativa": true, "estado": "confirmada", "servicios": { "areaDescanso": true, "gruaGratuita": true }, "mapa": { "x": 238, "y": 284 }, "fuente": { "nombre": "La Capital, 24/08/2026", "url": "https://www.lacapital.com.ar/la-ciudad/un-grupo-cordobes-cobrara-el-peaje-la-autopista-rosario-cordoba-n10277073.html" } },
    { "slug": "franck", "nombre": "Franck", "ruta": "RN 19", "km": 19.95, "vias": 6, "sentido": "ambos", "localidad": "Franck", "provincia": "Santa Fe", "situacion": "existente", "operativa": true, "estado": "confirmada", "servicios": { "areaDescanso": true, "gruaGratuita": true }, "mapa": { "x": 715, "y": 150 }, "fuente": { "nombre": "El Litoral, 25/08/2026", "url": "https://www.ellitoral.com/politica/peajes-santafe-rutanacional11-vialidadnacional-tramocentro-llambicampbell-rutanacional34-totoras-chacosantafe-resolucion1379-franck-vera-rutanacional9_0_g0HSrixqTt.html" } },
    { "slug": "leones", "nombre": "Leones", "ruta": "RN 9", "km": 454, "sentido": "ambos", "localidad": "Leones", "provincia": "Córdoba", "situacion": "nueva", "operativa": false, "estado": "confirmada", "freeFlow": true, "mapa": { "x": 458, "y": 399 }, "fuente": { "nombre": "La Capital", "url": "https://www.lacapital.com.ar/la-autopista-cordoba-sumara-otro-peaje-la-altura-leones-n10260956.html" } },
    { "slug": "san-francisco", "nombre": "San Francisco", "ruta": "RN 19", "km": 120, "sentido": "ambos", "localidad": "San Francisco", "provincia": "Córdoba", "situacion": "nueva", "operativa": false, "estado": "confirmada", "freeFlow": true, "mapa": { "x": 500, "y": 116 }, "fuente": { "nombre": "El Litoral, 25/08/2026", "url": "https://www.ellitoral.com/politica/peajes-santafe-rutanacional11-vialidadnacional-tramocentro-llambicampbell-rutanacional34-totoras-chacosantafe-resolucion1379-franck-vera-rutanacional9_0_g0HSrixqTt.html" } },
    { "slug": "totoras", "nombre": "Totoras", "ruta": "RN 34", "km": 60, "sentido": "ambos", "localidad": "Totoras", "provincia": "Santa Fe", "situacion": "nueva", "operativa": false, "estado": "confirmada", "freeFlow": true, "mapa": { "x": 673, "y": 380 }, "fuente": { "nombre": "El Litoral, 25/08/2026", "url": "https://www.ellitoral.com/politica/peajes-santafe-rutanacional11-vialidadnacional-tramocentro-llambicampbell-rutanacional34-totoras-chacosantafe-resolucion1379-franck-vera-rutanacional9_0_g0HSrixqTt.html" } }
  ],
  "avisos": [
    "Longitudes, extremos, progresivas y vías según el Pliego de Especificaciones Técnicas Particulares del Tramo Centro (art. 1 y 2). La habilitación de cada estación la define Vialidad Nacional.",
    "Las estaciones nuevas (Leones, San Francisco y Totoras) cobran cuando Vialidad Nacional las habilite y operan con Free Flow, sin barreras, desde el inicio.",
    "La estación San Vicente (RN 34 km 160) deja de operar con el inicio de la concesión."
  ]
}
```

Nota para quien ejecuta: la provincia de la estación San Francisco queda "Córdoba" hasta que Covicen confirme (por progresiva, km 120 < límite km 127,19, estaría en Santa Fe). Es un pendiente de la spec §14, no lo cambies.

- [x] **Step 6: Correr tests y typecheck**

Run: `pnpm vitest run tests/lib/datos && pnpm check`
Expected: los tests de datos PASS. `pnpm check` va a marcar errores en los componentes que usaban `empresa.descriptor` o el `telefono` nulo (`Footer.astro`, `Header.astro`, `BarraEmergencias.astro`, `Seo`/`seo.ts`, `privacidad.astro`, `quienes-somos.astro`, `contacto.astro`, `emergencias.astro`): se arreglan en las tareas 1.4–1.7. Si `check` corta por eso, seguir con la 1.3; al cerrar la 1.7 tiene que quedar en verde.

- [x] **Step 7: Commit**

```bash
git add src/content/empresa.json src/content/contacto.json src/content/tramo.json tests/lib/datos/local-json.test.ts
git commit -m "feat(datos): 679,03 km, extremos y progresivas del PETP, estaciones con km y vías, 140 y canales del pliego"
```

### Tarea 1.3: Avisos: contrato, datos, filtro por vigencia, barra y rotación

**Files:**
- Modify: `src/lib/datos/esquemas.ts` (al final: `esquemaAviso`)
- Create: `src/lib/avisos.ts`
- Create: `src/content/avisos.json`
- Modify: `src/lib/datos/fuente.ts`, `src/lib/datos/fuentes/local-json.ts`
- Create: `src/components/BarraSuperior.astro`, `src/scripts/anuncios.ts`
- Modify: `tests/presupuesto.test.ts:7`
- Create: `tests/lib/avisos.test.ts`, `tests/components/barra-superior.test.ts`

**Interfaces:**
- Produces: `Aviso = { id, texto, url?, desde?, hasta?, tono: 'info' | 'vial' }`; `avisosVigentes(avisos: Aviso[], hoy: string): Aviso[]`; `hoyArgentina(): string` (YYYY-MM-DD); `FuenteDatos.avisos(): Promise<Aviso[]>`; componente `<BarraSuperior avisos={Aviso[]} contacto={Contacto} />` (40 px, `h-10`); script `anuncios.ts` sobre `[data-anuncios]` con hijos `[data-anuncio]` y botones `[data-anuncio-anterior]`/`[data-anuncio-siguiente]`.

- [ ] **Step 1: Tests**

Crear `tests/lib/avisos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { avisosVigentes, hoyArgentina } from '@/lib/avisos';
import type { Aviso } from '@/lib/datos/esquemas';

const a = (id: string, extra: Partial<Aviso> = {}): Aviso => ({ id, texto: id, tono: 'info', ...extra });

describe('avisosVigentes', () => {
  it('deja pasar los que no tienen fechas y filtra por desde/hasta inclusive', () => {
    const lista = [a('siempre'), a('futuro', { desde: '2026-10-05' }), a('vencido', { hasta: '2026-09-01' }), a('hoy', { desde: '2026-09-13', hasta: '2026-09-13' })];
    expect(avisosVigentes(lista, '2026-09-13').map((x) => x.id)).toEqual(['siempre', 'hoy']);
    expect(avisosVigentes(lista, '2026-10-05').map((x) => x.id)).toEqual(['siempre', 'futuro']);
  });
  it('hoyArgentina devuelve YYYY-MM-DD', () => {
    expect(hoyArgentina()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

Crear `tests/components/barra-superior.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BarraSuperior from '@/components/BarraSuperior.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async (avisos: unknown[]) => {
  const c = await AstroContainer.create();
  return c.renderToString(BarraSuperior, { props: { avisos, contacto: await fuenteLocalJson.contacto() } });
};

describe('BarraSuperior', () => {
  it('muestra el primer anuncio visible, los demás ocultos, y controles si hay más de uno', async () => {
    const html = await render([{ id: 'a', texto: 'Primero', tono: 'vial' }, { id: 'b', texto: 'Segundo', tono: 'info', url: '/tarifas' }]);
    expect(html).toContain('data-anuncios');
    expect(html.match(/data-anuncio[\s>]/g)?.length).toBe(2);
    expect(html).toMatch(/<li[^>]*data-anuncio[^>]*hidden/);
    expect(html).toContain('href="/tarifas/"');
    expect(html).toContain('aria-label="Anuncio siguiente"');
  });
  it('con un solo anuncio no hay controles; sin anuncios no hay sección de anuncios', async () => {
    expect(await render([{ id: 'a', texto: 'Solo', tono: 'info' }])).not.toContain('aria-label="Anuncio siguiente"');
    expect(await render([])).not.toContain('data-anuncios');
  });
  it('accesos: TelePASE externo, Mi cuenta a Medios de pago mientras no haya oficina virtual, y el interruptor', async () => {
    const html = await render([]);
    expect(html).toMatch(/href="https:\/\/www\.telepase\.com\.ar\/"[^>]*target="_blank"/);
    expect(html).toContain('href="/medios-de-pago/#mi-cuenta"');
    expect(html).toContain('data-tema-boton');
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/lib/avisos.test.ts tests/components/barra-superior.test.ts`
Expected: FAIL (módulos inexistentes).

- [ ] **Step 3: Esquema, filtro y datos**

Al final de `src/lib/datos/esquemas.ts` agregar:

```ts
/** Aviso de la barra superior. `url` interna ('/tarifas') o externa (https). Sin fechas = siempre vigente. */
export const esquemaAviso = z.object({
  id: slug,
  texto: z.string().min(1).max(160),
  url: z.string().regex(/^(\/|https?:\/\/)/).optional(),
  desde: fechaIso.optional(),
  hasta: fechaIso.optional(),
  tono: z.enum(['info', 'vial']).default('info'),
});
export type Aviso = z.infer<typeof esquemaAviso>;
```

Crear `src/lib/avisos.ts`:

```ts
import type { Aviso } from '@/lib/datos/esquemas';

/** Fecha de hoy en Argentina como YYYY-MM-DD (el build corre en UTC en GitHub Actions). */
export const hoyArgentina = (): string => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

/** Los avisos cuya vigencia incluye `hoy` (fechas ISO se comparan como texto). */
export const avisosVigentes = (avisos: Aviso[], hoy: string): Aviso[] =>
  avisos.filter((a) => (a.desde === undefined || a.desde <= hoy) && (a.hasta === undefined || a.hasta >= hoy));
```

Crear `src/content/avisos.json`:

```json
[
  { "id": "toma-de-posesion", "texto": "Covicen opera el Tramo Centro desde el 5 de octubre de 2026. Conocé el tramo y las estaciones.", "url": "/el-tramo", "tono": "vial", "hasta": "2026-10-05" },
  { "id": "emergencias-140", "texto": "Emergencias en la ruta: llamá al 140, las 24 horas.", "url": "/emergencias", "tono": "info" },
  { "id": "tarifas", "texto": "Consultá el cuadro tarifario vigente por estación de peaje.", "url": "/tarifas", "tono": "info" }
]
```

En `src/lib/datos/fuente.ts`: importar `Aviso` en la línea 1 y agregar a la interfaz `avisos(): Promise<Aviso[]>;` después de `estadoRutas()`.

En `src/lib/datos/fuentes/local-json.ts`: agregar `import avisosJson from '@/content/avisos.json';` y `import { avisosVigentes, hoyArgentina } from '@/lib/avisos';`, sumar `esquemaAviso` y `type Aviso` al import de `../esquemas`, y agregar al objeto `fuenteLocalJson`:

```ts
  // Barra superior: solo los vigentes hoy (el sitio se reconstruye a diario, así las fechas entran y salen solas).
  avisos: async (): Promise<Aviso[]> => avisosVigentes(z.array(esquemaAviso).parse(avisosJson), hoyArgentina()),
```

con `import { z } from 'astro/zod';` arriba.

- [ ] **Step 4: Componente y script**

Crear `src/components/BarraSuperior.astro`:

```astro
---
// Barra de 40 px pegada arriba del header: a la izquierda los anuncios rotando (uno visible, los demás `hidden`;
// scripts/anuncios.ts los rota), a la derecha TelePASE · Mi cuenta · interruptor de tema (solo desktop; en celular
// esos tres viven en el menú). Sin anuncios vigentes, la izquierda queda vacía y la barra sigue (los accesos).
import { ChevronLeft, ChevronRight } from '@lucide/astro';
import InterruptorTema from '@/components/InterruptorTema.astro';
import type { Aviso, Contacto } from '@/lib/datos/esquemas';
import { ruta } from '@/lib/rutas';
interface Props { avisos: Aviso[]; contacto: Contacto }
const { avisos, contacto } = Astro.props;
const enlace = (u: string) => (u.startsWith('/') ? ruta(u) : u);
const oficina = contacto.enlaces.oficinaVirtual;
const miCuenta = oficina ?? ruta('/medios-de-pago#mi-cuenta');
---
<div class="barra-superior h-10 border-b border-borde bg-fondo-2 text-sm">
  <div class="contenedor flex h-full items-center justify-between gap-4">
    {avisos.length > 0 ? (
      <section class="anuncios flex min-w-0 flex-1 items-center gap-2" aria-label="Anuncios" data-anuncios>
        <ul class="anuncios-lista min-w-0 flex-1">
          {avisos.map((a, i) => (
            <li class="anuncio flex items-center gap-2" data-anuncio hidden={i !== 0}>
              <span class:list={['h-2 w-2 shrink-0 rounded-full', a.tono === 'vial' ? 'bg-vial' : 'bg-acento']} aria-hidden="true"></span>
              {a.url ? <a href={enlace(a.url)} class="truncate text-texto">{a.texto}</a> : <span class="truncate text-texto">{a.texto}</span>}
            </li>
          ))}
        </ul>
        {avisos.length > 1 && (
          <div class="flex shrink-0 items-center gap-1">
            <button type="button" class="control" data-anuncio-anterior aria-label="Anuncio anterior"><ChevronLeft size={16} aria-hidden="true" /></button>
            <button type="button" class="control" data-anuncio-siguiente aria-label="Anuncio siguiente"><ChevronRight size={16} aria-hidden="true" /></button>
          </div>
        )}
      </section>
    ) : (
      <span class="flex-1" aria-hidden="true"></span>
    )}
    <nav aria-label="Accesos" class="hidden shrink-0 items-center gap-1 lg:flex">
      <a href={contacto.enlaces.telepase} class="acceso" rel="noopener noreferrer" target="_blank">TelePASE</a>
      <a href={miCuenta} class="acceso" rel={oficina ? 'noopener noreferrer' : undefined} target={oficina ? '_blank' : undefined}>Mi cuenta</a>
      <InterruptorTema class="ml-1 h-8 w-8" />
    </nav>
  </div>
</div>
<script src="../scripts/anuncios.ts"></script>
<style>
  .anuncio { animation: aparecer-suave var(--dur-ui) var(--ease-salida) both; }
  .acceso { display: inline-flex; align-items: center; min-height: 2rem; padding: 0 0.6rem; border-radius: var(--radius-sm); color: var(--color-texto-2); font-weight: 600; text-decoration: none; }
  .acceso:hover, .acceso:focus-visible { color: var(--color-texto); background: var(--color-superficie); }
  .control { display: inline-flex; align-items: center; justify-content: center; width: 2rem; height: 2rem; border-radius: var(--radius-sm); color: var(--color-texto-2); }
  .control:hover, .control:focus-visible { color: var(--color-texto); background: var(--color-superficie); }
  @media (prefers-reduced-motion: reduce) { .anuncio { animation: none; } }
</style>
```

Crear `src/scripts/anuncios.ts`:

```ts
// Rotación de la barra de anuncios: cada 6 s pasa al siguiente (con fundido, vía CSS al des-ocultar). Se frena con el
// puntero encima, con el foco adentro y con "menos movimiento"; los botones anterior/siguiente funcionan siempre.
const INTERVALO = 6000;

const montar = (raiz: HTMLElement) => {
  const items = [...raiz.querySelectorAll<HTMLElement>('[data-anuncio]')];
  if (items.length < 2) return;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let actual = items.findIndex((el) => !el.hidden);
  let timer = 0;
  const mostrar = (n: number) => {
    items[actual]!.hidden = true;
    actual = (n + items.length) % items.length;
    items[actual]!.hidden = false;
  };
  const parar = () => window.clearInterval(timer);
  const arrancar = () => { parar(); if (!quieto) timer = window.setInterval(() => mostrar(actual + 1), INTERVALO); };
  raiz.querySelector('[data-anuncio-anterior]')?.addEventListener('click', () => { mostrar(actual - 1); arrancar(); });
  raiz.querySelector('[data-anuncio-siguiente]')?.addEventListener('click', () => { mostrar(actual + 1); arrancar(); });
  raiz.addEventListener('pointerenter', parar);
  raiz.addEventListener('pointerleave', arrancar);
  raiz.addEventListener('focusin', parar);
  raiz.addEventListener('focusout', arrancar);
  document.addEventListener('astro:before-swap', parar, { once: true });
  arrancar();
};

const iniciar = () => document.querySelectorAll<HTMLElement>('[data-anuncios]:not([data-montado])').forEach((r) => { r.dataset.montado = ''; montar(r); });
document.addEventListener('astro:page-load', iniciar);

export {};
```

En `tests/presupuesto.test.ts` línea 7 agregar `'src/scripts/anuncios.ts'` a `todos`.

- [ ] **Step 5: Correr los tests**

Run: `pnpm vitest run tests/lib/avisos.test.ts tests/components/barra-superior.test.ts tests/lib/datos tests/presupuesto.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/datos/esquemas.ts src/lib/avisos.ts src/content/avisos.json src/lib/datos/fuente.ts src/lib/datos/fuentes/local-json.ts src/components/BarraSuperior.astro src/scripts/anuncios.ts tests/presupuesto.test.ts tests/lib/avisos.test.ts tests/components/barra-superior.test.ts
git commit -m "feat(anuncios): barra superior con avisos vigentes rotando y accesos a TelePASE, Mi cuenta y tema"
```

### Tarea 1.4: Header de dos filas con el 140 grande

**Files:**
- Modify: `src/components/Header.astro` (todo)
- Modify: `src/components/BarraEmergencias.astro` (todo)
- Modify: `src/layouts/Base.astro:24,39`
- Modify: `src/styles/tokens.css` (`--alto-header: 7rem`)
- Modify: `tests/components/layout.test.ts`

**Interfaces:**
- Consumes: `<BarraSuperior avisos contacto />`, `<InterruptorTema />`, `.btn-vial` global, `datos.avisos()`.
- Produces: `<Header contacto avisos rutaActual />` (prop nueva `avisos: Aviso[]`), altura total `--alto-header` = 7rem (40 + 72 px).

- [ ] **Step 1: Tests**

En `tests/components/layout.test.ts`: reemplazar el `it('emergencias: sin número …')` (líneas 39–42) por:

```ts
  it('el 140 está en toda página, con tel:', async () => {
    const html = await render('/politicas/', { titulo: 'Políticas', descripcion: 'x' });
    expect(html).toContain('href="tel:140"');
    expect(html).toContain('aria-label="Llamar a emergencias, 140"');
  });
```

y el `describe('Header', …)` (45–54) por:

```ts
describe('Header', () => {
  const props = async (avisos: unknown[] = []) => ({ contacto: await fuenteLocalJson.contacto(), avisos, rutaActual: '/tarifas/' });
  it('marca la página actual, tiene el 140 grande con tel: y el menú mobile', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Header, { props: await props() });
    expect(html).toContain('href="tel:140"');
    expect(html).toMatch(/href="\/tarifas\/"[^>]*aria-current="page"/);
    expect(html).toContain('popovertarget="menu-mobile"');
  });
  it('lleva la barra superior con los accesos y, en el menú mobile, TelePASE y Mi cuenta', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Header, { props: await props([{ id: 'a', texto: 'Aviso', tono: 'info' }]) });
    expect(html).toContain('data-anuncios');
    expect(html.match(/>TelePASE</g)?.length).toBe(2);
    expect(html.match(/>Mi cuenta</g)?.length).toBe(2);
    expect(html).not.toContain('Corredor Vial del Centro');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm vitest run tests/components/layout.test.ts`
Expected: FAIL.

- [ ] **Step 3: Reescribir `src/components/Header.astro`**

```astro
---
import { ChevronDown, Menu, Phone, X } from '@lucide/astro';
import BarraSuperior from '@/components/BarraSuperior.astro';
import InterruptorTema from '@/components/InterruptorTema.astro';
import Logotipo from '@/components/marca/Logotipo.astro';
import type { Aviso, Contacto } from '@/lib/datos/esquemas';
import { ruta } from '@/lib/rutas';

interface Props { contacto: Contacto; avisos: Aviso[]; rutaActual: string }
const { contacto, avisos, rutaActual } = Astro.props;

const items = [
  { nombre: 'Tarifas', href: '/tarifas' },
  { nombre: 'El tramo', href: '/el-tramo' },
  { nombre: 'Servicios', href: '/servicios' },
  { nombre: 'Obras', href: '/obras' },
  { nombre: 'Novedades', href: '/novedades' },
];
const nosotros = [
  { nombre: 'Quiénes somos', href: '/quienes-somos' },
  { nombre: 'Políticas', href: '/politicas' },
  { nombre: 'Transparencia', href: '/transparencia' },
  { nombre: 'Trabajá con nosotros', href: '/trabaja-con-nosotros' },
];
const activo = (href: string) => rutaActual.startsWith(ruta(href));
const nosotrosActivo = nosotros.some((n) => activo(n.href));
const tel = contacto.emergencias.telefono;
const telHref = `tel:${tel.replace(/[^\d+]/g, '')}`;
const oficina = contacto.enlaces.oficinaVirtual;
const miCuenta = oficina ?? ruta('/medios-de-pago#mi-cuenta');
---
<header class="cabecera fixed inset-x-0 top-0 z-50 border-b" transition:animate="none">
  <BarraSuperior {avisos} {contacto} />
  <div class="contenedor flex h-[4.5rem] items-center justify-between gap-6">
    <Logotipo />

    <nav aria-label="Principal" class="hidden lg:block">
      <ul class="nav-lista flex items-center gap-1">
        {items.map((i) => (
          <li>
            <a href={ruta(i.href)} class="nav-item" aria-current={activo(i.href) ? 'page' : undefined}>{i.nombre}</a>
          </li>
        ))}
        <li>
          <details class="desplegable relative" data-desplegable>
            <summary class:list={['nav-item cursor-pointer list-none', { 'is-activo': nosotrosActivo }]} aria-expanded="false">
              Nosotros <ChevronDown size={16} aria-hidden="true" class="chevron" />
            </summary>
            <ul class="absolute right-0 top-full mt-2 w-64 rounded-md border border-borde bg-superficie-2 p-2 shadow-2xl">
              {nosotros.map((n) => (
                <li>
                  <a href={ruta(n.href)} class="block rounded-sm px-3 py-2 text-texto transition-colors hover:bg-superficie hover:text-acento-hover" aria-current={activo(n.href) ? 'page' : undefined}>{n.nombre}</a>
                </li>
              ))}
            </ul>
          </details>
        </li>
        <li><a href={ruta('/contacto')} class="nav-item" aria-current={activo('/contacto') ? 'page' : undefined}>Contacto</a></li>
      </ul>
    </nav>

    <div class="flex items-center gap-3">
      <!-- El 140 grande: número corto de emergencia del pliego (PETG 59). Debajo de 640 px lo muestra BarraEmergencias. -->
      <a href={telHref} class="btn-vial btn-140 hidden sm:inline-flex" aria-label={`Llamar a emergencias, ${tel}`}>
        <Phone size={22} aria-hidden="true" class="telefono" />
        <span class="flex flex-col text-left leading-none">
          <span class="eyebrow text-sobre-vial">{contacto.emergencias.etiqueta}</span>
          <span class="text-2xl font-extrabold tabular-nums leading-none">{tel}</span>
        </span>
      </a>
      <button type="button" class="inline-flex h-11 w-11 items-center justify-center rounded-md border border-borde text-texto hover:border-borde-fuerte hover:bg-superficie lg:hidden" popovertarget="menu-mobile" aria-label="Abrir menú">
        <Menu size={22} aria-hidden="true" />
      </button>
    </div>
  </div>

  <nav id="menu-mobile" popover class="menu-mobile" aria-label="Menú">
    <div class="flex items-center justify-between border-b border-borde p-5">
      <div class="flex items-center gap-3"><span class="eyebrow">Menú</span><InterruptorTema /></div>
      <button type="button" class="inline-flex h-11 w-11 items-center justify-center rounded-md border border-borde hover:bg-superficie" popovertarget="menu-mobile" popovertargetaction="hide" aria-label="Cerrar menú">
        <X size={22} aria-hidden="true" />
      </button>
    </div>
    <ul class="flex flex-col p-3">
      {[...items, ...nosotros, { nombre: 'Contacto', href: '/contacto' }, { nombre: 'Preguntas frecuentes', href: '/preguntas-frecuentes' }].map((i) => (
        <li>
          <a href={ruta(i.href)} class="block rounded-sm px-3 py-3 text-lg font-semibold text-texto hover:bg-superficie hover:text-acento-hover" aria-current={activo(i.href) ? 'page' : undefined}>{i.nombre}</a>
        </li>
      ))}
    </ul>
    <ul class="flex flex-col border-t border-borde p-3">
      <li><a href={contacto.enlaces.telepase} class="block rounded-sm px-3 py-3 font-semibold text-texto-2 hover:bg-superficie hover:text-texto" rel="noopener noreferrer" target="_blank">TelePASE</a></li>
      <li><a href={miCuenta} class="block rounded-sm px-3 py-3 font-semibold text-texto-2 hover:bg-superficie hover:text-texto" rel={oficina ? 'noopener noreferrer' : undefined} target={oficina ? '_blank' : undefined}>Mi cuenta</a></li>
    </ul>
  </nav>
</header>
<script>
  // El <summary> no expone aria-expanded solo: se sincroniza con el estado del <details>.
  const sincronizar = () => document.querySelectorAll<HTMLDetailsElement>('details[data-desplegable]').forEach((d) => {
    const s = d.querySelector('summary');
    if (!s) return;
    s.setAttribute('aria-expanded', String(d.open));
    if (!d.dataset.listo) { d.dataset.listo = ''; d.addEventListener('toggle', () => s.setAttribute('aria-expanded', String(d.open))); }
  });
  document.addEventListener('astro:page-load', sincronizar);
</script>

<style>
  .cabecera { border-color: transparent; backdrop-filter: blur(12px); }
  @supports (animation-timeline: scroll()) {
    .cabecera { animation: cabecera-fondo linear both; animation-timeline: scroll(root); animation-range: 0 120px; }
  }
  @supports not (animation-timeline: scroll()) {
    .cabecera { background: var(--color-cabecera); border-color: var(--color-borde); }
  }
  @keyframes cabecera-fondo {
    from { background: transparent; border-color: transparent; }
    to { background: var(--color-cabecera); border-color: var(--color-borde); }
  }

  .nav-item {
    position: relative; display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.7rem 0.75rem; border-radius: var(--radius-sm);
    color: var(--color-texto-2); font-weight: 500; line-height: 1.2; text-decoration: none; white-space: nowrap;
    transition: color var(--dur-micro) var(--ease-salida);
  }
  .nav-item::after {
    content: ""; position: absolute; left: 0.75rem; right: 0.75rem; bottom: 0.2rem; height: 2px; border-radius: 1px;
    background: var(--color-acento); transform: scaleX(0); transform-origin: left;
    transition: transform var(--dur-ui) var(--ease-salida);
  }
  .nav-item:hover, .nav-item:focus-visible, .nav-item[aria-current="page"], .nav-item.is-activo { color: var(--color-texto); }
  .nav-item:hover::after, .nav-item:focus-visible::after, .nav-item[aria-current="page"]::after, .nav-item.is-activo::after { transform: scaleX(1); }
  .desplegable summary::-webkit-details-marker { display: none; }
  .desplegable .chevron { transition: transform var(--dur-ui) var(--ease-salida); }
  .desplegable[open] .chevron { transform: rotate(180deg); }
  .desplegable[open] > ul { animation: aparecer var(--dur-ui) var(--ease-salida) both; }
  @keyframes aparecer { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

  .btn-140 { padding: 0.35rem 0.9rem 0.35rem 0.75rem; }

  .menu-mobile {
    inset: unset; top: 0; right: 0; height: 100dvh; width: min(100%, 22rem); margin: 0; border: 0; border-left: 1px solid var(--color-borde);
    background: var(--color-fondo-2); color: var(--color-texto); translate: 100% 0; overflow-y: auto; overscroll-behavior: contain;
    transition: translate var(--dur-ui) var(--ease-salida), display var(--dur-ui) allow-discrete, overlay var(--dur-ui) allow-discrete;
  }
  .menu-mobile:popover-open { translate: 0 0; }
  @starting-style { .menu-mobile:popover-open { translate: 100% 0; } }
  .menu-mobile::backdrop { background: color-mix(in srgb, var(--color-fondo) 60%, transparent); }
</style>
```

- [ ] **Step 4: `BarraEmergencias.astro` con el 140 grande**

```astro
---
// Barra fija inferior en celular (< 640 px): el 140 siempre a un toque. Desde la Fase 5 suma el botón de asistencia.
import { Phone } from '@lucide/astro';
import type { Contacto } from '@/lib/datos/esquemas';
interface Props { contacto: Contacto }
const { contacto } = Astro.props;
const tel = contacto.emergencias.telefono;
---
<div class="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-fondo-2/95 p-3 backdrop-blur sm:hidden" style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))">
  <a href={`tel:${tel.replace(/[^\d+]/g, '')}`} class="btn-vial flex h-12 items-center justify-center gap-3" aria-label={`Llamar a emergencias, ${tel}`}>
    <Phone size={20} aria-hidden="true" class="telefono" /> <span class="eyebrow text-sobre-vial">{contacto.emergencias.etiqueta}</span> <span class="text-2xl font-extrabold tabular-nums leading-none">{tel}</span>
  </a>
</div>
```

- [ ] **Step 5: `Base.astro` y la altura del header**

En `src/layouts/Base.astro` línea 24: `const [empresa, contacto, avisos] = await Promise.all([datos.empresa(), datos.contacto(), datos.avisos()]);` y línea 39: `<Header {contacto} {avisos} rutaActual={Astro.url.pathname} />`.

En `src/styles/tokens.css`, en `:root`: `--alto-header: 7rem; /* 2.5rem de barra superior + 4.5rem de header */`.

- [ ] **Step 6: Tests, typecheck y vista**

Run: `pnpm vitest run tests/components/layout.test.ts tests/components/barra-superior.test.ts tests/components/tema.test.ts`
Expected: PASS.

Run: `pnpm dev`: la barra arriba con el anuncio rotando y TelePASE · Mi cuenta · sol/luna; el header con el 140 grande; en ancho de celular el burger, la barra inferior con el 140 y, dentro del menú, TelePASE, Mi cuenta y el interruptor. El contenido arranca debajo del header (nada tapado). Cerrar.

- [ ] **Step 7: Commit**

```bash
git add src/components/Header.astro src/components/BarraEmergencias.astro src/layouts/Base.astro src/styles/tokens.css tests/components/layout.test.ts
git commit -m "feat(header): dos filas con barra de anuncios y accesos, y el 140 grande con tel:"
```

### Tarea 1.5: Footer con slots ocultos, logos institucionales y última actualización

**Files:**
- Modify: `src/components/Footer.astro` (todo)
- Modify: `src/lib/formato.ts` (`fechaHoraLarga`)
- Create: `src/lib/institucional.ts`
- Create: `tests/components/footer.test.ts`
- Modify: `tests/lib/formato.test.ts`

**Interfaces:**
- Produces: `fechaHoraLarga(d: Date): string` ("13 de septiembre de 2026, 15:04"); `enlacesInstitucionales: Array<{ id, nombre, url }>` y `logoInstitucional(id): string | undefined` (SVG inline si existe `src/assets/institucional/<id>.svg`).

- [ ] **Step 1: Tests**

Agregar a `tests/lib/formato.test.ts` (dentro del `describe` existente o en uno nuevo):

```ts
  it('fechaHoraLarga en hora argentina', () => {
    expect(fechaHoraLarga(new Date('2026-09-13T18:04:00Z'))).toBe('13 de septiembre de 2026, 15:04');
  });
```

(y sumar `fechaHoraLarga` al import).

Crear `tests/components/footer.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Footer from '@/components/Footer.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async (empresa: unknown, contacto: unknown) => (await AstroContainer.create()).renderToString(Footer, { props: { empresa, contacto } });

describe('Footer', () => {
  it('sin datos registrales ni canales comerciales no muestra relleno: nada de "a confirmar"', async () => {
    const html = await render(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto());
    expect(html).not.toMatch(/a confirmar/i);
    expect(html).not.toContain('Datos registrales');
    expect(html).not.toContain('WhatsApp');
    expect(html).not.toContain('Corredor Vial del Centro');
    expect(html).toContain('href="tel:140"');
    expect(html).toContain('Última actualización');
    expect(html).toContain('Sociedad en formación');
  });
  it('con datos registrales y redes los muestra', async () => {
    const e = { ...(await fuenteLocalJson.empresa()), razonSocial: 'Covicen S.A.', cuit: '30-12345678-9', domicilioLegal: 'Calle 1, Córdoba', domicilioComercial: 'Ruta 9 km 340, Carcarañá', enFormacion: false };
    const c = { ...(await fuenteLocalJson.contacto()), lineaGratuita: '0800 555 0000', atencionUsuario: 'atencionalusuario@covicen.com.ar', redes: { instagram: 'https://instagram.com/covicen' } };
    const html = await render(e, c);
    expect(html).toContain('Datos registrales');
    expect(html).toContain('30-12345678-9');
    expect(html).toContain('Domicilio comercial');
    expect(html).toContain('href="mailto:atencionalusuario@covicen.com.ar"');
    expect(html).toContain('href="tel:08005550000"');
    expect(html).toContain('href="https://instagram.com/covicen"');
    expect(html).not.toContain('Sociedad en formación');
  });
  it('fila institucional: Vialidad, Transporte, Presidencia, Red Federal, TelePASE y 140', async () => {
    const html = await render(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto());
    for (const u of ['https://www.argentina.gob.ar/transporte/vialidad-nacional', 'https://www.argentina.gob.ar/transporte', 'https://www.argentina.gob.ar/', 'https://www.argentina.gob.ar/transporte/vialidad-nacional/red-federal-de-concesiones', 'https://www.telepase.com.ar/']) {
      expect(html).toContain(`href="${u}"`);
    }
    expect(html).toContain('aria-label="Sitios institucionales"');
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/components/footer.test.ts tests/lib/formato.test.ts`
Expected: FAIL.

- [ ] **Step 3: `formato.ts` e `institucional.ts`**

Agregar a `src/lib/formato.ts`:

```ts
const fmtFechaHora = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' });
/** "13 de septiembre de 2026, 15:04" (hora Argentina). Para la fecha de última actualización del footer. */
export const fechaHoraLarga = (d: Date): string => fmtFechaHora.format(d).replace(' a las ', ', ').replace(/,\s*(\d{2}:\d{2})$/, ', $1');
```

Si el navegador de Node formatea "13 de septiembre de 2026, 15:04" directamente, los `replace` no hacen nada; si formatea con "a las", lo normalizan. El test fija el formato.

Crear `src/lib/institucional.ts`:

```ts
// Sitios institucionales del pie (PETG 61.6 exige DNV, Secretaría de Transporte y Presidencia). Si existe
// src/assets/institucional/<id>.svg (logo oficial, monocromo, currentColor) se usa inline; si no, un lockup tipográfico.
export const enlacesInstitucionales = [
  { id: 'vialidad-nacional', nombre: 'Vialidad Nacional', url: 'https://www.argentina.gob.ar/transporte/vialidad-nacional' },
  { id: 'transporte', nombre: 'Secretaría de Transporte', url: 'https://www.argentina.gob.ar/transporte' },
  { id: 'presidencia', nombre: 'Presidencia de la Nación', url: 'https://www.argentina.gob.ar/' },
  { id: 'red-federal', nombre: 'Red Federal de Concesiones', url: 'https://www.argentina.gob.ar/transporte/vialidad-nacional/red-federal-de-concesiones' },
  { id: 'telepase', nombre: 'TelePASE', url: 'https://www.telepase.com.ar/' },
] as const;

const logos = import.meta.glob<string>('/src/assets/institucional/*.svg', { eager: true, query: '?raw', import: 'default' });

export const logoInstitucional = (id: string): string | undefined =>
  Object.entries(logos).find(([ruta]) => ruta.endsWith(`/${id}.svg`))?.[1];
```

- [ ] **Step 4: Reescribir `src/components/Footer.astro`**

```astro
---
import { existsSync } from 'node:fs';
import { Facebook, Instagram, Linkedin, Phone, Youtube } from '@lucide/astro';
import Isotipo from '@/components/marca/Isotipo.astro';
import type { Contacto, Empresa } from '@/lib/datos/esquemas';
import { fechaHoraLarga } from '@/lib/formato';
import { enlacesInstitucionales, logoInstitucional } from '@/lib/institucional';
import { ruta } from '@/lib/rutas';
import { enlaceWhatsapp } from '@/lib/whatsapp';

interface Props { empresa: Empresa; contacto: Contacto }
const { empresa, contacto } = Astro.props;
const columnas = [
  { titulo: 'Usuarios', links: [['Tarifas', '/tarifas'], ['Medios de pago', '/medios-de-pago'], ['Emergencias', '/emergencias'], ['Seguridad vial', '/seguridad-vial'], ['Preguntas frecuentes', '/preguntas-frecuentes']] },
  { titulo: 'Empresa', links: [['Quiénes somos', '/quienes-somos'], ['Obras', '/obras'], ['Novedades', '/novedades'], ['Políticas', '/politicas'], ['Transparencia', '/transparencia'], ['Trabajá con nosotros', '/trabaja-con-nosotros']] },
] as const;
const tel = contacto.emergencias.telefono;
const soloDigitos = (t: string) => t.replace(/[^\d+]/g, '');
// Criterio "esconder, no a confirmar": los datos registrales aparecen completos o no aparecen.
const registrales = empresa.razonSocial && empresa.cuit && empresa.domicilioLegal;
// El QR de Data Fiscal lo carga Juli en public/qr-afip.png cuando exista el CUIT.
const hayQr = Boolean(empresa.cuit) && existsSync('public/qr-afip.png');
const redes = [
  ['instagram', 'Instagram', Instagram], ['facebook', 'Facebook', Facebook], ['linkedin', 'LinkedIn', Linkedin], ['youtube', 'YouTube', Youtube],
] as const;
const actualizado = fechaHoraLarga(new Date());
---
<footer class="mt-24 border-t border-borde bg-fondo-2">
  <div class="contenedor grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
    <div>
      <div class="flex items-center gap-3"><Isotipo size={40} /><span class="text-xl font-extrabold">COVICEN</span></div>
      <p class="mt-4 text-sm text-texto-2">Concesionaria del Tramo Centro de la Red Federal de Concesiones. {empresa.concesion.rutas.join(' · ')} · {empresa.concesion.provincias.join(' y ')}.</p>
      {(Object.keys(contacto.redes).length > 0) && (
        <ul class="mt-5 flex flex-wrap gap-2" aria-label="Redes sociales">
          {redes.map(([clave, nombre, Icono]) => contacto.redes[clave] && (
            <li><a href={contacto.redes[clave]} class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-borde text-texto-2 hover:border-borde-fuerte hover:bg-superficie hover:text-texto" rel="noopener noreferrer" target="_blank" aria-label={`${nombre} (se abre en otra pestaña)`}><Icono size={18} aria-hidden="true" /></a></li>
          ))}
          {contacto.redes.x && <li><a href={contacto.redes.x} class="inline-flex h-10 w-10 items-center justify-center rounded-md border border-borde font-extrabold text-texto-2 hover:border-borde-fuerte hover:bg-superficie hover:text-texto" rel="noopener noreferrer" target="_blank" aria-label="X (se abre en otra pestaña)">X</a></li>}
        </ul>
      )}
    </div>
    {columnas.map((c) => (
      <nav aria-label={c.titulo}>
        <h2 class="eyebrow mb-4 text-texto">{c.titulo}</h2>
        <ul class="flex flex-col gap-2">
          {c.links.map(([n, h]) => <li><a href={ruta(h)} class="inline-block py-1 text-texto-2 hover:text-texto">{n}</a></li>)}
        </ul>
      </nav>
    ))}
    <div>
      <h2 class="eyebrow mb-4 text-texto">Contacto</h2>
      <ul class="flex flex-col gap-2 text-texto-2">
        <li><a href={`tel:${soloDigitos(tel)}`} class="inline-flex items-center gap-2 py-1 font-semibold text-texto" aria-label={`Llamar a emergencias, ${tel}`}><Phone size={16} aria-hidden="true" /> {contacto.emergencias.etiqueta} {tel}</a></li>
        {contacto.lineaGratuita && <li><a href={`tel:${soloDigitos(contacto.lineaGratuita)}`} class="inline-block py-1">Atención al usuario {contacto.lineaGratuita}</a></li>}
        {contacto.atencionUsuario && <li><a href={`mailto:${contacto.atencionUsuario}`} class="inline-block py-1">{contacto.atencionUsuario}</a></li>}
        {contacto.whatsapp.numero && <li><a href={enlaceWhatsapp(contacto.whatsapp.numero, 'Hola Covicen')} class="inline-block py-1" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>}
        <li><a href={ruta('/contacto')} class="inline-block py-1">Formulario de contacto</a></li>
        <li><a href={ruta('/proveedores')} class="inline-block py-1">Proveedores</a></li>
      </ul>
      {registrales && (
        <>
          <h2 class="eyebrow mb-3 mt-8 text-texto">Datos registrales</h2>
          <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-texto-2">
            <dt>Razón social</dt><dd>{empresa.razonSocial}</dd>
            <dt>CUIT</dt><dd>{empresa.cuit}</dd>
            <dt>Domicilio legal</dt><dd>{empresa.domicilioLegal}</dd>
            {empresa.domicilioComercial && <><dt>Domicilio comercial</dt><dd>{empresa.domicilioComercial}</dd></>}
          </dl>
          {hayQr && (
            <a href={empresa.constanciaUrl ?? undefined} class="mt-4 inline-block" rel={empresa.constanciaUrl ? 'noopener noreferrer' : undefined} target={empresa.constanciaUrl ? '_blank' : undefined}>
              <img src={ruta('/qr-afip.png')} alt="Código QR de Data Fiscal de AFIP: constancia de inscripción de Covicen" width="96" height="96" loading="lazy" class="rounded-sm bg-white p-1" />
            </a>
          )}
        </>
      )}
    </div>
  </div>
  <div class="border-t border-borde">
    <ul class="contenedor flex flex-wrap items-center justify-center gap-x-8 gap-y-4 py-8" aria-label="Sitios institucionales">
      {enlacesInstitucionales.map((e) => (
        <li>
          <a href={e.url} rel="noopener noreferrer" target="_blank" class="institucional inline-flex items-center gap-2 text-texto-2 hover:text-texto" aria-label={`${e.nombre} (se abre en otra pestaña)`}>
            {logoInstitucional(e.id) ? <span class="logo-institucional" set:html={logoInstitucional(e.id)} /> : <span class="eyebrow border-l-2 border-borde-fuerte pl-2 text-texto-2">{e.nombre}</span>}
          </a>
        </li>
      ))}
      <li><a href={`tel:${soloDigitos(tel)}`} class="btn-vial inline-flex items-center gap-2 px-3 py-1 text-base font-extrabold" aria-label={`Llamar a emergencias, ${tel}`}><Phone size={16} aria-hidden="true" /> {tel}</a></li>
    </ul>
  </div>
  <div class="border-t border-borde">
    <div class="contenedor flex flex-col gap-4 py-6 text-sm text-texto-2 md:flex-row md:items-center md:justify-between">
      <p>{empresa.enFormacion && <span>Sociedad en formación · </span>}Adjudicación: {empresa.concesion.adjudicacion.resolucion}. <a href={ruta('/privacidad')}>Privacidad</a> · <a href="https://www.boletinoficial.gob.ar/" rel="noopener noreferrer" target="_blank">Boletín Oficial</a>{contacto.enlaces.atencionDnv && <> · <a href={contacto.enlaces.atencionDnv} rel="noopener noreferrer" target="_blank">Atención al usuario de Vialidad Nacional</a></>}</p>
      <p><span class="text-texto-3">Última actualización:</span> <time datetime={new Date().toISOString()}>{actualizado}</time></p>
    </div>
  </div>
</footer>
<style>
  .logo-institucional :global(svg) { height: 1.75rem; width: auto; fill: currentColor; }
  .institucional { transition: color var(--dur-micro) var(--ease-salida); }
</style>
```

Si `astro check` dice que `Youtube`, `Facebook`, `Linkedin` o `Instagram` no existen en `@lucide/astro`, buscar el nombre exacto con `grep -o "export { default as [A-Za-z]*" node_modules/@lucide/astro/dist/index.js | grep -i <nombre>` y ajustar el import; nunca dibujar la marca a mano.

- [ ] **Step 5: Tests**

Run: `pnpm vitest run tests/components/footer.test.ts tests/lib/formato.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/Footer.astro src/lib/formato.ts src/lib/institucional.ts tests/components/footer.test.ts tests/lib/formato.test.ts
git commit -m "feat(footer): slots ocultos hasta tener el dato, fila institucional y última actualización real"
```

### Tarea 1.6: Marca — fuera "Corredor Vial del Centro", OG regenerada

**Files:**
- Modify: `src/components/marca/Logotipo.astro`, `src/components/Seo.astro:20`, `src/lib/seo.ts:10`, `src/assets/marca/og.svg`, `src/pages/privacidad.astro:11`, `src/pages/quienes-somos.astro:13`
- Regenerate: `public/og.png`, `public/apple-touch-icon.png` (`pnpm og`)
- Modify: `tests/components/marca.test.ts:23-32`, `tests/components/layout.test.ts:21-24`, `tests/lib/seo.test.ts`

- [ ] **Step 1: Tests**

`tests/components/marca.test.ts`, reemplazar el `describe('Logotipo', …)` por:

```ts
describe('Logotipo', () => {
  it('es un link a Home con nombre accesible, sin descriptor', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Logotipo, {});
    expect(html).toContain('aria-label="Covicen, inicio"');
    expect(html).toContain('href="/"');
    expect(html).toContain('COVICEN');
    expect(html).not.toContain('Corredor Vial del Centro');
  });
});
```

`tests/components/layout.test.ts` línea 23: `expect(html).toContain('<title>Covicen — Tramo Centro</title>');`.

`tests/lib/seo.test.ts`, en el primer `it` agregar `expect(o).not.toHaveProperty('alternateName');`.

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/components/marca.test.ts tests/components/layout.test.ts tests/lib/seo.test.ts`
Expected: FAIL.

- [ ] **Step 3: Cambios**

`src/components/marca/Logotipo.astro`:

```astro
---
import Isotipo from './Isotipo.astro';
import { ruta } from '@/lib/rutas';

interface Props { class?: string }
const { class: clase = '' } = Astro.props;
---
<a href={ruta('/')} aria-label="Covicen, inicio" class:list={['logotipo inline-flex items-center gap-3 text-texto no-underline', clase]}>
  <Isotipo size={36} class="shrink-0" />
  <span class="font-extrabold text-[1.25rem] leading-none tracking-[0.02em]">COVICEN</span>
</a>
<style>
  .logotipo :global(svg) { transition: transform var(--dur-ui) var(--ease-salida); }
  .logotipo:hover :global(svg), .logotipo:focus-visible :global(svg) { transform: rotate(-4deg) scale(1.04); }
</style>
```

`src/components/Seo.astro` línea 20: `const tituloCompleto = esHome ? 'Covicen — Tramo Centro' : \`${titulo} | Covicen\`;`

`src/lib/seo.ts`: borrar la línea 10 (`alternateName: e.descriptor,`).

`src/assets/marca/og.svg`: borrar la línea 17 y reemplazar las líneas 16 y 18 por:

```xml
  <text x="330" y="262" font-family="Archivo" font-weight="800" font-size="96" fill="#E8EEF5" letter-spacing="2">COVICEN</text>
  <text x="96" y="560" font-family="Archivo" font-weight="400" font-size="28" fill="#A9C4D8">Tramo Centro de la Red Federal de Concesiones · RN 9 · RN 19 · RN 34 · 679 km</text>
```

`src/pages/privacidad.astro` línea 11: `<p>{e.marca}{e.enFormacion ? ', sociedad en formación' : \`, ${e.razonSocial}, CUIT ${e.cuit}\`}. Los datos de contacto del responsable se publican en el pie de página cuando se complete la inscripción.</p>`

`src/pages/quienes-somos.astro` línea 13: reemplazar `Covicen (${e.descriptor}) es la sociedad` por `Covicen es la sociedad` (la página entera se reescribe en la Fase 4; acá solo se saca el descriptor).

- [ ] **Step 4: Regenerar la OG**

Run: `pnpm og`
Expected: `ok public/og.png` y `ok public/apple-touch-icon.png`. Abrir `public/og.png` y comprobar: isotipo a la izquierda, "COVICEN" centrado verticalmente con él, la línea de abajo con "679 km", sin la línea del descriptor.

- [ ] **Step 5: Tests**

Run: `pnpm vitest run tests/components tests/lib/seo.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/marca/Logotipo.astro src/components/Seo.astro src/lib/seo.ts src/assets/marca/og.svg public/og.png public/apple-touch-icon.png src/pages/privacidad.astro src/pages/quienes-somos.astro tests/components/marca.test.ts tests/components/layout.test.ts tests/lib/seo.test.ts
git commit -m "feat(marca): fuera el descriptor Corredor Vial del Centro; título Covicen — Tramo Centro; OG regenerada"
```

### Tarea 1.7: Criterio "esconder" y 679 en todos los textos

**Files:**
- Modify: `src/pages/index.astro:26`, `src/pages/el-tramo.astro:13-20`, `src/pages/trabaja-con-nosotros.astro:9`, `src/pages/quienes-somos.astro:14-18`, `src/pages/contacto.astro:16-18`, `src/pages/emergencias.astro:9,20-25`, `src/content/faq/01-que-es-covicen.json`, `src/content/novedades/2026-08-24-adjudicacion-tramo-centro.md:10`
- Modify: `src/components/TablaTarifas.astro:30` (la fila sin valor no dice "a confirmar"; la tabla entera se rehace en la Fase 3)

- [ ] **Step 1: Buscar todo lo que hay que tocar**

Run: `grep -rn -i "a confirmar\|681\|numero a confirmar" src/ --include=*.astro --include=*.json --include=*.md --include=*.ts | grep -v "isotipo-path" | grep -v "tramo.json"`
Expected: la lista de ocurrencias de abajo (si aparece alguna más, entra en esta tarea).

- [ ] **Step 2: Cambios de texto**

- `src/pages/index.astro` línea 26: `descripcion="Covicen, concesionaria del Tramo Centro de la Red Federal de Concesiones: 679 km sobre RN 9, RN 19 y RN 34 en Córdoba y Santa Fe. Tarifas, peajes, emergencias y obras."`
- `src/pages/el-tramo.astro`: línea 13 → `{ valor: Math.floor(tramo.km), unidad: 'km', etiqueta: 'de rutas nacionales', texto: \`Desde Rosario hasta Pilar por la autopista, y desde Santo Tomé hasta el límite con Córdoba por la RN 19. ${numero(tramo.km, 2)} km bajo una misma concesión, según el pliego del Tramo Centro.\` },`; línea 19 → `descripcion="El Tramo Centro de la Red Federal de Concesiones: 679,03 km sobre RN 9 (autopista Rosario–Córdoba), RN 19 y RN 34, en Córdoba y Santa Fe. Mapa, ciudades y estaciones de peaje."`; línea 20 → `titulo="679 kilómetros de centro." intro="Un corredor que une Rosario con Córdoba por la autopista y se abre hacia Santo Tomé, Franck y San Francisco por la RN 19."`.
- `src/pages/trabaja-con-nosotros.astro` línea 9: `titulo="679 km necesitan gente."`.
- `src/pages/quienes-somos.astro` líneas 14–18: sacar el mojón de km (pedido de la reunión):

```astro
    <div class="escalonar grid gap-10 sm:grid-cols-2">
      <div style="--i: 0"><Mojon valor={c.plazoAnios} unidad="años" etiqueta={`de concesión${c.prorrogaAnios ? ` (+${c.prorrogaAnios} prorrogables)` : ''}`} animar /></div>
      <div style="--i: 1"><Mojon valor={c.tramosEtapa} etiqueta="tramos en la Etapa III" animar /></div>
    </div>
```

- `src/pages/contacto.astro` líneas 16–18: el 140 siempre; WhatsApp y correo solo si existen:

```astro
        <li class="tarjeta p-5"><p class="eyebrow flex items-center gap-2"><Phone size={14} aria-hidden="true" /> Emergencias 24 h</p><a href={`tel:${tel.replace(/[^\d+]/g, '')}`} class="mt-2 block text-3xl font-extrabold tabular-nums text-texto no-underline" aria-label={`Llamar a emergencias, ${tel}`}>{tel}</a></li>
        {contacto.whatsapp.numero && <li class="tarjeta p-5"><p class="eyebrow flex items-center gap-2"><MessageCircle size={14} aria-hidden="true" /> WhatsApp</p><a href={enlaceWhatsapp(contacto.whatsapp.numero, 'Hola Covicen')} class="mt-2 inline-block text-texto" target="_blank" rel="noopener noreferrer">Abrir chat</a></li>}
        {contacto.atencionUsuario && <li class="tarjeta p-5"><p class="eyebrow flex items-center gap-2"><Mail size={14} aria-hidden="true" /> Correo</p><a href={`mailto:${contacto.atencionUsuario}`} class="mt-2 inline-block text-texto">{contacto.atencionUsuario}</a></li>}
```

- `src/pages/emergencias.astro`: línea 9 queda `const tel = contacto.emergencias.telefono;`; reemplazar las líneas 20–25 (el condicional) por solo el enlace:

```astro
      <p class="eyebrow">{contacto.emergencias.etiqueta} · 24 horas · gratis desde cualquier celular</p>
      <a href={`tel:${tel.replace(/[^\d+]/g, '')}`} class="mt-3 inline-flex items-center gap-4 font-extrabold tabular-nums text-vial-texto no-underline" style="font-size: clamp(3rem, 2rem + 5vw, 6rem)" aria-label={`Llamar a emergencias, ${tel}`}><Phone size={44} aria-hidden="true" /> {tel}</a>
```

- `src/content/faq/01-que-es-covicen.json`: en `respuesta`, `681,92 km` → `679 km`.
- `src/content/novedades/2026-08-24-adjudicacion-tramo-centro.md` línea 10: `—681,92 km sobre` → `—679 km sobre`.
- `src/components/TablaTarifas.astro` línea 30: reemplazar `<span class="text-texto-2">— <span class="text-xs uppercase tracking-wider">a confirmar</span></span>` por `<span class="text-texto-2" aria-label="Sin valor publicado">—</span>`.

- [ ] **Step 3: Typecheck y suite completa**

Run: `pnpm check && pnpm test`
Expected: PASS. Si `check` marca `contacto.emergencias.telefono` posiblemente nulo en algún archivo no listado, es porque quedó un `tel ? … : …`: simplificarlo (el 140 es obligatorio).

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro src/pages/el-tramo.astro src/pages/trabaja-con-nosotros.astro src/pages/quienes-somos.astro src/pages/contacto.astro src/pages/emergencias.astro src/content/faq/01-que-es-covicen.json src/content/novedades/2026-08-24-adjudicacion-tramo-centro.md src/components/TablaTarifas.astro
git commit -m "feat(contenido): 679 km en todo el sitio, sin relleno 'a confirmar', 140 fijo en contacto y emergencias"
```

### Tarea 1.8: `verificar.ts`: 140, textos prohibidos, 679 y última actualización

**Files:**
- Modify: `scripts/verificar.ts:43-46`
- Modify: `scripts/lib/html.ts` (`textoVisible`)
- Modify: `tests/scripts/html.test.ts`

- [ ] **Step 1: Test de `textoVisible`**

Agregar a `tests/scripts/html.test.ts`:

```ts
  it('textoVisible saca scripts, estilos y etiquetas, deja el texto', () => {
    expect(textoVisible('<head><script>x=681</script><style>.a{}</style></head><body><p class="k681">Hola <b>mundo</b></p></body>').replace(/\s+/g, ' ').trim()).toBe('Hola mundo');
  });
```

(y sumar `textoVisible` al import desde `../../scripts/lib/html.ts`).

- [ ] **Step 2: Implementar**

Agregar a `scripts/lib/html.ts`:

```ts
/** Solo lo que un lector ve: sin <script>, <style> ni etiquetas (los atributos y los hashes de assets no cuentan). */
export const textoVisible = (html: string): string =>
  html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ');
```

En `scripts/verificar.ts`: sumar `textoVisible` al import de la línea 7 y reemplazar las líneas 43–46 por:

```ts
  // 4. emergencias: el 140 (número corto del pliego) en toda página
  if (!/href="tel:140"/.test(html)) fallo(`${nombre}: falta el tel:140 de emergencias`);
  // 5. vigencia en tarifas
  if (nombre.startsWith('tarifas') && !html.includes('Vigencia')) fallo(`${nombre}: la tabla de tarifas debe mostrar la vigencia`);
  // 10. textos prohibidos y datos oficiales (spec 2026-09-13 §2, §3): criterio "esconder", marca y 679 km
  const visible = textoVisible(html);
  for (const p of [/a confirmar/i, /corredor vial del centro/i, /\b681\b/]) if (p.test(visible)) fallo(`${nombre}: el texto contiene ${p}`);
  if ((nombre === 'index.html' || nombre.startsWith('el-tramo')) && !/\b679\b/.test(visible)) fallo(`${nombre}: falta la longitud oficial (679 km)`);
  if (!visible.includes('Última actualización')) fallo(`${nombre}: falta "Última actualización" en el pie`);
```

- [ ] **Step 3: Verificar**

Run: `pnpm vitest run tests/scripts/html.test.ts && pnpm verificar`
Expected: test PASS; `verificar` → `OK: N páginas verificadas, 0 fallos.` Si lista una página con "681" o "a confirmar", corregir el texto en esa página (es contenido, no código) y repetir.

- [ ] **Step 4: Commit**

```bash
git add scripts/verificar.ts scripts/lib/html.ts tests/scripts/html.test.ts
git commit -m "test(verificar): tel:140 en toda página, textos prohibidos, 679 km y última actualización"
```

### Tarea 1.9: Cierre de la Fase 1

- [ ] **Step 1: Todo en verde**

Run: `pnpm check && pnpm test && pnpm verificar`
Expected: verde.

- [ ] **Step 2: Revisión en carril separado**

Dispatch de `rev-bro` con la spec (§2, §3, §5, §6), este plan (Fase 1) y el diff de la fase; corre él mismo las tres verificaciones. Atender hallazgos.

- [ ] **Step 3: Vault y lista para el backend**

- `obsidian/Costura de datos.md`: sección "Campos nuevos del contrato (2026-09-13)" con la lista de la spec §6.2 y la nota "todos opcionales; el backend puede mandarlos cuando quiera".
- `obsidian/Decisiones de arquitectura.md`: filas para "sin descriptor", "esconder, no a confirmar", "679,03 km del PETP", "header de dos filas", "barra de anuncios siempre visible".
- `obsidian/Home.md`: estado "Fase 1 cerrada".

- [ ] **Step 4: Commit (si no se hizo por tarea)**

```bash
git add -A -- src scripts tests docs/contrato public/og.png public/apple-touch-icon.png obsidian
git commit -m "feat(web): Fase 1 completa — marca, datos oficiales, header de dos filas, anuncios y footer"
```

## Fase 2 — Mapa interactivo, tarjetas, El tramo y páginas de estación

Resultado: cada estación del mapa es un enlace con foco que abre su tarjeta; verde las operativas, amarillo y discontinuo las próximas; leyenda con servicios; El tramo con cuatro bloques y una página por estación en `/peajes/<slug>/`.

### Tarea 2.1: Helpers del tramo (`src/lib/tramo.ts`)

**Files:**
- Create: `src/lib/tramo.ts`
- Modify: `src/lib/formato.ts` (`kmTexto`)
- Create: `tests/lib/tramo.test.ts`
- Modify: `tests/lib/formato.test.ts`

**Interfaces:**
- Produces: `kmTexto(n: number): string` ("340", "19,95": coma decimal solo si hay decimales); `estadoCabina(c: Cabina): { clave: 'operativa' | 'proxima'; etiqueta: string }`; `SERVICIOS: ReadonlyArray<readonly [ClaveServicio, string]>`; `ClaveServicio = 'areaDescanso' | 'detencionSegura' | 'gruaGratuita' | 'sanitarios' | 'colocacionTelepase'`; `serviciosDeCabina(c): { clave; etiqueta }[]`; `leyendaServicios(t: Tramo): { clave; etiqueta }[]`; `puntoEnRuta(t: Tramo, ruta: NombreRuta, km: number): { x: number; y: number } | null`.

- [ ] **Step 1: Tests**

Crear `tests/lib/tramo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { estadoCabina, leyendaServicios, puntoEnRuta, serviciosDeCabina } from '@/lib/tramo';

describe('estadoCabina', async () => {
  const t = await fuenteLocalJson.tramo();
  const por = (slug: string) => t.cabinas.find((c) => c.slug === slug)!;
  it('operativa para las existentes, próxima (Free Flow) para las nuevas', () => {
    expect(estadoCabina(por('carcarana'))).toEqual({ clave: 'operativa', etiqueta: 'Operativa' });
    expect(estadoCabina(por('leones'))).toEqual({ clave: 'proxima', etiqueta: 'Próxima · Free Flow' });
  });
  it('servicios: solo los que la estación tiene; la leyenda, solo los que alguna tiene', () => {
    expect(serviciosDeCabina(por('franck')).map((s) => s.clave)).toEqual(['areaDescanso', 'gruaGratuita']);
    expect(serviciosDeCabina(por('totoras'))).toEqual([]);
    expect(leyendaServicios(t).map((s) => s.clave)).toEqual(['areaDescanso', 'gruaGratuita']);
  });
});

describe('puntoEnRuta', async () => {
  const t = await fuenteLocalJson.tramo();
  const ciudad = (slug: string) => t.ciudades.find((c) => c.slug === slug)!.mapa;
  it('en la progresiva inicial devuelve el primer nodo del trazado y en la final el último', () => {
    expect(puntoEnRuta(t, 'RN 9', 297)).toEqual(ciudad('rosario'));
    expect(puntoEnRuta(t, 'RN 9', 660.16)).toEqual(ciudad('cordoba'));
    expect(puntoEnRuta(t, 'RN 34', 188.68)).toEqual(ciudad('empalme-rn-19'));
  });
  it('recorta los km fuera del tramo y cae en el medio del trazo para un km intermedio', () => {
    expect(puntoEnRuta(t, 'RN 34', 999)).toEqual(ciudad('empalme-rn-19'));
    const p = puntoEnRuta(t, 'RN 34', 94)!;
    expect(p.y).toBeLessThan(ciudad('rosario').y);
    expect(p.y).toBeGreaterThan(ciudad('empalme-rn-19').y);
  });
  it('devuelve null si la ruta no tiene progresivas', () => {
    const sinPk = { ...t, rutas: t.rutas.map((r) => ({ ...r, pkInicial: undefined, pkFinal: undefined })) };
    expect(puntoEnRuta(sinPk, 'RN 9', 340)).toBeNull();
  });
});
```

Agregar a `tests/lib/formato.test.ts` (y `kmTexto` al import): `it('kmTexto: coma decimal solo si hay decimales', () => { expect(kmTexto(340)).toBe('340'); expect(kmTexto(19.95)).toBe('19,95'); });`

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm vitest run tests/lib/tramo.test.ts tests/lib/formato.test.ts`
Expected: FAIL (módulo inexistente; `kmTexto` no existe).

- [ ] **Step 3: Implementar `kmTexto` y `src/lib/tramo.ts`**

Agregar a `src/lib/formato.ts`: `/** Kilómetro para mostrar: "340", "19,95". */ export const kmTexto = (n: number): string => numero(n, Number.isInteger(n) ? 0 : 2);`

```ts
// Lo que el mapa y las tarjetas derivan del contrato: estado operativo, servicios y la posición de un km sobre el trazo.
import type { Cabina, NombreRuta, Tramo } from '@/lib/datos/esquemas';
import { cabinaOperativa } from '@/lib/datos/esquemas';

export type EstadoOperativo = { clave: 'operativa' | 'proxima'; etiqueta: string };

/** Verde (cobra hoy) o amarillo (cobra cuando Vialidad la habilite). Las nuevas nacen con Free Flow (PETP art. 2). */
export const estadoCabina = (c: Cabina): EstadoOperativo =>
  cabinaOperativa(c) ? { clave: 'operativa', etiqueta: 'Operativa' } : { clave: 'proxima', etiqueta: c.freeFlow ? 'Próxima · Free Flow' : 'Próxima' };

export const SERVICIOS = [
  ['areaDescanso', 'Área de descanso'],
  ['detencionSegura', 'Sector de detención segura'],
  ['gruaGratuita', 'Grúa y remolque gratuitos'],
  ['sanitarios', 'Sanitarios'],
  ['colocacionTelepase', 'Colocación de TelePASE'],
] as const;
export type ClaveServicio = (typeof SERVICIOS)[number][0];
type ItemServicio = { clave: ClaveServicio; etiqueta: string };

export const serviciosDeCabina = (c: Cabina): ItemServicio[] =>
  SERVICIOS.filter(([k]) => c.servicios?.[k] === true).map(([clave, etiqueta]) => ({ clave, etiqueta }));

/** Ítems de la leyenda: solo los servicios que alguna estación tiene (detención segura hoy no aparece: nadie sabe dónde están). */
export const leyendaServicios = (t: Tramo): ItemServicio[] =>
  SERVICIOS.filter(([k]) => t.cabinas.some((c) => c.servicios?.[k] === true)).map(([clave, etiqueta]) => ({ clave, etiqueta }));

/** Punto del SVG para un km de una ruta. Interpola a lo largo de la polilínea del trazado, que va en el sentido de las
 *  progresivas (pkInicial en el primer nodo, pkFinal en el último). Es esquemático: el dibujo no está a escala. */
export const puntoEnRuta = (t: Tramo, nombre: NombreRuta, km: number): { x: number; y: number } | null => {
  const ruta = t.rutas.find((r) => r.nombre === nombre);
  const trazado = t.trazados.find((z) => z.ruta === nombre);
  if (!ruta || !trazado || ruta.pkInicial === undefined || ruta.pkFinal === undefined || ruta.pkFinal <= ruta.pkInicial) return null;
  const coords = new Map(t.ciudades.map((c) => [c.slug, c.mapa]));
  const puntos = trazado.ciudades.map((s) => coords.get(s)).filter((p): p is { x: number; y: number } => p !== undefined);
  if (puntos.length < 2) return null;
  const largos = puntos.slice(1).map((p, i) => Math.hypot(p.x - puntos[i]!.x, p.y - puntos[i]!.y));
  const total = largos.reduce((a, b) => a + b, 0);
  const fraccion = Math.min(1, Math.max(0, (km - ruta.pkInicial) / (ruta.pkFinal - ruta.pkInicial)));
  let resta = fraccion * total;
  for (let i = 0; i < largos.length; i++) {
    const l = largos[i]!;
    if (resta <= l || i === largos.length - 1) {
      const u = l === 0 ? 0 : Math.min(1, resta / l);
      const a = puntos[i]!;
      const b = puntos[i + 1]!;
      return { x: Math.round(a.x + (b.x - a.x) * u), y: Math.round(a.y + (b.y - a.y) * u) };
    }
    resta -= l;
  }
  return null;
};
```

- [ ] **Step 4: Correr los tests**

Run: `pnpm vitest run tests/lib/tramo.test.ts tests/lib/formato.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/tramo.ts src/lib/formato.ts tests/lib/tramo.test.ts tests/lib/formato.test.ts
git commit -m "feat(tramo): estado operativo, servicios, posición por km sobre el trazo y formato de km"
```

### Tarea 2.2: Tarjeta de estación y `Senal` verde

**Files:**
- Create: `src/components/TarjetaEstacion.astro`
- Modify: `src/components/ui/Senal.astro`
- Create: `tests/components/estacion.test.ts`

**Interfaces:**
- Produces: `<TarjetaEstacion cabina={Cabina} completa?: boolean nivel?: 'h2' | 'h3' />` (raíz `<article data-estacion-tarjeta={slug}>`); `Senal` acepta `variante: 'vial' | 'frio' | 'ok'`.

- [ ] **Step 1: Test**

Crear `tests/components/estacion.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import TarjetaEstacion from '@/components/TarjetaEstacion.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async (slug: string, props: Record<string, unknown> = {}) => {
  const cabina = (await fuenteLocalJson.tramo()).cabinas.find((c) => c.slug === slug)!;
  return (await AstroContainer.create()).renderToString(TarjetaEstacion, { props: { cabina, ...props } });
};

describe('TarjetaEstacion', () => {
  it('operativa: verde, vías, sentido, servicios con ícono, link a su cuadro y al 140', async () => {
    const html = await render('carcarana');
    expect(html).toContain('data-estacion-tarjeta="carcarana"');
    expect(html).toContain('>Operativa<');
    expect(html).toContain('bg-ok');
    expect(html).toContain('>10<');
    expect(html).toContain('Cobra en ambos sentidos');
    expect(html).toContain('Área de descanso');
    expect(html).toContain('href="/tarifas/#carcarana"');
    expect(html).toContain('href="/peajes/carcarana/"');
    expect(html).toContain('href="tel:140"');
  });
  it('próxima: amarilla, sin cuadro, con la aclaración de que todavía no cobra', async () => {
    const html = await render('leones');
    expect(html).toContain('Próxima · Free Flow');
    expect(html).not.toContain('href="/tarifas/#leones"');
    expect(html).toContain('Cobra cuando Vialidad Nacional la habilite');
    expect(html).not.toContain('Área de descanso');
  });
  it('completa: sin el link a la ficha, con h2', async () => {
    const html = await render('franck', { completa: true, nivel: 'h2' });
    expect(html).not.toContain('Ficha completa');
    expect(html).toContain('<h2');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm vitest run tests/components/estacion.test.ts`
Expected: FAIL.

- [ ] **Step 3: `Senal` con variante `ok`**

Reemplazar `src/components/ui/Senal.astro`:

```astro
---
interface Props { variante?: 'vial' | 'frio' | 'ok'; class?: string }
const { variante = 'vial', class: clase = '' } = Astro.props;
const colores = { vial: 'bg-vial text-sobre-vial', frio: 'border border-borde-fuerte bg-superficie-2 text-texto', ok: 'bg-ok text-sobre-ok' };
---
<span class:list={['senal inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-extrabold uppercase tracking-[0.12em]', colores[variante], clase]}><slot /></span>
```

(`text-xs` = 12 px: el mínimo del pliego para anotaciones; el `text-[0.7rem]` anterior era 11,2 px.)

- [ ] **Step 4: Crear `src/components/TarjetaEstacion.astro`**

```astro
---
// Tarjeta de una estación: estado, ubicación, vías, sentido, atención, servicios con ícono y accesos. La usan el mapa
// interactivo, El tramo y la página de la estación. Todo sale del contrato; lo que no está, no se muestra.
import { Bath, Coffee, Phone, ShieldCheck, Tag, Truck } from '@lucide/astro';
import Senal from '@/components/ui/Senal.astro';
import type { Cabina } from '@/lib/datos/esquemas';
import { kmTexto } from '@/lib/formato';
import { ruta } from '@/lib/rutas';
import { estadoCabina, serviciosDeCabina, type ClaveServicio } from '@/lib/tramo';
interface Props { cabina: Cabina; completa?: boolean; nivel?: 'h2' | 'h3' }
const { cabina: c, completa = false, nivel = 'h3' } = Astro.props;
const Titulo = nivel;
const estado = estadoCabina(c);
const servicios = serviciosDeCabina(c);
const iconos: Record<ClaveServicio, typeof Coffee> = { areaDescanso: Coffee, detencionSegura: ShieldCheck, gruaGratuita: Truck, sanitarios: Bath, colocacionTelepase: Tag };
const sentidos = { ambos: 'Cobra en ambos sentidos', ascendente: 'Cobra en sentido ascendente', descendente: 'Cobra en sentido descendente' } as const;
---
<article class="tarjeta p-6" data-estacion-tarjeta={c.slug}>
  <div class="flex items-start justify-between gap-3">
    <div>
      <p class="eyebrow">{c.ruta}{c.km !== null && ` · km ${kmTexto(c.km)}`}</p>
      <Titulo class="mt-2 text-2xl">{c.nombre}</Titulo>
      <p class="mt-1 text-sm text-texto-2">{c.localidad}, {c.provincia}</p>
    </div>
    <Senal variante={estado.clave === 'operativa' ? 'ok' : 'vial'}>{estado.etiqueta}</Senal>
  </div>
  <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-texto-2">
    {c.vias !== undefined && <><dt class="text-texto-3">Vías</dt><dd>{c.vias}</dd></>}
    {c.sentido && <><dt class="text-texto-3">Sentido</dt><dd>{sentidos[c.sentido]}</dd></>}
    {c.horarioAtencion && <><dt class="text-texto-3">Atención</dt><dd>{c.horarioAtencion}</dd></>}
    {c.telefono && <><dt class="text-texto-3">Teléfono</dt><dd><a href={`tel:${c.telefono.replace(/[^\d+]/g, '')}`}>{c.telefono}</a></dd></>}
  </dl>
  {servicios.length > 0 && (
    <ul class="mt-4 flex flex-wrap gap-2" aria-label="Servicios">
      {servicios.map((s) => { const Icono = iconos[s.clave]; return <li class="inline-flex items-center gap-1.5 rounded-sm border border-borde px-2 py-1 text-sm text-texto-2"><Icono size={14} aria-hidden="true" /> {s.etiqueta}</li>; })}
    </ul>
  )}
  {estado.clave === 'proxima' && <p class="mt-4 text-sm text-texto-2">Cobra cuando Vialidad Nacional la habilite. Hasta entonces, en esta estación no se paga.</p>}
  <div class="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
    {estado.clave === 'operativa' && <a href={ruta(`/tarifas#${c.slug}`)}>Ver su cuadro tarifario</a>}
    {!completa && <a href={ruta(`/peajes/${c.slug}`)}>Ficha completa</a>}
    <a href="tel:140" class="inline-flex items-center gap-1 text-vial-texto" aria-label="Llamar a emergencias, 140"><Phone size={14} aria-hidden="true" /> 140</a>
  </div>
</article>
```

Si `Bath`, `Coffee`, `ShieldCheck`, `Tag` o `Truck` no existen en `@lucide/astro`: `grep -o "export { default as [A-Za-z]*" node_modules/@lucide/astro/dist/index.js | grep -i <nombre>` y elegir el más parecido (nunca dibujarlos a mano).

- [ ] **Step 5: Tests**

Run: `pnpm vitest run tests/components/estacion.test.ts tests/components/ui.test.ts tests/styles`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/TarjetaEstacion.astro src/components/ui/Senal.astro tests/components/estacion.test.ts
git commit -m "feat(mapa): tarjeta de estación con estado, servicios y accesos; señal verde"
```

### Tarea 2.3: Mapa interactivo (enlaces con foco, colores por estado, leyenda condicional, incidentes)

**Files:**
- Modify: `src/components/ilustraciones/MapaTramo.astro` (todo)
- Create: `src/components/MapaInteractivo.astro`, `src/scripts/mapa.ts`
- Modify: `tests/components/ilustraciones.test.ts:7-20`, `tests/presupuesto.test.ts:7`
- Create: `tests/components/mapa.test.ts`

**Interfaces:**
- Produces: `<MapaTramo tramo incidentes? modo? class? />` (SVG `role="group"`, cada estación `<a data-estacion={slug} data-estado-operativo="operativa|proxima">`); `<MapaInteractivo tramo incidentes? modo? disposicion?: 'lado' | 'abajo' />` (raíz `[data-mapa-interactivo]`, tarjetas en `[data-tarjeta-estacion={slug}]`); script `mapa.ts`.

- [ ] **Step 1: Tests**

Reemplazar el `describe('MapaTramo', …)` de `tests/components/ilustraciones.test.ts` (líneas 7–20) por:

```ts
describe('MapaTramo', () => {
  const render = async (props: Record<string, unknown> = {}) => (await AstroContainer.create()).renderToString(MapaTramo, { props: { tramo: await fuenteLocalJson.tramo(), modo: 'scroll', ...props } });
  it('dibuja las 3 rutas, las 6 estaciones como enlaces con nombre y etiqueta las ciudades principales', async () => {
    const html = await render();
    expect(html.match(/class="dibujar/g)?.length).toBe(6); // 3 rutas × 2 trazos sólidos (glow, línea)
    expect(html.match(/class="marcas-vivas/g)?.length).toBe(3);
    expect(html.match(/data-estacion="/g)?.length).toBe(6);
    expect(html).toContain('aria-label="Estación Carcarañá, RN 9 km 340, operativa"');
    expect(html).toContain('aria-label="Estación Leones, RN 9 km 454, próxima · free flow"');
    expect(html).toContain('href="/peajes/carcarana/"');
    expect(html).toContain('role="group"');
    expect(html).not.toContain('role="img"');
    expect(html).toContain('>Rosario<');
    expect(html).not.toContain('>Empalme RN 19<'); // los empalmes no llevan etiqueta
  });
  it('colores por estado y leyenda solo con los servicios que existen', async () => {
    const html = await render();
    expect(html.match(/data-estado-operativo="operativa"/g)?.length).toBe(3);
    expect(html.match(/data-estado-operativo="proxima"/g)?.length).toBe(3);
    expect(html).toContain('Estación operativa');
    expect(html).toContain('Estación próxima');
    expect(html).toContain('Área de descanso');
    expect(html).not.toContain('Sector de detención segura');
  });
  it('ubica incidentes sobre el trazo y los suma a la leyenda', async () => {
    const html = await render({ incidentes: [{ ruta: 'RN 9', km: 400, descripcion: 'Bacheo', severidad: 'precaucion' }] });
    expect(html).toContain('data-severidad="precaucion"');
    expect(html).toContain('Incidente informado');
  });
});
```

Crear `tests/components/mapa.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import MapaInteractivo from '@/components/MapaInteractivo.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('MapaInteractivo', () => {
  it('mapa + una tarjeta por estación (todas visibles sin JS) en una región viva', async () => {
    const html = await (await AstroContainer.create()).renderToString(MapaInteractivo, { props: { tramo: await fuenteLocalJson.tramo() } });
    expect(html).toContain('data-mapa-interactivo');
    expect(html.match(/data-tarjeta-estacion="/g)?.length).toBe(6);
    expect(html).not.toMatch(/data-tarjeta-estacion="[^"]+" hidden/);
    expect(html).toContain('aria-live="polite"');
  });
});
```

En `tests/presupuesto.test.ts` línea 7 agregar `'src/scripts/mapa.ts'`.

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/components/ilustraciones.test.ts tests/components/mapa.test.ts`
Expected: FAIL.

- [ ] **Step 3: Reescribir `src/components/ilustraciones/MapaTramo.astro`**

```astro
---
// Mapa esquemático del Tramo Centro. viewBox 820×520: son las coordenadas del contrato (el panel del backend las usa para
// la vista previa), NO se cambia; el tamaño lo da el contenedor. Cada estación es un enlace con foco a su página; con JS
// (scripts/mapa.ts, desde MapaInteractivo) el toque muestra su tarjeta. Verde = operativa; amarillo + anillo discontinuo =
// próxima (nada se comunica solo por color). Los incidentes del estado de la traza se ubican por km (lib/tramo.ts).
import { Bath, Coffee, ShieldCheck, Tag, TriangleAlert, Truck } from '@lucide/astro';
import type { EstadoRuta, Tramo } from '@/lib/datos/esquemas';
import { kmTexto } from '@/lib/formato';
import { ruta } from '@/lib/rutas';
import { estadoCabina, leyendaServicios, puntoEnRuta, type ClaveServicio } from '@/lib/tramo';
interface Props { tramo: Tramo; incidentes?: NonNullable<EstadoRuta['incidentes']>; modo?: 'scroll' | 'cargar'; class?: string }
const { tramo, incidentes = [], modo = 'scroll', class: clase = '' } = Astro.props;
const porSlug = new Map(tramo.ciudades.map((c) => [c.slug, c]));
const ciudad = (s: string) => {
  const c = porSlug.get(s);
  if (!c) throw new Error(`MapaTramo: la ciudad "${s}" no existe en tramo.json`);
  return c;
};
const d = (slugs: string[]) => slugs.map((s, i) => `${i === 0 ? 'M' : 'L'}${ciudad(s).mapa.x} ${ciudad(s).mapa.y}`).join(' ');
const etiquetaRuta = (slugs: string[]) => {
  const medio = Math.floor(slugs.length / 2);
  const a = ciudad(slugs[medio - 1]!);
  const b = ciudad(slugs[medio]!);
  return { x: (a.mapa.x + b.mapa.x) / 2, y: (a.mapa.y + b.mapa.y) / 2 - 10 };
};
const claseDibujar = modo === 'scroll' ? 'dibujar al-scroll' : 'dibujar al-cargar';
const claseBaliza = modo === 'scroll' ? 'baliza' : 'baliza al-cargar';
const idTitulo = `mapa-titulo-${Math.random().toString(36).slice(2, 8)}`;
const titulo = `Mapa esquemático del Tramo Centro: ${tramo.rutas.map((r) => r.nombre).join(', ')} entre ${tramo.ciudades.filter((c) => c.principal).map((c) => c.nombre).join(', ')}, con ${tramo.cabinas.length} estaciones de peaje.`;
const iconos: Record<ClaveServicio, typeof Coffee> = { areaDescanso: Coffee, detencionSegura: ShieldCheck, gruaGratuita: Truck, sanitarios: Bath, colocacionTelepase: Tag };
const marcadores = incidentes.flatMap((inc) => { const p = inc.km === null ? null : puntoEnRuta(tramo, inc.ruta, inc.km); return p ? [{ ...inc, p }] : []; });
---
<figure class:list={['mapa', clase]}>
  <p id={idTitulo} class="sr-only">{titulo}</p>
  <svg viewBox="0 0 820 520" role="group" aria-labelledby={idTitulo} class="h-auto w-full">
    <defs>
      <pattern id="mapa-plano" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="var(--color-plano)"></path></pattern>
      <filter id="mapa-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"></feGaussianBlur></filter>
    </defs>
    <rect width="820" height="520" fill="url(#mapa-plano)"></rect>
    {tramo.trazados.map((t, i) => (
      <g>
        <path d={d(t.ciudades)} fill="none" stroke="var(--color-borde-fuerte)" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"></path>
        <path d={d(t.ciudades)} fill="none" stroke="var(--color-glow)" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" filter="url(#mapa-glow)" pathLength="1000" class={claseDibujar}></path>
        <path d={d(t.ciudades)} fill="none" stroke="var(--color-acento)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" pathLength="1000" class={claseDibujar}></path>
        <path d={d(t.ciudades)} fill="none" stroke="var(--color-vial)" stroke-width="1" stroke-dasharray="6 12" opacity="0.7" pathLength="1000" class="marcas-vivas aparece"></path>
        <path d={d(t.ciudades)} fill="none" stroke="var(--color-texto)" stroke-width="3" stroke-linecap="round" pathLength="1000" filter="url(#mapa-glow)" class="luz-viaja aparece" style={`--i: ${i}`}></path>
        <text x={etiquetaRuta(t.ciudades).x} y={etiquetaRuta(t.ciudades).y} class="ruta-etiqueta" text-anchor="middle">{t.ruta}</text>
      </g>
    ))}
    {tramo.ciudades.map((c) => (
      <g>
        {c.tipo === 'empalme' ? (
          <rect x={c.mapa.x - 3} y={c.mapa.y - 3} width="6" height="6" fill="var(--color-fondo)" stroke="var(--color-acento)" stroke-width="1.5"></rect>
        ) : (
          <circle cx={c.mapa.x} cy={c.mapa.y} r={c.principal ? 6 : 3.5} fill="var(--color-fondo)" stroke="var(--color-acento)" stroke-width={c.principal ? 2 : 1.5}></circle>
        )}
        {c.principal && (
          <text x={c.mapa.x + (c.mapa.x > 410 ? -12 : 12)} y={c.mapa.y + 5} class="ciudad-etiqueta" text-anchor={c.mapa.x > 410 ? 'end' : 'start'}>{c.nombre}</text>
        )}
      </g>
    ))}
    {marcadores.map((m) => (
      <g class="incidente" data-severidad={m.severidad} transform={`translate(${m.p.x} ${m.p.y})`}>
        <title>{`${m.ruta}${m.km !== null ? ` km ${kmTexto(m.km)}` : ''}: ${m.descripcion}`}</title>
        <path d="M0 -10 L9 6 L-9 6 Z" class="incidente-forma" stroke="var(--color-fondo)" stroke-width="1.5" stroke-linejoin="round"></path>
        <circle cy="1" r="1.4" fill="var(--color-fondo)"></circle>
      </g>
    ))}
    {tramo.cabinas.map((cab, i) => {
      const e = estadoCabina(cab);
      return (
        <a href={ruta(`/peajes/${cab.slug}`)} class={claseBaliza} style={`--i: ${i}`} data-estacion={cab.slug} data-estado-operativo={e.clave} aria-label={`Estación ${cab.nombre}, ${cab.ruta}${cab.km !== null ? ` km ${kmTexto(cab.km)}` : ''}, ${e.etiqueta.toLowerCase()}`}>
          <circle cx={cab.mapa.x} cy={cab.mapa.y} r="14" class="baliza-halo" opacity="0.18"></circle>
          <circle cx={cab.mapa.x} cy={cab.mapa.y} r="19" class="baliza-foco" fill="none" stroke-width="2"></circle>
          {e.clave === 'proxima' && <circle cx={cab.mapa.x} cy={cab.mapa.y} r="11" class="baliza-anillo" fill="none" stroke-width="1.5" stroke-dasharray="4 3"></circle>}
          <circle cx={cab.mapa.x} cy={cab.mapa.y} r="6" class="baliza-punto" stroke="var(--color-fondo)" stroke-width="2"></circle>
          <text x={cab.mapa.x} y={cab.mapa.y - 18} class="cabina-etiqueta" text-anchor="middle">{cab.nombre}</text>
        </a>
      );
    })}
  </svg>
  <figcaption class="mt-4 text-sm text-texto-2">
    <ul class="flex flex-wrap gap-x-6 gap-y-2" aria-label="Leyenda">
      <li class="inline-flex items-center gap-2"><span class="inline-block h-0.5 w-6 bg-acento" aria-hidden="true"></span> Rutas del tramo</li>
      <li class="inline-flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-full bg-ok" aria-hidden="true"></span> Estación operativa</li>
      <li class="inline-flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-full border-2 border-dashed border-vial-texto" aria-hidden="true"></span> Estación próxima</li>
      <li class="inline-flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-full border-2 border-acento" aria-hidden="true"></span> Ciudad</li>
      {leyendaServicios(tramo).map((s) => { const Icono = iconos[s.clave]; return <li class="inline-flex items-center gap-2"><Icono size={14} aria-hidden="true" /> {s.etiqueta}</li>; })}
      {marcadores.length > 0 && <li class="inline-flex items-center gap-2"><TriangleAlert size={14} aria-hidden="true" /> Incidente informado</li>}
    </ul>
  </figcaption>
</figure>
<style>
  .mapa text { font-family: var(--font-sans); fill: var(--color-texto-2); }
  .ruta-etiqueta { font-size: 13px; font-weight: 800; letter-spacing: 0.12em; fill: var(--color-acento); }
  .ciudad-etiqueta { font-size: 15px; font-weight: 600; fill: var(--color-texto); }
  .cabina-etiqueta { font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0; transition: opacity var(--dur-ui) var(--ease-salida); }
  .baliza { cursor: pointer; outline: none; }
  .baliza[data-estado-operativo="operativa"] .baliza-halo, .baliza[data-estado-operativo="operativa"] .baliza-punto { fill: var(--color-ok); }
  .baliza[data-estado-operativo="operativa"] .cabina-etiqueta { fill: var(--color-ok); }
  .baliza[data-estado-operativo="proxima"] .baliza-halo, .baliza[data-estado-operativo="proxima"] .baliza-punto { fill: var(--color-vial); }
  .baliza[data-estado-operativo="proxima"] .baliza-anillo { stroke: var(--color-vial); }
  .baliza[data-estado-operativo="proxima"] .cabina-etiqueta { fill: var(--color-vial-texto); }
  /* Foco de teclado y estación elegida: anillo con el acento (el outline no se dibuja en <a> de SVG). */
  .baliza-foco { stroke: var(--color-acento); opacity: 0; transition: opacity var(--dur-micro); }
  .baliza:focus-visible .baliza-foco, .baliza[aria-current="true"] .baliza-foco { opacity: 1; }
  .baliza:hover .cabina-etiqueta, .baliza:focus-visible .cabina-etiqueta, .baliza[aria-current="true"] .cabina-etiqueta { opacity: 1; }
  .baliza:hover .baliza-halo, .baliza:focus-visible .baliza-halo { animation-play-state: paused; transform: scale(1.5); opacity: 0.4; }
  .incidente-forma { fill: var(--color-acento); }
  .incidente[data-severidad="precaucion"] .incidente-forma { fill: var(--color-vial); }
  .incidente[data-severidad="corte"] .incidente-forma { fill: var(--color-error); }
  @media (min-width: 48rem) { .cabina-etiqueta { opacity: 0.9; } }
</style>
```

- [ ] **Step 4: `MapaInteractivo.astro` y `mapa.ts`**

Crear `src/components/MapaInteractivo.astro`:

```astro
---
// El mapa más las tarjetas de estación. Sin JS: todas las tarjetas listadas y cada estación enlaza a su página.
// Con JS (scripts/mapa.ts): se ve solo la tarjeta de la estación elegida; arranca la primera operativa.
import MapaTramo from '@/components/ilustraciones/MapaTramo.astro';
import TarjetaEstacion from '@/components/TarjetaEstacion.astro';
import type { EstadoRuta, Tramo } from '@/lib/datos/esquemas';
interface Props { tramo: Tramo; incidentes?: NonNullable<EstadoRuta['incidentes']>; modo?: 'scroll' | 'cargar'; disposicion?: 'lado' | 'abajo' }
const { tramo, incidentes = [], modo = 'scroll', disposicion = 'lado' } = Astro.props;
---
<div class:list={['mapa-interactivo grid gap-8', disposicion === 'lado' && 'lg:grid-cols-[1.6fr_1fr] lg:items-start']} data-mapa-interactivo>
  <MapaTramo {tramo} {incidentes} {modo} />
  <div class="grid gap-4" aria-live="polite" aria-label="Estación seleccionada">
    {tramo.cabinas.map((c) => <div data-tarjeta-estacion={c.slug}><TarjetaEstacion cabina={c} /></div>)}
  </div>
</div>
<script src="../scripts/mapa.ts"></script>
```

Crear `src/scripts/mapa.ts`:

```ts
// Mapa interactivo: al tocar (o Enter sobre) una estación se muestra solo su tarjeta y la estación queda marcada.
// Sin JS el enlace lleva a la página de la estación y todas las tarjetas quedan visibles: esto es solo mejora.
const montar = (raiz: HTMLElement) => {
  const balizas = [...raiz.querySelectorAll<HTMLAnchorElement>('[data-estacion]')];
  const tarjetas = [...raiz.querySelectorAll<HTMLElement>('[data-tarjeta-estacion]')];
  if (!balizas.length || !tarjetas.length) return;
  const elegir = (slug: string) => {
    tarjetas.forEach((t) => { t.hidden = t.dataset.tarjetaEstacion !== slug; });
    balizas.forEach((b) => { if (b.dataset.estacion === slug) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  };
  balizas.forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); elegir(b.dataset.estacion!); }));
  const inicial = balizas.find((b) => b.dataset.estadoOperativo === 'operativa') ?? balizas[0]!;
  elegir(inicial.dataset.estacion!);
};
const iniciar = () => document.querySelectorAll<HTMLElement>('[data-mapa-interactivo]:not([data-montado])').forEach((r) => { r.dataset.montado = ''; montar(r); });
document.addEventListener('astro:page-load', iniciar);

export {};
```

- [ ] **Step 5: Tests**

Run: `pnpm vitest run tests/components/ilustraciones.test.ts tests/components/mapa.test.ts tests/presupuesto.test.ts tests/styles`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ilustraciones/MapaTramo.astro src/components/MapaInteractivo.astro src/scripts/mapa.ts tests/components/ilustraciones.test.ts tests/components/mapa.test.ts tests/presupuesto.test.ts
git commit -m "feat(mapa): estaciones como enlaces con foco, verde/amarillo por estado, tarjeta al tocar, leyenda e incidentes"
```

### Tarea 2.4: Home, El tramo en cuatro bloques y `/peajes/[slug]/`

**Files:**
- Modify: `src/components/home/ElTramo.astro` (todo)
- Modify: `src/pages/el-tramo.astro` (todo)
- Create: `src/pages/peajes/[slug].astro`
- Modify: `scripts/verificar.ts` (existencia de las seis páginas)
- Create: `tests/components/paginas-estacion.test.ts`

- [ ] **Step 1: Test de las páginas de estación**

Crear `tests/components/paginas-estacion.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Peaje, { getStaticPaths } from '@/pages/peajes/[slug].astro';

describe('/peajes/[slug]/', () => {
  it('genera una página por estación con h1, Place en JSON-LD y el 140', async () => {
    const rutas = await getStaticPaths();
    expect(rutas.map((r) => r.params.slug).sort()).toEqual(['carcarana', 'franck', 'james-craik', 'leones', 'san-francisco', 'totoras']);
    const c = await AstroContainer.create();
    const html = await c.renderToString(Peaje, { request: new Request('https://covicen.test/peajes/carcarana/'), params: { slug: 'carcarana' }, props: rutas.find((r) => r.params.slug === 'carcarana')!.props });
    expect(html).toContain('<title>Peaje Carcarañá | Covicen</title>');
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain('"@type":"Place"');
    expect(html).toContain('href="tel:140"');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm vitest run tests/components/paginas-estacion.test.ts`
Expected: FAIL (la página no existe).

- [ ] **Step 3: Home — `src/components/home/ElTramo.astro`**

```astro
---
import { ArrowRight } from '@lucide/astro';
import MapaInteractivo from '@/components/MapaInteractivo.astro';
import Boton from '@/components/ui/Boton.astro';
import Mojon from '@/components/ui/Mojon.astro';
import Seccion from '@/components/ui/Seccion.astro';
import type { Tramo } from '@/lib/datos/esquemas';
import { cabinaOperativa } from '@/lib/datos/esquemas';
interface Props { tramo: Tramo }
const { tramo } = Astro.props;
const operativas = tramo.cabinas.filter(cabinaOperativa).length;
---
<Seccion id="tramo" indice="02" eyebrow="El tramo" titulo="Tres rutas, dos provincias, un corredor." intro={`${tramo.rutas.map((r) => `${r.nombre} (${r.descripcion})`).join(', ')}. Tocá una estación para ver su ficha: en verde las que cobran hoy, en amarillo las próximas.`} fondo="fondo-2">
  <div class="revelar tarjeta tarjeta-panel">
    <MapaInteractivo {tramo} modo="scroll" disposicion="lado" />
    <div class="escalonar mt-10 grid gap-8 border-t border-borde pt-8 sm:grid-cols-3">
      <div style="--i: 0"><Mojon valor={Math.floor(tramo.km)} unidad="km" etiqueta="de rutas nacionales" animar /></div>
      <div style="--i: 1"><Mojon valor={tramo.rutas.length} etiqueta="rutas: RN 9, RN 19 y RN 34" animar /></div>
      <div style="--i: 2"><Mojon valor={operativas} etiqueta={`estaciones operativas de ${tramo.cabinas.length}`} animar /></div>
    </div>
    <div class="revelar mt-8"><Boton href="/el-tramo" variante="secundario">Ver el tramo en detalle <ArrowRight size={18} aria-hidden="true" /></Boton></div>
  </div>
</Seccion>
```

- [ ] **Step 4: Página `src/pages/el-tramo.astro`**

```astro
---
import { ArrowRight } from '@lucide/astro';
import Base from '@/layouts/Base.astro';
import MapaInteractivo from '@/components/MapaInteractivo.astro';
import TarjetaEstacion from '@/components/TarjetaEstacion.astro';
import Boton from '@/components/ui/Boton.astro';
import Mojon from '@/components/ui/Mojon.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
import { cabinaOperativa } from '@/lib/datos/esquemas';
import { fechaHoraLarga, kmTexto, numero } from '@/lib/formato';
import { ruta } from '@/lib/rutas';
import { serviciosDeCabina } from '@/lib/tramo';
const [tramo, estado] = await Promise.all([datos.tramo(), datos.estadoRutas()]);
const incidentes = estado.disponible ? estado.incidentes ?? [] : [];
const bloques = [['rutas', 'Rutas y longitudes'], ['estaciones', 'Estaciones de peaje'], ['tarifas', 'Cuadros tarifarios'], ['servicios', 'Áreas de descanso y servicios']] as const;
const conServicios = tramo.cabinas.filter((c) => serviciosDeCabina(c).length > 0);
---
<Base titulo="El tramo" descripcion="El Tramo Centro de la Red Federal de Concesiones: 679,03 km sobre RN 9 (autopista Rosario–Córdoba), RN 19 y RN 34, en Córdoba y Santa Fe. Mapa interactivo, rutas, estaciones de peaje, tarifas y servicios." migas={[{ nombre: 'El tramo', href: '/el-tramo' }]}>
  <Seccion nivel="h1" eyebrow="El tramo" titulo="679 kilómetros de centro." intro="Un corredor que une Rosario con Córdoba por la autopista y se abre hacia Santo Tomé, Franck y San Francisco por la RN 19. Tocá una estación en el mapa para ver su ficha." class="pt-10 pb-0" />

  <nav aria-label="Secciones de El tramo" class="sticky top-[var(--alto-header)] z-30 border-b border-borde bg-fondo/85 backdrop-blur">
    <ul class="contenedor flex gap-1 overflow-x-auto py-2 text-sm">
      {bloques.map(([id, nombre]) => <li><a href={`#${id}`} class="inline-block whitespace-nowrap rounded-sm px-3 py-2 font-semibold text-texto-2 hover:bg-superficie hover:text-texto">{nombre}</a></li>)}
    </ul>
  </nav>

  <section id="mapa" class="contenedor py-12" aria-label="Mapa interactivo">
    <div class="revelar tarjeta tarjeta-panel"><MapaInteractivo {tramo} {incidentes} modo="scroll" disposicion="lado" /></div>
    {estado.disponible && estado.actualizado && <p class="anotacion mt-3 text-xs text-texto-3">Estado de la traza actualizado el {fechaHoraLarga(new Date(estado.actualizado))}.</p>}
  </section>

  <Seccion id="rutas" indice="01" eyebrow="Rutas y longitudes" titulo="Tres rutas nacionales bajo una misma concesión." intro={`${numero(tramo.km, 2)} km en total, según el pliego del Tramo Centro.`} fondo="fondo-2">
    <div class="revelar overflow-x-auto rounded-md border border-borde" tabindex="0" role="region" aria-label="Rutas del tramo">
      <table class="w-full border-collapse text-left">
        <caption class="sr-only">Rutas del Tramo Centro con extremos, progresivas y longitud en kilómetros.</caption>
        <thead class="bg-fondo text-sm uppercase tracking-wider text-texto-2"><tr><th scope="col" class="px-4 py-3">Ruta</th><th scope="col" class="px-4 py-3">Desde</th><th scope="col" class="px-4 py-3">Hasta</th><th scope="col" class="px-4 py-3 text-right">Progresivas</th><th scope="col" class="px-4 py-3 text-right">Longitud</th></tr></thead>
        <tbody class="divide-y divide-borde">
          {tramo.rutas.map((r) => (
            <tr class="hover:bg-superficie"><th scope="row" class="px-4 py-4 font-semibold text-texto">{r.nombre}<span class="block text-sm font-normal text-texto-2">{r.descripcion}</span></th><td class="px-4 py-4 text-texto-2">{r.desde}</td><td class="px-4 py-4 text-texto-2">{r.hasta}</td><td class="px-4 py-4 text-right tabular-nums text-texto-2">{r.pkInicial !== undefined && r.pkFinal !== undefined ? `km ${numero(r.pkInicial, 2)} a ${numero(r.pkFinal, 2)}` : ''}</td><td class="px-4 py-4 text-right tabular-nums font-semibold text-texto">{r.km !== null ? `${numero(r.km, 2)} km` : ''}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
    <div class="escalonar mt-10 grid gap-8 sm:grid-cols-3">
      <div style="--i: 0"><Mojon valor={Math.floor(tramo.km)} unidad="km" etiqueta="de rutas nacionales" animar /></div>
      <div style="--i: 1"><Mojon valor={tramo.provincias.length} unidad="provincias" etiqueta={tramo.provincias.join(' y ')} animar /></div>
      <div style="--i: 2"><Mojon valor={tramo.cabinas.length} unidad="peajes" etiqueta={`${tramo.cabinas.filter(cabinaOperativa).length} operativos y ${tramo.cabinas.filter((c) => !cabinaOperativa(c)).length} próximos`} animar /></div>
    </div>
  </Seccion>

  <Seccion id="estaciones" indice="02" eyebrow="Estaciones de peaje" titulo="Dónde se paga." intro="Tres estaciones que ya cobran y tres nuevas que nacen con Free Flow.">
    <ul class="escalonar grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tramo.cabinas.map((c, i) => <li style={`--i: ${i}`}><TarjetaEstacion cabina={c} /></li>)}
    </ul>
    <ul class="revelar mt-8 flex flex-col gap-2 text-sm text-texto-2">{tramo.avisos.map((a) => <li class="flex gap-2"><span aria-hidden="true">—</span>{a}</li>)}</ul>
  </Seccion>

  <Seccion id="tarifas" indice="03" eyebrow="Cuadros tarifarios" titulo="Cuánto cuesta en cada estación." intro="El cuadro vigente, por estación operativa, con TelePASE y pago en la vía." fondo="fondo-2">
    <div class="revelar"><Boton href="/tarifas">Ver los cuadros tarifarios <ArrowRight size={18} aria-hidden="true" /></Boton></div>
  </Seccion>

  <Seccion id="servicios" indice="04" eyebrow="Áreas de descanso y servicios" titulo="Qué encontrás en la ruta." intro="Servicios por estación según los datos cargados. El detalle de gratuitos y con costo está en Servicios.">
    <ul class="escalonar grid gap-4 md:grid-cols-3">
      {conServicios.map((c, i) => (
        <li class="tarjeta p-6" style={`--i: ${i}`}><h3 class="text-xl">{c.nombre}</h3><p class="mt-1 text-sm text-texto-2">{c.ruta}{c.km !== null && ` · km ${kmTexto(c.km)}`}</p><ul class="mt-3 flex flex-col gap-1 text-texto-2">{serviciosDeCabina(c).map((s) => <li class="flex gap-2"><span aria-hidden="true">—</span>{s.etiqueta}</li>)}</ul></li>
      ))}
    </ul>
    <div class="revelar mt-8"><a href={ruta('/servicios')} class="font-semibold">Servicios al usuario: gratuitos y con costo</a></div>
  </Seccion>
</Base>
```

(El bloque "Cuadros tarifarios" pasa a mostrar las tablas por estación en la Fase 3.)

- [ ] **Step 5: Página por estación `src/pages/peajes/[slug].astro`**

```astro
---
import Base from '@/layouts/Base.astro';
import TarjetaEstacion from '@/components/TarjetaEstacion.astro';
import Boton from '@/components/ui/Boton.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
import type { Cabina } from '@/lib/datos/esquemas';
import { kmTexto } from '@/lib/formato';
import { absoluta, ruta } from '@/lib/rutas';
import { estadoCabina } from '@/lib/tramo';

export async function getStaticPaths() {
  const tramo = await datos.tramo();
  return tramo.cabinas.map((cabina) => ({ params: { slug: cabina.slug }, props: { cabina } }));
}
const { cabina } = Astro.props as { cabina: Cabina };
const estado = estadoCabina(cabina);
const titulo = `Peaje ${cabina.nombre}`;
const ubicacion = `${cabina.ruta}${cabina.km !== null ? ` km ${kmTexto(cabina.km)}` : ''}`;
const descripcion = `Estación de peaje ${cabina.nombre}, ${ubicacion}, ${cabina.localidad} (${cabina.provincia}). ${estado.etiqueta}. Tarifas, servicios y emergencias: 140.`;
const jsonLd = [{
  '@context': 'https://schema.org', '@type': 'Place', name: `Estación de peaje ${cabina.nombre}`, description: descripcion, url: absoluta(`/peajes/${cabina.slug}`),
  address: { '@type': 'PostalAddress', addressLocality: cabina.localidad, addressRegion: cabina.provincia, addressCountry: 'AR' },
}];
---
<Base titulo={titulo} descripcion={descripcion} jsonLd={jsonLd} migas={[{ nombre: 'El tramo', href: '/el-tramo' }, { nombre: titulo, href: `/peajes/${cabina.slug}` }]}>
  <Seccion nivel="h1" eyebrow={ubicacion} titulo={titulo} intro={`${cabina.localidad}, ${cabina.provincia}. ${estado.etiqueta}.`} class="pt-10">
    <div class="revelar grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start">
      <TarjetaEstacion {cabina} completa nivel="h2" />
      <div class="flex flex-col gap-6" data-tarifas-estacion>
        {estado.clave === 'operativa' ? (
          <p class="text-lg text-texto-2">El cuadro tarifario vigente de esta estación está en <a href={ruta('/tarifas')} class="font-semibold">Tarifas</a>.</p>
        ) : (
          <p class="text-lg text-texto-2">Esta estación todavía no cobra: la habilita Vialidad Nacional cuando esté construida. Va a operar con Free Flow, sin barreras, y con el mismo cuadro tarifario que Carcarañá.</p>
        )}
        <div class="flex flex-wrap gap-3"><Boton href="/medios-de-pago" variante="secundario">Cómo pagar</Boton><Boton href="/emergencias" variante="vial">Emergencias 140</Boton></div>
      </div>
    </div>
  </Seccion>
</Base>
```

(En la Fase 3, el `<p>` de la estación operativa se reemplaza por `<TablaTarifas tarifario cabina />`.)

- [ ] **Step 6: `verificar.ts`: las páginas de estación existen**

Después del bloque de contraste (antes de `// 9. presupuesto de JS enviado`) agregar:

```ts
// 11. páginas que tienen que existir (una por estación de peaje)
for (const slug of ['carcarana', 'james-craik', 'franck', 'leones', 'san-francisco', 'totoras']) {
  if (!existsSync(join(DIST, 'peajes', slug, 'index.html'))) fallo(`falta la página /peajes/${slug}/`);
}
```

y sumar `existsSync` al import de `node:fs` de la línea 2.

- [ ] **Step 7: Tests y verificación**

Run: `pnpm vitest run tests/components && pnpm check && pnpm verificar`
Expected: PASS y `OK` (las seis páginas nuevas pasan los chequeos: título, h1, canonical, tel:140, sin "a confirmar").

Run: `pnpm dev`: en `/` tocar Franck → aparece su tarjeta; Tab por las estaciones muestra el anillo; en `/el-tramo/` la sub-navegación pegada funciona; `/peajes/totoras/` dice que todavía no cobra. Cerrar.

- [ ] **Step 8: Commit**

```bash
git add src/components/home/ElTramo.astro src/pages/el-tramo.astro "src/pages/peajes/[slug].astro" scripts/verificar.ts tests/components/paginas-estacion.test.ts
git commit -m "feat(tramo): mapa interactivo en el home y El tramo en cuatro bloques; una página por estación"
```

### Tarea 2.5: Cierre de la Fase 2

- [ ] **Step 1:** `pnpm check && pnpm test && pnpm verificar` en verde.
- [ ] **Step 2:** Revisión de `rev-bro` (spec §7, plan Fase 2, diff). Atender hallazgos.
- [ ] **Step 3:** `obsidian/Costura de datos.md`: nota sobre `lib/tramo.ts` (interpolación por km, trazados en sentido de las progresivas). `obsidian/Home.md`: "Fase 2 cerrada".
- [ ] **Step 4:** Commit de cierre si no se hizo por tarea.

## Fase 3 — Tarifas

Resultado: `/tarifas/` publica el cuadro heredado de la Res. 248/2026 por estación, con TelePASE y pago electrónico o manual (hoy iguales), precio al público y sin IVA, origen y vigencia arriba, leyenda del pliego al pie, y los bloques del pliego (descuentos, exenciones, diferencial, falta de pago, categorías futuras). El home muestra $1.500.

### Tarea 3.1: Datos del cuadro vigente y `icono` por tarifa

**Files:**
- Modify: `src/lib/datos/esquemas.ts` (`esquemaTarifa.icono`)
- Modify: `src/content/tarifario.json` (todo)
- Modify: `tests/lib/datos/local-json.test.ts` (test del tarifario), `tests/lib/contrato.test.ts` (icono opcional)
- Regenerate: `docs/contrato/tarifario.schema.json`

**Interfaces:**
- Produces: `Tarifa.icono?: 'moto' | 'auto' | 'camioneta' | 'camion-2' | 'camion-3-4' | 'camion-5-6' | 'camion-7'`; constante `ICONOS_VEHICULO`; datos: 5 categorías `cat-1`…`cat-5`, `origen: 'heredado'`, `cabinas: ['carcarana','james-craik','franck']`, `categoriaDestacada: 'cat-1'`.

- [ ] **Step 1: Tests**

En `tests/lib/datos/local-json.test.ts` reemplazar el `it('tarifario: …')` por:

```ts
  it('tarifario: el cuadro heredado de la Res. 248/2026, cinco categorías con precio, igual en las tres estaciones', async () => {
    const t = await fuenteLocalJson.tarifario();
    expect(t.origen).toBe('heredado');
    expect(t.vigencia.desde).toBe('2026-02-26');
    expect(t.resolucion).toContain('248/2026');
    expect(t.cabinas).toEqual(['carcarana', 'james-craik', 'franck']);
    expect(t.categoriaDestacada).toBe('cat-1');
    expect(t.tarifas).toHaveLength(5);
    expect(t.tarifas.every((x) => x.montoSinIva !== null && x.montoManualSinIva === x.montoSinIva)).toBe(true);
    expect(t.tarifas.map((x) => Math.round(x.montoSinIva! * 1.21))).toEqual([1500, 3000, 4500, 6000, 7500]);
    expect(t.tarifas.map((x) => x.icono)).toEqual(['auto', 'camioneta', 'camion-3-4', 'camion-5-6', 'camion-7']);
    expect(t.avisos.some((a) => a.includes('en oportunidad de contar con todas las vías automáticas'))).toBe(true);
  });
```

En `tests/lib/contrato.test.ts`, en el último `it` agregar `expect(tarifario.properties.tarifas.items.required).not.toContain('icono');`.

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/lib/datos/local-json.test.ts tests/lib/contrato.test.ts`
Expected: FAIL.

- [ ] **Step 3: Contrato**

En `src/lib/datos/esquemas.ts`, antes de `esquemaTarifa` agregar:

```ts
/** Familia propia de íconos de vehículo (IconoVehiculo). Opcional: si falta, se deriva de la categoría. */
export const ICONOS_VEHICULO = ['moto', 'auto', 'camioneta', 'camion-2', 'camion-3-4', 'camion-5-6', 'camion-7'] as const;
export type IconoVehiculo = (typeof ICONOS_VEHICULO)[number];
```

y dentro de `esquemaTarifa`, después de `descripcion`: `icono: z.enum(ICONOS_VEHICULO).optional(),`.

- [ ] **Step 4: `src/content/tarifario.json`**

```json
{
  "publicadoEl": "2026-09-13",
  "vigencia": {
    "desde": "2026-02-26",
    "descripcion": "Cuadro tarifario de Corredores Viales S.A. aprobado por la Resolución 248/2026 de Vialidad Nacional, que Covicen aplica desde la toma de posesión (PETP art. 3). Rige el mismo cuadro en Carcarañá, James Craik y Franck."
  },
  "moneda": "ARS",
  "alicuotaIva": 0.21,
  "origen": "heredado",
  "resolucion": "Resolución 248/2026 de la Dirección Nacional de Vialidad",
  "cabinas": ["carcarana", "james-craik", "franck"],
  "categoriaDestacada": "cat-1",
  "tarifas": [
    { "categoria": "cat-1", "icono": "auto", "nombre": "Categoría 1", "descripcion": "Vehículos de hasta 2 ejes y hasta 2,30 m de altura, sin rueda doble.", "montoSinIva": 1239.67, "montoManualSinIva": 1239.67 },
    { "categoria": "cat-2", "icono": "camioneta", "nombre": "Categoría 2", "descripcion": "Hasta 2 ejes y más de 2,30 m de altura y/o con rueda doble; o más de 2 y hasta 4 ejes, menos de 2,30 m, sin rueda doble.", "montoSinIva": 2479.34, "montoManualSinIva": 2479.34 },
    { "categoria": "cat-3", "icono": "camion-3-4", "nombre": "Categoría 3", "descripcion": "Más de 2 y hasta 4 ejes, más de 2,30 m de altura y/o con rueda doble.", "montoSinIva": 3719.01, "montoManualSinIva": 3719.01 },
    { "categoria": "cat-4", "icono": "camion-5-6", "nombre": "Categoría 4", "descripcion": "Más de 4 y hasta 6 ejes.", "montoSinIva": 4958.68, "montoManualSinIva": 4958.68 },
    { "categoria": "cat-5", "icono": "camion-7", "nombre": "Categoría 5", "descripcion": "Más de 6 ejes.", "montoSinIva": 6198.35, "montoManualSinIva": 6198.35 }
  ],
  "fuente": {
    "nombre": "Resolución 248/2026 — Boletín Oficial, 24/02/2026",
    "url": "https://www.boletinoficial.gob.ar/detalleAviso/primera/338657/20260224"
  },
  "avisos": [
    "Pago electrónico manual: modalidad de pago manual electrónico (medios de pago electrónicos en punto de cobro, distintos de TelePASE), en oportunidad de contar con todas las vías automáticas y/o mixtas.",
    "La tarifa se actualiza por índices oficiales según el contrato de concesión, cada tres meses.",
    "El criterio de las categorías es el del esquema de cinco categorías de la red nacional; el cuadro definitivo de Covicen lo homologa Vialidad Nacional."
  ]
}
```

Los "sin IVA" son los del anexo oficial (IF-2026-18452702-APN-DNV#MEC): 1.239,67 × 1,21 = 1.500,00, etc.

- [ ] **Step 5: Regenerar el contrato y correr los tests**

Run: `pnpm contrato && pnpm vitest run tests/lib/datos tests/lib/contrato.test.ts`
Expected: PASS. (`tests/components/tarifas.test.ts` y `home.test.ts` fallan hasta la 3.3.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/datos/esquemas.ts src/content/tarifario.json docs/contrato/tarifario.schema.json tests/lib/datos/local-json.test.ts tests/lib/contrato.test.ts
git commit -m "feat(tarifas): cuadro heredado de la Res. 248/2026 con cinco categorías e ícono por tarifa"
```

### Tarea 3.2: Helpers de tarifas e íconos por tipo de vehículo

**Files:**
- Create: `src/lib/tarifas.ts`, `tests/lib/tarifas.test.ts`
- Modify: `src/components/ilustraciones/IconoVehiculo.astro`, `tests/components/ilustraciones.test.ts` (IconoVehiculo)

**Interfaces:**
- Produces: `FilaTarifa = Tarifa & { telepaseSinIva: number | null; manualSinIva: number | null }`; `tarifasParaCabina(t: Tarifario, cabina: string): FilaTarifa[]`; `publico(sinIva, conIvaSistema, alicuota): number | null`; `tarifaDestacada(t): Tarifa`; `cabinasDelCuadro(t, cabinas: Cabina[]): Cabina[]`; `iconoDeTarifa(f: Tarifa): IconoVehiculo`; `<IconoVehiculo icono={IconoVehiculo} size? class? />`.

- [ ] **Step 1: Tests**

Crear `tests/lib/tarifas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { cabinasDelCuadro, iconoDeTarifa, publico, tarifaDestacada, tarifasParaCabina } from '@/lib/tarifas';

describe('tarifas', async () => {
  const t = await fuenteLocalJson.tarifario();
  const tramo = await fuenteLocalJson.tramo();
  it('sin excepciones, TelePASE y manual salen del cuadro general', () => {
    const filas = tarifasParaCabina(t, 'franck');
    expect(filas[0]).toMatchObject({ categoria: 'cat-1', telepaseSinIva: 1239.67, manualSinIva: 1239.67 });
  });
  it('una excepción por cabina reemplaza solo esa categoría; manual sin dato hereda el de TelePASE', () => {
    const conEx = { ...t, excepciones: [{ cabina: 'franck', categoria: 'cat-1', montoSinIva: 2000 }] };
    expect(tarifasParaCabina(conEx, 'franck')[0]).toMatchObject({ telepaseSinIva: 2000, manualSinIva: 2000 });
    expect(tarifasParaCabina(conEx, 'carcarana')[0]).toMatchObject({ telepaseSinIva: 1239.67 });
    const manualNulo = { ...t, tarifas: [{ ...t.tarifas[0]!, montoManualSinIva: null }] };
    expect(tarifasParaCabina(manualNulo, 'franck')[0]!.manualSinIva).toBeNull();
  });
  it('publico: el del sistema si viene; si no, redondeo al peso', () => {
    expect(publico(1239.67, undefined, 0.21)).toBe(1500);
    expect(publico(1239.67, 1500.5, 0.21)).toBe(1500.5);
    expect(publico(null, undefined, 0.21)).toBeNull();
  });
  it('destacada: la categoría marcada, o la primera', () => {
    expect(tarifaDestacada(t).categoria).toBe('cat-1');
    expect(tarifaDestacada({ ...t, categoriaDestacada: undefined }).categoria).toBe('cat-1');
  });
  it('cabinasDelCuadro: las listadas; sin lista, todas las operativas', () => {
    expect(cabinasDelCuadro(t, tramo.cabinas).map((c) => c.slug)).toEqual(['carcarana', 'james-craik', 'franck']);
    expect(cabinasDelCuadro({ ...t, cabinas: undefined }, tramo.cabinas).map((c) => c.slug).sort()).toEqual(['carcarana', 'franck', 'james-craik']);
  });
  it('iconoDeTarifa: el explícito, o el legado por categoría, o auto', () => {
    expect(iconoDeTarifa({ categoria: 'cat-1', nombre: 'x', descripcion: 'x', montoSinIva: 1, icono: 'camion-7' })).toBe('camion-7');
    expect(iconoDeTarifa({ categoria: 'cat-1', nombre: 'x', descripcion: 'x', montoSinIva: 1 })).toBe('moto');
    expect(iconoDeTarifa({ categoria: 'otra', nombre: 'x', descripcion: 'x', montoSinIva: 1 })).toBe('auto');
  });
});
```

Reemplazar el `describe('IconoVehiculo', …)` de `tests/components/ilustraciones.test.ts` por:

```ts
describe('IconoVehiculo', () => {
  it('renderiza cada tipo y falla con uno desconocido', async () => {
    const c = await AstroContainer.create();
    for (const icono of ['moto', 'auto', 'camioneta', 'camion-2', 'camion-3-4', 'camion-5-6', 'camion-7']) {
      expect(await c.renderToString(IconoVehiculo, { props: { icono } })).toContain('<svg');
    }
    await expect(c.renderToString(IconoVehiculo, { props: { icono: 'nave' } })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/lib/tarifas.test.ts tests/components/ilustraciones.test.ts`
Expected: FAIL.

- [ ] **Step 3: `src/lib/tarifas.ts`**

```ts
// Lo que la UI deriva del tarifario: filas por cabina (con excepciones aplicadas), precio al público, destacada e íconos.
import type { Cabina, IconoVehiculo, Tarifa, Tarifario } from '@/lib/datos/esquemas';
import { cabinaOperativa } from '@/lib/datos/esquemas';
import { conIva } from '@/lib/formato';

export type FilaTarifa = Tarifa & { telepaseSinIva: number | null; manualSinIva: number | null };

/** Tarifas que rigen en una cabina: las generales, con las excepciones de esa cabina aplicadas (mismo modelo que el backend).
 *  Manual sin dato (undefined) = igual a TelePASE (Res. 248/2026: un solo precio); manual null = sin valor publicado. */
export const tarifasParaCabina = (t: Tarifario, cabina: string): FilaTarifa[] =>
  t.tarifas.map((f) => {
    const ex = t.excepciones?.find((e) => e.cabina === cabina && e.categoria === f.categoria);
    const telepase = ex ? ex.montoSinIva : f.montoSinIva;
    const manualCrudo = ex ? ex.montoManualSinIva : f.montoManualSinIva;
    return { ...f, telepaseSinIva: telepase, manualSinIva: manualCrudo === undefined ? telepase : manualCrudo };
  });

/** Precio al público (con IVA): el que manda el sistema si viene; si no, calculado con la alícuota y redondeado al peso. */
export const publico = (sinIva: number | null, conIvaSistema: number | null | undefined, alicuota: number): number | null =>
  sinIva === null ? null : (conIvaSistema ?? conIva(sinIva, alicuota));

export const tarifaDestacada = (t: Tarifario): Tarifa => t.tarifas.find((f) => f.categoria === t.categoriaDestacada) ?? t.tarifas[0]!;

/** Cabinas donde rige el cuadro: las listadas en el tarifario o, si no lista, todas las operativas. */
export const cabinasDelCuadro = (t: Tarifario, cabinas: Cabina[]): Cabina[] =>
  t.cabinas ? cabinas.filter((c) => t.cabinas!.includes(c.slug)) : cabinas.filter(cabinaOperativa);

// Para tarifarios sin `icono` (la API antes de mandarlo, fixtures viejos): categorías del esquema anterior.
const LEGADO: Record<string, IconoVehiculo> = { 'cat-1': 'moto', 'cat-2': 'auto', 'cat-3': 'camioneta', 'cat-4': 'camion-2', 'cat-5': 'camion-3-4', 'cat-6': 'camion-5-6' };
export const iconoDeTarifa = (f: Tarifa): IconoVehiculo => f.icono ?? LEGADO[f.categoria] ?? 'auto';
```

- [ ] **Step 4: `IconoVehiculo.astro` por tipo**

Reemplazar las líneas 3–14 de `src/components/ilustraciones/IconoVehiculo.astro` por:

```ts
import type { IconoVehiculo } from '@/lib/datos/esquemas';
interface Props { icono: IconoVehiculo; size?: number; class?: string }
const { icono, size = 28, class: clase = '' } = Astro.props;
// Los camiones de 5-6 y de 7 o más ejes comparten trazo: el texto de la categoría los distingue.
const iconos: Record<IconoVehiculo, string> = {
  moto: 'M4 17.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0m10 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0M6.5 15l3-5h4l2 3h2M9.5 10l-1-3h2.5M13.5 10 12 8',
  auto: 'M3 16h18v-3l-2.5-1-2-4h-8l-3 4-2.5 1zM7 16.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0m6 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0M9.5 8v4h6',
  camioneta: 'M2 16h11v-3l-2-1-1.5-3H5l-2 3-1 1zM4 16.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0M13 14h2l1-4h5v6h-1M16 16.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  'camion-2': 'M2 16V8h11v8zM13 11h5l3 3v2h-8M4 16.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0m5 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0m7 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  'camion-3-4': 'M1 16V9h12v7zM13 11h5l3 3v2h-8M2.5 16.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0m4.5 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0m4.5 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0m4.5 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  'camion-5-6': 'M1 16V9h13v7zM14 11h4l3 3v2h-7M1.5 16.5a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0m3.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0m3.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0m3.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0m3.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0',
  'camion-7': 'M1 16V9h13v7zM14 11h4l3 3v2h-7M1.5 16.5a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0m3.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0m3.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0m3.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0m3.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0',
};
const d = iconos[icono];
if (!d) throw new Error(`IconoVehiculo: tipo desconocido "${icono}"`);
```

- [ ] **Step 5: Correr los tests**

Run: `pnpm vitest run tests/lib/tarifas.test.ts tests/components/ilustraciones.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/tarifas.ts tests/lib/tarifas.test.ts src/components/ilustraciones/IconoVehiculo.astro tests/components/ilustraciones.test.ts
git commit -m "feat(tarifas): filas por cabina con excepciones, precio al público e íconos por tipo de vehículo"
```

### Tarea 3.3: Tabla por estación, página de tarifas, home y el botón Imprimir

**Files:**
- Modify: `src/components/TablaTarifas.astro` (todo), `src/pages/tarifas.astro` (todo), `src/components/home/TarifaDestacada.astro:8-20,29-30,62-68`, `src/pages/el-tramo.astro` (bloque `#tarifas`), `src/pages/peajes/[slug].astro` (tabla de la estación)
- Create: `src/scripts/imprimir.ts`
- Modify: `tests/components/tarifas.test.ts:7-19`, `tests/components/home.test.ts:22-31`, `tests/presupuesto.test.ts:7`

**Interfaces:**
- Produces: `<TablaTarifas tarifario cabina? id? compacta? />`; script `imprimir.ts` sobre `[data-imprimir]`.

- [ ] **Step 1: Tests**

Reemplazar el primer `describe` de `tests/components/tarifas.test.ts` (líneas 7–19) por:

```ts
describe('TablaTarifas', () => {
  it('por estación: cinco filas, TelePASE y pago manual con el mismo precio hoy, público grande y sin IVA como anotación', async () => {
    const c = await AstroContainer.create();
    const [tarifario, tramo] = await Promise.all([fuenteLocalJson.tarifario(), fuenteLocalJson.tramo()]);
    const cabina = tramo.cabinas.find((x) => x.slug === 'franck')!;
    const html = (await c.renderToString(TablaTarifas, { props: { tarifario, cabina, id: 'franck' } })).replace(/[  ]/g, ' ');
    expect(html).toContain('id="franck"');
    expect(html).toContain('Estación Franck · RN 19 km 19,95');
    expect(html).toContain('<caption');
    expect(html).toContain('>TelePASE<');
    expect(html).toContain('>Pago electrónico o manual<');
    expect(html.match(/<tr class="fila/g)?.length).toBe(5);
    expect(html.match(/\$ 1\.500</g)?.length).toBe(2);
    expect(html).toContain('$ 1.239,67 sin IVA');
    expect(html).toContain('Vigencia: desde el 26 de febrero de 2026');
    expect(html).toContain('Resolución 248/2026');
    expect(html).toContain('en oportunidad de contar con todas las vías automáticas');
    expect(html).not.toMatch(/a confirmar/i);
  });
});
```

En `tests/components/home.test.ts` reemplazar el `describe('TarifaDestacada', …)` por:

```ts
describe('TarifaDestacada', () => {
  it('muestra la categoría destacada al público, la vigencia y la resolución', async () => {
    const html = (await render(TarifaDestacada, { tarifario: await fuenteLocalJson.tarifario(), empresa: await fuenteLocalJson.empresa() })).replace(/[  ]/g, ' ');
    expect(html).toContain('$ 1.500');
    expect(html).toContain('$ 1.239,67');
    expect(html).toContain('26 de febrero de 2026');
    expect(html).toContain('Cuadro vigente');
    expect(html).toContain('248/2026');
    expect(html).not.toContain('Tarifa ofertada');
  });
});
```

En `tests/presupuesto.test.ts` línea 7 agregar `'src/scripts/imprimir.ts'`.

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/components/tarifas.test.ts tests/components/home.test.ts`
Expected: FAIL.

- [ ] **Step 3: `src/components/TablaTarifas.astro`**

```astro
---
// Cuadro tarifario de UNA estación (o el general si no se pasa cabina): categoría, tipo de vehículo, TelePASE y pago
// electrónico o manual, precio al público (con IVA, como en la cabina) y sin IVA en anotación. Los textos del operador
// (avisos, vigencia, fuente) se pintan como texto, nunca set:html; la URL de la fuente solo se enlaza si es http(s).
import IconoVehiculo from '@/components/ilustraciones/IconoVehiculo.astro';
import type { Cabina, Tarifario } from '@/lib/datos/esquemas';
import { fechaCorta, fechaLarga, kmTexto, moneda } from '@/lib/formato';
import { iconoDeTarifa, publico, tarifasParaCabina } from '@/lib/tarifas';
interface Props { tarifario: Tarifario; cabina?: Cabina; id?: string; compacta?: boolean }
const { tarifario: t, cabina, id, compacta = false } = Astro.props;
const filas = tarifasParaCabina(t, cabina?.slug ?? '');
const vigencia = t.vigencia.desde ? `Vigencia: desde el ${fechaLarga(t.vigencia.desde)}.` : `Vigencia: ${t.vigencia.descripcion}`;
const esHttp = (url: string) => /^https?:\/\//i.test(url);
const titulo = cabina ? `Estación ${cabina.nombre} · ${cabina.ruta}${cabina.km !== null ? ` km ${kmTexto(cabina.km)}` : ''}` : 'Todas las estaciones operativas';
---
<div class="revelar" {id}>
  <div class="mb-4 flex flex-wrap items-baseline justify-between gap-3">
    <h3 class="text-xl">{titulo}</h3>
    <p class="text-sm text-texto-2">{vigencia}{t.resolucion && ` ${t.resolucion}.`}</p>
  </div>
  <div class="overflow-x-auto rounded-md border border-borde" tabindex="0" role="region" aria-label={`Tabla de tarifas, ${titulo}`}>
    <table class="w-full border-collapse text-left">
      <caption class="sr-only">Tarifas de peaje, {titulo}, en pesos argentinos con IVA incluido. {vigencia}</caption>
      <thead class="bg-fondo-2 text-sm uppercase tracking-wider text-texto-2">
        <tr><th scope="col" class="px-4 py-3">Categoría</th><th scope="col" class="px-4 py-3">Tipo de vehículo</th><th scope="col" class="px-4 py-3 text-right">TelePASE</th><th scope="col" class="px-4 py-3 text-right">Pago electrónico o manual</th></tr>
      </thead>
      <tbody class="divide-y divide-borde">
        {filas.map((f) => {
          const telepase = publico(f.telepaseSinIva, f.montoConIva, t.alicuotaIva);
          const manual = publico(f.manualSinIva, undefined, t.alicuotaIva);
          return (
            <tr class="fila transition-colors hover:bg-superficie">
              <th scope="row" class="px-4 py-4 font-semibold text-texto"><span class="flex items-center gap-3"><IconoVehiculo icono={iconoDeTarifa(f)} class="icono text-texto-2" /> {f.nombre}</span></th>
              <td class="px-4 py-4 text-texto-2">{f.descripcion}{f.nota && <span class="anotacion mt-1 block text-xs text-texto-2">{f.nota}</span>}</td>
              <td class="px-4 py-4 text-right tabular-nums text-texto">{telepase === null ? <span class="text-texto-2" aria-label="Sin valor publicado">—</span> : <><span class="text-lg font-extrabold">{moneda(telepase)}</span>{f.telepaseSinIva !== null && <span class="anotacion block text-xs text-texto-2">{moneda(f.telepaseSinIva)} sin IVA</span>}</>}</td>
              <td class="px-4 py-4 text-right tabular-nums text-texto">{manual === null ? <span class="text-texto-2" aria-label="Sin valor publicado">—</span> : <><span class="text-lg font-extrabold">{moneda(manual)}</span>{f.manualSinIva !== null && <span class="anotacion block text-xs text-texto-2">{moneda(f.manualSinIva)} sin IVA</span>}</>}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
  <p class="mt-2 text-sm text-texto-3 sm:hidden">Deslizá la tabla hacia el costado para ver todas las columnas.</p>
  {!compacta && <ul class="mt-6 flex flex-col gap-2 text-sm text-texto-2">{t.avisos.map((a) => <li class="flex gap-2"><span aria-hidden="true">—</span>{a}</li>)}</ul>}
  {!compacta && <p class="anotacion mt-4 text-xs text-texto-3">Publicado el {fechaCorta(t.publicadoEl)}. Fuente: {esHttp(t.fuente.url) ? <a href={t.fuente.url} rel="noopener noreferrer" target="_blank" aria-label={`${t.fuente.nombre} (se abre en otra pestaña)`}>{t.fuente.nombre}</a> : t.fuente.nombre}.</p>}
</div>
<style>
  .fila:hover :global(.icono) { color: var(--color-acento); }
</style>
```

- [ ] **Step 4: `src/scripts/imprimir.ts`**

```ts
// Botón "Imprimir" (pliego 61.7: vista de impresión). La hoja de estilos de impresión vive en src/styles/impresion.css.
const iniciar = () => document.querySelectorAll<HTMLButtonElement>('[data-imprimir]:not([data-listo])').forEach((b) => { b.dataset.listo = ''; b.addEventListener('click', () => window.print()); });
document.addEventListener('astro:page-load', iniciar);
export {};
```

- [ ] **Step 5: `src/pages/tarifas.astro`**

```astro
---
import { Printer } from '@lucide/astro';
import Base from '@/layouts/Base.astro';
import TablaTarifas from '@/components/TablaTarifas.astro';
import IconoVehiculo from '@/components/ilustraciones/IconoVehiculo.astro';
import Boton from '@/components/ui/Boton.astro';
import Seccion from '@/components/ui/Seccion.astro';
import Senal from '@/components/ui/Senal.astro';
import { datos } from '@/lib/datos';
import { cabinaOperativa } from '@/lib/datos/esquemas';
import { fechaLarga, moneda } from '@/lib/formato';
import { ruta } from '@/lib/rutas';
import { cabinasDelCuadro, iconoDeTarifa, publico, tarifaDestacada } from '@/lib/tarifas';
const [tarifario, tramo] = await Promise.all([datos.tarifario(), datos.tramo()]);
const destacada = tarifaDestacada(tarifario);
const precio = publico(destacada.montoSinIva, destacada.montoConIva, tarifario.alicuotaIva);
const cabinas = cabinasDelCuadro(tarifario, tramo.cabinas);
const proximas = tramo.cabinas.filter((c) => !cabinaOperativa(c));
// Categorías que rigen después de las Obras Iniciales de Puesta en Valor (PETG 53.2): informativas, sin precio.
const futuras = [
  ['0', 'Motocicletas', '0,5'], ['1', 'Hasta 2 ejes y hasta 2,30 m de altura, sin rueda doble', '1'],
  ['2', 'Hasta 2 ejes y más de 2,30 m con rueda doble; o 3 ejes, menos de 2,30 m, sin rueda doble', '2'],
  ['3', '3 ejes, más de 2,30 m, con rueda doble', '3'], ['4', '4 ejes', '4'], ['5', '5 ejes', '5'], ['6', '6 ejes', '6'],
  ['7', 'Más de 6 ejes', '7'], ['8', 'Más de 8 ejes', '9'], ['Especial', 'Con permiso de circulación especial', 'cantidad de ejes'],
] as const;
const descuentos = [['36 a 44 pasadas por mes', '15 %'], ['45 a 60 pasadas por mes', '25 %'], ['61 pasadas o más por mes', '35 %']] as const;
const exentos = ['Ambulancias', 'Vehículos de las Fuerzas Armadas y de Seguridad de la Nación', 'Vehículos de servicio contra incendio (bomberos)', 'Vehículos y agentes al servicio de Vialidad Nacional', 'Vehículos de la Agencia Nacional de Seguridad Vial', 'Vehículos al servicio de la Cruz Roja (Ley 27.547)', 'Vehículos afectados a personas con discapacidad, según el reglamento de Vialidad Nacional', 'Vehículos afectados a ex combatientes de Malvinas, según el reglamento de Vialidad Nacional'];
---
<Base titulo="Tarifas" descripcion={`Cuadro tarifario vigente en los peajes del Tramo Centro (Carcarañá, James Craik y Franck): ${precio !== null ? moneda(precio) : ''} por auto, Resolución 248/2026 de Vialidad Nacional. TelePASE, pago en la vía, descuentos por frecuencia y exenciones.`} migas={[{ nombre: 'Tarifas', href: '/tarifas' }]}>
  <Seccion nivel="h1" eyebrow="Tarifas" titulo="Cuánto cuesta el peaje." intro={tarifario.vigencia.descripcion} class="pt-10">
    <div class="revelar mb-12 grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
      <div class="rounded-md border border-borde bg-superficie/50 p-8">
        <div class="flex items-center gap-3 text-texto-2"><IconoVehiculo icono={iconoDeTarifa(destacada)} size={32} /> <span>{destacada.nombre} · {destacada.descripcion}</span></div>
        {precio !== null && destacada.montoSinIva !== null && (
          <>
            <p class="mt-5 flex flex-wrap items-baseline gap-x-3">
              <span class="font-extrabold leading-none tracking-[var(--tracking-titulo)] text-texto" style="font-size: clamp(3rem, 2rem + 5vw, 6rem)">{moneda(precio)}</span>
              <span class="text-lg text-texto-2">al público, con IVA</span>
            </p>
            <p class="mt-3 text-texto-2">{moneda(destacada.montoSinIva)} sin IVA · igual con TelePASE que con pago en la vía.</p>
          </>
        )}
      </div>
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap gap-2"><Senal variante="ok">Cuadro vigente</Senal>{tarifario.vigencia.desde && <Senal variante="frio">Desde el {fechaLarga(tarifario.vigencia.desde)}</Senal>}</div>
        {tarifario.resolucion && <p class="text-texto-2">{tarifario.resolucion}. <a href={tarifario.fuente.url} rel="noopener noreferrer" target="_blank">Ver en el Boletín Oficial</a>.</p>}
        <p class="text-texto-2">Rige el mismo cuadro en {cabinas.map((c) => c.nombre).join(', ')}.</p>
        <div><button type="button" class="btn btn-secundario inline-flex items-center gap-2 rounded-md border border-borde px-4 py-2 font-semibold text-texto hover:border-borde-fuerte hover:bg-superficie" data-imprimir><Printer size={18} aria-hidden="true" /> Imprimir el cuadro</button></div>
      </div>
    </div>

    <nav aria-label="Estaciones" class="revelar mb-8 flex flex-wrap gap-2">
      {cabinas.map((c) => <a href={`#${c.slug}`} class="rounded-md border border-borde px-3 py-2 text-sm font-semibold text-texto-2 no-underline hover:border-borde-fuerte hover:bg-superficie hover:text-texto">{c.nombre}</a>)}
    </nav>
    <div class="flex flex-col gap-14">
      {cabinas.map((c) => <TablaTarifas {tarifario} cabina={c} id={c.slug} />)}
    </div>

    {proximas.length > 0 && (
      <div class="revelar mt-12 rounded-md border border-dashed border-borde-fuerte p-6">
        <h3 class="text-xl">Estaciones sin habilitar</h3>
        <p class="mt-2 text-texto-2">{proximas.map((c) => c.nombre).join(', ')}: cobran cuando Vialidad Nacional las habilite, con el cuadro tarifario de Carcarañá (PETP art. 3). Hasta entonces, en esas estaciones no se paga.</p>
      </div>
    )}
  </Seccion>

  <Seccion indice="01" eyebrow="Descuentos por frecuencia" titulo="Cuanto más pasás, menos pagás." intro="Para autos, con TelePASE, por estación y por mes calendario, en ambos sentidos. Es una obligación del contrato (PETG art. 53.3)." fondo="fondo-2">
    <dl class="revelar grid gap-4 md:grid-cols-3">
      {descuentos.map(([pasadas, pct]) => <div class="tarjeta p-6"><dt class="eyebrow">{pasadas}</dt><dd class="mt-2 text-4xl font-extrabold text-texto">{pct}</dd><dd class="mt-1 text-sm text-texto-2">de descuento a partir de esa pasada</dd></div>)}
    </dl>
  </Seccion>

  <Seccion indice="02" eyebrow="Exenciones" titulo="Quiénes no pagan." intro="Solo los vehículos de esta lista (PETG art. 52), y siempre con el dispositivo TelePASE habilitado a ese efecto.">
    <div class="revelar grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <ul class="flex flex-col gap-2 text-texto-2">{exentos.map((e) => <li class="flex gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vial" aria-hidden="true"></span>{e}</li>)}</ul>
      <div class="flex flex-col gap-4">
        <div class="tarjeta p-6"><h3 class="text-xl">Ex combatientes de Malvinas</h3><p class="mt-2 text-texto-2">El trámite es nacional y gratuito.</p><a href="https://www.argentina.gob.ar/servicio/exencion-de-pago-de-peaje-ex-combatientes-de-malvinas" rel="noopener noreferrer" target="_blank" class="mt-3 inline-block font-semibold">Cómo pedir la exención (argentina.gob.ar)</a></div>
        <div class="tarjeta p-6"><h3 class="text-xl">Personas con discapacidad</h3><p class="mt-2 text-texto-2">Se tramita ante Vialidad Nacional con el certificado único de discapacidad.</p><a href={ruta('/tramites')} class="mt-3 inline-block font-semibold">Ver la guía de trámites</a></div>
      </div>
    </div>
  </Seccion>

  <Seccion indice="03" eyebrow="Tarifa diferencial" titulo="Vecinos, frentistas y docentes." intro="Existe una tarifa diferencial para vecinos y frentistas de una estación y para docentes, solo para la categoría 1, que se renueva cada año. El monto se informa al hacer el trámite." fondo="fondo-2">
    <div class="revelar"><Boton href="/tramites" variante="secundario">Requisitos y cómo tramitarla</Boton></div>
  </Seccion>

  <Seccion indice="04" eyebrow="Si pasaste sin pagar" titulo="Cómo regularizarlo." intro="Si cruzás una estación sin TelePASE vigente y sin pagar (PETG art. 51.1.4):">
    <ol class="revelar grid gap-4 md:grid-cols-2">
      <li class="tarjeta p-6"><p class="eyebrow">Dentro de los 30 días</p><p class="mt-2 text-texto-2">Pagás la tarifa que correspondía más <strong class="text-texto">una tarifa</strong> de tu categoría, por gastos administrativos.</p></li>
      <li class="tarjeta p-6"><p class="eyebrow">Después de los 30 días</p><p class="mt-2 text-texto-2">Pagás la tarifa más <strong class="text-texto">dos tarifas</strong> de tu categoría, con intereses a la tasa activa del Banco Nación.</p></li>
    </ol>
    <p class="revelar mt-6 text-texto-2">El medio para regularizar la deuda se publica en <a href={ruta('/medios-de-pago#sin-pagar')}>Medios de pago</a> cuando esté habilitado.</p>
  </Seccion>

  <Seccion indice="05" eyebrow="Después de las obras iniciales" titulo="Las categorías que van a regir." intro="Cuando terminen las Obras Iniciales de Puesta en Valor, el cuadro pasa a las categorías del pliego (PETG art. 53.2): cada una es un múltiplo de la tarifa básica. Acá va la estructura; los precios, cuando Vialidad Nacional homologue el cuadro." fondo="fondo-2">
    <div class="revelar overflow-x-auto rounded-md border border-borde" tabindex="0" role="region" aria-label="Categorías futuras de vehículos">
      <table class="w-full border-collapse text-left">
        <caption class="sr-only">Categorías de vehículos del pliego y su múltiplo sobre la tarifa básica.</caption>
        <thead class="bg-fondo text-sm uppercase tracking-wider text-texto-2"><tr><th scope="col" class="px-4 py-3">Categoría</th><th scope="col" class="px-4 py-3">Vehículos</th><th scope="col" class="px-4 py-3 text-right">Tarifa básica ×</th></tr></thead>
        <tbody class="divide-y divide-borde">{futuras.map(([cat, veh, mult]) => <tr class="hover:bg-superficie"><th scope="row" class="px-4 py-3 font-semibold text-texto">{cat}</th><td class="px-4 py-3 text-texto-2">{veh}</td><td class="px-4 py-3 text-right tabular-nums text-texto">{mult}</td></tr>)}</tbody>
      </table>
    </div>
    <div class="revelar mt-12 flex flex-wrap gap-3">
      <Boton href="/medios-de-pago" variante="secundario">Cómo pagar</Boton>
      <Boton href="/el-tramo" variante="secundario">Dónde están los peajes</Boton>
      <Boton href="/preguntas-frecuentes" variante="secundario">Preguntas frecuentes</Boton>
    </div>
  </Seccion>
</Base>
<script src="../scripts/imprimir.ts"></script>
```

`/tramites/` se crea en la Fase 4; hasta entonces `verificar` va a marcar el link roto: crear en esta tarea un `src/pages/tramites.astro` mínimo (título "Guía de trámites", `Seccion` con intro "Requisitos y pasos de los trámites del usuario." y un `Boton` a `/contacto`) que la Fase 4 reemplaza. Lo mismo para el ancla `#sin-pagar` (es un ancla, no rompe el chequeo de links).

- [ ] **Step 6: Home, El tramo y páginas de estación**

`src/components/home/TarifaDestacada.astro`:
- Línea 8: `import { fechaCorta, fechaLarga, moneda } from '@/lib/formato';` y agregar `import { publico, tarifaDestacada } from '@/lib/tarifas';` y `import { iconoDeTarifa } from '@/lib/tarifas';` (una sola línea: `import { iconoDeTarifa, publico, tarifaDestacada } from '@/lib/tarifas';`).
- Líneas 12–14 → `const auto = tarifaDestacada(tarifario); const sinIva = auto.montoSinIva; const precio = publico(sinIva, auto.montoConIva, tarifario.alicuotaIva); if (sinIva === null || precio === null) throw new Error('TarifaDestacada: la tarifa destacada no tiene precio');`
- Línea 15: `const vigencia = tarifario.vigencia.desde ? \`Vigente desde el ${fechaLarga(tarifario.vigencia.desde)}.\` : \`Vigencia: ${tarifario.vigencia.descripcion}\`;`
- Líneas 16–20 (detalles): `{ Icono: BadgeCheck, texto: \`Rige en Carcarañá, James Craik y Franck; igual con TelePASE que con pago en la vía.\` }, { Icono: CalendarClock, texto: vigencia }, { Icono: FileText, texto: tarifario.resolucion ?? tarifario.fuente.nombre },`
- Línea 22 (`Seccion`): `titulo="El cuadro tarifario vigente." intro="El que fijó Vialidad Nacional para estas estaciones y que Covicen aplica desde la toma de posesión. Se actualiza por índices oficiales cada tres meses."`
- Línea 29: `<IconoVehiculo icono={iconoDeTarifa(auto)} size={28} />`.
- Línea 30: `<Senal variante="ok">Cuadro vigente</Senal>`.
- Líneas 34–38: precio al público grande (`{moneda(precio)}` con `<span class="text-lg text-texto-2">con IVA</span>`) y debajo `<strong class="text-texto">{moneda(sinIva)}</strong> sin IVA.`
- Línea 48: `{moneda(precio)} <span …>· {moneda(sinIva)} sin IVA</span>`.
- Línea 62: el link va a `tarifario.fuente.url` con texto "Resolución en el Boletín Oficial" y clase `text-sm` (no `text-xs`).
- Línea 68: `<p class="mt-4 text-center text-sm text-texto-3">Publicado el {fechaCorta(tarifario.publicadoEl)}. {tarifario.avisos[1]}</p>` → reemplazar `{tarifario.avisos[1]}` por `Se actualiza por índices oficiales según el contrato.` (sin depender del orden de avisos).

`src/pages/el-tramo.astro`, bloque `#tarifas`: agregar `TablaTarifas` al import y `tarifario` a la carga (`const [tramo, estado, tarifario] = await Promise.all([datos.tramo(), datos.estadoRutas(), datos.tarifario()]);`), importar `cabinasDelCuadro` de `@/lib/tarifas`, y reemplazar el contenido de la `Seccion id="tarifas"` por:

```astro
    <div class="flex flex-col gap-12">{cabinasDelCuadro(tarifario, tramo.cabinas).map((c) => <TablaTarifas {tarifario} cabina={c} compacta />)}</div>
    <div class="revelar mt-8"><Boton href="/tarifas">Descuentos, exenciones y detalle <ArrowRight size={18} aria-hidden="true" /></Boton></div>
```

`src/pages/peajes/[slug].astro`: importar `TablaTarifas` y cargar `const tarifario = await datos.tarifario();`; reemplazar el `<p>` de la estación operativa por `<TablaTarifas {tarifario} {cabina} />`.

- [ ] **Step 7: Tests, typecheck y verificación**

Run: `pnpm vitest run tests/components && pnpm check && pnpm verificar`
Expected: PASS y `OK`. Revisar en `pnpm dev`: `/tarifas/` con tres tablas, ancla `#franck` desde la tarjeta de estación, botón Imprimir abre el diálogo; home con $1.500.

- [ ] **Step 8: Commit**

```bash
git add src/components/TablaTarifas.astro src/pages/tarifas.astro src/pages/tramites.astro src/components/home/TarifaDestacada.astro src/pages/el-tramo.astro "src/pages/peajes/[slug].astro" src/scripts/imprimir.ts tests/components/tarifas.test.ts tests/components/home.test.ts tests/presupuesto.test.ts
git commit -m "feat(tarifas): tabla por estación con TelePASE y pago manual, bloques del pliego, home con el cuadro vigente"
```

### Tarea 3.4: Cierre de la Fase 3

- [ ] **Step 1:** `pnpm check && pnpm test && pnpm verificar` en verde.
- [ ] **Step 2:** Revisión de `rev-bro` (spec §8, plan Fase 3, diff). En particular: que ningún número publicado sea distinto de los del anexo de la Res. 248/2026, y que el "manual" sea igual al TelePASE.
- [ ] **Step 3:** `obsidian/Decisiones de arquitectura.md`: "cuadro heredado; columna manual = TelePASE hoy; sin estimaciones". `obsidian/Home.md`: "Fase 3 cerrada".
- [ ] **Step 4:** Commit de cierre si no se hizo por tarea.

## Fase 4 — Contenido que sale del pliego

Resultado: servicios gratuitos y con costo con los tiempos publicados, canales con plazos, medios de pago desde datos con "Mi cuenta", Quiénes somos original, transparencia con normativa descargable y slot de póliza, guía de trámites, seguridad vial desde datos, obras reales del pliego, FAQ y novedades corregidas. Todo con su artículo como fuente.

### Tarea 4.1: Contratos y datos nuevos (servicios, normativa, trámites, consejos) y campos de empresa/contacto

**Files:**
- Modify: `src/lib/datos/esquemas.ts` (al final; y `Empresa.polizaRc`, `Contacto.cuentaRegularizacion`)
- Create: `src/content/servicios.json`, `src/content/normativa.json`, `src/content/tramites.json`, `src/content/consejos.json`
- Modify: `src/content/empresa.json` (`polizaRc: null`), `src/content/contacto.json` (`cuentaRegularizacion: null`)
- Modify: `src/lib/datos/fuente.ts`, `src/lib/datos/fuentes/local-json.ts`
- Modify: `tests/lib/datos/local-json.test.ts`, `tests/lib/datos/esquemas.test.ts`

**Interfaces:**
- Produces: `Servicio = { id, nombre, gratuito: boolean, descripcion, alcance?, tiempos?: string[], fuente }`; `Norma = { id, titulo, descripcion, url: string | null, descargable: boolean }`; `Tramite = { id, nombre, quien, requisitos: string[], pasos: string[], plazo?, url?, fuente }`; `Consejo = { id, titulo, texto, categoria: 'conducir' | 'emergencia' }`; `Empresa.polizaRc: { aseguradora: string; numero: string; vigenciaHasta: fechaIso; url: string | null } | null`; `Contacto.cuentaRegularizacion: string | null`; `FuenteDatos.servicios()`, `normativa()`, `tramites()`, `consejos()`.

- [ ] **Step 1: Tests**

Agregar a `tests/lib/datos/local-json.test.ts`:

```ts
  it('servicios: gratuitos con los tiempos del pliego y onerosos separados', async () => {
    const s = await fuenteLocalJson.servicios();
    const grua = s.find((x) => x.id === 'grua-y-remolque')!;
    expect(grua.gratuito).toBe(true);
    expect(grua.tiempos).toEqual(['Vehículos livianos: 30 minutos en al menos el 90 % de los casos, y nunca más de 40.', 'Vehículos pesados: 60 minutos en al menos el 90 % de los casos, y nunca más de 72.']);
    expect(s.filter((x) => !x.gratuito).map((x) => x.id)).toEqual(['mecanica-general', 'remolque-extendido']);
  });
  it('normativa, trámites y consejos cargan y tienen ids únicos', async () => {
    const [n, tr, co] = await Promise.all([fuenteLocalJson.normativa(), fuenteLocalJson.tramites(), fuenteLocalJson.consejos()]);
    expect(n.map((x) => x.id)).toContain('resolucion-248-2026');
    expect(n.filter((x) => x.descargable).every((x) => x.url !== null)).toBe(true);
    expect(tr.map((x) => x.id)).toEqual(['tarifa-diferencial-vecinal', 'tarifa-diferencial-docente', 'exencion-discapacidad', 'exencion-malvinas', 'alta-telepase']);
    expect(co.filter((c) => c.categoria === 'emergencia').length).toBeGreaterThanOrEqual(4);
    expect(new Set(co.map((c) => c.id)).size).toBe(co.length);
  });
```

En `tests/lib/datos/esquemas.test.ts`, en `describe('esquemaEmpresa')`, sumar `polizaRc: null` al objeto `base` y un test:

```ts
  it('la póliza de RC es opcional (null) y, si viene, exige aseguradora, número y vigencia', () => {
    expect(esquemaEmpresa.parse(base).polizaRc).toBeNull();
    expect(() => esquemaEmpresa.parse({ ...base, polizaRc: { aseguradora: 'X Seguros', numero: '1', vigenciaHasta: '2027-10-05', url: null } })).not.toThrow();
    expect(() => esquemaEmpresa.parse({ ...base, polizaRc: { aseguradora: 'X Seguros' } })).toThrow();
  });
```

y en `describe('esquemaContacto')` sumar `cuentaRegularizacion: null` al objeto `vacio`.

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/lib/datos`
Expected: FAIL.

- [ ] **Step 3: Esquemas**

En `src/lib/datos/esquemas.ts`: dentro de `esquemaEmpresa`, después de `constanciaUrl`, agregar:

```ts
  /** Póliza de responsabilidad civil (PETG 61.6). null hasta que Covicen la mande. */
  polizaRc: z.object({ aseguradora: z.string().min(1), numero: z.string().min(1), vigenciaHasta: fechaIso, url: url.nullable() }).nullable(),
```

Dentro de `esquemaContacto`, después de `canales`: `/** Cuenta bancaria para regularizar peajes impagos (PETG 51.1.4 c). */ cuentaRegularizacion: z.string().min(1).nullable(),`.

Al final del archivo:

```ts
/** Servicio al usuario (PETG 54 y 55). Los gratuitos publican alcance y tiempos comprometidos. */
export const esquemaServicio = z.object({
  id: slug,
  nombre: z.string().min(1),
  gratuito: z.boolean(),
  descripcion: z.string().min(1),
  alcance: z.string().optional(),
  tiempos: z.array(z.string().min(1)).optional(),
  fuente: z.string().min(1),
});
export type Servicio = z.infer<typeof esquemaServicio>;

/** Normativa aplicable (PETG 61.6: "disponible para descargar"). descargable=false: se cita y se dice por qué no está. */
export const esquemaNorma = z.object({
  id: slug,
  titulo: z.string().min(1),
  descripcion: z.string().min(1),
  url: url.nullable(),
  descargable: z.boolean(),
});
export type Norma = z.infer<typeof esquemaNorma>;

/** Trámite del usuario (PETG 61.5 c). */
export const esquemaTramite = z.object({
  id: slug,
  nombre: z.string().min(1),
  quien: z.string().min(1),
  requisitos: z.array(z.string().min(1)),
  pasos: z.array(z.string().min(1)),
  plazo: z.string().optional(),
  url: url.optional(),
  fuente: z.string().min(1),
});
export type Tramite = z.infer<typeof esquemaTramite>;

/** Consejo de seguridad vial o de qué hacer ante una emergencia. */
export const esquemaConsejo = z.object({
  id: slug,
  titulo: z.string().min(1),
  texto: z.string().min(1),
  categoria: z.enum(['conducir', 'emergencia']),
});
export type Consejo = z.infer<typeof esquemaConsejo>;
```

- [ ] **Step 4: Datos**

`src/content/empresa.json`: agregar `"polizaRc": null` después de `"constanciaUrl": null`. `src/content/contacto.json`: agregar `"cuentaRegularizacion": null` después de `"canales": [...]`.

Crear `src/content/servicios.json`:

```json
[
  { "id": "emergencias-140", "nombre": "Emergencias 140", "gratuito": true, "descripcion": "Número corto de emergencia, gratuito desde cualquier celular, aun sin crédito o con señal solo de emergencia. Atendido por personas las 24 horas, los 365 días.", "fuente": "PETG art. 59 y 60.4" },
  { "id": "grua-y-remolque", "nombre": "Grúa y remolque para despejar la calzada", "gratuito": true, "descripcion": "Si tu vehículo queda detenido en la calzada por un accidente o un desperfecto, lo retiramos sin cargo.", "alcance": "Traslado hasta la localidad más próxima, o hasta cualquier punto anterior a esa localidad o estación de servicio más cercana, para que puedas conseguir asistencia mecánica.", "tiempos": ["Vehículos livianos: 30 minutos en al menos el 90 % de los casos, y nunca más de 40.", "Vehículos pesados: 60 minutos en al menos el 90 % de los casos, y nunca más de 72."], "fuente": "PETG art. 54.1, 54.2 y 54.5" },
  { "id": "moviles-de-seguridad-vial", "nombre": "Móviles de seguridad vial", "gratuito": true, "descripcion": "Vehículos identificados con el 140 que recorren el tramo, asisten en la ruta y aseguran el lugar de un incidente.", "alcance": "Un móvil sobre la RN 9 y otro sobre la RN 19.", "fuente": "PETG art. 70; PETP art. 13" },
  { "id": "telepase-gratuito", "nombre": "TelePASE sin costo", "gratuito": true, "descripcion": "La adhesión, el primer dispositivo por vehículo, su colocación, la renovación, la cancelación, la reposición y los gastos administrativos son gratuitos para el usuario.", "fuente": "PETG art. 50.5" },
  { "id": "atencion-al-usuario", "nombre": "Atención al usuario", "gratuito": true, "descripcion": "Reclamos, consultas y sugerencias con acuse en 24 horas y respuesta en 5 días hábiles, por formulario web, correo, 0800 y WhatsApp.", "fuente": "PETG art. 58 y 61" },
  { "id": "sanitarios", "nombre": "Sanitarios públicos", "gratuito": true, "descripcion": "Donde existan, el ingreso es libre y gratuito, con cambiador y sanitario para niños.", "fuente": "PETG art. 57" },
  { "id": "mecanica-general", "nombre": "Mecánica general", "gratuito": false, "descripcion": "Reparaciones de alguna complejidad, que requieran repuestos o demoras. Se cobra.", "fuente": "PETG art. 55" },
  { "id": "remolque-extendido", "nombre": "Remolque más allá del punto gratuito", "gratuito": false, "descripcion": "Traslado de un vehículo detenido más allá de la localidad o estación de servicio más próxima. Se cobra.", "fuente": "PETG art. 55" }
]
```

Crear `src/content/normativa.json`:

```json
[
  { "id": "resolucion-1379-2026", "titulo": "Resolución 1379/2026 del Ministerio de Economía", "descripcion": "Adjudicó los ocho tramos de la Etapa III de la Red Federal de Concesiones, entre ellos el Tramo Centro a Covicen (24/08/2026).", "url": "https://www.boletinoficial.gob.ar/detalleAviso/primera/346271/20260824", "descargable": true },
  { "id": "resolucion-248-2026", "titulo": "Resolución 248/2026 de la Dirección Nacional de Vialidad", "descripcion": "Aprobó los cuadros tarifarios vigentes en los corredores viales nacionales (Tramos I a X), que Covicen aplica desde la toma de posesión. Vigencia desde el 26/02/2026.", "url": "https://www.boletinoficial.gob.ar/detalleAviso/primera/338657/20260224", "descargable": true },
  { "id": "ley-27742", "titulo": "Ley 27.742 (Bases y Puntos de Partida para la Libertad de los Argentinos)", "descripcion": "Declaró a Corredores Viales S.A. sujeta a privatización y habilitó el nuevo régimen de concesiones.", "url": "https://www.boletinoficial.gob.ar/detalleAviso/primera/310150/20240708", "descargable": true },
  { "id": "decreto-97-2025", "titulo": "Decreto 97/2025", "descripcion": "Autorizó la privatización total de Corredores Viales S.A. y el programa Red Federal de Concesiones.", "url": "https://www.boletinoficial.gob.ar/detalleAviso/primera/320610/20250213", "descargable": true },
  { "id": "pliegos", "titulo": "Pliegos de la concesión (generales y particulares del Tramo Centro)", "descripcion": "Definen obras, servicios al usuario, canales de atención, tarifas y controles. Se publican acá cuando Covicen disponga de la versión definitiva firmada.", "url": null, "descargable": false }
]
```

Al ejecutar, verificar que las dos URL del Boletín Oficial de la Ley 27.742 y del Decreto 97/2025 abran el aviso correcto; si el número de aviso no coincide, reemplazarlo por el que devuelve la búsqueda del BO y dejar la fecha de publicación en la descripción.

Crear `src/content/tramites.json`:

```json
[
  { "id": "tarifa-diferencial-vecinal", "nombre": "Tarifa diferencial para vecinos y frentistas", "quien": "Personas con domicilio permanente cerca de una estación de peaje, con vehículo de categoría 1 a su nombre.", "requisitos": ["DNI con el domicilio de vivienda permanente actualizado.", "Escritura o contrato de alquiler de la vivienda.", "Una boleta de servicio público a nombre del solicitante.", "Cédula verde del vehículo a nombre del solicitante (o cédula azul y constancia del vínculo).", "Dispositivo TelePASE habilitado."], "pasos": ["Reunís la documentación.", "Hacés la solicitud por Trámites a Distancia (TAD) con tu CUIT o CUIL y clave, eligiendo la estación de peaje.", "Te avisamos por el canal que indiques cuando esté aprobada.", "Cada año hay que reempadronarse: el beneficio vence si no se renueva."], "plazo": "El beneficio es anual y se renueva.", "fuente": "PETP art. 4; PETG art. 56.1 y 61.5 c" },
  { "id": "tarifa-diferencial-docente", "nombre": "Tarifa diferencial para docentes", "quien": "Docentes que cruzan una estación de peaje para ir a su lugar de trabajo, con vehículo de categoría 1.", "requisitos": ["DNI.", "Constancia de servicios o recibo de sueldo del establecimiento.", "Cédula del vehículo a nombre del solicitante.", "Dispositivo TelePASE habilitado."], "pasos": ["Reunís la documentación.", "Hacés la solicitud por Trámites a Distancia (TAD), eligiendo la estación de peaje.", "Cada año hay que reempadronarse."], "plazo": "El beneficio es anual y se renueva.", "fuente": "PETP art. 4; PETG art. 61.5 c" },
  { "id": "exencion-discapacidad", "nombre": "Exención de peaje para personas con discapacidad", "quien": "Titulares del Certificado Único de Discapacidad (CUD) con vehículo afectado a su uso.", "requisitos": ["Certificado Único de Discapacidad vigente.", "DNI.", "Cédula del vehículo (o del vehículo afectado al traslado).", "Dispositivo TelePASE habilitado a este efecto."], "pasos": ["Presentás la solicitud ante Vialidad Nacional según su reglamento vigente de exentos.", "Con la exención otorgada, se habilita el TelePASE en los sectores de detención segura de las estaciones."], "fuente": "PETG art. 52 y 56.1" },
  { "id": "exencion-malvinas", "nombre": "Exención de peaje para ex combatientes de Malvinas", "quien": "Veteranos de la guerra de Malvinas con certificación oficial.", "requisitos": ["Certificado de veterano de guerra.", "DNI.", "Cédula del vehículo.", "Dispositivo TelePASE habilitado a este efecto."], "pasos": ["Hacés el trámite nacional en argentina.gob.ar.", "Con la exención otorgada, se habilita el TelePASE en los sectores de detención segura de las estaciones."], "url": "https://www.argentina.gob.ar/servicio/exencion-de-pago-de-peaje-ex-combatientes-de-malvinas", "fuente": "PETG art. 52 y 56.1" },
  { "id": "alta-telepase", "nombre": "Alta de TelePASE", "quien": "Cualquier usuario. Es gratuito: adhesión, primer dispositivo, colocación, renovación y reposición.", "requisitos": ["DNI.", "Cédula del vehículo.", "Un medio de pago (prepago o pospago con tarjeta)."], "pasos": ["Te adherís en telepase.com.ar o en un punto de colocación.", "Elegís prepago (cargás saldo) o pospago (se factura a mes vencido con el detalle de pasadas).", "Retirás y colocás el dispositivo, sin cargo."], "url": "https://www.telepase.com.ar/", "fuente": "PETG art. 50.1.3, 50.5 y 51.1" }
]
```

Crear `src/content/consejos.json`:

```json
[
  { "id": "distancia", "categoria": "conducir", "titulo": "Distancia de seguimiento", "texto": "En autopista, tres segundos respecto del vehículo de adelante. Con lluvia o niebla, el doble." },
  { "id": "velocidad", "categoria": "conducir", "titulo": "Velocidad", "texto": "Máxima 130 km/h en autopista y 110 en ruta convencional para autos; menos con lluvia, viento o niebla. La mínima en autopista es 60." },
  { "id": "luces", "categoria": "conducir", "titulo": "Luces bajas siempre", "texto": "Es obligatorio circular con luces bajas encendidas de día y de noche en rutas nacionales." },
  { "id": "niebla", "categoria": "conducir", "titulo": "Niebla", "texto": "La zona de Leones, Marcos Juárez y la RN 34 tienen niebla frecuente en otoño e invierno. Bajá la velocidad, luces bajas, no frenes de golpe." },
  { "id": "animales", "categoria": "conducir", "titulo": "Animales sueltos", "texto": "Son frecuentes en RN 19 y RN 34. De noche, atención a los ojos que reflejan la luz. Avisá al 140." },
  { "id": "cansancio", "categoria": "conducir", "titulo": "Cansancio", "texto": "Cada dos horas, parada. Si cabeceás, no se pasa con música: se pasa durmiendo veinte minutos." },
  { "id": "sobrepaso", "categoria": "conducir", "titulo": "Sobrepaso", "texto": "Solo con línea discontinua y visibilidad completa. En autopista, por la izquierda; después volvé al carril derecho." },
  { "id": "cinturon", "categoria": "conducir", "titulo": "Cinturón y sillas", "texto": "Todos los ocupantes con cinturón; menores de diez años atrás, con sistema de retención según edad." },
  { "id": "sali-de-la-calzada", "categoria": "emergencia", "titulo": "Salí de la calzada", "texto": "Detenete en la banquina, lo más a la derecha posible, y encendé las balizas." },
  { "id": "protegete", "categoria": "emergencia", "titulo": "Protegete", "texto": "Bajá por el lado contrario al tránsito y esperá detrás del guardarraíl si lo hay. De noche, chaleco reflectivo. No cruces la calzada a pie." },
  { "id": "llama-al-140", "categoria": "emergencia", "titulo": "Llamá al 140", "texto": "Es gratis y funciona sin crédito. Decí ruta, sentido y kilómetro (los mojones están cada kilómetro) y qué pasó. Quedate en línea." },
  { "id": "espera-el-auxilio", "categoria": "emergencia", "titulo": "Esperá el auxilio", "texto": "El móvil o la grúa llegan, aseguran el lugar y te asisten. No aceptes remolques no identificados: el servicio de Covicen es gratuito y lleva el 140 pintado." },
  { "id": "comparti-tu-ubicacion", "categoria": "emergencia", "titulo": "Compartí tu ubicación", "texto": "Si no sabés el kilómetro, el botón de asistencia de este sitio toma la ubicación de tu celular para que se la dictes al operador." }
]
```

- [ ] **Step 5: Fuente de datos**

En `src/lib/datos/fuente.ts` importar los tipos y agregar a la interfaz:

```ts
  servicios(): Promise<Servicio[]>;
  normativa(): Promise<Norma[]>;
  tramites(): Promise<Tramite[]>;
  consejos(): Promise<Consejo[]>;
```

En `src/lib/datos/fuentes/local-json.ts`: importar `serviciosJson`, `normativaJson`, `tramitesJson`, `consejosJson` de `@/content/*.json`, sumar `esquemaServicio`, `esquemaNorma`, `esquemaTramite`, `esquemaConsejo` y sus tipos al import, y agregar a `fuenteLocalJson`:

```ts
  servicios: async (): Promise<Servicio[]> => z.array(esquemaServicio).parse(serviciosJson),
  normativa: async (): Promise<Norma[]> => z.array(esquemaNorma).parse(normativaJson),
  tramites: async (): Promise<Tramite[]> => z.array(esquemaTramite).parse(tramitesJson),
  consejos: async (): Promise<Consejo[]> => z.array(esquemaConsejo).parse(consejosJson),
```

- [ ] **Step 6: Correr los tests**

Run: `pnpm vitest run tests/lib/datos && pnpm check`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/datos/esquemas.ts src/lib/datos/fuente.ts src/lib/datos/fuentes/local-json.ts src/content/servicios.json src/content/normativa.json src/content/tramites.json src/content/consejos.json src/content/empresa.json src/content/contacto.json tests/lib/datos/local-json.test.ts tests/lib/datos/esquemas.test.ts
git commit -m "feat(datos): servicios, normativa, trámites y consejos del pliego como datos; póliza y cuenta como slots"
```

### Tarea 4.2: Servicios al usuario y componente de canales

**Files:**
- Modify: `src/pages/servicios.astro` (todo), `src/components/home/Servicios.astro:8-12`
- Create: `src/components/Canales.astro`
- Create: `tests/components/servicios.test.ts`

**Interfaces:**
- Produces: `<Canales canales={Canal[]} compacto? />` (tabla con nombre, disponibilidad, acuse, respuesta; los sin `valor` dicen "Se habilita con la toma de posesión, el 5 de octubre de 2026").

- [ ] **Step 1: Test**

Crear `tests/components/servicios.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Canales from '@/components/Canales.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('Canales', () => {
  it('lista los canales con plazos; los no habilitados lo dicen sin relleno', async () => {
    const html = await (await AstroContainer.create()).renderToString(Canales, { props: { canales: (await fuenteLocalJson.contacto()).canales } });
    expect(html).toContain('href="tel:140"');
    expect(html).toContain('5 días hábiles');
    expect(html.match(/Se habilita con la toma de posesión/g)?.length).toBe(3);
    expect(html).not.toMatch(/a confirmar/i);
    expect(html).toContain('<caption');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm vitest run tests/components/servicios.test.ts`
Expected: FAIL.

- [ ] **Step 3: `src/components/Canales.astro`**

```astro
---
// Tabla de canales de atención con los plazos del pliego (PETG 58): acuse (TA) y respuesta (TR). Un canal sin valor
// existe por contrato pero todavía no está habilitado: se dice cuándo, sin inventar un número.
import type { Canal } from '@/lib/datos/esquemas';
import { ruta } from '@/lib/rutas';
interface Props { canales: Canal[]; compacto?: boolean }
const { canales, compacto = false } = Astro.props;
const enlace = (c: Canal) => {
  if (!c.valor) return null;
  if (c.tipo === 'telefono') return { href: `tel:${c.valor.replace(/[^\d+]/g, '')}`, texto: c.valor };
  if (c.tipo === 'correo') return { href: `mailto:${c.valor}`, texto: c.valor };
  if (c.tipo === 'whatsapp') return { href: `https://wa.me/${c.valor}`, texto: 'Abrir WhatsApp' };
  if (c.tipo === 'web') return { href: c.valor.startsWith('/') ? ruta(c.valor) : c.valor, texto: 'Abrir' };
  return null;
};
---
<div class="overflow-x-auto rounded-md border border-borde" tabindex="0" role="region" aria-label="Canales de atención y plazos">
  <table class="w-full border-collapse text-left text-sm">
    <caption class="sr-only">Canales de atención al usuario con su disponibilidad, tiempo de acuse y tiempo de respuesta.</caption>
    <thead class="bg-fondo-2 uppercase tracking-wider text-texto-2"><tr><th scope="col" class="px-4 py-3">Canal</th>{!compacto && <th scope="col" class="px-4 py-3">Disponibilidad</th>}<th scope="col" class="px-4 py-3">Acuse</th><th scope="col" class="px-4 py-3">Respuesta</th></tr></thead>
    <tbody class="divide-y divide-borde">
      {canales.map((c) => { const e = enlace(c); return (
        <tr class="hover:bg-superficie">
          <th scope="row" class="px-4 py-3 font-semibold text-texto">{c.nombre}<span class="block text-sm font-normal text-texto-2">{e ? <a href={e.href} rel={e.href.startsWith('http') ? 'noopener noreferrer' : undefined} target={e.href.startsWith('http') ? '_blank' : undefined}>{e.texto}</a> : 'Se habilita con la toma de posesión, el 5 de octubre de 2026.'}</span></th>
          {!compacto && <td class="px-4 py-3 text-texto-2">{c.disponibilidad}</td>}
          <td class="px-4 py-3 text-texto-2">{c.acuse}</td>
          <td class="px-4 py-3 text-texto-2">{c.respuesta}</td>
        </tr>
      ); })}
    </tbody>
  </table>
</div>
```

- [ ] **Step 4: `src/pages/servicios.astro`**

```astro
---
import Base from '@/layouts/Base.astro';
import Canales from '@/components/Canales.astro';
import HuecoCapacidad from '@/components/HuecoCapacidad.astro';
import Seccion from '@/components/ui/Seccion.astro';
import Senal from '@/components/ui/Senal.astro';
import { datos } from '@/lib/datos';
const [servicios, contacto] = await Promise.all([datos.servicios(), datos.contacto()]);
const gratuitos = servicios.filter((s) => s.gratuito);
const onerosos = servicios.filter((s) => !s.gratuito);
---
<Base titulo="Servicios al usuario" descripcion="Servicios de Covicen en el Tramo Centro: emergencias 140, grúa y remolque gratuitos con tiempos comprometidos, móviles de seguridad vial, TelePASE sin costo, atención al usuario con plazos, y qué servicios se cobran." migas={[{ nombre: 'Servicios', href: '/servicios' }]}>
  <Seccion nivel="h1" eyebrow="Servicios" titulo="Qué te da el peaje, y qué se cobra aparte." intro="El contrato obliga a prestar estos servicios y a decir cuáles son gratuitos y cuáles no. Acá están, con el artículo del pliego que los exige." class="pt-10 pb-0" />
  <Seccion id="gratuitos" indice="01" eyebrow="Sin costo" titulo="Servicios gratuitos." fondo="fondo-2">
    <ul class="escalonar grid gap-4 md:grid-cols-2">
      {gratuitos.map((s, i) => (
        <li class="tarjeta p-6" style={`--i: ${i}`}>
          <div class="flex items-start justify-between gap-3"><h3 class="text-xl">{s.nombre}</h3><Senal variante="ok">Gratis</Senal></div>
          <p class="mt-2 text-texto-2">{s.descripcion}</p>
          {s.alcance && <p class="mt-2 text-texto-2"><span class="text-texto">Alcance:</span> {s.alcance}</p>}
          {s.tiempos && <ul class="mt-3 flex flex-col gap-1 text-texto-2">{s.tiempos.map((t) => <li class="flex gap-2"><span aria-hidden="true">—</span>{t}</li>)}</ul>}
          <p class="anotacion mt-3 text-xs text-texto-3">Fuente: {s.fuente}</p>
        </li>
      ))}
    </ul>
  </Seccion>
  <Seccion id="con-costo" indice="02" eyebrow="Con costo" titulo="Servicios que se cobran." intro="Para que nadie se lleve una sorpresa: esto no lo cubre el peaje.">
    <ul class="escalonar grid gap-4 md:grid-cols-2">
      {onerosos.map((s, i) => <li class="tarjeta p-6" style={`--i: ${i}`}><div class="flex items-start justify-between gap-3"><h3 class="text-xl">{s.nombre}</h3><Senal variante="frio">Con costo</Senal></div><p class="mt-2 text-texto-2">{s.descripcion}</p><p class="anotacion mt-3 text-xs text-texto-3">Fuente: {s.fuente}</p></li>)}
    </ul>
  </Seccion>
  <Seccion id="canales" indice="03" eyebrow="Atención" titulo="Canales y plazos de respuesta." intro="Los que fija el pliego (art. 58). Los que todavía no están habilitados lo dicen." fondo="fondo-2">
    <div class="revelar"><Canales canales={contacto.canales} /></div>
  </Seccion>
  <Seccion indice="04" eyebrow="Más adelante" titulo="Lo que se suma cuando existan los sistemas.">
    <div class="grid gap-4 md:grid-cols-2">
      <HuecoCapacidad capacidad="oficinaVirtual" titulo="Oficina virtual" descripcion="Pasadas, facturas, deuda, comprobantes y pagos de TelePASE en línea." alternativaHref="/medios-de-pago#mi-cuenta" alternativaTexto="Qué vas a poder hacer" />
      <HuecoCapacidad capacidad="ticketingReclamos" titulo="Seguimiento de reclamos" descripcion="Número de reclamo y estado en línea." alternativaHref="/contacto" alternativaTexto="Cómo hacer un reclamo hoy" />
    </div>
  </Seccion>
</Base>
```

En `src/components/home/Servicios.astro` líneas 8–12:

```ts
const servicios = [
  { Icono: LifeBuoy, titulo: 'Emergencias 140 y auxilio', texto: 'Llamá al 140, gratis y las 24 horas. Grúa y remolque sin cargo para despejar la calzada, con tiempos comprometidos.', href: '/emergencias' },
  { Icono: ShieldCheck, titulo: 'Seguridad vial', texto: 'Móviles de seguridad en RN 9 y RN 19, señalización de obras y consejos para manejar mejor en el centro del país.', href: '/seguridad-vial' },
  { Icono: CreditCard, titulo: 'Medios de pago', texto: 'TelePASE gratis y en todas las estaciones, pago en la vía donde haya cabinas y Free Flow en las estaciones nuevas.', href: '/medios-de-pago' },
];
```

- [ ] **Step 5: Tests y verificación**

Run: `pnpm vitest run tests/components/servicios.test.ts && pnpm check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/pages/servicios.astro src/components/home/Servicios.astro src/components/Canales.astro tests/components/servicios.test.ts
git commit -m "feat(servicios): gratuitos y con costo con tiempos del pliego, y tabla de canales con plazos"
```

### Tarea 4.3: Medios de pago desde datos, con "Mi cuenta" y "Pasaste sin pagar"

**Files:**
- Modify: `src/pages/medios-de-pago.astro` (todo)

- [ ] **Step 1: Reescribir**

```astro
---
import { ExternalLink } from '@lucide/astro';
import Base from '@/layouts/Base.astro';
import Boton from '@/components/ui/Boton.astro';
import Card from '@/components/ui/Card.astro';
import Seccion from '@/components/ui/Seccion.astro';
import Senal from '@/components/ui/Senal.astro';
import { datos } from '@/lib/datos';
import { cabinaOperativa } from '@/lib/datos/esquemas';
const [tramo, contacto] = await Promise.all([datos.tramo(), datos.contacto()]);
const conCabina = tramo.cabinas.filter(cabinaOperativa).map((c) => c.nombre);
const freeFlow = tramo.cabinas.filter((c) => c.freeFlow).map((c) => c.nombre);
const colocacion = tramo.cabinas.filter((c) => c.servicios?.colocacionTelepase).map((c) => c.nombre);
const oficina = contacto.enlaces.oficinaVirtual;
// Modalidades del pliego (PETG 51.1).
const modalidades = [
  { titulo: 'Prepago con TelePASE', texto: 'Cargás saldo por adelantado y cada pasada se descuenta a la tarifa vigente de tu categoría.', fuente: 'PETG art. 51.1.1' },
  { titulo: 'Pospago con TelePASE', texto: 'Asociás una tarjeta de crédito o débito y pagás a mes vencido. La factura detalla pasadas, estaciones e importes.', fuente: 'PETG art. 51.1.2' },
  { titulo: 'Contado en la vía', texto: `Efectivo o medios electrónicos en las vías habilitadas de las estaciones con cabina (${conCabina.join(', ')}).`, fuente: 'PETG art. 51.1.3' },
];
---
<Base titulo="Medios de pago" descripcion="Cómo pagar el peaje en el Tramo Centro: TelePASE prepago o pospago, pago en la vía en Carcarañá, James Craik y Franck, Free Flow en las estaciones nuevas, y qué hacer si pasaste sin pagar." migas={[{ nombre: 'Servicios', href: '/servicios' }, { nombre: 'Medios de pago', href: '/medios-de-pago' }]}>
  <Seccion nivel="h1" eyebrow="Medios de pago" titulo="Cómo pagar el peaje." intro="Con TelePASE se paga lo mismo que en la vía. El dispositivo es gratis y sirve en toda la red nacional." class="pt-10">
    <ul class="escalonar grid gap-4 md:grid-cols-3">{modalidades.map((m, i) => <li style={`--i: ${i}`}><Card><h2 class="text-xl">{m.titulo}</h2><p class="mt-2 text-texto-2">{m.texto}</p><p class="anotacion mt-3 text-xs text-texto-3">Fuente: {m.fuente}</p></Card></li>)}</ul>
  </Seccion>

  <Seccion id="telepase" indice="01" eyebrow="TelePASE" titulo="Gratis, y en todas las estaciones." intro="La adhesión, el primer dispositivo por vehículo, su colocación, la renovación, la cancelación y la reposición no tienen costo para el usuario (PETG art. 50.5). Los exentos y las tarifas diferenciales también se gestionan con TelePASE." fondo="fondo-2">
    <div class="revelar grid gap-6 md:grid-cols-2">
      <div class="tarjeta p-6"><h3 class="text-xl">Cómo adherirte</h3><p class="mt-2 text-texto-2">En el sitio oficial de TelePASE o en un punto de colocación. Elegís prepago o pospago y retirás el dispositivo sin cargo.</p><div class="mt-4"><Boton href={contacto.enlaces.telepase} variante="secundario" externo>Ir a TelePASE <ExternalLink size={16} aria-hidden="true" /></Boton></div></div>
      <div class="tarjeta p-6"><h3 class="text-xl">Dónde se coloca</h3>{colocacion.length > 0 ? <p class="mt-2 text-texto-2">En los sectores de detención segura de {colocacion.join(', ')}, en días hábiles.</p> : <p class="mt-2 text-texto-2">En los sectores de detención segura de las estaciones, con horarios señalizados en cada una. Publicamos las ubicaciones cuando Covicen las defina.</p>}</div>
    </div>
  </Seccion>

  <Seccion id="free-flow" indice="02" eyebrow="Free Flow" titulo="Sin barreras en las estaciones nuevas." intro={`${freeFlow.join(', ')} se construyen sin cabinas: pórticos que leen el TelePASE o la patente sin que frenes. Cobran cuando Vialidad Nacional las habilite.`}>
    <p class="revelar text-texto-2">Si pasás sin TelePASE por una estación Free Flow, el peaje se paga después por los medios habilitados; pasado el plazo, se aplican los recargos de abajo.</p>
  </Seccion>

  <Seccion id="mi-cuenta" indice="03" eyebrow="Mi cuenta" titulo="Tus pasadas, facturas y pagos en un solo lugar." intro="La oficina virtual de TelePASE: consultás pasadas y facturas, ves si tenés deuda, descargás comprobantes y pagás." fondo="fondo-2">
    <div class="revelar flex flex-wrap items-center gap-4">
      {oficina ? <Boton href={oficina} externo>Entrar a Mi cuenta <ExternalLink size={16} aria-hidden="true" /></Boton> : <><Senal variante="frio">Se habilita con la toma de posesión</Senal><p class="text-texto-2">El acceso se publica acá y en la barra superior del sitio cuando esté disponible.</p></>}
    </div>
  </Seccion>

  <Seccion id="sin-pagar" indice="04" eyebrow="Pasaste sin pagar" titulo="Cómo regularizarlo." intro="Si cruzás una estación sin TelePASE vigente y sin pagar (PETG art. 51.1.4):">
    <ol class="revelar grid gap-4 md:grid-cols-2">
      <li class="tarjeta p-6"><p class="eyebrow">Dentro de los 30 días</p><p class="mt-2 text-texto-2">La tarifa que correspondía más <strong class="text-texto">una tarifa</strong> de tu categoría.</p></li>
      <li class="tarjeta p-6"><p class="eyebrow">Después de los 30 días</p><p class="mt-2 text-texto-2">La tarifa más <strong class="text-texto">dos tarifas</strong> de tu categoría, con intereses a la tasa activa del Banco Nación.</p></li>
    </ol>
    {contacto.cuentaRegularizacion ? <p class="revelar mt-6 text-texto-2">Podés pagar la deuda por transferencia a: <strong class="text-texto">{contacto.cuentaRegularizacion}</strong>.</p> : <p class="revelar mt-6 text-texto-2">El medio para pagar la deuda se publica acá cuando esté habilitado.</p>}
  </Seccion>
</Base>
```

- [ ] **Step 2: Verificar**

Run: `pnpm check && pnpm vitest run tests/components`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/pages/medios-de-pago.astro
git commit -m "feat(pago): modalidades del pliego, TelePASE gratis, Free Flow desde datos, Mi cuenta y regularización"
```

### Tarea 4.4: Quiénes somos, original y con las obras reales

**Files:**
- Modify: `src/pages/quienes-somos.astro` (todo)
- Create: `scripts/originalidad.ts`
- Modify: `src/lib/atmosfera.ts` (glob de institucional para el organigrama)

- [ ] **Step 1: Reescribir la página**

```astro
---
import { ExternalLink } from '@lucide/astro';
import { Image } from 'astro:assets';
import Base from '@/layouts/Base.astro';
import ImagenAtmosfera from '@/components/ilustraciones/ImagenAtmosfera.astro';
import Mojon from '@/components/ui/Mojon.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
import { imagenInstitucional } from '@/lib/atmosfera';
import { fechaLarga, numero } from '@/lib/formato';
const [e, tramo] = await Promise.all([datos.empresa(), datos.tramo()]);
const c = e.concesion;
const organigrama = imagenInstitucional('organigrama');
// Obligaciones tomadas del pliego del Tramo Centro (PETP art. 6 y 7) y del general (PETG 54, 59, 70).
const asumimos = [
  ['Conservar los 679 km', 'Calzada, banquinas, señalización, iluminación, desagües y forestación de las tres rutas, todos los días de los veinte años.'],
  ['Reconstruir las losas de hormigón', 'En la RN 9 y en la RN 19, los tramos de hormigón deteriorado se reconstruyen. Es una obra obligatoria del contrato.'],
  ['Pavimentar las banquinas', 'En la RN 9 entre Rosario y Carcarañá, para que detenerse sea seguro.'],
  ['Mantener el puente sobre el río Carcarañá', 'En la RN 34, con el plan de conservación que fija el pliego.'],
  ['Rehabilitar el asfalto por secciones', 'Toneladas mínimas de concreto asfáltico por año y por sección, medidas cada seis meses.'],
  ['Auxiliar gratis y a tiempo', 'Grúa y remolque para despejar la calzada, sin cargo, con tiempos comprometidos: 30 minutos para livianos, 60 para pesados.'],
  ['Atender el 140 con personas', 'Las 24 horas, los 365 días, gratis desde cualquier celular. Nunca solo un contestador.'],
  ['Cobrar solo lo habilitado', 'El peaje se cobra donde y cuando Vialidad Nacional lo autoriza, con el cuadro que ella aprueba. Las estaciones nuevas no cobran hasta estar construidas.'],
] as const;
---
<Base titulo="Quiénes somos" descripcion="Covicen es la concesionaria del Tramo Centro de la Red Federal de Concesiones: 679 km de RN 9, RN 19 y RN 34 entre Córdoba y Santa Fe, adjudicados por la Resolución 1379/2026 a AFEMA S.A., Pablo Federico e Hijos S.A. y Guido Mogetta S.A. Qué asumimos y quién nos controla." migas={[{ nombre: 'Quiénes somos', href: '/quienes-somos' }]}>
  <Seccion nivel="h1" eyebrow="Quiénes somos" titulo="Somos quienes van a cuidar las rutas del centro." intro={`Covicen es la concesionaria del Tramo Centro de la Red Federal de Concesiones: ${numero(c.km, 2)} km de rutas nacionales entre Córdoba y Santa Fe que, desde el ${fechaLarga(c.inicioOperacion)} y por ${c.plazoAnios} años, pasan a estar bajo nuestra responsabilidad.`} class="pt-10">
    <div class="revelar prose-covicen max-w-prose text-lg text-texto-2">
      <p>Nacimos de tres empresas constructoras de Córdoba y Santa Fe —{e.consorcio.map((s) => s.nombre).join(', ').replace(/, ([^,]*)$/, ' y $1')}— que se unieron para presentarse a la licitación del Tramo Centro y la ganaron ofreciendo el peaje más bajo de los {c.tramosEtapa} tramos de la Etapa III. La adjudicación es la {c.adjudicacion.resolucion}, del {fechaLarga(c.adjudicacion.fecha)}.</p>
      <p>No venimos a inaugurar una ruta: venimos a hacernos cargo de una que ya existe y que la gente usa todos los días. Por eso el orden es este: primero las obras, después el peaje pleno. El contrato lo exige y nosotros lo firmamos.</p>
      {e.enFormacion && <p>La sociedad está en formación. Cuando se complete la inscripción, publicamos acá y en el pie de página la razón social, el CUIT y los domicilios.</p>}
    </div>
    <div class="escalonar mt-12 grid gap-10 sm:grid-cols-2">
      <div style="--i: 0"><Mojon valor={c.plazoAnios} unidad="años" etiqueta={`de concesión${c.prorrogaAnios ? ` (+${c.prorrogaAnios} prorrogables)` : ''}`} animar /></div>
      <div style="--i: 1"><Mojon valor={tramo.cabinas.length} unidad="peajes" etiqueta="en tres rutas y dos provincias" animar /></div>
    </div>
  </Seccion>

  <Seccion indice="01" eyebrow="Qué asumimos" titulo="Ocho compromisos que se pueden exigir." intro="Todos están en el pliego de la concesión. Ninguno es una promesa de marketing." fondo="fondo-2">
    <ol class="escalonar grid gap-4 md:grid-cols-2">
      {asumimos.map(([t, d], i) => <li class="tarjeta p-6" style={`--i: ${i}`}><span class="eyebrow tabular-nums">0{i + 1}</span><h3 class="mt-3 text-xl">{t}</h3><p class="mt-2 text-texto-2">{d}</p></li>)}
    </ol>
  </Seccion>

  <Seccion indice="02" eyebrow="Quién nos controla" titulo="Vialidad Nacional, con indicadores. Y vos, con este sitio.">
    <div class="revelar grid gap-8 md:grid-cols-2">
      <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-texto-2">
        <dt class="eyebrow">Régimen</dt><dd>Concesión de obra pública por peaje, inversión privada, sin subsidios del Estado.</dd>
        <dt class="eyebrow">Tramo</dt><dd>Centro: {numero(c.km, 2)} km sobre {c.rutas.join(', ')}, en {c.provincias.join(' y ')}.</dd>
        <dt class="eyebrow">Plazo</dt><dd>{c.plazoAnios} años desde el {fechaLarga(c.inicioOperacion)}.</dd>
        <dt class="eyebrow">Adjudicación</dt><dd>{fechaLarga(c.adjudicacion.fecha)}, {c.adjudicacion.resolucion}. <a href={c.adjudicacion.url} rel="noopener noreferrer" target="_blank" class="inline-flex items-center gap-1">Boletín Oficial <ExternalLink size={12} aria-hidden="true" /></a></dd>
        <dt class="eyebrow">Control</dt><dd>La Dirección Nacional de Vialidad supervisa la concesión con niveles de servicio, indicadores de desempeño e informes periódicos, y puede sancionar los incumplimientos.</dd>
      </dl>
      <div class="prose-covicen text-texto-2">
        <p><strong>Misión.</strong> Que cruzar el centro del país sea seguro, previsible y justo en lo que cuesta: rutas en condiciones, auxilio a tiempo y un peaje que se explica solo.</p>
        <p><strong>Visión.</strong> Un corredor donde cada peaje tenga una obra que lo respalde y cada persona que viaja sepa a quién llamar y qué esperar.</p>
        <p>Este sitio publica el cuadro tarifario con su resolución, el estado de las obras, los tiempos de auxilio comprometidos y los plazos de respuesta. Si algo de eso no se cumple, el reclamo tiene fundamento escrito.</p>
      </div>
    </div>
  </Seccion>

  <Seccion indice="03" eyebrow="El consorcio" titulo="Tres empresas de construcción vial." fondo="fondo-2">
    <div class="revelar tarjeta mb-6 aspect-[21/9] w-full overflow-hidden p-0 empty:hidden"><div class="h-full w-full overflow-hidden rounded-[calc(var(--tarjeta-radio)-1.5px)]"><ImagenAtmosfera nombre="consorcio" alt="Tablero de un puente en construcción sobre la autopista, con una grúa torre al anochecer" sizes="(min-width: 80rem) 80rem, 100vw" /></div></div>
    <ul class="escalonar grid gap-4 md:grid-cols-3">{e.consorcio.map((s, i) => <li class="tarjeta p-6" style={`--i: ${i}`}><h3 class="text-xl">{s.nombre}</h3><p class="mt-2 text-texto-2">{s.descripcion}</p></li>)}</ul>
  </Seccion>

  {organigrama && (
    <Seccion indice="04" eyebrow="Organigrama" titulo="Cómo estamos organizados.">
      <figure class="revelar tarjeta overflow-hidden p-2"><Image src={organigrama} alt="Organigrama de Covicen" widths={[640, 1024, 1600]} sizes="(min-width: 80rem) 80rem, 100vw" class="h-auto w-full rounded-[calc(var(--tarjeta-radio)-1.5px)] bg-white" /></figure>
    </Seccion>
  )}
</Base>
```

En `src/lib/atmosfera.ts` agregar:

```ts
const institucionales = import.meta.glob<{ default: ImageMetadata }>('/src/assets/institucional/*.{jpg,jpeg,png,webp}', { eager: true });
/** Imágenes institucionales opcionales (organigrama). Sin archivo, la sección no se renderiza. */
export const imagenInstitucional = (nombre: string): ImageMetadata | undefined =>
  Object.entries(institucionales).find(([ruta]) => ruta.replace(/^.*\//, '').replace(/\.[^.]+$/, '') === nombre)?.[1].default;
```

(Crear la carpeta `src/assets/institucional/` con un `.gitkeep`; el organigrama lo carga Covicen como `organigrama.png`.)

- [ ] **Step 2: Script de originalidad (se corre una vez, no en CI)**

Crear `scripts/originalidad.ts`:

```ts
// Compara el texto de Quiénes somos (dist/) contra páginas institucionales de otras concesionarias: ninguna secuencia de
// 6 palabras puede coincidir. Uso: node scripts/originalidad.ts https://www.corresur.com.ar/ https://cvsa.com.ar/nosotros …
// Se corre a mano después de `pnpm build`. No va en CI: depende de sitios ajenos.
import { readFileSync } from 'node:fs';
import { textoVisible } from './lib/html.ts';

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ\s]/g, ' ').split(/\s+/).filter(Boolean);
const ngramas = (palabras: string[], n = 6) => new Set(palabras.slice(0, Math.max(0, palabras.length - n + 1)).map((_, i) => palabras.slice(i, i + n).join(' ')));

const propio = ngramas(normalizar(textoVisible(readFileSync('dist/quienes-somos/index.html', 'utf8'))));
const urls = process.argv.slice(2);
if (urls.length === 0) { console.error('Pasá al menos una URL institucional para comparar.'); process.exit(2); }
let coincidencias = 0;
for (const url of urls) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Covicen-originalidad)' } });
  if (!r.ok) { console.warn(`${url}: ${r.status}, se salta`); continue; }
  const ajeno = ngramas(normalizar(textoVisible(await r.text())));
  const comunes = [...propio].filter((g) => ajeno.has(g));
  coincidencias += comunes.length;
  console.log(`${url}: ${comunes.length} secuencias de 6 palabras en común${comunes.length ? `\n  - ${comunes.join('\n  - ')}` : ''}`);
}
process.exit(coincidencias > 0 ? 1 : 0);
```

Agregar a `package.json` → `"originalidad": "node scripts/originalidad.ts"`.

- [ ] **Step 3: Correr**

Run: `pnpm build && pnpm originalidad https://www.corresur.com.ar/ https://cvsa.com.ar/` (sumar las páginas institucionales de Autovía del Mercosur y Caminos del Río Uruguay que estén en línea: buscar "nosotros"/"institucional" en cada sitio y pasar esas URL).
Expected: `0 secuencias de 6 palabras en común` para cada URL. Si hay coincidencias, reescribir esa frase en la página y repetir. Corresur devuelve 403 sin User-Agent de navegador: el script ya manda uno; si sigue en 403, comparar contra el texto guardado a mano desde el navegador en `scratch/corresur.txt` adaptando la URL por una ruta local (`file://` no aplica: pegar el texto y leerlo con `readFileSync`).

- [ ] **Step 4: Tests, typecheck y commit**

Run: `pnpm check && pnpm verificar`
Expected: verde (sin "681", "a confirmar" ni descriptor).

```bash
git add src/pages/quienes-somos.astro src/lib/atmosfera.ts src/assets/institucional/.gitkeep scripts/originalidad.ts package.json
git commit -m "feat(institucional): Quiénes somos original con los compromisos del pliego; organigrama como slot; chequeo de originalidad"
```

### Tarea 4.5: Transparencia, Guía de trámites, Seguridad vial y Emergencias

**Files:**
- Modify: `src/pages/transparencia.astro` (todo), `src/pages/tramites.astro` (todo), `src/pages/seguridad-vial.astro` (todo), `src/pages/emergencias.astro` (pasos y tiempos desde datos)

- [ ] **Step 1: `src/pages/transparencia.astro`**

```astro
---
import { Download, ExternalLink } from '@lucide/astro';
import Base from '@/layouts/Base.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
import { fechaLarga } from '@/lib/formato';
const [e, normativa] = await Promise.all([datos.empresa(), datos.normativa()]);
const registrales = e.razonSocial && e.cuit && e.domicilioLegal;
---
<Base titulo="Transparencia" descripcion="Normativa de la concesión del Tramo Centro para descargar, póliza de responsabilidad civil, datos registrales y control de Vialidad Nacional. Covicen publica lo que se puede verificar, con la fuente al lado." migas={[{ nombre: 'Transparencia', href: '/transparencia' }]}>
  <Seccion nivel="h1" eyebrow="Transparencia" titulo="Lo que se puede verificar, con la fuente al lado." intro="Vialidad Nacional supervisa la concesión con indicadores objetivos. Acá está la normativa que la rige, la póliza que nos cubre y los datos de la sociedad, a medida que existen." class="pt-10">
    <h2 class="revelar mb-6 text-2xl">Normativa aplicable</h2>
    <ol class="escalonar grid gap-4 md:grid-cols-2">
      {normativa.map((n, i) => (
        <li class="tarjeta p-6" style={`--i: ${i}`}>
          <h3 class="text-xl">{n.titulo}</h3>
          <p class="mt-2 text-texto-2">{n.descripcion}</p>
          {n.url && n.descargable ? (
            <a href={n.url} rel="noopener noreferrer" target="_blank" class="mt-4 inline-flex items-center gap-1 text-sm font-semibold" aria-label={`${n.titulo}: ver o descargar en la fuente oficial (se abre en otra pestaña)`}><Download size={14} aria-hidden="true" /> Ver o descargar</a>
          ) : (
            <p class="anotacion mt-4 text-xs text-texto-3">Sin versión definitiva publicada todavía.</p>
          )}
        </li>
      ))}
    </ol>
  </Seccion>
  <Seccion indice="01" eyebrow="Seguro" titulo="Póliza de responsabilidad civil." intro="El contrato exige publicar la aseguradora y los datos de la póliza que cubre a los usuarios (PETG art. 61.6)." fondo="fondo-2">
    {e.polizaRc ? (
      <dl class="revelar grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-texto-2"><dt class="eyebrow">Aseguradora</dt><dd>{e.polizaRc.aseguradora}</dd><dt class="eyebrow">Póliza</dt><dd>{e.polizaRc.numero}</dd><dt class="eyebrow">Vigencia</dt><dd>hasta el {fechaLarga(e.polizaRc.vigenciaHasta)}</dd>{e.polizaRc.url && <><dt class="eyebrow">Documento</dt><dd><a href={e.polizaRc.url} rel="noopener noreferrer" target="_blank" class="inline-flex items-center gap-1">Ver la póliza <ExternalLink size={12} aria-hidden="true" /></a></dd></>}</dl>
    ) : (
      <p class="revelar text-texto-2">Se publica con la toma de posesión, el {fechaLarga(e.concesion.inicioOperacion)}.</p>
    )}
  </Seccion>
  <Seccion indice="02" eyebrow="La sociedad" titulo="Datos registrales.">
    {registrales ? (
      <dl class="revelar grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-texto-2"><dt class="eyebrow">Razón social</dt><dd>{e.razonSocial}</dd><dt class="eyebrow">CUIT</dt><dd>{e.cuit}</dd><dt class="eyebrow">Domicilio legal</dt><dd>{e.domicilioLegal}</dd>{e.domicilioComercial && <><dt class="eyebrow">Domicilio comercial</dt><dd>{e.domicilioComercial}</dd></>}</dl>
    ) : (
      <p class="revelar text-texto-2">La sociedad está en formación. Razón social, CUIT y domicilios se publican acá y en el pie de página cuando se complete la inscripción.</p>
    )}
  </Seccion>
</Base>
```

- [ ] **Step 2: `src/pages/tramites.astro`**

```astro
---
import { ExternalLink } from '@lucide/astro';
import Base from '@/layouts/Base.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
const tramites = await datos.tramites();
---
<Base titulo="Guía de trámites" descripcion="Trámites del usuario del Tramo Centro: tarifa diferencial para vecinos, frentistas y docentes, exención de peaje por discapacidad y para ex combatientes de Malvinas, y alta de TelePASE. Quién puede, requisitos y pasos." migas={[{ nombre: 'Guía de trámites', href: '/tramites' }]}>
  <Seccion nivel="h1" eyebrow="Guía de trámites" titulo="Quién puede, qué necesita y cómo se hace." intro="Los trámites que el pliego prevé para el usuario (PETG art. 61.5). Todos son gratuitos." class="pt-10">
    <nav aria-label="Trámites" class="revelar mb-10 flex flex-wrap gap-2">{tramites.map((t) => <a href={`#${t.id}`} class="rounded-md border border-borde px-3 py-1.5 text-sm text-texto-2 no-underline transition-colors hover:border-borde-fuerte hover:text-texto">{t.nombre}</a>)}</nav>
    <div class="escalonar grid gap-6">
      {tramites.map((t, i) => (
        <article id={t.id} class="tarjeta scroll-mt-32 p-8" style={`--i: ${i}`}>
          <h2 class="text-2xl">{t.nombre}</h2>
          <p class="mt-2 text-texto-2"><span class="text-texto">Quién puede:</span> {t.quien}</p>
          <div class="mt-6 grid gap-8 md:grid-cols-2">
            <div><h3 class="eyebrow">Requisitos</h3><ul class="mt-3 flex flex-col gap-2 text-texto-2">{t.requisitos.map((r) => <li class="flex gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-acento" aria-hidden="true"></span>{r}</li>)}</ul></div>
            <div><h3 class="eyebrow">Pasos</h3><ol class="mt-3 flex flex-col gap-2 text-texto-2">{t.pasos.map((p, j) => <li class="flex gap-3"><span class="eyebrow tabular-nums">{j + 1}</span>{p}</li>)}</ol></div>
          </div>
          <div class="mt-6 flex flex-wrap items-center gap-4 text-sm">
            {t.plazo && <span class="text-texto-2">{t.plazo}</span>}
            {t.url && <a href={t.url} rel="noopener noreferrer" target="_blank" class="inline-flex items-center gap-1 font-semibold">Sitio oficial del trámite <ExternalLink size={14} aria-hidden="true" /></a>}
            <span class="anotacion text-xs text-texto-3">Fuente: {t.fuente}</span>
          </div>
        </article>
      ))}
    </div>
  </Seccion>
</Base>
```

(El formulario de trámites se agrega en la Fase 5.)

- [ ] **Step 3: `src/pages/seguridad-vial.astro`**

```astro
---
import Base from '@/layouts/Base.astro';
import Boton from '@/components/ui/Boton.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
const consejos = await datos.consejos();
const conducir = consejos.filter((c) => c.categoria === 'conducir');
const emergencia = consejos.filter((c) => c.categoria === 'emergencia');
---
<Base titulo="Seguridad vial" descripcion="Consejos de seguridad vial para RN 9, RN 19 y RN 34 y qué hacer ante una emergencia en la ruta: salir de la calzada, protegerse, llamar al 140 y esperar el auxilio gratuito." migas={[{ nombre: 'Seguridad vial', href: '/seguridad-vial' }]}>
  <Seccion nivel="h1" eyebrow="Seguridad vial" titulo="Manejar bien el centro del país." intro="Ocho hábitos que evitan la mayoría de los siniestros en estas tres rutas." class="pt-10">
    <ol class="escalonar grid gap-4 md:grid-cols-2">
      {conducir.map((c, i) => <li class="tarjeta p-6" style={`--i: ${i}`}><span class="eyebrow tabular-nums">0{i + 1}</span><h2 class="mt-3 text-xl">{c.titulo}</h2><p class="mt-2 text-texto-2">{c.texto}</p></li>)}
    </ol>
  </Seccion>
  <Seccion id="emergencia" indice="01" eyebrow="Ante una emergencia" titulo="Qué hacer si algo pasa en la ruta." intro="En este orden. El auxilio es gratuito y el 140 funciona sin crédito." fondo="fondo-2">
    <ol class="escalonar grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {emergencia.map((c, i) => <li class="tarjeta p-6" style={`--i: ${i}`}><span class="eyebrow tabular-nums">0{i + 1}</span><h3 class="mt-3 text-xl">{c.titulo}</h3><p class="mt-2 text-texto-2">{c.texto}</p></li>)}
    </ol>
    <div class="revelar mt-8 flex flex-wrap gap-3"><Boton href="tel:140" variante="vial" ariaLabel="Llamar a emergencias, 140">Llamar al 140</Boton><Boton href="/emergencias" variante="secundario">Emergencias y auxilio</Boton></div>
  </Seccion>
</Base>
```

- [ ] **Step 4: `src/pages/emergencias.astro`: pasos y tiempos desde datos**

Reemplazar el frontmatter para cargar `const [contacto, servicios, consejos] = await Promise.all([datos.contacto(), datos.servicios(), datos.consejos()]);`, `const grua = servicios.find((s) => s.id === 'grua-y-remolque');`, `const pasos = consejos.filter((c) => c.categoria === 'emergencia');`, y quitar el array `pasos` literal. Reemplazar el `<ol>` de pasos por:

```astro
    <ol class="escalonar mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {pasos.map((p, i) => <li class="rounded-md border border-borde bg-superficie/40 p-6" style={`--i: ${i}`}><span class="eyebrow tabular-nums">0{i + 1}</span><h2 class="mt-3 text-xl">{p.titulo}</h2><p class="mt-2 text-texto-2">{p.texto}</p></li>)}
    </ol>
    {grua && (
      <div class="revelar mt-12 tarjeta p-8">
        <h2 class="text-2xl">{grua.nombre}: gratis y con tiempos comprometidos</h2>
        <p class="mt-2 text-texto-2">{grua.descripcion} {grua.alcance}</p>
        <ul class="mt-4 flex flex-col gap-1 text-texto-2">{grua.tiempos?.map((t) => <li class="flex gap-2"><span aria-hidden="true">—</span>{t}</li>)}</ul>
        <p class="anotacion mt-3 text-xs text-texto-3">Fuente: {grua.fuente}</p>
      </div>
    )}
    <div class="revelar mt-12"><h2 class="mb-4 text-2xl">Canales y plazos</h2><Canales canales={contacto.canales} compacto /></div>
```

e importar `Canales` (`import Canales from '@/components/Canales.astro';`).

- [ ] **Step 5: Verificar y commit**

Run: `pnpm check && pnpm vitest run tests/components && pnpm verificar`
Expected: verde.

```bash
git add src/pages/transparencia.astro src/pages/tramites.astro src/pages/seguridad-vial.astro src/pages/emergencias.astro
git commit -m "feat(contenido): transparencia con normativa y póliza, guía de trámites, seguridad vial y emergencias desde datos"
```

### Tarea 4.6: Obras reales, FAQ y novedades

**Files:**
- Delete: `src/content/obras/01-plan-de-contingencia.json`, `02-rehabilitacion-de-pavimento.json`, `03-senalizacion-e-iluminacion.json`, `04-cobro-electronico.json`
- Create: `src/content/obras/01-puesta-en-valor.json` … `06-cobro-electronico.json`
- Modify: `src/content/faq/03-cuanto-cuesta-el-peaje.json`, `05-desde-cuando-se-cobra.json`, `06-donde-estan-los-peajes.json`, `07-telepase.json`, `08-free-flow.json`, `09-desperfecto-en-ruta.json`, `10-como-hago-un-reclamo.json`, `12-peajes-existentes.json`
- Create: `src/content/faq/14-descuentos-por-frecuencia.json`, `15-exenciones.json`, `16-pase-sin-pagar.json`, `17-tarifa-vecinal.json`
- Modify: `src/content/novedades/2026-08-26-que-cambia-el-5-de-octubre.md`, `2026-08-27-como-se-fija-la-tarifa.md`, `2026-08-27-obras-antes-que-peaje.md` (repasar afirmaciones)
- Create: `src/content/novedades/2026-09-13-que-cuadro-tarifario-rige.md`

- [ ] **Step 1: Obras (PETP art. 5, 6 y 7)**

Borrar los cuatro JSON de `src/content/obras/` y crear:

`01-puesta-en-valor.json`: `{ "slug": "puesta-en-valor", "titulo": "Obras iniciales de puesta en valor", "ruta": "Todo el tramo", "tipo": "Obra inicial", "estado": "planificada", "avance": null, "orden": 1, "descripcion": "Primera etapa del contrato: los sectores más deteriorados de calzada, banquinas, drenajes y señalización se ponen en condiciones. Hasta que Vialidad Nacional firme el acta de finalización, no se aplica la tarifa ofertada ni cobran las estaciones nuevas (PETP art. 3 y 5)." }`

`02-losas-hormigon.json`: `{ "slug": "losas-de-hormigon", "titulo": "Reconstrucción de losas de hormigón", "ruta": "RN 9", "tramo": "RN 9 y RN 19", "tipo": "Obra obligatoria", "estado": "planificada", "avance": null, "orden": 2, "descripcion": "Reconstrucción de las losas de hormigón deterioradas en la RN 9 y en la RN 19. Es una de las obras obligatorias del pliego del Tramo Centro (PETP art. 6)." }`

`03-banquinas-rosario-carcarana.json`: `{ "slug": "banquinas-rosario-carcarana", "titulo": "Banquinas pavimentadas entre Rosario y Carcarañá", "ruta": "RN 9", "tramo": "Rosario – Carcarañá", "tipo": "Obra obligatoria", "estado": "planificada", "avance": null, "orden": 3, "descripcion": "Pavimentación de banquinas en la RN 9 entre Rosario y Carcarañá, para que detenerse ante una emergencia sea seguro (PETP art. 6)." }`

`04-puente-carcarana.json`: `{ "slug": "puente-rio-carcarana", "titulo": "Mantenimiento del puente sobre el río Carcarañá", "ruta": "RN 34", "tipo": "Obra obligatoria", "estado": "planificada", "avance": null, "orden": 4, "descripcion": "Conservación del puente de la RN 34 sobre el río Carcarañá según el plan que fija el pliego (PETP art. 6)." }`

`05-rehabilitacion-asfaltica.json`: `{ "slug": "rehabilitacion-asfaltica", "titulo": "Rehabilitación asfáltica por secciones", "ruta": "Todo el tramo", "tipo": "Rehabilitación", "estado": "planificada", "avance": null, "orden": 5, "descripcion": "Toneladas mínimas de concreto asfáltico por sección y por año durante los veinte años, con medición semestral del avance en toneladas y en longitud de carril (PETP art. 7)." }`

`06-cobro-electronico.json`: `{ "slug": "cobro-electronico", "titulo": "Estaciones nuevas con Free Flow", "ruta": "Todo el tramo", "tramo": "Leones (RN 9), San Francisco (RN 19) y Totoras (RN 34)", "tipo": "Estaciones de peaje", "estado": "planificada", "avance": null, "orden": 6, "descripcion": "Las tres estaciones nuevas se proyectan y construyen sin barreras: pórticos que leen el TelePASE o la patente sin detener el vehículo. Cobran cuando Vialidad Nacional las habilite, con el cuadro tarifario de Carcarañá (PETP art. 2 y 3)." }`

Actualizar las descripciones de `src/pages/obras.astro` (línea 12: `descripcion="Obras de Covicen en el Tramo Centro: puesta en valor inicial, losas de hormigón en RN 9 y RN 19, banquinas entre Rosario y Carcarañá, puente sobre el Carcarañá, rehabilitación asfáltica y estaciones Free Flow. Estado y avance."`).

- [ ] **Step 2: FAQ**

Cambiar solo el campo `respuesta` (y `pregunta` donde se indica):

- `03-cuanto-cuesta-el-peaje.json`: `"El cuadro vigente es el que aprobó Vialidad Nacional por la Resolución 248/2026: $1.500 por auto (categoría 1) con IVA incluido, igual con TelePASE que pagando en la vía, en Carcarañá, James Craik y Franck. Las cinco categorías están en Tarifas. Se actualiza por índices oficiales cada tres meses."`
- `05-desde-cuando-se-cobra.json`: `"pregunta": "¿Qué tarifa se cobra desde el 5 de octubre?"`, `"respuesta": "Desde la toma de posesión rige el mismo cuadro que ya se cobraba en estas estaciones (Resolución 248/2026). La tarifa que Covicen ofertó en la licitación se aplica después de terminar las obras iniciales de puesta en valor, cuando Vialidad Nacional homologue el cuadro propio. Primero las obras; después el peaje pleno."`
- `06-donde-estan-los-peajes.json`: `"Hoy cobran tres: Carcarañá (RN 9, km 340), James Craik (RN 9, km 588) y Franck (RN 19, km 19,95). Las tres nuevas —Leones (RN 9, km 454), San Francisco (RN 19, km 120) y Totoras (RN 34, km 60)— se construyen sin barreras y cobran cuando Vialidad Nacional las habilite. El mapa de El tramo tiene la ficha de cada una."`
- `07-telepase.json`: `"Sí, y es gratis: la adhesión, el primer dispositivo, la colocación, la renovación y la reposición no tienen costo. No es obligatorio para circular, pero los descuentos por frecuencia, las exenciones y las tarifas diferenciales solo funcionan con TelePASE. Se paga lo mismo que en la vía."`
- `08-free-flow.json`: `"Es el cobro sin barreras: pórticos que leen el TelePASE o la patente sin que frenes. Las tres estaciones nuevas del tramo nacen así. Si pasás sin TelePASE, el peaje se paga después por los medios habilitados; pasado el plazo, hay recargos."`
- `09-desperfecto-en-ruta.json`: `"Salí de la calzada, encendé las balizas, esperá detrás del guardarraíl y llamá al 140: es gratis y funciona sin crédito. La grúa para despejar la calzada no se cobra y tiene tiempos comprometidos: 30 minutos para livianos y 60 para pesados. Si no sabés el kilómetro, el botón de asistencia del sitio toma tu ubicación."`
- `10-como-hago-un-reclamo.json`: `"Por el formulario de Contacto, por correo o por el 0800 cuando estén habilitados. Recibís un acuse con número de gestión en 24 horas y una respuesta en 5 días hábiles; si hace falta más tiempo para reunir pruebas, te avisamos antes. Los plazos los fija el pliego."`
- `12-peajes-existentes.json`: `"Carcarañá, James Craik y Franck siguen cobrando con el mismo cuadro tarifario que hasta ahora (Resolución 248/2026). La estación San Vicente, en la RN 34, deja de operar con el inicio de la concesión."`

Crear:

`14-descuentos-por-frecuencia.json`: `{ "slug": "descuentos-por-frecuencia", "tema": "tarifas", "orden": 14, "enHome": false, "pregunta": "¿Hay descuento si paso muchas veces?", "respuesta": "Sí, para autos con TelePASE, por estación y por mes: 15 % a partir de la pasada 36, 25 % desde la 45 y 35 % desde la 61, en ambos sentidos. Es una obligación del contrato (PETG art. 53.3) y se aplica solo." }`

`15-exenciones.json`: `{ "slug": "exenciones", "tema": "tarifas", "orden": 15, "enHome": false, "pregunta": "¿Quiénes no pagan peaje?", "respuesta": "Solo los de la lista del pliego: ambulancias, fuerzas armadas y de seguridad, bomberos, vehículos de Vialidad Nacional, de la Agencia Nacional de Seguridad Vial y de la Cruz Roja, y los vehículos afectados a personas con discapacidad o a ex combatientes de Malvinas, siempre con TelePASE habilitado a ese efecto. Los trámites están en la Guía de trámites." }`

`16-pase-sin-pagar.json`: `{ "slug": "pase-sin-pagar", "tema": "pago", "orden": 16, "enHome": false, "pregunta": "Pasé sin pagar. ¿Qué hago?", "respuesta": "Si pagás dentro de los 30 días, abonás la tarifa más una tarifa de tu categoría. Después de los 30 días, la tarifa más dos tarifas, con intereses. El medio para regularizar se publica en Medios de pago cuando esté habilitado." }`

`17-tarifa-vecinal.json`: `{ "slug": "tarifa-vecinal", "tema": "tarifas", "orden": 17, "enHome": false, "pregunta": "Vivo cerca del peaje. ¿Tengo tarifa vecinal?", "respuesta": "Existe una tarifa diferencial para vecinos y frentistas de una estación y para docentes, solo para autos (categoría 1), que se renueva cada año y se tramita por Trámites a Distancia. Los requisitos están en la Guía de trámites; el monto se informa al hacer el trámite." }`

- [ ] **Step 3: Novedades**

- `2026-08-26-que-cambia-el-5-de-octubre.md`: poner `destacada: true` en el frontmatter (es el mensaje de campaña del carrusel) y repasar el cuerpo: donde diga que "no se cobra" o mencione $1.399 como precio, reemplazar por "rige el cuadro vigente (Resolución 248/2026) hasta terminar las obras iniciales".
- `2026-08-27-como-se-fija-la-tarifa.md`: agregar un párrafo final: "Mientras tanto, desde la toma de posesión rige en las tres estaciones el cuadro que ya se cobraba, aprobado por la Resolución 248/2026 de Vialidad Nacional: $1.500 por auto con IVA. La tarifa ofertada llega con las obras iniciales terminadas."
- `2026-08-27-obras-antes-que-peaje.md`: reemplazar la lista de obras por las seis reales (losas de hormigón en RN 9 y RN 19, banquinas Rosario–Carcarañá, puente sobre el Carcarañá, rehabilitación asfáltica, estaciones Free Flow) con enlace relativo `../../obras/`.
- Crear `2026-09-13-que-cuadro-tarifario-rige.md`:

```md
---
titulo: "Qué cuadro tarifario rige desde el 5 de octubre"
fecha: "2026-09-13"
resumen: "Desde la toma de posesión, en Carcarañá, James Craik y Franck se cobra el mismo cuadro que hasta ahora: el de la Resolución 248/2026 de Vialidad Nacional. Qué dice, cuánto es y cuándo cambia."
etiquetas: ["tarifas", "transparencia"]
destacada: false
---
El 5 de octubre Covicen toma posesión del Tramo Centro. Ese día **no cambia el precio del peaje**: el pliego manda aplicar el cuadro tarifario vigente en el tramo a la fecha de la toma de posesión (PETP art. 3).

## Qué cuadro es

El que aprobó la Dirección Nacional de Vialidad por la **Resolución 248/2026**, vigente desde el 26 de febrero de 2026. Es el mismo en las tres estaciones que cobran hoy y tiene cinco categorías. Para un auto (categoría 1) son **$1.500 con IVA incluido**, igual con TelePASE que pagando en la vía. El detalle por categoría y estación está en [Tarifas](../../tarifas/).

## Cuándo cambia

Cuando terminen las obras iniciales de puesta en valor y Vialidad Nacional homologue el cuadro propio de Covicen, basado en la tarifa que ofertamos en la licitación. Hasta entonces, el cuadro se actualiza por los índices oficiales que fija el contrato, cada tres meses, y cada cambio se publica acá con su resolución.

## Dónde controlarlo

La resolución está en el [Boletín Oficial](https://www.boletinoficial.gob.ar/detalleAviso/primera/338657/20260224) y la lista completa de normas, en [Transparencia](../../transparencia/).
```

- [ ] **Step 4: Verificar todo**

Run: `pnpm check && pnpm test && pnpm verificar`
Expected: verde. `local-json.test` sigue exigiendo obras ordenadas y FAQ con slugs únicos y ≥ 4 en home.

- [ ] **Step 5: Commit**

```bash
git add -A -- src/content/obras src/content/faq src/content/novedades src/pages/obras.astro
git commit -m "feat(contenido): obras obligatorias del pliego, FAQ actualizada y ampliada, novedad del cuadro tarifario vigente"
```

### Tarea 4.7: Cierre de la Fase 4

- [ ] **Step 1:** `pnpm check && pnpm test && pnpm verificar` en verde; `pnpm originalidad …` en 0 coincidencias.
- [ ] **Step 2:** Revisión de `rev-bro` (spec §9, plan Fase 4, diff): en particular que cada dato del pliego citado coincida con el artículo y que no haya afirmaciones sin fuente.
- [ ] **Step 3:** Vault: `obsidian/Costura de datos.md` (métodos nuevos: `servicios`, `normativa`, `tramites`, `consejos`, `avisos`); nota nueva `obsidian/Obligaciones del pliego para la web.md` con el checklist de la spec §13 y el estado real; `Home.md`: "Fase 4 cerrada".
- [ ] **Step 4:** Commit de cierre si no se hizo por tarea.

## Fase 5 — Interactivo: estado de la traza, asistencia, carrusel y formularios

Resultado: el módulo de estado tipo subte con datos de ejemplo (y marcadores en el mapa), el botón de asistencia con ubicación, el carrusel del hero con las novedades destacadas y los tres formularios del pliego con sus plazos.

### Tarea 5.1: Estado de la traza

**Files:**
- Modify: `src/lib/datos/esquemas.ts` (`esquemaEstadoRuta`), `src/lib/datos/fuentes/local-json.ts` (`estadoRutas` lee el JSON)
- Create: `src/content/estado-ruta.json`, `src/components/EstadoTraza.astro`, `src/lib/estado.ts`
- Modify: `src/components/home/ObrasYEstado.astro:23-25`, `src/pages/obras.astro:30`, `src/pages/index.astro` (pasar `estado`)
- Modify: `tests/lib/datos/local-json.test.ts` (test de estadoRutas), `tests/lib/datos/api.test.ts` (sin cambios de claves)
- Create: `tests/lib/estado.test.ts`, `tests/components/estado-traza.test.ts`

**Interfaces:**
- Produces: `EstadoRuta.ejemplo?: boolean`; `incidentes[].tipo: 'transito' | 'obra' | 'incidente' | 'clima'`, `sentido?`, `desde?`, `hasta?`; `estadoPorRuta(estado, rutas): Array<{ ruta; nivel: 'normal' | 'precaucion' | 'corte'; etiqueta; incidentes }>`; `<EstadoTraza estado={EstadoRuta} rutas={NombreRuta[]} nivel?: 'h2' | 'h3' />`.

- [ ] **Step 1: Tests**

Crear `tests/lib/estado.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { estadoPorRuta } from '@/lib/estado';

const inc = (ruta: 'RN 9' | 'RN 19' | 'RN 34', severidad: 'info' | 'precaucion' | 'corte') => ({ ruta, km: 10, descripcion: 'x', severidad, tipo: 'obra' as const });

describe('estadoPorRuta', () => {
  it('una fila por ruta, con el peor nivel de sus incidentes; sin incidentes es normal', () => {
    const filas = estadoPorRuta({ disponible: true, incidentes: [inc('RN 9', 'info'), inc('RN 9', 'corte'), inc('RN 34', 'precaucion')] }, ['RN 9', 'RN 19', 'RN 34']);
    expect(filas.map((f) => [f.ruta, f.nivel])).toEqual([['RN 9', 'corte'], ['RN 19', 'normal'], ['RN 34', 'precaucion']]);
    expect(filas[0]!.etiqueta).toBe('Corte');
    expect(filas[1]!.etiqueta).toBe('Normal');
    expect(filas[0]!.incidentes).toHaveLength(2);
  });
  it('no disponible: todo normal y sin incidentes', () => {
    expect(estadoPorRuta({ disponible: false }, ['RN 9']).map((f) => f.nivel)).toEqual(['normal']);
  });
});
```

Crear `tests/components/estado-traza.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import EstadoTraza from '@/components/EstadoTraza.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('EstadoTraza', () => {
  it('con los datos de ejemplo del repo: tres rutas, cartel de ejemplo, última actualización', async () => {
    const estado = await fuenteLocalJson.estadoRutas();
    const html = await (await AstroContainer.create()).renderToString(EstadoTraza, { props: { estado, rutas: ['RN 9', 'RN 19', 'RN 34'] } });
    expect(html.match(/data-ruta="/g)?.length).toBe(3);
    expect(html).toContain('Datos de ejemplo');
    expect(html).toContain('Última actualización');
    expect(html).toContain('data-nivel="precaucion"');
  });
  it('con datos reales (ejemplo=false) no muestra el cartel', async () => {
    const estado = { ...(await fuenteLocalJson.estadoRutas()), ejemplo: false };
    const html = await (await AstroContainer.create()).renderToString(EstadoTraza, { props: { estado, rutas: ['RN 9'] } });
    expect(html).not.toContain('Datos de ejemplo');
  });
});
```

En `tests/lib/datos/local-json.test.ts` reemplazar `it('estadoRutas: no disponible en v1', …)` por:

```ts
  it('estadoRutas: datos de ejemplo marcados como tales, con fecha y un incidente por tipo', async () => {
    const e = await fuenteLocalJson.estadoRutas();
    expect(e.disponible).toBe(true);
    expect(e.ejemplo).toBe(true);
    expect(e.actualizado).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Set(e.incidentes?.map((i) => i.tipo))).toEqual(new Set(['transito', 'obra', 'incidente', 'clima']));
  });
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/lib/estado.test.ts tests/components/estado-traza.test.ts tests/lib/datos/local-json.test.ts`
Expected: FAIL.

- [ ] **Step 3: Contrato, datos y helper**

Reemplazar `esquemaEstadoRuta` en `src/lib/datos/esquemas.ts` por:

```ts
export const esquemaIncidente = z.object({
  ruta: esquemaNombreRuta,
  km: z.number().nullable(),
  descripcion: z.string(),
  severidad: z.enum(['info', 'precaucion', 'corte']),
  tipo: z.enum(['transito', 'obra', 'incidente', 'clima']).default('incidente'),
  sentido: z.enum(['ambos', 'ascendente', 'descendente']).optional(),
  desde: z.iso.datetime().optional(),
  hasta: z.iso.datetime().optional(),
});
export type Incidente = z.infer<typeof esquemaIncidente>;

export const esquemaEstadoRuta = z.object({
  disponible: z.boolean(),
  /** true = datos de muestra para ver el módulo funcionando; el componente lo dice con un cartel. */
  ejemplo: z.boolean().default(false),
  actualizado: z.iso.datetime().optional(),
  incidentes: z.array(esquemaIncidente).optional(),
});
export type EstadoRuta = z.infer<typeof esquemaEstadoRuta>;
```

Crear `src/content/estado-ruta.json`:

```json
{
  "disponible": true,
  "ejemplo": true,
  "actualizado": "2026-09-13T09:00:00-03:00",
  "incidentes": [
    { "ruta": "RN 9", "km": 352, "tipo": "obra", "severidad": "precaucion", "sentido": "ascendente", "descripcion": "Bacheo en carril derecho entre Carcarañá y Cañada de Gómez. Calzada reducida a un carril, velocidad máxima 60 km/h." },
    { "ruta": "RN 9", "km": 588, "tipo": "transito", "severidad": "info", "sentido": "ambos", "descripcion": "Demoras de hasta 10 minutos en la estación James Craik por alto tránsito." },
    { "ruta": "RN 19", "km": 61, "tipo": "clima", "severidad": "precaucion", "sentido": "ambos", "descripcion": "Niebla con visibilidad reducida entre San Carlos Centro y Rafaela. Luces bajas, distancia y velocidad reducida." },
    { "ruta": "RN 34", "km": 118, "tipo": "incidente", "severidad": "corte", "sentido": "descendente", "descripcion": "Corte total por vuelco de un camión a la altura de Cañada Rosquín. Desvío por RP 13. Grúa y móvil de seguridad en el lugar." }
  ]
}
```

En `src/lib/datos/fuentes/local-json.ts`: `import estadoJson from '@/content/estado-ruta.json';` y reemplazar la línea de `estadoRutas` por `estadoRutas: async (): Promise<EstadoRuta> => esquemaEstadoRuta.parse(estadoJson),` (con el comentario: `// Estado de la traza: hoy datos de ejemplo del repo (ejemplo: true); con estadoRutasEnVivo, una isla lo pide en runtime.`).

Crear `src/lib/estado.ts`:

```ts
// Estado "tipo subte": una fila por ruta con el peor nivel de sus incidentes.
import type { EstadoRuta, Incidente, NombreRuta } from '@/lib/datos/esquemas';

export type Nivel = 'normal' | 'precaucion' | 'corte';
export type FilaEstado = { ruta: NombreRuta; nivel: Nivel; etiqueta: string; incidentes: Incidente[] };
const ORDEN: Record<Nivel, number> = { normal: 0, precaucion: 1, corte: 2 };
const ETIQUETA: Record<Nivel, string> = { normal: 'Normal', precaucion: 'Precaución', corte: 'Corte' };
const nivelDe = (i: Incidente): Nivel => (i.severidad === 'corte' ? 'corte' : i.severidad === 'precaucion' ? 'precaucion' : 'normal');

export const estadoPorRuta = (estado: EstadoRuta, rutas: NombreRuta[]): FilaEstado[] =>
  rutas.map((ruta) => {
    const incidentes = estado.disponible ? (estado.incidentes ?? []).filter((i) => i.ruta === ruta) : [];
    const nivel = incidentes.reduce<Nivel>((peor, i) => (ORDEN[nivelDe(i)] > ORDEN[peor] ? nivelDe(i) : peor), 'normal');
    return { ruta, nivel, etiqueta: ETIQUETA[nivel], incidentes };
  });
```

- [ ] **Step 4: `src/components/EstadoTraza.astro`**

```astro
---
// Estado de la traza "tipo subte": una fila por ruta con su chip (Normal / Precaución / Corte) y los incidentes debajo.
// Mientras los datos sean de muestra (estado.ejemplo), lo dice con un cartel inequívoco: nadie lee un corte inventado como real.
import { CloudFog, Construction, Car, TriangleAlert } from '@lucide/astro';
import Senal from '@/components/ui/Senal.astro';
import type { EstadoRuta, Incidente, NombreRuta } from '@/lib/datos/esquemas';
import { fechaHoraLarga } from '@/lib/formato';
import { estadoPorRuta } from '@/lib/estado';
interface Props { estado: EstadoRuta; rutas: NombreRuta[]; nivel?: 'h2' | 'h3' }
const { estado, rutas, nivel = 'h3' } = Astro.props;
const Titulo = nivel;
const filas = estadoPorRuta(estado, rutas);
const iconos: Record<Incidente['tipo'], typeof Car> = { transito: Car, obra: Construction, incidente: TriangleAlert, clima: CloudFog };
const sentidos = { ambos: 'ambos sentidos', ascendente: 'sentido ascendente', descendente: 'sentido descendente' } as const;
---
<section class="estado-traza tarjeta p-6" aria-label="Estado de la traza">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <Titulo class="text-xl">Estado de la traza</Titulo>
    {estado.ejemplo && <Senal variante="frio">Datos de ejemplo: el módulo se activa con la operación</Senal>}
  </div>
  <ul class="mt-4 divide-y divide-borde">
    {filas.map((f) => (
      <li class="py-4" data-ruta={f.ruta} data-nivel={f.nivel}>
        <div class="flex items-center gap-3">
          <span class:list={['chip h-3 w-3 shrink-0 rounded-full', f.nivel === 'corte' ? 'bg-error' : f.nivel === 'precaucion' ? 'bg-vial' : 'bg-ok']} aria-hidden="true"></span>
          <span class="font-extrabold text-texto">{f.ruta}</span>
          <span class="text-sm text-texto-2">{f.etiqueta}{f.incidentes.length > 0 && ` · ${f.incidentes.length} ${f.incidentes.length === 1 ? 'aviso' : 'avisos'}`}</span>
        </div>
        {f.incidentes.length > 0 && (
          <ul class="mt-3 flex flex-col gap-3 pl-6">
            {f.incidentes.map((i) => { const Icono = iconos[i.tipo]; return (
              <li class="flex gap-3 text-sm">
                <Icono size={18} aria-hidden="true" class="mt-0.5 shrink-0 text-texto-2" />
                <div><p class="font-semibold text-texto">{i.km !== null && `km ${i.km}`}{i.sentido && ` · ${sentidos[i.sentido]}`}</p><p class="text-texto-2">{i.descripcion}</p></div>
              </li>
            ); })}
          </ul>
        )}
      </li>
    ))}
  </ul>
  {estado.actualizado && <p class="anotacion mt-4 text-xs text-texto-3">Última actualización: {fechaHoraLarga(new Date(estado.actualizado))}</p>}
</section>
```

Si `CloudFog` o `Construction` no existen en `@lucide/astro`, usar `Cloud` y `HardHat` (verificar con grep en `node_modules/@lucide/astro/dist/index.js`).

- [ ] **Step 5: Colocarlo en home y en Obras**

`src/pages/index.astro`: cargar `datos.estadoRutas()` en el `Promise.all` (variable `estado`) y pasar `<ObrasYEstado {obras} {estado} rutas={tramo.rutas.map((r) => r.nombre)} />`.

`src/components/home/ObrasYEstado.astro`: `interface Props { obras: Obra[]; estado: EstadoRuta; rutas: NombreRuta[] }`, importar `EstadoTraza` y los tipos, y reemplazar las líneas 23–25 por:

```astro
    <div class="revelar lg:sticky lg:top-32 lg:self-start">
      {estado.disponible ? <EstadoTraza {estado} {rutas} /> : <HuecoCapacidad capacidad="estadoRutasEnVivo" titulo="Estado de las rutas en tiempo real" descripcion="Cortes, desvíos y clima por ruta y kilómetro." alternativaHref="/emergencias" alternativaTexto="Emergencias y auxilio" />}
    </div>
```

`src/pages/obras.astro`: cargar `estado` y `tramo`, y reemplazar la línea 30 por el mismo condicional (con `nivel="h2"`).

- [ ] **Step 6: Tests**

Run: `pnpm vitest run tests/lib/estado.test.ts tests/components/estado-traza.test.ts tests/lib/datos && pnpm check`
Expected: PASS. (`tests/lib/datos/api.test.ts` sigue igual: `estadoRutas` no está en la API.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/datos/esquemas.ts src/lib/datos/fuentes/local-json.ts src/content/estado-ruta.json src/components/EstadoTraza.astro src/lib/estado.ts src/components/home/ObrasYEstado.astro src/pages/obras.astro src/pages/index.astro tests/lib/estado.test.ts tests/components/estado-traza.test.ts tests/lib/datos/local-json.test.ts
git commit -m "feat(estado): estado de la traza tipo subte con datos de ejemplo marcados, en home, obras y el mapa"
```

### Tarea 5.2: Formulario con campos de solo lectura, plazos y mensaje honesto; los tres formularios

**Files:**
- Modify: `src/components/Formulario.astro`, `src/scripts/formulario.ts`
- Modify: `src/pages/contacto.astro` (formularios a y b, tabla de canales, cómo reclamar), `src/pages/tramites.astro` (formulario c)
- Modify: `tests/components/formulario.test.ts`

**Interfaces:**
- Produces: `Campo.tipo` suma `'readonly'` (`valor?: string`, lo rellena un script); `Formulario` props nuevas `plazos?: string`, `id?: string`; el mensaje se arma recorriendo los campos (`name` → texto de su `label`).

- [ ] **Step 1: Tests**

Reemplazar `tests/components/formulario.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Formulario from '@/components/Formulario.astro';

const campos = [{ nombre: 'nombre', etiqueta: 'Nombre', requerido: true }, { nombre: 'mensaje', etiqueta: 'Mensaje', tipo: 'textarea' }];
const render = async (props: Record<string, unknown>) => (await AstroContainer.create()).renderToString(Formulario, { props: { asunto: 'Consulta', campos, ...props } });

describe('Formulario', () => {
  it('con WhatsApp: action a wa.me, labels asociados, botón de envío y plazos', async () => {
    const html = await render({ whatsapp: '5493510000000', email: null, plazos: 'Acuse en 24 hs · Respuesta en 5 días hábiles' });
    expect(html).toContain('action="https://wa.me/5493510000000?text=Asunto%3A%20Consulta"');
    expect(html).toContain('<label for="campo-nombre"');
    expect(html).toContain('id="campo-nombre"');
    expect(html).toContain('type="submit"');
    expect(html).toContain('Acuse en 24 hs');
  });
  it('sin canales: lo dice con la fecha y el 140, y no promete envío', async () => {
    const html = await render({ whatsapp: null, email: null });
    expect(html).toContain('data-canal="a-confirmar"');
    expect(html).toContain('Los formularios se habilitan con la toma de posesión, el 5 de octubre de 2026. Mientras, el 140 atiende emergencias las 24 horas.');
    expect(html).not.toContain('type="submit"');
  });
  it('campo de solo lectura: input readonly con su label (entra al mensaje)', async () => {
    const html = await render({ whatsapp: '5493510000000', email: null, campos: [{ nombre: 'ubicacion', etiqueta: 'Ubicación', tipo: 'readonly', valor: '' }] });
    expect(html).toMatch(/<input[^>]*id="campo-ubicacion"[^>]*readonly/);
    expect(html).toContain('<label for="campo-ubicacion"');
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/components/formulario.test.ts`
Expected: FAIL.

- [ ] **Step 3: `Formulario.astro`**

- `Campo` (líneas 5–12): `tipo?: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'readonly'` y `valor?: string`.
- `Props` (línea 13): `interface Props { asunto: string; whatsapp: string | null; email: string | null; campos: Campo[]; textoBoton?: string; plazos?: string; id?: string }` y `const { asunto, whatsapp, email, campos, textoBoton = 'Enviar por WhatsApp', plazos, id } = Astro.props;`
- `<form …>` (línea 20): agregar `{id}` como atributo.
- Aviso sin canal (líneas 22–24): texto `Los formularios se habilitan con la toma de posesión, el 5 de octubre de 2026. Mientras, el 140 atiende emergencias las 24 horas.` con `<a href="tel:140">140</a>` enlazado.
- En el render de campos (línea 35–36), antes del `<input>` genérico, agregar la rama: `c.tipo === 'readonly' ? (<input id={\`campo-${c.nombre}\`} name={c.nombre} type="text" readonly value={c.valor ?? ''} placeholder={c.placeholder} class="campo campo-lectura" aria-describedby={\`error-${c.nombre}\`} />) :`.
- Junto al botón (línea 43–48), después del `<button>`: `{plazos && <span class="text-sm text-texto-2">{plazos}</span>}`.
- Línea 50 (texto legal): `class="text-sm text-texto-3"` (14 px: es un párrafo, no una anotación).
- En el `<style>`: `.campo-lectura { background: var(--color-superficie); color: var(--color-texto-2); }`.

- [ ] **Step 4: `formulario.ts` recorre los campos**

Reemplazar las líneas 20–27 por:

```ts
      const datos = new FormData(form);
      const lineas = [`Asunto: ${form.dataset.asunto ?? ''}`];
      // Recorre los CAMPOS (no las etiquetas): así entran también los de solo lectura que rellena un script (ubicación).
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('.campo').forEach((campo) => {
        const etiqueta = form.querySelector<HTMLLabelElement>(`label[for="${campo.id}"]`)?.textContent?.replace('*', '').trim() ?? campo.name;
        const valor = String(datos.get(campo.name) ?? '').trim();
        if (valor) lineas.push(`${etiqueta}: ${valor}`);
      });
      const texto = lineas.join('\n');
```

- [ ] **Step 5: Contacto con los formularios (a) y (b), canales y cómo reclamar**

Reescribir `src/pages/contacto.astro`:

```astro
---
import { Phone } from '@lucide/astro';
import Base from '@/layouts/Base.astro';
import Canales from '@/components/Canales.astro';
import Formulario from '@/components/Formulario.astro';
import HuecoCapacidad from '@/components/HuecoCapacidad.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
import { cabinaOperativa } from '@/lib/datos/esquemas';
const [contacto, tramo] = await Promise.all([datos.contacto(), datos.tramo()]);
const tel = contacto.emergencias.telefono;
const correo = contacto.atencionUsuario ?? contacto.email.general;
const estaciones = tramo.cabinas.filter(cabinaOperativa).map((c) => c.nombre);
const plazos = 'Acuse en 24 horas · Respuesta en 5 días hábiles';
const pasosReclamo = [
  ['Elegís el canal', 'Formulario, correo, 0800 o WhatsApp cuando estén habilitados. Para emergencias, el 140.'],
  ['Recibís un número de gestión', 'Dentro de las 24 horas te confirmamos que lo recibimos, con un número para seguirlo.'],
  ['Te respondemos', 'En 5 días hábiles, con fundamento. Si hace falta más tiempo para reunir pruebas, te avisamos antes y el plazo se extiende una sola vez por igual término.'],
  ['Si no estás conforme', 'Podés escalarlo ante Vialidad Nacional, que supervisa la concesión y tiene su propio centro de atención al usuario.'],
] as const;
---
<Base titulo="Contacto" descripcion="Reclamos, consultas y sugerencias a Covicen con acuse en 24 horas y respuesta en 5 días hábiles. Consultas de TelePASE. Emergencias en ruta: 140, las 24 horas." migas={[{ nombre: 'Contacto', href: '/contacto' }]}>
  <Seccion nivel="h1" eyebrow="Contacto" titulo="Reclamos, consultas y sugerencias." intro="Con los plazos que fija el pliego. Para emergencias en la ruta, llamá al 140." class="pt-10">
    <div class="revelar grid gap-12 lg:grid-cols-[1fr_1.3fr]">
      <div class="flex flex-col gap-4">
        <div class="tarjeta tarjeta-vial p-5"><p class="eyebrow flex items-center gap-2"><Phone size={14} aria-hidden="true" /> Emergencias 24 h</p><a href={`tel:${tel.replace(/[^\d+]/g, '')}`} class="mt-2 block text-3xl font-extrabold tabular-nums text-vial-texto no-underline" aria-label={`Llamar a emergencias, ${tel}`}>{tel}</a></div>
        <Canales canales={contacto.canales} compacto />
        <HuecoCapacidad capacidad="ticketingReclamos" nivel="h2" titulo="Seguimiento de reclamos en línea" descripcion="Número de reclamo y estado, cuando exista el sistema." />
      </div>
      <Formulario id="reclamos" asunto="Reclamo, consulta o sugerencia" whatsapp={contacto.whatsapp.numero} email={correo} {plazos} campos={[
        { nombre: 'motivo', etiqueta: 'Motivo', tipo: 'select', opciones: ['Reclamo', 'Consulta', 'Sugerencia'], requerido: true },
        { nombre: 'tema', etiqueta: 'Tema', tipo: 'select', opciones: ['Tarifas y cobro', 'Estado de la ruta y obras', 'Atención recibida', 'Seguridad vial', 'Otro'], requerido: true },
        { nombre: 'lugar', etiqueta: 'Ruta y kilómetro, o estación', placeholder: `RN 9, km 350 · ${estaciones.join(' / ')}` },
        { nombre: 'fecha', etiqueta: 'Fecha del hecho', placeholder: 'dd/mm/aaaa' },
        { nombre: 'patente', etiqueta: 'Patente (opcional, para reclamos de cobro)' },
        { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
        { nombre: 'apellido', etiqueta: 'Apellido', requerido: true },
        { nombre: 'dni', etiqueta: 'DNI (opcional)' },
        { nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', requerido: true },
        { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel' },
        { nombre: 'mensaje', etiqueta: 'Mensaje', tipo: 'textarea', requerido: true },
      ]} />
    </div>
  </Seccion>

  <Seccion id="telepase" indice="01" eyebrow="TelePASE" titulo="Consultas sobre tu TelePASE." intro="Cobros, dispositivo, adhesión o factura. Las respuestas a TelePASE tienen prioridad (PETG art. 61.5 b)." fondo="fondo-2">
    <div class="revelar grid gap-12 lg:grid-cols-[1fr_1.3fr]">
      <p class="text-texto-2">Si tu consulta es sobre la cuenta o la facturación del dispositivo, también podés resolverla en el <a href={contacto.enlaces.telepase} rel="noopener noreferrer" target="_blank">sitio de TelePASE</a>.</p>
      <Formulario id="formulario-telepase" asunto="Consulta de TelePASE" whatsapp={contacto.whatsapp.numero} email={correo} {plazos} campos={[
        { nombre: 'tipo', etiqueta: 'Tipo de consulta', tipo: 'select', opciones: ['Me cobraron mal', 'Problema con el dispositivo', 'Adhesión o alta', 'Factura o pasadas', 'Otra'], requerido: true },
        { nombre: 'patente', etiqueta: 'Patente', requerido: true },
        { nombre: 'tag', etiqueta: 'Número de TAG (opcional)' },
        { nombre: 'estacion', etiqueta: 'Estación', tipo: 'select', opciones: [...estaciones, 'No aplica'] },
        { nombre: 'fecha', etiqueta: 'Fecha de la pasada', placeholder: 'dd/mm/aaaa' },
        { nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', requerido: true },
        { nombre: 'mensaje', etiqueta: 'Qué pasó', tipo: 'textarea', requerido: true },
      ]} />
    </div>
  </Seccion>

  <Seccion indice="02" eyebrow="Cómo hacer un reclamo" titulo="Cuatro pasos, con plazos.">
    <ol class="escalonar grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {pasosReclamo.map(([t, d], i) => <li class="tarjeta p-6" style={`--i: ${i}`}><span class="eyebrow tabular-nums">0{i + 1}</span><h3 class="mt-3 text-xl">{t}</h3><p class="mt-2 text-texto-2">{d}</p></li>)}
    </ol>
  </Seccion>
</Base>
```

En `src/pages/tramites.astro`, antes de `</Seccion>` final, agregar el formulario (c):

```astro
    <div id="formulario" class="revelar mt-16 grid gap-12 lg:grid-cols-[1fr_1.3fr]">
      <div><h2 class="text-2xl">Iniciá tu trámite</h2><p class="mt-3 text-texto-2">Dejanos tus datos y el trámite que querés hacer. La documentación se envía por correo cuando te la pidamos.</p></div>
      <Formulario id="formulario-tramites" asunto="Trámite" whatsapp={contacto.whatsapp.numero} email={contacto.atencionUsuario ?? contacto.email.general} plazos="Acuse en 24 horas · Respuesta en 5 días hábiles" campos={[
        { nombre: 'tramite', etiqueta: 'Trámite', tipo: 'select', opciones: tramites.map((t) => t.nombre), requerido: true },
        { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
        { nombre: 'apellido', etiqueta: 'Apellido', requerido: true },
        { nombre: 'dni', etiqueta: 'DNI', requerido: true },
        { nombre: 'domicilio', etiqueta: 'Domicilio' },
        { nombre: 'patente', etiqueta: 'Patente', requerido: true },
        { nombre: 'correo', etiqueta: 'Correo electrónico', tipo: 'email', requerido: true },
        { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel' },
      ]} />
    </div>
```

(importar `Formulario` y cargar `contacto` con `datos.contacto()` en el frontmatter de `tramites.astro`).

- [ ] **Step 6: Tests, typecheck, verificación**

Run: `pnpm vitest run tests/components && pnpm check && pnpm verificar`
Expected: verde. Los formularios salen deshabilitados (sin canal) con el aviso honesto.

- [ ] **Step 7: Commit**

```bash
git add src/components/Formulario.astro src/scripts/formulario.ts src/pages/contacto.astro src/pages/tramites.astro tests/components/formulario.test.ts
git commit -m "feat(formularios): los tres del pliego con plazos y aviso honesto; campos de solo lectura para la ubicación"
```

### Tarea 5.3: Asistencia en ruta con ubicación

**Files:**
- Create: `src/pages/asistencia.astro`, `src/scripts/asistencia.ts`, `src/lib/asistencia.ts`
- Modify: `src/pages/emergencias.astro`, `src/components/BarraEmergencias.astro`, `src/components/TarjetaEstacion.astro`, `src/components/home/AccesosRapidos.astro`, `src/components/Footer.astro` (links al botón), `scripts/verificar.ts` (página existe), `tests/presupuesto.test.ts:7`
- Create: `tests/lib/asistencia.test.ts`, `tests/components/asistencia.test.ts`

**Interfaces:**
- Produces: `textoUbicacion(lat, lng, precision?): string` ("-32,7150, -61,1550 (±25 m) · https://maps.google.com/?q=-32.7150,-61.1550"); página `/asistencia/` con `[data-asistencia]`, botón `[data-ubicar]`, salida `[data-ubicacion]`, botón `[data-copiar]`, y el `Formulario` con campo `readonly` `ubicacion`.

- [ ] **Step 1: Tests**

Crear `tests/lib/asistencia.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { textoUbicacion } from '@/lib/asistencia';

describe('textoUbicacion', () => {
  it('coordenadas con 5 decimales, precisión redondeada y link a Google Maps', () => {
    expect(textoUbicacion(-32.715012, -61.155087, 24.6)).toBe('-32.71501, -61.15509 (±25 m) · https://maps.google.com/?q=-32.71501,-61.15509');
  });
  it('sin precisión no la muestra', () => {
    expect(textoUbicacion(-31.5, -60.7)).toBe('-31.50000, -60.70000 · https://maps.google.com/?q=-31.50000,-60.70000');
  });
});
```

Crear `tests/components/asistencia.test.ts`:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Asistencia from '@/pages/asistencia.astro';

describe('/asistencia/', () => {
  it('primero el 140, después la ubicación y los datos mínimos; sin canal, dice la verdad', async () => {
    const html = await (await AstroContainer.create()).renderToString(Asistencia, { request: new Request('https://covicen.test/asistencia/') });
    expect(html.indexOf('href="tel:140"')).toBeLessThan(html.indexOf('data-ubicar'));
    expect(html).toContain('data-asistencia');
    expect(html).toContain('data-copiar');
    expect(html).toMatch(/<input[^>]*id="campo-ubicacion"[^>]*readonly/);
    expect(html).toContain('Llamá al 140 y dictá tu ubicación');
    expect(html).toContain('no se guarda');
  });
});
```

- [ ] **Step 2: Correr y ver que fallan**

Run: `pnpm vitest run tests/lib/asistencia.test.ts tests/components/asistencia.test.ts`
Expected: FAIL.

- [ ] **Step 3: `src/lib/asistencia.ts` y `src/scripts/asistencia.ts`**

```ts
// src/lib/asistencia.ts — el texto de la ubicación que se dicta al 140 o viaja en el mensaje. Sin dependencias del DOM.
export const textoUbicacion = (lat: number, lng: number, precision?: number): string => {
  const a = lat.toFixed(5);
  const b = lng.toFixed(5);
  const p = precision === undefined ? '' : ` (±${Math.round(precision)} m)`;
  return `${a}, ${b}${p} · https://maps.google.com/?q=${a},${b}`;
};
```

```ts
// src/scripts/asistencia.ts — pide la ubicación al celular (solo con permiso, solo HTTPS), la muestra, la copia y la mete
// en el campo de solo lectura del formulario. Si el usuario dice no o el navegador no puede, el resto sigue funcionando.
import { textoUbicacion } from '@/lib/asistencia';

const montar = (raiz: HTMLElement) => {
  const boton = raiz.querySelector<HTMLButtonElement>('[data-ubicar]');
  const salida = raiz.querySelector<HTMLElement>('[data-ubicacion]');
  const copiar = raiz.querySelector<HTMLButtonElement>('[data-copiar]');
  const campo = raiz.querySelector<HTMLInputElement>('input[name="ubicacion"]');
  const estado = raiz.querySelector<HTMLElement>('[data-estado]');
  if (!boton || !salida || !estado) return;
  const decir = (t: string) => { estado.textContent = t; };
  let texto = '';
  boton.addEventListener('click', () => {
    if (!('geolocation' in navigator)) { decir('Este navegador no puede obtener la ubicación. Decile al operador el kilómetro del mojón más cercano.'); return; }
    decir('Buscando tu ubicación…');
    boton.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        texto = textoUbicacion(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        salida.textContent = texto;
        salida.hidden = false;
        if (campo) campo.value = texto;
        if (copiar) copiar.hidden = false;
        decir('Listo. Dictale estas coordenadas al operador del 140 o copialas.');
        boton.disabled = false;
      },
      (err) => {
        decir(err.code === err.PERMISSION_DENIED ? 'No diste permiso de ubicación. Podés seguir: decile al operador el kilómetro del mojón más cercano.' : 'No se pudo obtener la ubicación. Decile al operador el kilómetro del mojón más cercano.');
        boton.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
  copiar?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(texto); decir('Ubicación copiada.'); } catch { decir('No se pudo copiar: seleccioná el texto y copialo a mano.'); }
  });
};
const iniciar = () => document.querySelectorAll<HTMLElement>('[data-asistencia]:not([data-montado])').forEach((r) => { r.dataset.montado = ''; montar(r); });
document.addEventListener('astro:page-load', iniciar);

export {};
```

- [ ] **Step 4: `src/pages/asistencia.astro`**

```astro
---
import { Copy, LocateFixed, Phone } from '@lucide/astro';
import Base from '@/layouts/Base.astro';
import Formulario from '@/components/Formulario.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
const contacto = await datos.contacto();
const tel = contacto.emergencias.telefono;
const hayCanal = Boolean(contacto.whatsapp.numero || contacto.atencionUsuario || contacto.email.general);
---
<Base titulo="Asistencia en ruta" descripcion="Pedí asistencia en el Tramo Centro: llamá al 140 (gratis, las 24 horas), compartí la ubicación de tu celular y contanos qué pasó. Grúa y remolque gratuitos para despejar la calzada." migas={[{ nombre: 'Emergencias', href: '/emergencias' }, { nombre: 'Asistencia en ruta', href: '/asistencia' }]}>
  <Seccion nivel="h1" eyebrow="Asistencia en ruta" titulo="¿Te quedaste en la ruta? Primero, llamá." intro="El 140 es gratis, funciona sin crédito y lo atienden personas las 24 horas. Después, si no sabés en qué kilómetro estás, compartí tu ubicación." class="pt-10">
    <div class="revelar tarjeta tarjeta-vial p-8 text-center">
      <a href={`tel:${tel.replace(/[^\d+]/g, '')}`} class="inline-flex items-center justify-center gap-4 font-extrabold tabular-nums text-vial-texto no-underline" style="font-size: clamp(3.5rem, 2rem + 8vw, 8rem)" aria-label={`Llamar a emergencias, ${tel}`}><Phone size={56} aria-hidden="true" /> {tel}</a>
      <p class="mt-2 text-texto-2">Tocá el número para llamar. Decí ruta, sentido y kilómetro, y qué pasó.</p>
    </div>

    <div class="revelar mt-12 grid gap-12 lg:grid-cols-[1fr_1.3fr]" data-asistencia>
      <div class="flex flex-col gap-4">
        <h2 class="text-2xl">Compartí tu ubicación</h2>
        <p class="text-texto-2">Con tu permiso, tomamos la ubicación del celular para que se la dictes al operador o la mandes con el pedido.</p>
        <div><button type="button" class="btn-vial inline-flex items-center gap-2 px-4 py-3 font-semibold" data-ubicar><LocateFixed size={18} aria-hidden="true" /> Obtener mi ubicación</button></div>
        <p class="text-sm text-texto-2" data-estado aria-live="polite"></p>
        <p class="break-all rounded-md border border-borde bg-superficie p-4 font-semibold tabular-nums text-texto" data-ubicacion hidden></p>
        <div><button type="button" class="inline-flex items-center gap-2 rounded-md border border-borde px-4 py-2 font-semibold text-texto hover:border-borde-fuerte hover:bg-superficie" data-copiar hidden><Copy size={16} aria-hidden="true" /> Copiar</button></div>
        <p class="text-sm text-texto-3">Tu ubicación no se guarda en ningún lado: solo aparece acá y viaja en el mensaje si decidís enviarlo.</p>
      </div>
      <div>
        <h2 class="text-2xl">Contanos qué pasó</h2>
        {!hayCanal && <p class="mt-3 text-texto-2"><strong class="text-texto">Llamá al 140 y dictá tu ubicación.</strong> El envío por mensaje se habilita con la toma de posesión; mientras, este formulario te arma el texto para que lo copies.</p>}
        <div class="mt-4">
          <Formulario id="formulario-asistencia" asunto="Asistencia en ruta" whatsapp={contacto.whatsapp.numero} email={contacto.atencionUsuario ?? contacto.email.general} textoBoton="Pedir asistencia por WhatsApp" plazos="Respuesta inmediata" campos={[
            { nombre: 'que-paso', etiqueta: 'Qué pasó', tipo: 'select', opciones: ['Avería o desperfecto', 'Accidente', 'Obstáculo o animal en la calzada', 'Otro'], requerido: true },
            { nombre: 'vehiculo', etiqueta: 'Vehículo', tipo: 'select', opciones: ['Liviano (auto, camioneta, moto)', 'Pesado (camión, ómnibus)'], requerido: true },
            { nombre: 'personas', etiqueta: 'Cuántas personas viajan', requerido: true },
            { nombre: 'ubicacion', etiqueta: 'Ubicación (la completa el botón de arriba)', tipo: 'readonly', valor: '', placeholder: 'Tocá "Obtener mi ubicación"' },
            { nombre: 'referencia', etiqueta: 'Ruta, sentido y kilómetro si los sabés', placeholder: 'RN 9, hacia Córdoba, km 352' },
            { nombre: 'telefono', etiqueta: 'Un teléfono para ubicarte', tipo: 'tel', requerido: true },
          ]} />
        </div>
      </div>
    </div>
  </Seccion>
</Base>
<script src="../scripts/asistencia.ts"></script>
```

- [ ] **Step 5: Accesos al botón**

- `src/pages/emergencias.astro`: después del bloque del 140, `<div class="revelar mt-6"><Boton href="/asistencia" variante="vial">Pedir asistencia con mi ubicación</Boton></div>`.
- `src/components/BarraEmergencias.astro`: el contenedor pasa a `flex gap-2`; el `<a tel>` con `flex-1`, y al lado `<a href={ruta('/asistencia')} class="inline-flex h-12 items-center justify-center rounded-md border border-borde-fuerte px-3 text-sm font-semibold text-texto" aria-label="Pedir asistencia en ruta"><LocateFixed size={18} aria-hidden="true" /></a>` (importar `LocateFixed` y `ruta`).
- `src/components/TarjetaEstacion.astro`: en el bloque de accesos, agregar `<a href={ruta('/asistencia')}>Pedir asistencia</a>`.
- `src/components/home/AccesosRapidos.astro`: el acceso "Emergencias" pasa a `texto: 'Llamá al 140 o pedí asistencia con tu ubicación.'` y `href: tel`; agregar un quinto acceso solo si el grid lo permite: mantener cuatro, y cambiar el de "Emergencias" para que el título sea `'Emergencias 140'`. (El botón de asistencia queda en Emergencias, la barra mobile, las tarjetas y el footer.)
- `src/components/Footer.astro`: en la columna Usuarios agregar `['Asistencia en ruta', '/asistencia']` y `['Guía de trámites', '/tramites']`.
- `scripts/verificar.ts`: al bloque 11 sumar `for (const p of ['asistencia', 'tramites']) if (!existsSync(join(DIST, p, 'index.html'))) fallo(\`falta la página /${p}/\`);`.
- `tests/presupuesto.test.ts` línea 7: agregar `'src/scripts/asistencia.ts'`.

- [ ] **Step 6: Tests, typecheck y prueba manual**

Run: `pnpm vitest run tests/lib/asistencia.test.ts tests/components && pnpm check && pnpm verificar`
Expected: verde.

Run: `pnpm dev` y abrir `/asistencia/` en el celular (misma red, `--host`) o en el navegador: "Obtener mi ubicación" pide permiso, muestra coordenadas y link, "Copiar" copia. Negar el permiso: el mensaje lo dice y el resto sigue. Cerrar.

- [ ] **Step 7: Commit**

```bash
git add src/pages/asistencia.astro src/scripts/asistencia.ts src/lib/asistencia.ts src/pages/emergencias.astro src/components/BarraEmergencias.astro src/components/TarjetaEstacion.astro src/components/home/AccesosRapidos.astro src/components/Footer.astro scripts/verificar.ts tests/presupuesto.test.ts tests/lib/asistencia.test.ts tests/components/asistencia.test.ts
git commit -m "feat(asistencia): botón de asistencia en ruta con ubicación del celular, sin simular envío"
```

### Tarea 5.4: Carrusel del hero con las novedades destacadas

**Files:**
- Modify: `src/components/home/Hero.astro`, `src/pages/index.astro:27`
- Create: `src/scripts/carrusel.ts`
- Modify: `tests/components/home.test.ts` (Hero), `tests/presupuesto.test.ts:7`

**Interfaces:**
- Produces: `<Hero empresa novedades={Novedad[]} />`; sin destacadas renderiza el slide fijo solo; con destacadas, `[data-carrusel]` con `[data-slide]` (el fijo primero), botones `[data-slide-anterior]`/`[data-slide-siguiente]` y puntos `[data-slide-ir]`.

- [ ] **Step 1: Tests**

En `tests/components/home.test.ts`, reemplazar el `describe('Hero', …)` por:

```ts
describe('Hero', () => {
  it('sin destacadas: un h1, la fecha de inicio, CTAs y sin carrusel', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa(), novedades: [] });
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain('5 de octubre de 2026');
    expect(html).toContain('href="/tarifas/"');
    expect(html).not.toContain('data-carrusel');
  });
  it('con destacadas: carrusel con el slide fijo primero, las destacadas después (máximo 3), controles y puntos', async () => {
    const novedades = ['a', 'b', 'c', 'd'].map((s, i) => ({ slug: s, titulo: `Nota ${s}`, fecha: `2026-09-0${i + 1}`, resumen: 'r', etiquetas: [], destacada: i < 4 }));
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa(), novedades });
    expect(html).toContain('data-carrusel');
    expect(html.match(/data-slide="/g)?.length).toBe(4);
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain('aria-roledescription="carrusel"');
    expect(html).toContain('data-slide-siguiente');
    expect(html.match(/data-slide-ir="/g)?.length).toBe(4);
    expect(html).toContain('href="/novedades/a/"');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm vitest run tests/components/home.test.ts`
Expected: FAIL.

- [ ] **Step 3: Hero con carrusel**

En `src/components/home/Hero.astro`: importar `ChevronLeft, ChevronRight` de lucide y `type { Empresa, Novedad }`; `interface Props { empresa: Empresa; novedades?: Novedad[] }`, `const { empresa, novedades = [] } = Astro.props;`, `const destacadas = novedades.filter((n) => n.destacada).slice(0, 3);`, `const hayCarrusel = destacadas.length > 0;`. Reemplazar el `<div class="entrada contenedor …">` (líneas 28–39) por:

```astro
  <div class="contenedor flex min-h-[calc(100dvh-var(--alto-header))] flex-col justify-center py-20">
    <div class:list={['carrusel', hayCarrusel && 'con-slides']} data-carrusel={hayCarrusel ? '' : undefined} aria-roledescription={hayCarrusel ? 'carrusel' : undefined} aria-label={hayCarrusel ? 'Destacados' : undefined}>
      <div class="carrusel-pista">
        <div class="entrada slide" data-slide="inicio" aria-roledescription={hayCarrusel ? 'diapositiva' : undefined} aria-label={hayCarrusel ? 'Covicen' : undefined}>
          <div style="--i: 0"><Eyebrow>Concesionaria del Tramo Centro · {c.rutas.join(' · ')}</Eyebrow></div>
          <h1 class="mt-6 max-w-4xl" style="--i: 1">Las rutas del centro del país tienen quién responda.</h1>
          <p class="mt-6 max-w-2xl text-lg text-texto-2 md:text-xl" style="--i: 2">
            Covicen es la nueva concesionaria del Tramo Centro de la Red Federal de Concesiones: <strong class="text-texto">{numero(c.km, 2)} km</strong> sobre {c.rutas.join(', ')}, entre {c.provincias.join(' y ')}. Operación desde el <strong class="text-texto">{fechaLarga(c.inicioOperacion)}</strong>.
          </p>
          <div class="mt-10 flex flex-wrap items-center gap-4" style="--i: 3">
            <Boton href="/tarifas">Ver tarifas <ArrowRight size={18} aria-hidden="true" /></Boton>
            <Boton href="/el-tramo" variante="secundario">Conocer el tramo</Boton>
          </div>
          <div class="mt-10" style="--i: 4"><CuentaRegresiva fecha={c.inicioOperacion} /></div>
        </div>
        {destacadas.map((n) => (
          <div class="slide" data-slide={n.slug} hidden aria-roledescription="diapositiva" aria-label={n.titulo}>
            <div><Eyebrow>Destacado · {fechaLarga(n.fecha)}</Eyebrow></div>
            <p class="mt-6 max-w-4xl font-extrabold text-texto" style="font-size: clamp(2rem, 1.5rem + 3vw, 4.5rem); line-height: 1.05; letter-spacing: var(--tracking-titulo)">{n.titulo}</p>
            <p class="mt-6 max-w-2xl text-lg text-texto-2 md:text-xl">{n.resumen}</p>
            <div class="mt-10"><Boton href={`/novedades/${n.slug}`}>Leer más <ArrowRight size={18} aria-hidden="true" /></Boton></div>
          </div>
        ))}
      </div>
      {hayCarrusel && (
        <div class="mt-8 flex items-center gap-4">
          <button type="button" class="control" data-slide-anterior aria-label="Anterior"><ChevronLeft size={18} aria-hidden="true" /></button>
          <ul class="flex gap-2" aria-label="Ir a">
            {['inicio', ...destacadas.map((n) => n.slug)].map((s, i) => <li><button type="button" class:list={['punto', i === 0 && 'is-activo']} data-slide-ir={s} aria-label={i === 0 ? 'Covicen' : destacadas[i - 1]!.titulo} aria-current={i === 0 ? 'true' : undefined}></button></li>)}
          </ul>
          <button type="button" class="control" data-slide-siguiente aria-label="Siguiente"><ChevronRight size={18} aria-hidden="true" /></button>
        </div>
      )}
    </div>
  </div>
```

(El título de las notas destacadas es un `<p>` con estilo de título: la página sigue con un solo `<h1>`.) Agregar al `<style>`:

```css
  .slide { animation: aparecer-suave var(--dur-ui) var(--ease-salida) both; }
  .control { display: inline-flex; align-items: center; justify-content: center; width: 2.75rem; height: 2.75rem; border-radius: var(--radius-md); border: 1px solid var(--color-borde); color: var(--color-texto); }
  .control:hover, .control:focus-visible { border-color: var(--color-borde-fuerte); background: var(--color-superficie); }
  .punto { width: 2.75rem; height: 2.75rem; display: inline-flex; align-items: center; justify-content: center; }
  .punto::before { content: ""; width: 0.6rem; height: 0.6rem; border-radius: 999px; background: var(--color-borde-fuerte); transition: background var(--dur-micro), transform var(--dur-micro); }
  .punto.is-activo::before, .punto:hover::before { background: var(--color-acento); transform: scale(1.25); }
  @media (prefers-reduced-motion: reduce) { .slide { animation: none; } }
```

y `<script src="../../scripts/carrusel.ts"></script>` junto al de la cuenta regresiva. En `src/pages/index.astro` línea 27: `<Hero {empresa} {novedades} />`.

Crear `src/scripts/carrusel.ts`:

```ts
// Carrusel del hero: pasa cada 8 s, se frena con el puntero, el foco y "menos movimiento"; flechas y puntos siempre.
const INTERVALO = 8000;
const montar = (raiz: HTMLElement) => {
  const slides = [...raiz.querySelectorAll<HTMLElement>('[data-slide]')];
  const puntos = [...raiz.querySelectorAll<HTMLButtonElement>('[data-slide-ir]')];
  if (slides.length < 2) return;
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let actual = 0;
  let timer = 0;
  const mostrar = (n: number) => {
    slides[actual]!.hidden = true;
    actual = (n + slides.length) % slides.length;
    slides[actual]!.hidden = false;
    puntos.forEach((p, i) => { p.classList.toggle('is-activo', i === actual); if (i === actual) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current'); });
  };
  const parar = () => window.clearInterval(timer);
  const arrancar = () => { parar(); if (!quieto) timer = window.setInterval(() => mostrar(actual + 1), INTERVALO); };
  raiz.querySelector('[data-slide-anterior]')?.addEventListener('click', () => { mostrar(actual - 1); arrancar(); });
  raiz.querySelector('[data-slide-siguiente]')?.addEventListener('click', () => { mostrar(actual + 1); arrancar(); });
  puntos.forEach((p, i) => p.addEventListener('click', () => { mostrar(i); arrancar(); }));
  raiz.addEventListener('pointerenter', parar);
  raiz.addEventListener('pointerleave', arrancar);
  raiz.addEventListener('focusin', parar);
  raiz.addEventListener('focusout', arrancar);
  document.addEventListener('astro:before-swap', parar, { once: true });
  arrancar();
};
const iniciar = () => document.querySelectorAll<HTMLElement>('[data-carrusel]:not([data-montado])').forEach((r) => { r.dataset.montado = ''; montar(r); });
document.addEventListener('astro:page-load', iniciar);

export {};
```

En `tests/presupuesto.test.ts` línea 7 agregar `'src/scripts/carrusel.ts'`.

- [ ] **Step 4: Tests y verificación**

Run: `pnpm vitest run tests/components/home.test.ts tests/presupuesto.test.ts && pnpm check && pnpm verificar`
Expected: verde (una novedad está `destacada: true` desde la Fase 4, así que el home muestra el carrusel con dos slides).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/Hero.astro src/pages/index.astro src/scripts/carrusel.ts tests/components/home.test.ts tests/presupuesto.test.ts
git commit -m "feat(home): carrusel del hero con las novedades destacadas, accesible y sin autoplay con menos movimiento"
```

### Tarea 5.5: Cierre de la Fase 5

- [ ] **Step 1:** `pnpm check && pnpm test && pnpm verificar` en verde. Verificar el presupuesto de JS impreso por `verificar` (≤ 30 KB gz).
- [ ] **Step 2:** Revisión de `sec-bro` sobre `src/pages/asistencia.astro`, `src/scripts/asistencia.ts`, `src/components/Formulario.astro`, `src/scripts/formulario.ts`, `src/pages/contacto.astro`, `src/pages/tramites.astro` (privacidad de la ubicación, inyección en el mensaje, `target=_blank` con `noopener`, sin datos guardados). Atender hallazgos.
- [ ] **Step 3:** Revisión de `rev-bro` (spec §10, plan Fase 5, diff).
- [ ] **Step 4:** Vault: `Costura de datos.md` (estado-ruta.json y el flag `ejemplo`), `Decisiones de arquitectura.md` (asistencia sin simular envío; carrusel = destacadas; popup no). `Home.md`: "Fase 5 cerrada".
- [ ] **Step 5:** Commit de cierre si no se hizo por tarea.

## Fase 6 — Legibilidad, impresión, HTML válido, docs y cierre

Resultado: el sitio cumple las reglas de legibilidad del pliego (61.7) con guardas que lo mantienen, imprime bien, valida como HTML, y quedan la guía de revisión, el vault y la lista para el backend al día.

### Tarea 6.1: Enlaces subrayados, tamaños mínimos, párrafos y guardas

**Files:**
- Modify: `src/styles/global.css` (`@layer base` y `.prose-covicen`; borrar `.link-crece`)
- Modify: todos los archivos que usan `link-crece` (`grep -rn "link-crece" src/`), `src/components/ui/Senal.astro`, `src/pages/novedades/index.astro:13`, `src/pages/obras.astro:24-25`, `src/components/home/TarifaDestacada.astro:63`, `src/components/Breadcrumbs.astro:14`, `src/components/Footer.astro` (links de columnas), `src/pages/el-tramo.astro` (sub-nav), `src/pages/tramites.astro` y `src/pages/politicas.astro` (navs de anclas)
- Create: `tests/styles/legibilidad.test.ts`

- [ ] **Step 1: Guarda**

Crear `tests/styles/legibilidad.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const listar = (dir: string): string[] => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? listar(p) : [p]; });
const archivos = ['src/components', 'src/pages', 'src/layouts', 'src/styles'].flatMap(listar).map((p) => p.replace(/\\/g, '/')).filter((p) => /\.(astro|css)$/.test(p));
const lineasCon = (archivo: string, re: RegExp) => readFileSync(archivo, 'utf8').split('\n').map((l, i) => (re.test(l) ? `${archivo}:${i + 1}: ${l.trim()}` : null)).filter(Boolean) as string[];

// Pliego 61.7: cuerpo ≥ 14 px en contenido, 12 px solo en anotaciones (clase .anotacion), sin justificado, enlaces subrayados.
describe('legibilidad (pliego 61.7)', () => {
  it('no hay tamaños menores a 12 px', () => {
    const culpables = archivos.flatMap((a) => lineasCon(a, /text-\[(0\.[0-6]\d*rem|0\.7\d*rem|1[01]px|[0-9]px)\]|font-size:\s*(0\.[0-6]\d*rem|0\.7\d*rem|1[01]px|[0-9]px)\b/));
    expect(culpables, culpables.join('\n')).toEqual([]);
  });
  it('text-xs (12 px) solo en anotaciones', () => {
    const culpables = archivos.flatMap((a) => lineasCon(a, /\btext-xs\b/)).filter((l) => !/\banotacion\b/.test(l));
    expect(culpables, culpables.join('\n')).toEqual([]);
  });
  it('sin texto justificado', () => {
    const culpables = archivos.flatMap((a) => lineasCon(a, /text-justify|text-align:\s*justify/));
    expect(culpables).toEqual([]);
  });
  it('los enlaces de texto van subrayados por regla global y ya no existe link-crece', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toMatch(/a:not\([^)]*\)[^{]*\{[^}]*text-decoration:\s*underline/);
    expect(archivos.flatMap((a) => lineasCon(a, /link-crece/))).toEqual([]);
  });
  it('los párrafos largos se separan 1,5 veces el interlineado', () => {
    expect(readFileSync('src/styles/global.css', 'utf8')).toContain('margin-block-start: 1.5lh');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm vitest run tests/styles/legibilidad.test.ts`
Expected: FAIL (link-crece, text-xs sin anotacion, sin regla de subrayado).

- [ ] **Step 3: `global.css`**

En `@layer base`, reemplazar las líneas 34–35 (`a { … }` y `a:hover`) por:

```css
  /* Pliego 61.7: los enlaces de texto van subrayados. Menú, botones y tarjetas-enlace tienen otra forma de verse:
     usan `no-underline` (utilidad) o definen text-decoration: none en su propio estilo. */
  a:not(.btn):not(.btn-vial):not(.nav-item) { @apply text-acento; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 0.15em; transition: color var(--dur-micro) var(--ease-salida), text-decoration-thickness var(--dur-micro); }
  a:not(.btn):not(.btn-vial):not(.nav-item):hover, a:not(.btn):not(.btn-vial):not(.nav-item):focus-visible { @apply text-acento-hover; text-decoration-thickness: 2px; }
```

En `@layer components`: borrar el bloque `.link-crece` (líneas 72–78) y reemplazar `.prose-covicen p { margin-top: 0.75rem; }` por:

```css
  /* Pliego 61.7 (WCAG 1.4.8): separación entre párrafos = 1,5 veces el interlineado. `lh` donde existe; 2.4em (1.5 × 1.6) si no. */
  .prose-covicen p { margin-top: 0.75rem; }
  .prose-covicen p + p { margin-block-start: 2.4em; margin-block-start: 1.5lh; }
```

- [ ] **Step 4: Quitar `link-crece` y marcar anotaciones**

Run: `grep -rn "link-crece" src/` y en cada ocurrencia borrar la clase (los enlaces quedan subrayados por la regla global). Donde el enlace está en un menú (`Breadcrumbs.astro:14`, los `<nav>` del `Footer.astro`, la sub-navegación de `el-tramo.astro`, las navs de anclas de `tramites.astro`, `politicas.astro`, `preguntas-frecuentes.astro` y `tarifas.astro`) agregar `no-underline hover:underline`.

Anotaciones: `Senal.astro` → agregar `anotacion` a la lista de clases; `novedades/index.astro:13` (etiquetas) → `anotacion text-xs`; `obras.astro:24-25` → `anotacion text-xs`; `TarifaDestacada.astro:63` → `text-sm` (es una instrucción, no una anotación). Volver a correr el grep del test hasta que quede vacío.

- [ ] **Step 5: Tests y vista**

Run: `pnpm vitest run tests/styles && pnpm check`
Expected: PASS. En `pnpm dev`: los enlaces del cuerpo subrayados, el menú y los botones no; los párrafos de una novedad con más aire entre sí.

- [ ] **Step 6: Commit**

```bash
git add -A -- src/styles src/components src/pages src/layouts tests/styles/legibilidad.test.ts
git commit -m "feat(legibilidad): enlaces subrayados, 12 px solo en anotaciones, separación de párrafos del pliego, con guardas"
```

### Tarea 6.2: Vista de impresión y foco visible

**Files:**
- Create: `src/styles/impresion.css`
- Modify: `src/styles/global.css:1-5` (import), `src/layouts/Base.astro:37,41,54-55`
- Modify: `scripts/verificar.ts` (hoja de impresión presente), `tests/styles/tokens.test.ts` (no cambia) 
- Create: `tests/styles/impresion.test.ts`

- [ ] **Step 1: Test**

Crear `tests/styles/impresion.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('impresión (pliego 61.7)', () => {
  const css = readFileSync('src/styles/impresion.css', 'utf8');
  it('hay una hoja de impresión que oculta la navegación, muestra las URL y todas las tarjetas', () => {
    expect(css).toContain('@media print');
    expect(css).toMatch(/header[^{]*\{[^}]*display:\s*none/);
    expect(css).toContain('attr(href)');
    expect(css).toContain('[data-tarjeta-estacion][hidden]');
  });
  it('global.css la importa', () => {
    expect(readFileSync('src/styles/global.css', 'utf8')).toContain('@import "./impresion.css"');
  });
});
```

- [ ] **Step 2: Correr y ver que falla**

Run: `pnpm vitest run tests/styles/impresion.test.ts`
Expected: FAIL.

- [ ] **Step 3: `src/styles/impresion.css`**

```css
/* Vista de impresión (pliego 61.7). Fondo blanco, texto negro, sin navegación ni animaciones; las URL visibles;
   las tablas completas; todas las tarjetas de estación aunque el mapa interactivo esté mostrando una sola. */
@media print {
  :root, html[data-tema="claro"] { --color-fondo: #ffffff; --color-fondo-2: #ffffff; --color-superficie: #ffffff; --color-superficie-2: #ffffff; --color-texto: #000000; --color-texto-2: #000000; --color-texto-3: #333333; --color-acento: #000000; --color-acento-hover: #000000; --color-vial-texto: #000000; --color-ok: #000000; --color-error: #000000; --color-borde: #999999; --color-borde-fuerte: #666666; --brillo-foto: 1; }
  *, *::before, *::after { animation: none !important; transition: none !important; box-shadow: none !important; text-shadow: none !important; }
  body { padding: 0 !important; }
  body::before { content: "Covicen · " attr(data-sitio) " · impreso el " attr(data-fecha); display: block; padding: 0 0 1rem; border-bottom: 1px solid #666666; font-size: 12px; }
  header, .barra-superior, footer nav, [data-grilla], canvas, .costura, .scrollea, .salto, .hilo-ruta, button, .control, .punto, [data-anuncios], .parallax, .hero-luz, .divisor { display: none !important; }
  main { padding-top: 0 !important; }
  .tarjeta, .tarjeta::before, .tarjeta::after { background: none !important; border: 1px solid #666666 !important; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 12px; }
  a { color: #000000 !important; }
  [data-tarjeta-estacion][hidden], [data-slide][hidden], [data-anuncio][hidden] { display: block !important; }
  .overflow-x-auto { overflow: visible !important; }
  table { page-break-inside: avoid; }
  h1, h2, h3 { page-break-after: avoid; }
}
```

(Los hex acá son la única excepción permitida además de `tokens.css`: sumar `'src/styles/impresion.css'` a `permitidos` en `tests/styles/colores-fijos.test.ts`, con el comentario "impresión: blanco y negro por definición".)

En `src/styles/global.css` línea 5, después de `@import "./tarjetas.css";` agregar `@import "./impresion.css";`.

- [ ] **Step 4: Base: datos para el encabezado de impresión y foco visible del destino del skip link**

`src/layouts/Base.astro`:
- Frontmatter: `import { config } from '@/lib/config';` y `const impreso = new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });`.
- Línea 37: `<body class="flex min-h-dvh flex-col bg-fondo pb-20 text-texto sm:pb-0" data-sitio={config.sitio.replace(/^https?:\/\//, '')} data-fecha={impreso}>`.
- Línea 41: quitar `outline-none` de `<main>`.
- Líneas 54–55 (`<style is:global>`): agregar `#contenido:focus-visible { outline: 2px solid var(--color-acento); outline-offset: 4px; border-radius: var(--radius-sm); }`.

- [ ] **Step 5: `verificar.ts`: la hoja de impresión llega al build**

Después del bloque de páginas de estación (11) agregar:

```ts
// 12. la hoja de impresión (pliego 61.7) está en el CSS emitido
const css = readdirSync(join(DIST, '_astro')).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(DIST, '_astro', f), 'utf8')).join('\n');
if (!css.includes('@media print')) fallo('el CSS emitido no tiene la hoja de impresión (@media print)');
```

- [ ] **Step 6: Tests y prueba manual**

Run: `pnpm vitest run tests/styles && pnpm verificar`
Expected: verde.

Run: `pnpm dev`, en `/tarifas/` tocar "Imprimir el cuadro" y mirar la vista previa: fondo blanco, sin header, las tres tablas, las URL entre paréntesis, el encabezado "Covicen · … · impreso el …". En `/el-tramo/` la vista previa muestra las seis tarjetas. Cerrar.

- [ ] **Step 7: Commit**

```bash
git add src/styles/impresion.css src/styles/global.css src/layouts/Base.astro scripts/verificar.ts tests/styles/impresion.test.ts tests/styles/colores-fijos.test.ts
git commit -m "feat(impresion): hoja de impresión del pliego y foco visible al saltar al contenido"
```

### Tarea 6.3: HTML válido en el build

**Files:**
- Modify: `package.json` (devDependency `html-validate`), `pnpm-lock.yaml`
- Create: `.htmlvalidate.json`
- Modify: `scripts/verificar.ts`

- [ ] **Step 1: Instalar y configurar**

Run: `pnpm add -D html-validate`

Crear `.htmlvalidate.json`:

```json
{
  "extends": ["html-validate:recommended"],
  "rules": {
    "no-inline-style": "off",
    "no-trailing-whitespace": "off",
    "long-title": ["error", { "maxlength": 90 }],
    "require-sri": "off"
  }
}
```

(`no-inline-style` apagada porque Astro emite `style="--i: 0"` para el stagger y las coordenadas: son variables, no estilos de presentación. Cualquier otra regla que haya que apagar se justifica en un comentario en `scripts/verificar.ts`, al lado del validador.)

- [ ] **Step 2: Validar cada página en `verificar.ts`**

Agregar `import { HtmlValidate } from 'html-validate';` y, antes del `for (const ruta of paginas)`, `const validador = new HtmlValidate();`. Dentro del bucle, al final:

```ts
  // 13. HTML válido (pliego 61.7: estándares W3C). Reglas apagadas y por qué: ver .htmlvalidate.json.
  const reporte = await validador.validateString(html, ruta);
  for (const r of reporte.results) for (const m of r.messages) fallo(`${nombre}: HTML ${m.ruleId} (${m.line}:${m.column}) ${m.message}`);
  // 14. ningún enlace externo abre en otra pestaña sin rel="noopener"
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) fallo(`${nombre}: target=_blank sin noopener → ${m[0].slice(0, 80)}`);
```

Como el bucle pasa a usar `await`, envolver el recorrido en una función `async` o dejar el archivo como módulo con top-level await (Node ≥ 22 lo permite en `.ts` ejecutado con `node`): el archivo ya es ESM, así que el `await` a nivel superior funciona.

- [ ] **Step 3: Correr y corregir lo que marque**

Run: `pnpm verificar`
Expected: lista de errores de HTML, si los hay (por ejemplo: `<a>` dentro de `<svg>` sin `xlink`, atributos duplicados, `<p>` dentro de `<p>` en la prosa, IDs repetidos entre la tabla de tarifas de El tramo y las tarjetas). Corregir cada uno en su componente (nunca apagando la regla salvo justificación escrita) hasta `OK: N páginas verificadas, 0 fallos.`

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml .htmlvalidate.json scripts/verificar.ts
git commit -m "test(verificar): HTML válido en cada página con html-validate"
```

### Tarea 6.4: Guía de revisión, vault, lista para el backend y cierre general

**Files:**
- Modify: `docs/guia-de-revision.md`
- Modify: `obsidian/Home.md`, `obsidian/Decisiones de arquitectura.md`, `obsidian/Costura de datos.md`, `obsidian/Sistema de diseno.md`
- Create: `obsidian/Obligaciones del pliego para la web.md` (si no se creó en la Fase 4)
- Modify: `README.md` (variables para el dominio)

- [ ] **Step 1: `docs/guia-de-revision.md`**

Reescribir siguiendo la estructura actual (una sección por pantalla), con qué mirar ahora:

- **Todas las páginas**: barra superior (anuncio rotando, TelePASE, Mi cuenta, sol/luna), el 140 grande, interruptor de tema (probar recargar en claro: sin destello), footer con la fila institucional y "Última actualización".
- **Home**: hero (carrusel si hay destacadas), tarifa destacada $1.500, mapa con tarjetas (tocar Franck), estado de la traza con el cartel de ejemplo.
- **Tarifas**: tres tablas por estación, columnas iguales hoy, imprimir.
- **El tramo**: sub-navegación pegada, tabla de rutas con progresivas, tarjetas, tablas por estación, servicios.
- **Peajes**: `/peajes/carcarana/` y `/peajes/totoras/`.
- **Servicios, Emergencias, Asistencia, Medios de pago, Trámites, Contacto**: qué se ve, qué está oculto hasta tener el dato (lista), y cómo probar la ubicación en el celular.
- **Quiénes somos, Transparencia, Obras, Seguridad vial, FAQ, Novedades**.
- **Cómo cargar lo que falta (sin tocar componentes)**: tabla campo → archivo → efecto: `empresa.json` (razonSocial, cuit, domicilioLegal, domicilioComercial, constanciaUrl, polizaRc), `contacto.json` (lineaGratuita, atencionUsuario, whatsapp.numero, redes, enlaces.oficinaVirtual, canales[].valor, cuentaRegularizacion), `tramo.json` (servicios por estación, telefono, horarioAtencion), `avisos.json`, `estado-ruta.json` (poner `ejemplo: false` cuando sean reales), `public/qr-afip.png`, `src/assets/institucional/organigrama.png`, `src/assets/institucional/<id>.svg` (logos), `src/assets/atmosfera/hero-ruta-diurna.jpg`, `TEMA_POR_DEFECTO` en `src/lib/tema.ts`.
- **Migración a dominio propio** (pliego 61.7): en GitHub Pages, dominio personalizado `www.covicen.com.ar` (CNAME) para que el apex redirija al `www`; en Actions: `PUBLIC_SITE_URL=https://www.covicen.com.ar`, `PUBLIC_BASE_PATH=/`, `PUBLIC_INDEXABLE=true`. La URL va en la cartelería de las cabinas: no cambiarla después.

- [ ] **Step 2: Vault**

- `obsidian/Home.md`: línea de estado del día con el cierre de las seis fases, link a la spec y al plan, y la lista corta de pendientes de Covicen (spec §14).
- `obsidian/Decisiones de arquitectura.md`: filas nuevas (tema con interruptor y default por constante; header de dos filas; esconder, no a confirmar; 679,03 del PETP; cuadro heredado y columna manual igual; asistencia sin simular envío; carrusel = destacadas, sin popup; contrato compartido solo con opcionales) y actualizar la fila "Marca" (sin descriptor).
- `obsidian/Costura de datos.md`: métodos nuevos, JSON nuevos, campos nuevos del contrato con la nota para el backend, y la sección "Datos hoy marcados a confirmar" pasa a "Datos hoy ocultos (null en `src/content/`)".
- `obsidian/Sistema de diseno.md`: sección "Tema claro" (si no se escribió en la Fase 0) y "Legibilidad e impresión (pliego 61.7)".
- `obsidian/Obligaciones del pliego para la web.md`: el checklist de la spec §13 con el estado real al cierre y el enlace a la spec.

- [ ] **Step 3: Cierre general**

Run: `pnpm check && pnpm test && pnpm verificar`
Expected: verde. Anotar en el mensaje de cierre los números que imprime `verificar` (páginas, KB de JS).

Revisión final de `rev-bro` sobre todo el diff desde el commit de la spec (`git diff 15791de..HEAD --stat` y el diff completo), contra la spec entera, con las tres verificaciones corridas por él. Atender hallazgos. Después, `superpowers:verification-before-completion` con los outputs pegados.

- [ ] **Step 4: Commit y estado del repo**

```bash
git add docs/guia-de-revision.md README.md obsidian
git commit -m "docs: guía de revisión, vault y lista para el backend al cierre de la actualización de la web"
git log --oneline 15791de..HEAD
git status --short --branch
```

Avisar a Juli: `main` queda N commits adelante de `origin/main` (ya venía 7 adelante antes de este plan). El push lo decide él.

---

## Lo que llega después del video

Los puntos que Juli agregue tras ver la grabación entran como tareas nuevas al final de la fase que corresponda (numeradas `N.x`), con el mismo formato: archivos, interfaces, test que falla, implementación, test que pasa, commit. Ninguno cambia el orden de las fases ni las guardas.

<!-- FIN -->
