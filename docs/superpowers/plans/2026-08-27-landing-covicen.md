# Landing fundacional de Covicen — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la landing estática de Covicen (Astro 7, dark-first, concepto "La ruta, de noche") con contenido versionado detrás de un adaptador de datos, SEO y accesibilidad AA verificados por script, y deploy a GitHub Pages.

**Architecture:** Sitio 100% estático generado por Astro. Los componentes consumen datos solo a través de `src/lib/datos` (contrato Zod + interfaz `FuenteDatos`); hoy la fuente es JSON/Markdown del repo, mañana una API. Movimiento con CSS scroll-driven y fallback vanilla; sin React hidratado en v1. Verificación sin navegador: `astro check`, `vitest` (Container API para componentes) y un script sobre `dist/`.

**Tech Stack:** Astro 7.2, Tailwind 4.3 (`@tailwindcss/vite`), `@lucide/astro` 1.34 (íconos), `@fontsource-variable/archivo` 5, `@astrojs/sitemap` 3, `@astrojs/react` 6 + React 19 (instalado para islas futuras; en v1 no se hidrata nada), Vitest 4, `@astrojs/check` + TypeScript 5, `linkedom` (verificación), `@resvg/resvg-js` (imagen OG), `svgo`. pnpm. Node 25 (los scripts `.ts` corren con `node` directo).

**Spec:** `docs/superpowers/specs/2026-08-27-landing-covicen-design.md` — el plan argumenta desde el spec; leé los dos.

## Global Constraints

- **Español rioplatense** en código, comentarios, commits y copy. Voseo en el copy ("Consultá"). Cuidar irregulares ("anduvo", no "andó").
- **No commitear sin pedido explícito de Juli.** Los pasos "Checkpoint" hacen `git add -A` y muestran `git status`; solo commitean si Juli autorizó commits por tarea al arrancar la ejecución.
- **Cero emojis en la UI.** Íconos: `@lucide/astro` únicamente.
- **Cero Chrome headless.** La validación visual la hace Juli; nosotros cerramos con `pnpm check`, `pnpm test`, `pnpm build`, `pnpm verificar` en verde.
- **Dirección única de dependencia:** `src/content/` → `src/lib/datos/` → componentes/páginas. Un `import` de `src/content` fuera de `src/lib/datos/fuentes/` es un bug.
- **Tokens semánticos solamente en componentes** (`fondo`, `superficie`, `texto`, `acento`, `vial`, …). Los tokens de marca (`marca-900`, …) solo se usan dentro de `tokens.css` y en los SVG de marca.
- **Todo elemento interactivo declara hover, focus-visible y estado activo.** Un componente sin eso no está terminado.
- **Presupuesto:** JS enviado al cliente ≤ 30 KB gz total; JS de animación ≤ 2 KB; ningún asset above-the-fold > 100 KB.
- **Afirmaciones verificables únicamente.** Datos sin fuente → `null` + etiqueta "a confirmar" en la UI, nunca un número inventado.
- **`tel:` de emergencias visible en toda página**, aunque el número sea `null` (se muestra el slot "a confirmar").
- **Astro 7 compila HTML estricto:** todo tag no-void se cierra explícitamente (`<div></div>`, nunca `<div/>` salvo componentes).
- **Compatibilidad:** Firefox estable no tiene scroll-driven animations (junio 2026) → toda animación por scroll lleva fallback `@supports not` + `IntersectionObserver`.
- Entorno: Windows 11, Git Bash. Node `v25.5.0`, pnpm `10.33`. Rutas en comandos con `/`.

---

## Estructura de archivos

```
astro.config.mjs                  config Astro (site/base desde env, tailwind vite plugin, sitemap, react)
package.json · tsconfig.json · vitest.config.ts · .env.example · .gitignore · README.md
.github/workflows/pages.yml       check + test + build + deploy a Pages
docs/marca/                       Logo Covicen 2.pdf, prompts-imagenes.md
docs/guia-de-revision.md          URL + qué mirar por pantalla (para Juli)
scripts/
  extraer-isotipo.py              PDF → src/assets/marca/isotipo*.svg (se corre una vez; el SVG queda versionado)
  generar-og.ts                   src/assets/marca/og.svg → public/og.png (resvg + TTF de Archivo)
  verificar.ts                    chequeos sobre dist/ (links, SEO, JSON-LD, tel:, vigencia, noindex, presupuesto)
  lib/contraste.ts                ratio WCAG (puro, testeado)
  fuentes/                        Archivo-ExtraBold.ttf, Archivo-Regular.ttf (solo para OG)
src/
  styles/global.css               @import tailwind + tokens + base + movimiento
  styles/tokens.css               @theme: marca + semánticos + tipografía + easings; :root: duraciones
  styles/movimiento.css           patrones: revelar, mojón, hilo, balizas, dibujar-ruta, transiciones de página
  lib/datos/esquemas.ts           Zod + tipos (EL CONTRATO)
  lib/datos/fuente.ts             interface FuenteDatos
  lib/datos/capacidades.ts        flags de lo que depende de sistemas
  lib/datos/fuentes/local.ts      lee src/content (JSON via import, novedades via astro:content)
  lib/datos/fuentes/api.ts        stub que lanza
  lib/datos/index.ts              export const datos
  lib/formato.ts                  moneda, fechas, números es-AR
  lib/rutas.ts                    ruta(), absoluta() (respetan base y trailing slash)
  lib/whatsapp.ts                 enlaceWhatsapp(numero, texto)
  lib/seo.ts                      builders JSON-LD
  lib/config.ts                   lee PUBLIC_* de import.meta.env, tipado
  content.config.ts               colección `novedades` (markdown)
  content/                        empresa.json, contacto.json, tramo.json, tarifario.json, obras/*.json, faq/*.json, novedades/*.md
  assets/marca/                   isotipo.svg, isotipo-tinta.svg, og.svg
  assets/atmosfera/               (vacío; imágenes opcionales generadas por Juli)
  layouts/Base.astro              html, head (Seo, ClientRouter), skip link, Header, BarraEmergencias, HiloRuta, Footer
  components/Seo.astro · Header.astro · Footer.astro · BarraEmergencias.astro · HiloRuta.astro · Breadcrumbs.astro
  components/marca/Isotipo.astro · Logotipo.astro
  components/ui/Boton.astro · Card.astro · Senal.astro · Mojon.astro · Eyebrow.astro · Seccion.astro · Titulo.astro
  components/ilustraciones/MapaTramo.astro · HeroRuta.astro · IconoVehiculo.astro · ImagenAtmosfera.astro
  components/HuecoCapacidad.astro · Formulario.astro · CuentaRegresiva.astro · Faq.astro · TablaTarifas.astro
  components/home/Hero.astro · AccesosRapidos.astro · TarifaDestacada.astro · ObrasYEstado.astro · Servicios.astro · NovedadesRecientes.astro · Consorcio.astro · FaqCorto.astro · ContactoCta.astro
  scripts/revelar.ts              fallback IntersectionObserver (< 1 KB)
  scripts/cuenta-regresiva.ts     countdown (< 1 KB)
  scripts/formulario.ts           arma el link wa.me con los campos (< 1 KB)
  pages/index.astro · tarifas.astro · el-tramo.astro · servicios.astro · emergencias.astro · medios-de-pago.astro
  pages/seguridad-vial.astro · obras.astro · novedades/index.astro · novedades/[slug].astro
  pages/quienes-somos.astro · politicas.astro · transparencia.astro · trabaja-con-nosotros.astro
  pages/preguntas-frecuentes.astro · contacto.astro · proveedores.astro · privacidad.astro · 404.astro · robots.txt.ts
tests/                            espejo de src/ y scripts/ (*.test.ts)
```

---

### Task 1: Scaffold del proyecto (Astro 7 + Tailwind 4 + Vitest)

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.env.example`, `.gitignore`, `README.md`, `src/pages/index.astro` (provisoria), `src/lib/config.ts`, `tests/lib/config.test.ts`
- Move: `Logo Covicen 2.pdf` → `docs/marca/Logo Covicen 2.pdf`; `PROMPT_MAESTRO.md` → `docs/PROMPT_MAESTRO.md`

**Interfaces:**
- Produces: `src/lib/config.ts` → `export const config: { sitio: string; base: string; indexable: boolean; fuenteDatos: 'local' | 'api' }`
- Produces: scripts `pnpm dev | build | check | test | verificar`

- [ ] **Step 1: Mover archivos sueltos a `docs/`**

```bash
mkdir -p docs/marca && git mv -k "Logo Covicen 2.pdf" docs/marca/ 2>/dev/null || mv "Logo Covicen 2.pdf" docs/marca/
mv PROMPT_MAESTRO.md docs/PROMPT_MAESTRO.md
ls docs docs/marca
```
Expected: `docs/` contiene `PROMPT_MAESTRO.md`, `marca/`, `superpowers/`.

- [ ] **Step 2: Crear `package.json`**

```json
{
  "name": "covicen-landing",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "packageManager": "pnpm@10.33.0",
  "scripts": {
    "dev": "astro dev",
    "build": "node scripts/generar-og.ts && astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest",
    "verificar": "pnpm build && node scripts/verificar.ts",
    "og": "node scripts/generar-og.ts"
  }
}
```

- [ ] **Step 3: Instalar dependencias**

```bash
pnpm add astro@^7.2 @astrojs/react@^6 react@^19 react-dom@^19 @astrojs/sitemap@^3 @tailwindcss/vite@^4.3 tailwindcss@^4.3 @lucide/astro@^1.34 @fontsource-variable/archivo@^5
pnpm add -D @astrojs/check@^0.9 typescript@^5 vitest@^4 vite@^8 linkedom@^0.18 @resvg/resvg-js@^2.6 svgo@^4 @types/node@^26 @types/react@^19 @types/react-dom@^19
```
Expected: sin errores de peer deps. Si `@astrojs/check` se queja de TypeScript, confirmá que quedó `typescript` 5.x (`pnpm ls typescript`), no 7.x. `vite` va declarado explícitamente porque `astro.config.mjs` importa `loadEnv` de ahí y pnpm no expone dependencias transitivas.

> **Nota posterior (ejecución):** `@astrojs/react`, `react`, `react-dom` y sus `@types` se sacaron en la Task 16 porque la integración emite ~60 KB gz de runtime de cliente aunque no haya islas. No los instales; `integrations: [sitemap()]`.
> **Nota posterior 2:** `sharp@^0.35` va como devDependency: Astro 6+ no lo trae y `astro:assets` lo necesita para optimizar las imágenes de `src/assets/atmosfera/` (con pnpm no se hoistea nada).

- [ ] **Step 4: `astro.config.mjs`**

```js
// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// .env no se carga en la config: hay que leerlo a mano.
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');
const site = env.PUBLIC_SITE_URL || 'http://localhost:4321';
const base = env.PUBLIC_BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 5: `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "src/**/*", "tests/**/*", "scripts/**/*"],
  "exclude": ["dist", "node_modules"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["node", "vitest/globals"]
  }
}
```

- [ ] **Step 6: `vitest.config.ts`**

```ts
/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: true,
    env: {
      PUBLIC_SITE_URL: 'https://covicen.test',
      PUBLIC_BASE_PATH: '/',
      PUBLIC_INDEXABLE: 'false',
      FUENTE_DATOS: 'local',
    },
  },
});
```

- [ ] **Step 7: `.env.example`, `.gitignore`, `README.md`**

`.env.example`:
```
# URL final del sitio (sin base). En GitHub Pages: https://<cuenta>.github.io
PUBLIC_SITE_URL=https://juliv08.github.io
# Base path. En Pages de un repo llamado covicen: /covicen/ . Con dominio propio: /
PUBLIC_BASE_PATH=/covicen/
# false mientras sea demo: noindex + robots cerrado. true cuando haya dominio.
PUBLIC_INDEXABLE=false
# local | api  (api no está implementada en v1)
FUENTE_DATOS=local
```

`.gitignore`:
```
node_modules/
dist/
.astro/
.env
.env.*
!.env.example
.omc/
!.omc/skills/
public/og.png
```

`README.md`:
```markdown
# Covicen — landing fundacional

Sitio estático (Astro 7) de Covicen, concesionaria del Tramo Centro de la Red Federal de Concesiones.

## Comandos
- `pnpm dev` — servidor local en http://localhost:4321
- `pnpm check` — typecheck (astro check)
- `pnpm test` — tests (vitest)
- `pnpm build` — genera `dist/` (antes regenera `public/og.png`)
- `pnpm verificar` — build + chequeos de links, SEO, JSON-LD, accesibilidad y presupuesto sobre `dist/`

## Contenido
Todo el contenido vive en `src/content/` (JSON y Markdown). Los componentes lo consumen a través de `src/lib/datos`. Ver `docs/superpowers/specs/2026-08-27-landing-covicen-design.md` §4.

## Entorno
Copiá `.env.example` a `.env`. Variables: `PUBLIC_SITE_URL`, `PUBLIC_BASE_PATH`, `PUBLIC_INDEXABLE`, `FUENTE_DATOS`.
```

- [ ] **Step 8: Test de `config.ts` (falla primero)**

`tests/lib/config.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { config } from '@/lib/config';

describe('config', () => {
  it('lee las variables públicas del entorno', () => {
    expect(config.sitio).toBe('https://covicen.test');
    expect(config.base).toBe('/');
    expect(config.indexable).toBe(false);
    expect(config.fuenteDatos).toBe('local');
  });
});
```
Run: `pnpm test`
Expected: FAIL — `Cannot find module '@/lib/config'`.

- [ ] **Step 9: `src/lib/config.ts`**

```ts
// Único lugar que lee variables de entorno. El resto importa `config`.
// Acceso ESTÁTICO (import.meta.env.NOMBRE): desde Astro 6 los valores se inlinean en build;
// un acceso dinámico por clave no se reemplaza y queda undefined.
const oDefecto = (valor: string | undefined, porDefecto: string): string => (valor === undefined || valor === '' ? porDefecto : valor);

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
```

- [ ] **Step 10: Página provisoria y primera corrida completa**

`src/pages/index.astro`:
```astro
---
const titulo = 'Covicen';
---
<html lang="es-AR">
  <head><meta charset="utf-8" /><title>{titulo}</title></head>
  <body><h1>{titulo}</h1></body>
</html>
```
Run: `pnpm test && pnpm check && pnpm build`
Expected: test PASS (1), `astro check` 0 errors, `dist/index.html` existe. `pnpm build` va a fallar hasta la Task 6 porque `scripts/generar-og.ts` no existe: **por ahora** corré `pnpm exec astro build` para verificar el scaffold.

- [ ] **Step 11: Checkpoint**

```bash
git add -A && git status --short | head -30
```
Commit (solo si Juli autorizó): `chore: scaffold Astro 7 + Tailwind 4 + Vitest`

---

### Task 2: Tokens, tipografía, CSS global y verificación de contraste

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `scripts/lib/contraste.ts`, `tests/scripts/contraste.test.ts`, `tests/styles/tokens.test.ts`

**Interfaces:**
- Produces: utilidades Tailwind `bg-fondo`, `bg-fondo-2`, `bg-superficie`, `bg-superficie-2`, `text-texto`, `text-texto-2`, `text-texto-3`, `text-acento`, `text-acento-hover`, `bg-vial`, `text-vial`, `text-error`, `border-borde`, `border-borde-fuerte`, `font-sans`, `ease-salida`, `ease-suave`, `rounded-sm|md|lg|full`; variables `--dur-micro|ui|entrada|narrativa`, `--stagger`, `--alto-header`, `--ancho-max`
- Produces: `contraste(hexA: string, hexB: string): number` y `leerTokens(css: string): Record<string, string>` en `scripts/lib/contraste.ts`

- [ ] **Step 1: Test de `contraste` (falla primero)**

`tests/scripts/contraste.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { contraste, leerTokens } from '../../scripts/lib/contraste.ts';

describe('contraste', () => {
  it('blanco sobre negro es 21', () => {
    expect(contraste('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
  });
  it('es simétrico', () => {
    expect(contraste('#E8EEF5', '#0B1526')).toBeCloseTo(contraste('#0B1526', '#E8EEF5'), 5);
  });
  it('texto sobre fondo del tema oscuro supera 4.5', () => {
    expect(contraste('#E8EEF5', '#0B1526')).toBeGreaterThan(4.5);
  });
});

describe('leerTokens', () => {
  it('extrae --color-* con valor hex', () => {
    const css = `@theme {\n  --color-fondo: #0B1526;\n  --color-borde: rgb(255 255 255 / 0.10);\n}`;
    expect(leerTokens(css)).toEqual({ fondo: '#0B1526' });
  });
});
```
Run: `pnpm test tests/scripts/contraste.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 2: `scripts/lib/contraste.ts`**

```ts
// Ratio de contraste WCAG 2.1 entre dos colores hex (#RRGGBB).
const canal = (v: number): number => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const luminancia = (hex: string): number => {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Color hex inválido: ${hex}`);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
};

export const contraste = (a: string, b: string): number => {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [claro, oscuro] = la >= lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (oscuro + 0.05);
};

/** Devuelve { nombre: '#hex' } para cada `--color-<nombre>: #hex` del CSS. Ignora valores no hex. */
export const leerTokens = (css: string): Record<string, string> => {
  const tokens: Record<string, string> = {};
  for (const m of css.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[m[1]] = m[2].toUpperCase();
  }
  return tokens;
};
```
Run: `pnpm test tests/scripts/contraste.test.ts`
Expected: PASS (4).

- [ ] **Step 3: `src/styles/tokens.css`**

```css
/* Tokens de Covicen. Dos capas: marca (manual "Covicen Marca 9b1", fijos) y semánticos (los usan los componentes).
   El tema claro futuro redefine SOLO la capa semántica. */
@theme {
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

  /* --- semánticos, tema oscuro "La ruta, de noche" --- */
  --color-fondo: #0B1526;
  --color-fondo-2: #10203A;
  --color-superficie: #16304E;
  --color-superficie-2: #1E4870;
  --color-texto: #E8EEF5;
  --color-texto-2: #A9C4D8;
  --color-texto-3: #8593A0; /* ≥ 4.5:1 sobre fondo y fondo-2; NO sobre superficie */
  --color-acento: #68BCE1;
  --color-acento-hover: #8FCDE8;
  --color-vial: #F0C419;
  --color-error: #FF8A80;
  --color-borde: rgb(255 255 255 / 0.10);
  --color-borde-fuerte: rgb(255 255 255 / 0.18);
  --color-glow: rgb(104 188 225 / 0.35);

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
  color-scheme: dark;
}
```

- [ ] **Step 4: `src/styles/global.css`**

```css
@import "tailwindcss";
@import "./tokens.css";
@import "@fontsource-variable/archivo";
@import "./movimiento.css";

@layer base {
  html {
    scroll-behavior: smooth;
    -webkit-text-size-adjust: 100%;
  }
  body {
    @apply bg-fondo text-texto font-sans antialiased;
    font-size: 1rem;
    line-height: 1.6;
    font-variant-numeric: tabular-nums;
  }
  ::selection { background: var(--color-acento); color: var(--color-fondo); }

  /* foco visible, uniforme, en todo lo interactivo */
  :focus-visible {
    outline: 2px solid var(--color-acento);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }
  h1, h2, h3 { @apply font-extrabold text-texto; letter-spacing: var(--tracking-titulo); line-height: 1.05; text-wrap: balance; }
  h1 { font-size: clamp(2.5rem, 2rem + 4vw, 6rem); }
  h2 { font-size: clamp(1.9rem, 1.4rem + 2.2vw, 3.25rem); }
  h3 { font-size: clamp(1.25rem, 1.1rem + 0.8vw, 1.75rem); }
  p { text-wrap: pretty; }
  a { @apply text-acento; transition: color var(--dur-micro) var(--ease-salida); }
  a:hover { @apply text-acento-hover; }

  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
  }
}

@layer components {
  .contenedor { width: min(100% - 2.5rem, var(--ancho-max)); margin-inline: auto; }
  /* grilla de plano: fondo tech tenue */
  .plano {
    background-image:
      linear-gradient(to right, rgb(255 255 255 / 0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgb(255 255 255 / 0.04) 1px, transparent 1px);
    background-size: 4rem 4rem;
  }
  /* esquineros finos, como dibujo técnico */
  .esquineros { position: relative; }
  .esquineros::before, .esquineros::after {
    content: ""; position: absolute; width: 0.75rem; height: 0.75rem; pointer-events: none;
    border-color: var(--color-borde-fuerte); border-style: solid;
    transition: width var(--dur-ui) var(--ease-salida), height var(--dur-ui) var(--ease-salida), border-color var(--dur-ui);
  }
  .esquineros::before { top: -1px; left: -1px; border-width: 1px 0 0 1px; }
  .esquineros::after { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }
  .esquineros:hover::before, .esquineros:hover::after { width: 1.25rem; height: 1.25rem; border-color: var(--color-acento); }
  /* link con subrayado que crece desde la izquierda */
  .link-crece {
    background-image: linear-gradient(currentColor, currentColor);
    background-repeat: no-repeat; background-size: 0% 1px; background-position: 0 100%;
    transition: background-size var(--dur-ui) var(--ease-salida), color var(--dur-micro);
  }
  .link-crece:hover, .link-crece:focus-visible { background-size: 100% 1px; }
  .eyebrow { @apply font-medium uppercase text-texto-2; letter-spacing: var(--tracking-eyebrow); font-size: 0.75rem; }
}
```
Nota: `movimiento.css` se crea en la Task 8; hasta entonces creá el archivo vacío: `printf '' > src/styles/movimiento.css`.

- [ ] **Step 5: Confirmar el nombre de la familia de Archivo**

Run: `grep -m1 "font-family" node_modules/@fontsource-variable/archivo/index.css`
Expected: `font-family: 'Archivo Variable';`. Si dice otra cosa, ajustá `--font-sans` en `tokens.css`.

- [ ] **Step 6: Test de contraste de los tokens reales (falla si algún par baja de 4.5)**

`tests/styles/tokens.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contraste, leerTokens } from '../../scripts/lib/contraste.ts';

const tokens = leerTokens(readFileSync('src/styles/tokens.css', 'utf8'));

// Pares (texto, fondo) que el sitio usa. Si un componente usa un par nuevo, se agrega acá.
const pares: Array<[string, string]> = [
  ['texto', 'fondo'], ['texto-2', 'fondo'], ['texto-3', 'fondo'], ['acento', 'fondo'], ['vial', 'fondo'], ['error', 'fondo'],
  ['texto', 'fondo-2'], ['texto-2', 'fondo-2'], ['texto-3', 'fondo-2'], ['acento', 'fondo-2'],
  ['texto', 'superficie'], ['texto-2', 'superficie'], ['acento', 'superficie'], ['vial', 'superficie'],
  ['texto', 'superficie-2'], ['texto-2', 'superficie-2'],
  ['fondo', 'vial'], ['fondo', 'acento'],
];

describe('tokens', () => {
  it('define los 7 colores del manual de marca', () => {
    expect(tokens['marca-900']).toBe('#1E4870');
    expect(tokens['marca-700']).toBe('#2C688F');
    expect(tokens['marca-500']).toBe('#4A92BA');
    expect(tokens['marca-300']).toBe('#68BCE1');
    expect(tokens['gris-texto']).toBe('#5A6472');
    expect(tokens['gris-fondo']).toBe('#EEF1F4');
    expect(tokens['vial']).toBe('#F0C419');
  });
  it.each(pares)('%s sobre %s cumple AA (≥ 4.5)', (texto, fondo) => {
    expect(tokens[texto], `falta --color-${texto}`).toBeDefined();
    expect(tokens[fondo], `falta --color-${fondo}`).toBeDefined();
    expect(contraste(tokens[texto], tokens[fondo])).toBeGreaterThanOrEqual(4.5);
  });
});
```
Run: `pnpm test tests/styles`
Expected: PASS. (Sabido: `acento` sobre `superficie-2` da 4.4 y por eso NO está en la lista; no uses ese par para texto normal.)

- [ ] **Step 7: Enchufar el CSS y verificar**

En `src/pages/index.astro` agregá en el frontmatter `import '@/styles/global.css';` y a `<body>` la clase `bg-fondo text-texto`.
Run: `pnpm check && pnpm exec astro build && ls dist/_astro/*.css`
Expected: 0 errores; existe un `.css` en `dist/_astro/`. `grep -c "Archivo Variable" dist/_astro/*.css` → ≥ 1.

- [ ] **Step 8: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `feat(estilos): tokens de marca y semánticos, Archivo, base global`

---

### Task 3: El contrato de datos (esquemas, interfaz, capacidades, stub API)

**Files:**
- Create: `src/lib/datos/esquemas.ts`, `src/lib/datos/fuente.ts`, `src/lib/datos/capacidades.ts`, `src/lib/datos/fuentes/api.ts`, `tests/lib/datos/esquemas.test.ts`, `tests/lib/datos/api.test.ts`

**Interfaces:**
- Produces (todo desde `@/lib/datos/esquemas`): esquemas Zod `esquemaEmpresa`, `esquemaContacto`, `esquemaTramo`, `esquemaTarifario`, `esquemaObra`, `esquemaNovedadFrontmatter`, `esquemaPregunta`, `esquemaEstadoRuta` y tipos `Empresa`, `Contacto`, `Ruta`, `Ciudad`, `Cabina`, `Tramo`, `Tarifa`, `Tarifario`, `Obra`, `NovedadFrontmatter`, `Novedad`, `Pregunta`, `EstadoRuta`
- Produces: `interface FuenteDatos` (`@/lib/datos/fuente`), `capacidades` (`@/lib/datos/capacidades`), `fuenteApi: FuenteDatos` (`@/lib/datos/fuentes/api`)

- [ ] **Step 1: Tests de esquemas (fallan primero)**

`tests/lib/datos/esquemas.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { esquemaCabina, esquemaTarifario, esquemaContacto, esquemaEmpresa } from '@/lib/datos/esquemas';

describe('esquemaTarifario', () => {
  const base = {
    publicadoEl: '2026-08-27',
    vigencia: { desde: null, descripcion: 'A partir de la habilitación del cobro' },
    moneda: 'ARS',
    alicuotaIva: 0.21,
    origen: 'oferta',
    tarifas: [{ categoria: 'cat-2', nombre: 'Autos y camionetas', descripcion: '2 ejes, hasta 2,10 m', montoSinIva: 1399 }],
    fuente: { nombre: 'Resolución 1379/2026', url: 'https://www.boletinoficial.gob.ar/detalleAviso/primera/346271/20260824' },
    avisos: [],
  };
  it('acepta un tarifario válido', () => {
    expect(esquemaTarifario.parse(base).tarifas[0]?.montoSinIva).toBe(1399);
  });
  it('acepta montoSinIva null (a confirmar) pero no un string', () => {
    expect(() => esquemaTarifario.parse({ ...base, tarifas: [{ ...base.tarifas[0], montoSinIva: null }] })).not.toThrow();
    expect(() => esquemaTarifario.parse({ ...base, tarifas: [{ ...base.tarifas[0], montoSinIva: '$1.399' }] })).toThrow();
  });
  it('rechaza fechas que no sean YYYY-MM-DD', () => {
    expect(() => esquemaTarifario.parse({ ...base, publicadoEl: '27/08/2026' })).toThrow();
  });
});

describe('esquemaCabina', () => {
  it('exige slug, ruta conocida y estado', () => {
    expect(() => esquemaCabina.parse({ slug: 'totoras', nombre: 'Totoras', ruta: 'RN 34', km: 60, localidad: 'Totoras', provincia: 'Santa Fe', situacion: 'nueva', estado: 'confirmada', mapa: { x: 1, y: 2 } })).not.toThrow();
    expect(() => esquemaCabina.parse({ slug: 'x', nombre: 'X', ruta: 'RN 7', km: null, localidad: 'X', provincia: 'Córdoba', situacion: 'nueva', estado: 'confirmada', mapa: { x: 1, y: 2 } })).toThrow();
  });
});

describe('esquemaContacto', () => {
  it('admite todos los canales en null', () => {
    const c = esquemaContacto.parse({ emergencias: { telefono: null, etiqueta: 'Emergencias' }, whatsapp: { numero: null }, email: { general: null, rrhh: null, proveedores: null, etica: null }, redes: {} });
    expect(c.whatsapp.numero).toBeNull();
  });
  it('rechaza un WhatsApp con signos (debe ser E.164 sin +)', () => {
    expect(() => esquemaContacto.parse({ emergencias: { telefono: null, etiqueta: 'E' }, whatsapp: { numero: '+54 9 351' }, email: { general: null, rrhh: null, proveedores: null, etica: null }, redes: {} })).toThrow();
  });
});

describe('esquemaEmpresa', () => {
  it('exige inicioOperacion ISO y consorcio no vacío', () => {
    expect(() => esquemaEmpresa.parse({ marca: 'Covicen', descriptor: 'Corredor Vial del Centro', razonSocial: null, cuit: null, domicilioLegal: null, enFormacion: true, consorcio: [], concesion: { tramo: 'Centro', km: 681.92, rutas: ['RN 9'], provincias: ['Córdoba'], plazoAnios: 20, prorrogaAnios: 10, inicioOperacion: '2026-10-05', adjudicacion: { fecha: '2026-08-24', resolucion: 'R', url: 'https://x' }, tarifaOfertadaSinIva: 1399, tarifaTopeSinIva: 3200, tramosEtapa: 8 } })).toThrow();
  });
});
```
Run: `pnpm test tests/lib/datos/esquemas.test.ts`
Expected: FAIL — módulo inexistente.

- [ ] **Step 2: `src/lib/datos/esquemas.ts`**

```ts
// EL CONTRATO. Valida hoy el JSON del repo y mañana la respuesta de la API.
// Formas de dominio, no de pantalla: fechas ISO (YYYY-MM-DD), montos number en ARS sin IVA, ids = slugs.
import { z } from 'astro/zod';

export const fechaIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'fecha en formato YYYY-MM-DD');
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug en minúsculas con guiones');
export const url = z.string().url();

export const RUTAS = ['RN 9', 'RN 19', 'RN 34'] as const;
export const esquemaNombreRuta = z.enum(RUTAS);

export const esquemaEmpresa = z.object({
  marca: z.literal('Covicen'),
  descriptor: z.string().min(1),
  razonSocial: z.string().min(1).nullable(),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d$/).nullable(),
  domicilioLegal: z.string().min(1).nullable(),
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
    tarifaOfertadaSinIva: z.number().positive(),
    tarifaTopeSinIva: z.number().positive(),
    tramosEtapa: z.number().int().positive(),
  }),
});
export type Empresa = z.infer<typeof esquemaEmpresa>;

export const esquemaContacto = z.object({
  emergencias: z.object({ telefono: z.string().regex(/^[0-9+\- ]{6,20}$/).nullable(), etiqueta: z.string().min(1) }),
  /** E.164 sin '+', ej. 5493510000000 → wa.me/5493510000000 */
  whatsapp: z.object({ numero: z.string().regex(/^\d{10,15}$/).nullable() }),
  email: z.object({
    general: z.string().email().nullable(),
    rrhh: z.string().email().nullable(),
    proveedores: z.string().email().nullable(),
    etica: z.string().email().nullable(),
  }),
  redes: z.object({ instagram: url.optional(), x: url.optional(), linkedin: url.optional() }),
});
export type Contacto = z.infer<typeof esquemaContacto>;

export const esquemaRuta = z.object({
  nombre: esquemaNombreRuta,
  descripcion: z.string().min(1),
  desde: z.string().min(1),
  hasta: z.string().min(1),
  km: z.number().positive().nullable(),
  nota: z.string().optional(),
});
export type Ruta = z.infer<typeof esquemaRuta>;

/** Coordenadas dentro del SVG propio del mapa (viewBox 0 0 820 500), no geográficas. */
const puntoMapa = z.object({ x: z.number(), y: z.number() });

export const esquemaCiudad = z.object({ slug, nombre: z.string().min(1), provincia: z.string().min(1), mapa: puntoMapa, principal: z.boolean().default(false) });
export type Ciudad = z.infer<typeof esquemaCiudad>;

export const esquemaCabina = z.object({
  slug,
  nombre: z.string().min(1),
  ruta: esquemaNombreRuta,
  km: z.number().nonnegative().nullable(),
  localidad: z.string().min(1),
  provincia: z.string().min(1),
  situacion: z.enum(['existente', 'nueva']),
  estado: z.enum(['confirmada', 'a-confirmar']),
  mapa: puntoMapa,
  fuente: z.object({ nombre: z.string().min(1), url }).optional(),
});
export type Cabina = z.infer<typeof esquemaCabina>;

export const esquemaTramo = z.object({
  km: z.number().positive(),
  rutas: z.array(esquemaRuta).min(1),
  provincias: z.array(z.string().min(1)).min(1),
  ciudades: z.array(esquemaCiudad).min(1),
  cabinas: z.array(esquemaCabina),
  /** Trazado de cada ruta como lista de slugs de ciudad, en orden, para dibujar el mapa. */
  trazados: z.array(z.object({ ruta: esquemaNombreRuta, ciudades: z.array(slug).min(2) })),
  avisos: z.array(z.string()),
});
export type Tramo = z.infer<typeof esquemaTramo>;

export const esquemaTarifa = z.object({
  categoria: slug,
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  montoSinIva: z.number().positive().nullable(),
  nota: z.string().optional(),
});
export type Tarifa = z.infer<typeof esquemaTarifa>;

export const esquemaTarifario = z.object({
  publicadoEl: fechaIso,
  vigencia: z.object({ desde: fechaIso.nullable(), descripcion: z.string().min(1) }),
  moneda: z.literal('ARS'),
  alicuotaIva: z.number().min(0).max(1),
  origen: z.enum(['oferta', 'homologada']),
  tarifas: z.array(esquemaTarifa).min(1),
  fuente: z.object({ nombre: z.string().min(1), url }),
  avisos: z.array(z.string()),
});
export type Tarifario = z.infer<typeof esquemaTarifario>;

export const esquemaObra = z.object({
  slug,
  titulo: z.string().min(1),
  ruta: z.union([esquemaNombreRuta, z.literal('Todo el tramo')]),
  tramo: z.string().optional(),
  tipo: z.string().min(1),
  estado: z.enum(['planificada', 'en-ejecucion', 'terminada']),
  avance: z.number().min(0).max(100).nullable(),
  inicio: fechaIso.optional(),
  finEstimado: fechaIso.optional(),
  descripcion: z.string().min(1),
  orden: z.number().int(),
});
export type Obra = z.infer<typeof esquemaObra>;

export const esquemaNovedadFrontmatter = z.object({
  titulo: z.string().min(1),
  fecha: fechaIso,
  resumen: z.string().min(1),
  etiquetas: z.array(z.string().min(1)).default([]),
  destacada: z.boolean().default(false),
});
export type NovedadFrontmatter = z.infer<typeof esquemaNovedadFrontmatter>;
export type Novedad = NovedadFrontmatter & { slug: string };

export const esquemaPregunta = z.object({
  slug,
  pregunta: z.string().min(1),
  respuesta: z.string().min(1),
  tema: z.enum(['general', 'tarifas', 'peajes', 'pago', 'servicios', 'empresa']),
  orden: z.number().int(),
  enHome: z.boolean().default(false),
});
export type Pregunta = z.infer<typeof esquemaPregunta>;

export const esquemaEstadoRuta = z.object({
  disponible: z.boolean(),
  actualizado: z.string().datetime().optional(),
  incidentes: z.array(z.object({ ruta: esquemaNombreRuta, km: z.number().nullable(), descripcion: z.string(), severidad: z.enum(['info', 'precaucion', 'corte']) })).optional(),
});
export type EstadoRuta = z.infer<typeof esquemaEstadoRuta>;
```
Run: `pnpm test tests/lib/datos/esquemas.test.ts`
Expected: PASS (7).

- [ ] **Step 3: `src/lib/datos/fuente.ts` y `capacidades.ts`**

`src/lib/datos/fuente.ts`:
```ts
import type { Contacto, Empresa, EstadoRuta, Novedad, Obra, Pregunta, Tarifario, Tramo } from './esquemas';

/** Async desde el día 1: hoy se resuelve en build; mañana una isla lo consume en runtime. */
export interface FuenteDatos {
  empresa(): Promise<Empresa>;
  contacto(): Promise<Contacto>;
  tramo(): Promise<Tramo>;
  tarifario(): Promise<Tarifario>;
  obras(): Promise<Obra[]>;
  novedades(): Promise<Novedad[]>;
  novedad(slug: string): Promise<Novedad | null>;
  faq(): Promise<Pregunta[]>;
  estadoRutas(): Promise<EstadoRuta>;
}
```

`src/lib/datos/capacidades.ts`:
```ts
/** Lo que depende de sistemas que hoy no existen. Encender = true + implementar en fuentes/api.ts. */
export const capacidades = {
  estadoRutasEnVivo: false,
  oficinaVirtual: false,
  ticketingReclamos: false,
  portalProveedores: false,
  canalEticoAnonimo: false,
} as const;
export type Capacidad = keyof typeof capacidades;
```

- [ ] **Step 4: Test del stub API (falla primero)**

`tests/lib/datos/api.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { fuenteApi } from '@/lib/datos/fuentes/api';

describe('fuenteApi', () => {
  it('no está implementada en v1 y lo dice sin mockear nada', async () => {
    await expect(fuenteApi.tarifario()).rejects.toThrow(/FuenteApi: no implementado/);
    await expect(fuenteApi.estadoRutas()).rejects.toThrow(/FuenteApi: no implementado/);
  });
});
```
Run: `pnpm test tests/lib/datos/api.test.ts` → FAIL.

- [ ] **Step 5: `src/lib/datos/fuentes/api.ts`**

```ts
import type { FuenteDatos } from '../fuente';

// Acá va Django. Cada método hará fetch + esquemaX.parse(...) contra el contrato de esquemas.ts.
// No es un mock: lanza. Si alguien lo selecciona por error, el build rompe con un mensaje claro.
const noImplementado = (metodo: string) => async (): Promise<never> => {
  throw new Error(`FuenteApi: no implementado (${metodo}). Usá FUENTE_DATOS=local.`);
};

export const fuenteApi: FuenteDatos = {
  empresa: noImplementado('empresa'),
  contacto: noImplementado('contacto'),
  tramo: noImplementado('tramo'),
  tarifario: noImplementado('tarifario'),
  obras: noImplementado('obras'),
  novedades: noImplementado('novedades'),
  novedad: noImplementado('novedad'),
  faq: noImplementado('faq'),
  estadoRutas: noImplementado('estadoRutas'),
};
```
Run: `pnpm test tests/lib/datos` → PASS.

- [ ] **Step 6: Checkpoint**

```bash
pnpm check && git add -A && git status --short
```
Commit (si autorizado): `feat(datos): contrato Zod, interfaz FuenteDatos, capacidades y stub de API`

---

### Task 4: Contenido versionado + fuente local + `datos`

**Files:**
- Create: `src/content/empresa.json`, `src/content/contacto.json`, `src/content/tramo.json`, `src/content/tarifario.json`, `src/content/obras/{01-plan-de-contingencia,02-rehabilitacion-de-pavimento,03-senalizacion-e-iluminacion,04-cobro-electronico}.json`, `src/content/faq/*.json` (13 archivos), `src/lib/datos/fuentes/local-json.ts`, `src/lib/datos/fuentes/local-novedades.ts`, `src/lib/datos/index.ts`, `src/content.config.ts`, `tests/lib/datos/local-json.test.ts`
- Nota: las novedades en Markdown se crean en la Task 13; `local-novedades.ts` queda listo y devuelve `[]` si la colección está vacía.

**Interfaces:**
- Consumes: esquemas y `FuenteDatos` de la Task 3.
- Produces: `fuenteLocalJson` (`@/lib/datos/fuentes/local-json`) con todos los métodos de `FuenteDatos` salvo `novedades`/`novedad`; `datos: FuenteDatos` (`@/lib/datos`). `datos` **nunca importa `astro:content` de forma estática** (lo hace con `import()` solo en `novedades()`), así que se puede importar en tests de Vitest.

- [ ] **Step 1: Test del contenido real (falla primero)**

`tests/lib/datos/local-json.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('contenido del repo', () => {
  it('empresa: datos verificables de la adjudicación', async () => {
    const e = await fuenteLocalJson.empresa();
    expect(e.concesion.km).toBe(681.92);
    expect(e.concesion.rutas).toEqual(['RN 9', 'RN 19', 'RN 34']);
    expect(e.concesion.inicioOperacion).toBe('2026-10-05');
    expect(e.concesion.tarifaOfertadaSinIva).toBe(1399);
    expect(e.enFormacion).toBe(true);
    expect(e.cuit).toBeNull();
    expect(e.consorcio.map((c) => c.nombre)).toEqual(['AFEMA S.A.', 'Pablo Federico e Hijos S.A.', 'Guido Mogetta S.A.']);
  });
  it('tramo: seis cabinas confirmadas por fuentes públicas y trazados que referencian ciudades existentes', async () => {
    const t = await fuenteLocalJson.tramo();
    expect(t.cabinas.map((c) => c.slug).sort()).toEqual(['carcarana', 'franck', 'james-craik', 'leones', 'san-francisco', 'totoras']);
    const slugs = new Set(t.ciudades.map((c) => c.slug));
    for (const tr of t.trazados) for (const s of tr.ciudades) expect(slugs.has(s), `ciudad ${s} no existe`).toBe(true);
    for (const c of t.cabinas) expect(c.fuente?.url).toMatch(/^https:\/\//);
  });
  it('tarifario: solo la categoría auto tiene valor; el resto es null (a confirmar)', async () => {
    const t = await fuenteLocalJson.tarifario();
    expect(t.origen).toBe('oferta');
    expect(t.tarifas.find((x) => x.categoria === 'cat-2')?.montoSinIva).toBe(1399);
    expect(t.tarifas.filter((x) => x.montoSinIva !== null)).toHaveLength(1);
    expect(t.vigencia.descripcion.length).toBeGreaterThan(10);
  });
  it('obras y faq: ordenadas y con slugs únicos', async () => {
    const obras = await fuenteLocalJson.obras();
    expect(obras.map((o) => o.orden)).toEqual([...obras.map((o) => o.orden)].sort((a, b) => a - b));
    const faq = await fuenteLocalJson.faq();
    expect(new Set(faq.map((p) => p.slug)).size).toBe(faq.length);
    expect(faq.filter((p) => p.enHome).length).toBeGreaterThanOrEqual(4);
  });
  it('estadoRutas: no disponible en v1', async () => {
    expect((await fuenteLocalJson.estadoRutas()).disponible).toBe(false);
  });
});
```
Run: `pnpm test tests/lib/datos/local-json.test.ts` → FAIL.

- [ ] **Step 2: `src/content/empresa.json`**

```json
{
  "marca": "Covicen",
  "descriptor": "Corredor Vial del Centro",
  "razonSocial": null,
  "cuit": null,
  "domicilioLegal": null,
  "enFormacion": true,
  "consorcio": [
    { "nombre": "AFEMA S.A.", "descripcion": "Constructora vial con base en Córdoba." },
    { "nombre": "Pablo Federico e Hijos S.A.", "descripcion": "Construcción y obras de hormigón, 25 años de trayectoria." },
    { "nombre": "Guido Mogetta S.A.", "descripcion": "Construcción, obra pública, transporte y minería." }
  ],
  "concesion": {
    "tramo": "Centro",
    "km": 681.92,
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

- [ ] **Step 3: `src/content/contacto.json`**

```json
{
  "emergencias": { "telefono": null, "etiqueta": "Emergencias en ruta" },
  "whatsapp": { "numero": null },
  "email": { "general": null, "rrhh": null, "proveedores": null, "etica": null },
  "redes": {}
}
```

- [ ] **Step 4: `src/content/tramo.json`**

Coordenadas `mapa` = posición en el SVG propio (viewBox `0 0 820 520`), derivadas de lat/lon con escala 190 px/° de longitud y 230 px/° de latitud, origen (-64.5°, -31.1°), más 40 px de margen. No son geográficas exactas: es un mapa esquemático.

```json
{
  "km": 681.92,
  "provincias": ["Córdoba", "Santa Fe"],
  "rutas": [
    { "nombre": "RN 9", "descripcion": "Autopista Rosario–Córdoba", "desde": "Rosario (Circunvalación, viaducto Che Guevara)", "hasta": "Pilar (Córdoba), inicio de la Red de Accesos a Córdoba", "km": 363 },
    { "nombre": "RN 19", "descripcion": "Santa Fe – San Francisco", "desde": "Santa Fe", "hasta": "San Francisco (Córdoba)", "km": 130, "nota": "Extremos exactos del tramo concesionado a confirmar contra el contrato." },
    { "nombre": "RN 34", "descripcion": "Rosario – Rafaela", "desde": "Empalme con RN 9 (Rosario)", "hasta": "Rafaela", "km": 188, "nota": "Extremos exactos del tramo concesionado a confirmar contra el contrato." }
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
    { "slug": "rafaela", "nombre": "Rafaela", "provincia": "Santa Fe", "mapa": { "x": 612, "y": 74 }, "principal": true },
    { "slug": "franck", "nombre": "Franck", "provincia": "Santa Fe", "mapa": { "x": 715, "y": 150 } },
    { "slug": "santa-fe", "nombre": "Santa Fe", "provincia": "Santa Fe", "mapa": { "x": 762, "y": 162 }, "principal": true },
    { "slug": "totoras", "nombre": "Totoras", "provincia": "Santa Fe", "mapa": { "x": 673, "y": 380 } }
  ],
  "trazados": [
    { "ruta": "RN 9", "ciudades": ["rosario", "carcarana", "leones", "villa-maria", "james-craik", "pilar", "cordoba"] },
    { "ruta": "RN 19", "ciudades": ["santa-fe", "franck", "san-francisco"] },
    { "ruta": "RN 34", "ciudades": ["rosario", "totoras", "rafaela"] }
  ],
  "cabinas": [
    { "slug": "carcarana", "nombre": "Carcarañá", "ruta": "RN 9", "km": null, "localidad": "Carcarañá", "provincia": "Santa Fe", "situacion": "existente", "estado": "confirmada", "mapa": { "x": 677, "y": 445 }, "fuente": { "nombre": "El Litoral, 25/08/2026", "url": "https://www.ellitoral.com/politica/peajes-santafe-rutanacional11-vialidadnacional-tramocentro-llambicampbell-rutanacional34-totoras-chacosantafe-resolucion1379-franck-vera-rutanacional9_0_g0HSrixqTt.html" } },
    { "slug": "james-craik", "nombre": "James Craik", "ruta": "RN 9", "km": null, "localidad": "James Craik", "provincia": "Córdoba", "situacion": "existente", "estado": "confirmada", "mapa": { "x": 238, "y": 284 }, "fuente": { "nombre": "La Capital, 24/08/2026", "url": "https://www.lacapital.com.ar/la-ciudad/un-grupo-cordobes-cobrara-el-peaje-la-autopista-rosario-cordoba-n10277073.html" } },
    { "slug": "leones", "nombre": "Leones", "ruta": "RN 9", "km": null, "localidad": "Leones", "provincia": "Córdoba", "situacion": "nueva", "estado": "confirmada", "mapa": { "x": 458, "y": 399 }, "fuente": { "nombre": "La Capital", "url": "https://www.lacapital.com.ar/la-autopista-cordoba-sumara-otro-peaje-la-altura-leones-n10260956.html" } },
    { "slug": "franck", "nombre": "Franck", "ruta": "RN 19", "km": null, "localidad": "Franck", "provincia": "Santa Fe", "situacion": "existente", "estado": "confirmada", "mapa": { "x": 715, "y": 150 }, "fuente": { "nombre": "El Litoral, 25/08/2026", "url": "https://www.ellitoral.com/politica/peajes-santafe-rutanacional11-vialidadnacional-tramocentro-llambicampbell-rutanacional34-totoras-chacosantafe-resolucion1379-franck-vera-rutanacional9_0_g0HSrixqTt.html" } },
    { "slug": "san-francisco", "nombre": "San Francisco", "ruta": "RN 19", "km": 120, "localidad": "San Francisco", "provincia": "Córdoba", "situacion": "nueva", "estado": "confirmada", "mapa": { "x": 500, "y": 116 }, "fuente": { "nombre": "El Litoral, 25/08/2026", "url": "https://www.ellitoral.com/politica/peajes-santafe-rutanacional11-vialidadnacional-tramocentro-llambicampbell-rutanacional34-totoras-chacosantafe-resolucion1379-franck-vera-rutanacional9_0_g0HSrixqTt.html" } },
    { "slug": "totoras", "nombre": "Totoras", "ruta": "RN 34", "km": 60, "localidad": "Totoras", "provincia": "Santa Fe", "situacion": "nueva", "estado": "confirmada", "mapa": { "x": 673, "y": 380 }, "fuente": { "nombre": "El Litoral, 25/08/2026", "url": "https://www.ellitoral.com/politica/peajes-santafe-rutanacional11-vialidadnacional-tramocentro-llambicampbell-rutanacional34-totoras-chacosantafe-resolucion1379-franck-vera-rutanacional9_0_g0HSrixqTt.html" } }
  ],
  "avisos": [
    "Las ubicaciones surgen de la Resolución 1379/2026 y de la cobertura de prensa. La habilitación de cada estación la define Vialidad Nacional.",
    "La estación San Vicente (RN 34) deja de operar con el inicio de la concesión."
  ]
}
```

- [ ] **Step 5: `src/content/tarifario.json`**

```json
{
  "publicadoEl": "2026-08-27",
  "vigencia": {
    "desde": null,
    "descripcion": "A partir de la habilitación del cobro por Vialidad Nacional. La tarifa ofertada no se aplica hasta alcanzar las condiciones de transitabilidad óptima que exige el contrato."
  },
  "moneda": "ARS",
  "alicuotaIva": 0.21,
  "origen": "oferta",
  "tarifas": [
    { "categoria": "cat-1", "nombre": "Motos", "descripcion": "Motocicletas y ciclomotores.", "montoSinIva": null },
    { "categoria": "cat-2", "nombre": "Autos y camionetas", "descripcion": "Vehículos de 2 ejes y hasta 2,10 m de altura.", "montoSinIva": 1399, "nota": "Tarifa ofertada en la adjudicación (Res. 1379/2026)." },
    { "categoria": "cat-3", "nombre": "Autos con remolque y vehículos de 2 ejes de más de 2,10 m", "descripcion": "Autos y camionetas con remolque o acoplado; camiones y ómnibus de 2 ejes.", "montoSinIva": null },
    { "categoria": "cat-4", "nombre": "Camiones y ómnibus de 3 y 4 ejes", "descripcion": "Vehículos pesados de 3 o 4 ejes.", "montoSinIva": null },
    { "categoria": "cat-5", "nombre": "Camiones de 5 y 6 ejes", "descripcion": "Vehículos pesados de 5 o 6 ejes.", "montoSinIva": null },
    { "categoria": "cat-6", "nombre": "Camiones de 7 o más ejes", "descripcion": "Vehículos pesados de 7 ejes o más.", "montoSinIva": null }
  ],
  "fuente": {
    "nombre": "Resolución 1379/2026 — Boletín Oficial",
    "url": "https://www.boletinoficial.gob.ar/detalleAviso/primera/346271/20260824"
  },
  "avisos": [
    "Las categorías son las de referencia habitual en la red nacional; el cuadro tarifario definitivo lo homologa Vialidad Nacional.",
    "Los valores sin dato se publican cuando exista el cuadro homologado. No publicamos estimaciones.",
    "La tarifa se actualiza por índices oficiales según el contrato de concesión."
  ]
}
```

- [ ] **Step 6: Obras (`src/content/obras/`)**

`01-plan-de-contingencia.json`:
```json
{ "slug": "plan-de-contingencia", "titulo": "Plan de contingencia inicial", "ruta": "Todo el tramo", "tipo": "Puesta en condiciones", "estado": "planificada", "avance": null, "orden": 1,
  "descripcion": "Primera etapa del contrato: atender los sectores más deteriorados de la calzada, banquinas y drenajes para garantizar la transitabilidad segura mientras avanzan las obras de fondo." }
```
`02-rehabilitacion-de-pavimento.json`:
```json
{ "slug": "rehabilitacion-de-pavimento", "titulo": "Rehabilitación de pavimento", "ruta": "Todo el tramo", "tipo": "Obra vial", "estado": "planificada", "avance": null, "orden": 2,
  "descripcion": "Recuperación de los sectores con pavimento deteriorado en RN 9, RN 19 y RN 34. Es la condición para alcanzar la transitabilidad óptima que exige el contrato antes de aplicar la tarifa plena." }
```
`03-senalizacion-e-iluminacion.json`:
```json
{ "slug": "senalizacion-e-iluminacion", "titulo": "Señalización, iluminación y seguridad", "ruta": "Todo el tramo", "tipo": "Seguridad vial", "estado": "planificada", "avance": null, "orden": 3,
  "descripcion": "Renovación de señalización horizontal y vertical, iluminación en accesos y mejoras de seguridad en intersecciones, más el sistema de auxilio y asistencia en ruta." }
```
`04-cobro-electronico.json`:
```json
{ "slug": "cobro-electronico", "titulo": "Cobro electrónico: TelePASE y Free Flow", "ruta": "Todo el tramo", "tipo": "Tecnología", "estado": "planificada", "avance": null, "orden": 4,
  "descripcion": "Incorporación progresiva de cobro sin detención: TelePASE en todas las estaciones y modalidad Free Flow (sin barreras) en las nuevas, según lo exige el contrato." }
```

- [ ] **Step 7: FAQ (`src/content/faq/`)** — un archivo por pregunta, nombre `NN-slug.json`

```json
{ "slug": "que-es-covicen", "tema": "general", "orden": 1, "enHome": true, "pregunta": "¿Qué es Covicen?",
  "respuesta": "Covicen es la concesionaria del Tramo Centro de la Red Federal de Concesiones: 681,92 km de rutas nacionales (RN 9, RN 19 y RN 34) en Córdoba y Santa Fe. La concesión fue adjudicada el 24 de agosto de 2026 por la Resolución 1379/2026 al consorcio integrado por AFEMA S.A., Pablo Federico e Hijos S.A. y Guido Mogetta S.A." }
```
```json
{ "slug": "desde-cuando-opera", "tema": "general", "orden": 2, "enHome": true, "pregunta": "¿Desde cuándo opera Covicen?",
  "respuesta": "La operación del Tramo Centro comienza el 5 de octubre de 2026. La concesión es por 20 años." }
```
```json
{ "slug": "cuanto-cuesta-el-peaje", "tema": "tarifas", "orden": 3, "enHome": true, "pregunta": "¿Cuánto cuesta el peaje?",
  "respuesta": "La tarifa ofertada en la adjudicación es de $1.399 más IVA por auto, la más baja de los ocho tramos de la Etapa III. Consultá el tarifario para ver el detalle por categoría y la vigencia." }
```
```json
{ "slug": "por-que-la-tarifa-mas-baja", "tema": "tarifas", "orden": 4, "enHome": false, "pregunta": "¿Por qué la tarifa de Covicen es la más baja?",
  "respuesta": "En la Red Federal de Concesiones cada tramo se adjudica a quien ofrece la menor tarifa de peaje, sin subsidios del Estado. Covicen ofertó $1.399 más IVA frente a un tope de $3.200 y fue la oferta más baja de los ocho tramos." }
```
```json
{ "slug": "desde-cuando-se-cobra", "tema": "tarifas", "orden": 5, "enHome": true, "pregunta": "¿Desde cuándo se cobra la tarifa?",
  "respuesta": "El contrato no permite cobrar la tarifa ofertada hasta alcanzar las condiciones de transitabilidad óptima, verificadas por Vialidad Nacional. Primero las obras; después el peaje pleno. La fecha de habilitación se publica en este sitio." }
```
```json
{ "slug": "donde-estan-los-peajes", "tema": "peajes", "orden": 6, "enHome": true, "pregunta": "¿Dónde están los peajes del Tramo Centro?",
  "respuesta": "En RN 9: Carcarañá, James Craik y una estación nueva en Leones. En RN 19: Franck y una estación nueva en San Francisco (km 120). En RN 34: una estación nueva en Totoras (km 60). La estación San Vicente (RN 34) deja de operar." }
```
```json
{ "slug": "telepase", "tema": "pago", "orden": 7, "enHome": false, "pregunta": "¿Puedo pagar con TelePASE? ¿Es obligatorio?",
  "respuesta": "Sí: el dispositivo TelePASE es único para toda la red nacional y va a funcionar en las estaciones del Tramo Centro. No es obligatorio para circular; también se puede pagar en efectivo en las estaciones con cabina." }
```
```json
{ "slug": "free-flow", "tema": "pago", "orden": 8, "enHome": false, "pregunta": "¿Qué es el Free Flow?",
  "respuesta": "Es el cobro sin barreras: pórticos con lectores que identifican el vehículo sin que se detenga. Las estaciones nuevas del tramo se construyen con esta modalidad, según exige el contrato." }
```
```json
{ "slug": "desperfecto-en-ruta", "tema": "servicios", "orden": 9, "enHome": false, "pregunta": "¿Qué hago si tengo un desperfecto en la ruta?",
  "respuesta": "Detenete en la banquina con balizas encendidas y llamá al número de emergencias de Covicen, visible en todas las páginas de este sitio. El servicio de auxilio y asistencia en ruta forma parte de las obligaciones del contrato." }
```
```json
{ "slug": "como-hago-un-reclamo", "tema": "servicios", "orden": 10, "enHome": false, "pregunta": "¿Cómo hago un reclamo o una consulta?",
  "respuesta": "Desde la página de contacto: el formulario arma un mensaje de WhatsApp con tus datos y el motivo. Vialidad Nacional supervisa la concesión con indicadores de servicio, así que cada reclamo cuenta." }
```
```json
{ "slug": "quien-controla", "tema": "empresa", "orden": 11, "enHome": false, "pregunta": "¿Quién controla a Covicen?",
  "respuesta": "La Dirección Nacional de Vialidad supervisa la concesión con indicadores objetivos de desempeño y niveles de servicio. La inversión es 100% privada, sin subsidios del Estado." }
```
```json
{ "slug": "peajes-existentes", "tema": "peajes", "orden": 12, "enHome": false, "pregunta": "¿Qué pasa con los peajes que ya existían?",
  "respuesta": "Carcarañá y James Craik (RN 9) y Franck (RN 19) siguen operando bajo la nueva concesión. San Vicente (RN 34) deja de operar cuando Covicen toma posesión del tramo." }
```
```json
{ "slug": "trabajar-o-proveer", "tema": "empresa", "orden": 13, "enHome": false, "pregunta": "¿Cómo puedo trabajar con Covicen o ser proveedor?",
  "respuesta": "En Trabajá con nosotros podés enviarnos tu perfil. El portal de proveedores está en preparación; mientras tanto, escribinos desde Contacto indicando el rubro." }
```

- [ ] **Step 8: `src/lib/datos/fuentes/local-json.ts`**

```ts
// Fuente v1: JSON del repo, validado contra el contrato. Sin `astro:content` (eso vive en local-novedades.ts).
import empresaJson from '@/content/empresa.json';
import contactoJson from '@/content/contacto.json';
import tramoJson from '@/content/tramo.json';
import tarifarioJson from '@/content/tarifario.json';
import {
  esquemaContacto, esquemaEmpresa, esquemaEstadoRuta, esquemaObra, esquemaPregunta, esquemaTarifario, esquemaTramo,
  type Contacto, type Empresa, type EstadoRuta, type Obra, type Pregunta, type Tarifario, type Tramo,
} from '../esquemas';
import type { FuenteDatos } from '../fuente';

const obrasJson = import.meta.glob('@/content/obras/*.json', { eager: true, import: 'default' });
const faqJson = import.meta.glob('@/content/faq/*.json', { eager: true, import: 'default' });

const parsearTodos = <T>(archivos: Record<string, unknown>, parsear: (x: unknown, origen: string) => T): T[] =>
  Object.entries(archivos).map(([ruta, contenido]) => parsear(contenido, ruta));

export const fuenteLocalJson: Omit<FuenteDatos, 'novedades' | 'novedad'> = {
  empresa: async (): Promise<Empresa> => esquemaEmpresa.parse(empresaJson),
  contacto: async (): Promise<Contacto> => esquemaContacto.parse(contactoJson),
  tramo: async (): Promise<Tramo> => esquemaTramo.parse(tramoJson),
  tarifario: async (): Promise<Tarifario> => esquemaTarifario.parse(tarifarioJson),
  obras: async (): Promise<Obra[]> =>
    parsearTodos(obrasJson, (x, origen) => {
      const r = esquemaObra.safeParse(x);
      if (!r.success) throw new Error(`Obra inválida en ${origen}: ${r.error.message}`);
      return r.data;
    }).sort((a, b) => a.orden - b.orden),
  faq: async (): Promise<Pregunta[]> =>
    parsearTodos(faqJson, (x, origen) => {
      const r = esquemaPregunta.safeParse(x);
      if (!r.success) throw new Error(`Pregunta inválida en ${origen}: ${r.error.message}`);
      return r.data;
    }).sort((a, b) => a.orden - b.orden),
  // v1: no hay sistema de estado de rutas. El slot del layout lee esto y muestra el hueco.
  estadoRutas: async (): Promise<EstadoRuta> => esquemaEstadoRuta.parse({ disponible: false }),
};
```
`resolveJsonModule` ya viene en la config estricta de Astro. Si `@/content/...` no resuelve dentro de `import.meta.glob`, usá la ruta relativa `../../../content/obras/*.json`.

Run: `pnpm test tests/lib/datos/local-json.test.ts` → PASS (5).

- [ ] **Step 9: Colección `novedades` y `local-novedades.ts`**

`src/content.config.ts`:
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { esquemaNovedadFrontmatter } from '@/lib/datos/esquemas';

const novedades = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/novedades' }),
  schema: esquemaNovedadFrontmatter,
});

export const collections = { novedades };
```
Creá la carpeta vacía: `mkdir -p src/content/novedades && touch src/content/novedades/.gitkeep`.

`src/lib/datos/fuentes/local-novedades.ts`:
```ts
import { getCollection, getEntry } from 'astro:content';
import type { Novedad } from '../esquemas';

const aNovedad = (entrada: { id: string; data: Omit<Novedad, 'slug'> }): Novedad => ({ slug: entrada.id, ...entrada.data });

export const novedadesLocal = async (): Promise<Novedad[]> =>
  (await getCollection('novedades')).map(aNovedad).sort((a, b) => b.fecha.localeCompare(a.fecha));

export const novedadLocal = async (slug: string): Promise<Novedad | null> => {
  const entrada = await getEntry('novedades', slug);
  return entrada ? aNovedad(entrada) : null;
};
```

- [ ] **Step 10: `src/lib/datos/index.ts`**

```ts
// Punto de entrada único. Los componentes importan `datos` de acá y de ningún otro lado.
import { config } from '@/lib/config';
import type { FuenteDatos } from './fuente';
import { fuenteApi } from './fuentes/api';
import { fuenteLocalJson } from './fuentes/local-json';

// `astro:content` se importa de forma diferida para que `datos` sea importable en Vitest
// y para que ninguna página pague ese módulo si no lista novedades.
const fuenteLocal: FuenteDatos = {
  ...fuenteLocalJson,
  novedades: async () => (await import('./fuentes/local-novedades')).novedadesLocal(),
  novedad: async (slug) => (await import('./fuentes/local-novedades')).novedadLocal(slug),
};

export const datos: FuenteDatos = config.fuenteDatos === 'api' ? fuenteApi : fuenteLocal;
export { capacidades } from './capacidades';
export type * from './esquemas';
```
Run: `pnpm check && pnpm test && pnpm exec astro build`
Expected: todo en verde (la colección vacía no rompe el build).

- [ ] **Step 11: Checkpoint**

```bash
git add -A && git status --short | head -40
```
Commit (si autorizado): `feat(contenido): datos verificados del Tramo Centro y fuente local`

---

### Task 5: Utilidades puras: formato, rutas, WhatsApp, JSON-LD

**Files:**
- Create: `src/lib/formato.ts`, `src/lib/rutas.ts`, `src/lib/whatsapp.ts`, `src/lib/seo.ts`, `tests/lib/formato.test.ts`, `tests/lib/rutas.test.ts`, `tests/lib/whatsapp.test.ts`, `tests/lib/seo.test.ts`

**Interfaces:**
- Produces `@/lib/formato`: `moneda(n: number): string` → `"$ 1.399"`; `conIva(monto: number, alicuota: number): number` (redondeado); `fechaLarga(iso: string): string` → `"5 de octubre de 2026"`; `fechaCorta(iso: string): string` → `"05/10/2026"`; `numero(n: number, decimales?: number): string` → `"681,92"`
- Produces `@/lib/rutas`: `ruta(path: string, base?: string): string`; `absoluta(path: string): string`
- Produces `@/lib/whatsapp`: `enlaceWhatsapp(numero: string, texto: string): string`; `mensajeContacto(asunto: string, campos: Record<string, string>): string`
- Produces `@/lib/seo`: `jsonLdOrganizacion(e: Empresa, c: Contacto, sitio: string, logoUrl: string)`, `jsonLdSitioWeb(sitio: string)`, `jsonLdFaq(preguntas: Pregunta[])`, `jsonLdMigas(migas: {nombre: string; url: string}[])`, `jsonLdArticulo(n: Novedad, url: string, sitio: string)` — todos devuelven `Record<string, unknown>`

- [ ] **Step 1: Tests (fallan primero)**

`tests/lib/formato.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { conIva, fechaCorta, fechaLarga, moneda, numero } from '@/lib/formato';

const sinNbsp = (s: string) => s.replace(/[  ]/g, ' ');

describe('formato es-AR', () => {
  it('moneda sin decimales con punto de miles', () => expect(sinNbsp(moneda(1399))).toBe('$ 1.399'));
  it('conIva redondea al peso', () => expect(conIva(1399, 0.21)).toBe(1693));
  it('fechaLarga no corre un día por zona horaria', () => expect(fechaLarga('2026-10-05')).toBe('5 de octubre de 2026'));
  it('fechaCorta', () => expect(fechaCorta('2026-10-05')).toBe('05/10/2026'));
  it('numero con coma decimal', () => expect(numero(681.92, 2)).toBe('681,92'));
});
```

`tests/lib/rutas.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { absoluta, ruta } from '@/lib/rutas';

describe('ruta', () => {
  it('agrega barra final a las páginas', () => expect(ruta('/tarifas')).toBe('/tarifas/'));
  it('respeta la raíz', () => expect(ruta('/')).toBe('/'));
  it('no agrega barra a archivos', () => expect(ruta('/og.png')).toBe('/og.png'));
  it('conserva anclas', () => expect(ruta('/politicas#anticorrupcion')).toBe('/politicas/#anticorrupcion'));
  it('antepone la base', () => {
    expect(ruta('/tarifas', '/covicen/')).toBe('/covicen/tarifas/');
    expect(ruta('/', '/covicen/')).toBe('/covicen/');
  });
});
describe('absoluta', () => {
  it('usa el origen configurado', () => expect(absoluta('/tarifas')).toBe('https://covicen.test/tarifas/'));
});
```

`tests/lib/whatsapp.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { enlaceWhatsapp, mensajeContacto } from '@/lib/whatsapp';

describe('whatsapp', () => {
  it('arma el link wa.me con el texto codificado', () => {
    expect(enlaceWhatsapp('5493510000000', 'Hola, ¿qué tal?')).toBe('https://wa.me/5493510000000?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F');
  });
  it('mensajeContacto lista asunto y campos, ignora vacíos', () => {
    expect(mensajeContacto('Reclamo', { Nombre: 'Ana', Ruta: 'RN 9', Km: '' })).toBe('Asunto: Reclamo\nNombre: Ana\nRuta: RN 9');
  });
});
```

`tests/lib/seo.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { jsonLdArticulo, jsonLdFaq, jsonLdMigas, jsonLdOrganizacion, jsonLdSitioWeb } from '@/lib/seo';

describe('JSON-LD', () => {
  it('Organization sin CUIT, con área servida y sin contactPoint si no hay teléfono', async () => {
    const o = jsonLdOrganizacion(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto(), 'https://covicen.test', 'https://covicen.test/isotipo.svg');
    expect(o['@type']).toBe('Organization');
    expect(o.name).toBe('Covicen');
    expect(o.areaServed).toEqual([{ '@type': 'AdministrativeArea', name: 'Córdoba' }, { '@type': 'AdministrativeArea', name: 'Santa Fe' }]);
    expect(o).not.toHaveProperty('taxID');
    expect(o).not.toHaveProperty('contactPoint');
  });
  it('WebSite', () => expect(jsonLdSitioWeb('https://covicen.test')['@type']).toBe('WebSite'));
  it('FAQPage con mainEntity', async () => {
    const f = jsonLdFaq(await fuenteLocalJson.faq());
    expect(f['@type']).toBe('FAQPage');
    expect((f.mainEntity as unknown[]).length).toBeGreaterThan(10);
  });
  it('BreadcrumbList numera desde 1', () => {
    const m = jsonLdMigas([{ nombre: 'Inicio', url: 'https://covicen.test/' }, { nombre: 'Tarifas', url: 'https://covicen.test/tarifas/' }]);
    expect((m.itemListElement as Array<{ position: number }>)[1]?.position).toBe(2);
  });
  it('Article', () => {
    const a = jsonLdArticulo({ slug: 'x', titulo: 'T', fecha: '2026-08-27', resumen: 'R', etiquetas: [], destacada: false }, 'https://covicen.test/novedades/x/', 'https://covicen.test');
    expect(a['@type']).toBe('Article');
    expect(a.datePublished).toBe('2026-08-27');
  });
});
```
Run: `pnpm test tests/lib` → FAIL (módulos inexistentes).

- [ ] **Step 2: `src/lib/formato.ts`**

```ts
// La UI formatea; los datos llegan crudos. Todo en es-AR.
const fmtMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const fmtFechaLarga = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtFechaCorta = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

const aFechaUtc = (iso: string): Date => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Fecha inválida: ${iso}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
};

export const moneda = (n: number): string => fmtMoneda.format(n);
export const conIva = (monto: number, alicuota: number): number => Math.round(monto * (1 + alicuota));
export const fechaLarga = (iso: string): string => fmtFechaLarga.format(aFechaUtc(iso));
export const fechaCorta = (iso: string): string => fmtFechaCorta.format(aFechaUtc(iso));
export const numero = (n: number, decimales = 0): string =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(n);
```

- [ ] **Step 3: `src/lib/rutas.ts`**

```ts
import { config } from '@/lib/config';

/** Ruta interna con base y barra final. Ningún componente escribe `/` a mano: siempre `ruta('/tarifas')`. */
export const ruta = (path: string, base: string = config.base): string => {
  const [sinAncla, ancla] = path.split('#');
  let p = (sinAncla ?? '/').replace(/^\/+/, '');
  const esArchivo = /\.[a-z0-9]+$/i.test(p);
  if (p !== '' && !esArchivo && !p.endsWith('/')) p += '/';
  return `${base}${p}${ancla ? `#${ancla}` : ''}`;
};

export const absoluta = (path: string): string => `${config.sitio}${ruta(path)}`;
```

- [ ] **Step 4: `src/lib/whatsapp.ts`**

```ts
export const enlaceWhatsapp = (numero: string, texto: string): string =>
  `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

/** Texto estructurado para el mensaje. Los campos vacíos no se incluyen. */
export const mensajeContacto = (asunto: string, campos: Record<string, string>): string =>
  [`Asunto: ${asunto}`, ...Object.entries(campos).filter(([, v]) => v.trim() !== '').map(([k, v]) => `${k}: ${v.trim()}`)].join('\n');
```

- [ ] **Step 5: `src/lib/seo.ts`**

```ts
import type { Contacto, Empresa, Novedad, Pregunta } from '@/lib/datos/esquemas';

type JsonLd = Record<string, unknown>;

export const jsonLdOrganizacion = (e: Empresa, c: Contacto, sitio: string, logoUrl: string): JsonLd => {
  const o: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: e.marca,
    alternateName: e.descriptor,
    url: sitio,
    logo: logoUrl,
    description: `Concesionaria del Tramo Centro de la Red Federal de Concesiones: ${e.concesion.rutas.join(', ')} en ${e.concesion.provincias.join(' y ')}.`,
    areaServed: e.concesion.provincias.map((p) => ({ '@type': 'AdministrativeArea', name: p })),
    foundingDate: e.concesion.adjudicacion.fecha,
  };
  if (e.razonSocial) o.legalName = e.razonSocial;
  if (e.cuit) o.taxID = e.cuit;
  if (c.emergencias.telefono) {
    o.contactPoint = [{ '@type': 'ContactPoint', telephone: c.emergencias.telefono, contactType: 'emergency', areaServed: 'AR', availableLanguage: 'es' }];
  }
  const sameAs = Object.values(c.redes).filter(Boolean);
  if (sameAs.length) o.sameAs = sameAs;
  return o;
};

export const jsonLdSitioWeb = (sitio: string): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Covicen',
  url: sitio,
  inLanguage: 'es-AR',
});

export const jsonLdFaq = (preguntas: Pregunta[]): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: preguntas.map((p) => ({
    '@type': 'Question',
    name: p.pregunta,
    acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
  })),
});

export const jsonLdMigas = (migas: Array<{ nombre: string; url: string }>): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: migas.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.nombre, item: m.url })),
});

export const jsonLdArticulo = (n: Novedad, url: string, sitio: string): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: n.titulo,
  description: n.resumen,
  datePublished: n.fecha,
  dateModified: n.fecha,
  inLanguage: 'es-AR',
  mainEntityOfPage: url,
  author: { '@type': 'Organization', name: 'Covicen', url: sitio },
  publisher: { '@type': 'Organization', name: 'Covicen', url: sitio },
});
```
Run: `pnpm test tests/lib` → PASS.

- [ ] **Step 6: Checkpoint**

```bash
pnpm check && git add -A && git status --short
```
Commit (si autorizado): `feat(lib): formato es-AR, rutas con base, WhatsApp y JSON-LD`

---

### Task 6: Marca: isotipo vectorial, logotipo, favicon e imagen OG

**Files:**
- Create: `scripts/extraer-isotipo.py`, `src/assets/marca/isotipo-path.ts` (generado), `src/assets/marca/isotipo.svg` (generado), `public/favicon.svg` (generado), `src/components/marca/Isotipo.astro`, `src/components/marca/Logotipo.astro`, `src/assets/marca/og.svg`, `scripts/generar-og.ts`, `scripts/fuentes/Archivo-ExtraBold.ttf`, `scripts/fuentes/Archivo-Regular.ttf`, `scripts/fuentes/OFL.txt`, `tests/components/marca.test.ts`

**Interfaces:**
- Produces: `ISOTIPO_D: string`, `ISOTIPO_VIEWBOX: string` (`@/assets/marca/isotipo-path`)
- Produces: `<Isotipo variante="degradado" | "tinta" size={n} class="" titulo? />` (SVG inline, `aria-hidden` salvo que reciba `titulo`) y `<Logotipo conDescriptor={true} />` (link a Home con `aria-label="Covicen, inicio"`)
- Produces: `public/og.png` (1200×630) y `public/apple-touch-icon.png` (180×180) generados por `pnpm og`

- [ ] **Step 1: `scripts/extraer-isotipo.py`** (requiere `pymupdf`; en la máquina de Juli ya está)

```python
"""Extrae la geometría del isotipo del manual de marca (PDF vectorial) y la escribe como SVG + módulo TS.
Se corre una sola vez; los archivos generados quedan versionados. Uso: python scripts/extraer-isotipo.py"""
import re
import fitz  # pymupdf

PDF = "docs/marca/Logo Covicen 2.pdf"
# En la página 1, el isotipo "uso preferente" es la imagen recortada por clip_14 (verificado el 2026-08-27).
CLIP_ID = "clip_14"
VIEWBOX = "120 120 784 784"  # la geometría vive en ~139..885; margen de 19 u por lado

svg = fitz.open(PDF)[0].get_svg_image()
clip = re.search(rf'<clipPath id="{CLIP_ID}">(.*?)</clipPath>', svg, re.S).group(1)
d = re.search(r' d="([^"]+)"', clip).group(1)
assert d.count("M") == 5, f"esperaba 5 subtrazos (C + ruta + 3 marcas), hay {d.count('M')}"

gradiente = (
    '<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="139" y1="139" x2="885" y2="885">'
    '<stop offset="0" stop-color="#68BCE1"/><stop offset=".4" stop-color="#4A92BA"/>'
    '<stop offset=".75" stop-color="#2C688F"/><stop offset="1" stop-color="#1E4870"/></linearGradient></defs>'
)
standalone = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VIEWBOX}" role="img" aria-label="Covicen">'
    f'{gradiente}<path d="{d}" fill="url(#g)" fill-rule="evenodd"/></svg>'
)
open("src/assets/marca/isotipo.svg", "w", encoding="utf-8").write(standalone)
open("public/favicon.svg", "w", encoding="utf-8").write(standalone)
open("src/assets/marca/isotipo-path.ts", "w", encoding="utf-8").write(
    "// Generado por scripts/extraer-isotipo.py desde docs/marca/Logo Covicen 2.pdf. No editar a mano.\n"
    f'export const ISOTIPO_VIEWBOX = "{VIEWBOX}";\n'
    f'export const ISOTIPO_D = "{d}";\n'
)
print("ok:", len(d), "chars de path")
```
Run: `mkdir -p src/assets/marca public && python scripts/extraer-isotipo.py`
Expected: `ok: 7xxx chars de path`; existen `src/assets/marca/isotipo.svg`, `public/favicon.svg`, `src/assets/marca/isotipo-path.ts`.

- [ ] **Step 2: Test de componentes de marca (falla primero)**

`tests/components/marca.test.ts`:
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Isotipo from '@/components/marca/Isotipo.astro';
import Logotipo from '@/components/marca/Logotipo.astro';

describe('Isotipo', () => {
  it('renderiza SVG inline con degradado y es decorativo por defecto', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Isotipo, { props: { size: 40 } });
    expect(html).toContain('<svg');
    expect(html).toContain('linearGradient');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('width="40"');
  });
  it('variante tinta usa currentColor', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Isotipo, { props: { variante: 'tinta' } });
    expect(html).toContain('fill="currentColor"');
    expect(html).not.toContain('linearGradient');
  });
});

describe('Logotipo', () => {
  it('es un link a Home con nombre accesible y descriptor', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Logotipo, { props: { conDescriptor: true } });
    expect(html).toContain('aria-label="Covicen, inicio"');
    expect(html).toContain('href="/"');
    expect(html).toContain('COVICEN');
    expect(html).toContain('Corredor Vial del Centro');
  });
});
```
Run: `pnpm test tests/components/marca.test.ts` → FAIL.

- [ ] **Step 3: `src/components/marca/Isotipo.astro`**

```astro
---
import { ISOTIPO_D, ISOTIPO_VIEWBOX } from '@/assets/marca/isotipo-path';

interface Props {
  variante?: 'degradado' | 'tinta';
  size?: number;
  class?: string;
  /** Si el isotipo es la única señal, pasá un título y deja de ser decorativo. */
  titulo?: string;
}
const { variante = 'degradado', size = 32, class: clase = '', titulo } = Astro.props;
// id único por instancia: dos isotipos en la misma página no comparten gradiente
const id = `iso-${Math.random().toString(36).slice(2, 8)}`;
---
<svg
  viewBox={ISOTIPO_VIEWBOX}
  width={size}
  height={size}
  class={clase}
  aria-hidden={titulo ? undefined : 'true'}
  role={titulo ? 'img' : undefined}
  focusable="false"
>
  {titulo && <title>{titulo}</title>}
  {variante === 'degradado' && (
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="139" y1="139" x2="885" y2="885">
        <stop offset="0" stop-color="#68BCE1"></stop>
        <stop offset=".4" stop-color="#4A92BA"></stop>
        <stop offset=".75" stop-color="#2C688F"></stop>
        <stop offset="1" stop-color="#1E4870"></stop>
      </linearGradient>
    </defs>
  )}
  <path d={ISOTIPO_D} fill={variante === 'degradado' ? `url(#${id})` : 'currentColor'} fill-rule="evenodd"></path>
</svg>
```

- [ ] **Step 4: `src/components/marca/Logotipo.astro`**

```astro
---
import Isotipo from './Isotipo.astro';
import { ruta } from '@/lib/rutas';

interface Props { conDescriptor?: boolean; class?: string }
const { conDescriptor = false, class: clase = '' } = Astro.props;
---
<a href={ruta('/')} aria-label="Covicen, inicio" class:list={['logotipo inline-flex items-center gap-3 text-texto no-underline', clase]}>
  <Isotipo size={36} class="shrink-0" />
  <span class="flex flex-col leading-none">
    <span class="font-extrabold text-[1.25rem] tracking-[0.02em]">COVICEN</span>
    {conDescriptor && <span class="eyebrow mt-1 text-[0.6rem]">Corredor Vial del Centro</span>}
  </span>
</a>
<style>
  .logotipo :global(svg) { transition: transform var(--dur-ui) var(--ease-salida); }
  .logotipo:hover :global(svg), .logotipo:focus-visible :global(svg) { transform: rotate(-4deg) scale(1.04); }
</style>
```
Run: `pnpm test tests/components/marca.test.ts` → PASS (3).

- [ ] **Step 5: Fuentes TTF para la imagen OG**

```bash
mkdir -p scripts/fuentes
for f in Archivo-ExtraBold Archivo-Regular; do
  url=$(gh api "repos/Omnibus-Type/Archivo/contents/fonts/ttf/$f.ttf" --jq .download_url)
  curl -sL "$url" -o "scripts/fuentes/$f.ttf"
done
curl -sL "$(gh api repos/Omnibus-Type/Archivo/contents/OFL.txt --jq .download_url)" -o scripts/fuentes/OFL.txt
ls -la scripts/fuentes
```
Expected: dos `.ttf` de ~100–200 KB y `OFL.txt`. (Archivo es SIL OFL: se puede redistribuir con la licencia al lado.)

- [ ] **Step 6: `src/assets/marca/og.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="139" y1="139" x2="885" y2="885">
      <stop offset="0" stop-color="#68BCE1"/><stop offset=".4" stop-color="#4A92BA"/><stop offset=".75" stop-color="#2C688F"/><stop offset="1" stop-color="#1E4870"/>
    </linearGradient>
    <pattern id="plano" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M64 0H0V64" fill="none" stroke="#ffffff" stroke-opacity=".05"/>
    </pattern>
    <linearGradient id="hilo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#68BCE1" stop-opacity="0"/><stop offset=".5" stop-color="#68BCE1"/><stop offset="1" stop-color="#68BCE1" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#0B1526"/>
  <rect width="1200" height="630" fill="url(#plano)"/>
  <path d="M-20 470 C 300 420, 500 520, 820 440 S 1150 380, 1220 410" fill="none" stroke="url(#hilo)" stroke-width="3"/>
  <path d="M-20 470 C 300 420, 500 520, 820 440 S 1150 380, 1220 410" fill="none" stroke="#F0C419" stroke-width="2" stroke-dasharray="14 22" opacity=".7"/>
  <g transform="translate(96 150) scale(0.24)">ISOTIPO</g>
  <text x="330" y="240" font-family="Archivo" font-weight="800" font-size="96" fill="#E8EEF5" letter-spacing="2">COVICEN</text>
  <text x="334" y="292" font-family="Archivo" font-weight="400" font-size="26" fill="#A9C4D8" letter-spacing="6">CORREDOR VIAL DEL CENTRO</text>
  <text x="96" y="560" font-family="Archivo" font-weight="400" font-size="28" fill="#A9C4D8">Tramo Centro · RN 9 · RN 19 · RN 34 · 681 km · Córdoba y Santa Fe</text>
</svg>
```
El marcador `ISOTIPO` lo reemplaza el script del paso siguiente. El isotipo tiene viewBox `120 120 784 784`: con `scale(0.24)` mide ~188 px y el `translate` lo ubica a la izquierda del wordmark; dentro del `<g>` hay que compensar el origen del viewBox, por eso el script envuelve el path en `<g transform="translate(-120 -120)">`.

- [ ] **Step 7: `scripts/generar-og.ts`**

```ts
// Genera public/og.png (1200x630) y public/apple-touch-icon.png (180x180) desde los SVG de marca.
// Corre con `node scripts/generar-og.ts` (Node ≥ 22.6 ejecuta TS sin transpilar).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const fuentes = ['scripts/fuentes/Archivo-ExtraBold.ttf', 'scripts/fuentes/Archivo-Regular.ttf'];
const isotipoSvg = readFileSync('src/assets/marca/isotipo.svg', 'utf8');
// Nos quedamos solo con el <path>; el gradiente "g" ya está definido en og.svg.
const pathIsotipo = /<path[^>]*\/>/.exec(isotipoSvg)?.[0];
if (!pathIsotipo) throw new Error('No encontré el <path> del isotipo');
const isotipo = `<g transform="translate(-120 -120)">${pathIsotipo}</g>`;

const renderizar = (svg: string, ancho: number, salida: string) => {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: ancho },
    font: { fontFiles: fuentes, loadSystemFonts: false, defaultFontFamily: 'Archivo' },
  });
  writeFileSync(salida, r.render().asPng());
  console.log('ok', salida);
};

mkdirSync('public', { recursive: true });
renderizar(readFileSync('src/assets/marca/og.svg', 'utf8').replace('ISOTIPO', isotipo), 1200, 'public/og.png');
renderizar(isotipoSvg, 180, 'public/apple-touch-icon.png');
```
Agregá `public/apple-touch-icon.png` al `.gitignore`.
Run: `pnpm og && ls -la public/*.png`
Expected: `og.png` (~60–120 KB) y `apple-touch-icon.png`. Abrilos (`start public/og.png`) y confirmá que el texto está en Archivo (pesado, geométrico; no una fuente de fallback) y que el isotipo tiene degradado.

- [ ] **Step 8: Build completo**

Run: `pnpm check && pnpm test && pnpm build`
Expected: todo en verde; ahora `pnpm build` funciona porque existe `scripts/generar-og.ts`.

- [ ] **Step 9: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `feat(marca): isotipo vectorial desde el manual, logotipo, favicon e imagen OG`

---

### Task 7: Layout base: Seo, Header, Footer, barra de emergencias, hilo de ruta, migas, robots, 404

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/Seo.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/BarraEmergencias.astro`, `src/components/HiloRuta.astro`, `src/components/Breadcrumbs.astro`, `src/scripts/menu.ts`, `src/pages/robots.txt.ts`, `src/pages/404.astro`, `tests/components/layout.test.ts`
- Modify: `src/pages/index.astro` (usa `Base`)

**Interfaces:**
- Consumes: `datos` (Task 4), `ruta/absoluta` (Task 5), `jsonLd*` (Task 5), `Logotipo`/`Isotipo` (Task 6), tokens (Task 2).
- Produces: `<Base titulo descripcion jsonLd? tipo? imagen? migas? claseMain?>` — `migas: Array<{ nombre: string; href: string }>` (sin "Inicio": lo agrega el layout). Renderiza `<html lang="es-AR">`, skip link, header, hilo, `<main id="contenido">`, footer, barra mobile y los scripts `revelar`, `menu`.
- Produces: `<Header contacto rutaActual />`, `<Footer empresa contacto />`, `<BarraEmergencias contacto />`, `<HiloRuta />`, `<Breadcrumbs migas />`.

- [ ] **Step 1: Test del layout (falla primero)**

`tests/components/layout.test.ts`:
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Base from '@/layouts/Base.astro';
import Header from '@/components/Header.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async (path: string, props: Record<string, unknown>) => {
  const c = await AstroContainer.create();
  return c.renderToString(Base, { request: new Request(`https://covicen.test${path}`), props, slots: { default: '<p>contenido</p>' } });
};

describe('Base', () => {
  it('título con patrón, canonical absoluta, noindex en demo, lang es-AR', async () => {
    const html = await render('/tarifas/', { titulo: 'Tarifas', descripcion: 'Cuánto cuesta el peaje.' });
    expect(html).toContain('<html lang="es-AR"');
    expect(html).toContain('<title>Tarifas | Covicen</title>');
    expect(html).toContain('<link rel="canonical" href="https://covicen.test/tarifas/"');
    expect(html).toContain('name="robots" content="noindex, nofollow"');
    expect(html).toContain('property="og:image" content="https://covicen.test/og.png"');
  });
  it('Home usa el título de marca', async () => {
    const html = await render('/', { titulo: 'Inicio', descripcion: 'x' });
    expect(html).toContain('<title>Covicen — Corredor Vial del Centro</title>');
  });
  it('incluye Organization y WebSite en JSON-LD y el skip link', async () => {
    const html = await render('/obras/', { titulo: 'Obras', descripcion: 'x' });
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain('href="#contenido"');
    expect(html).toContain('<main id="contenido"');
  });
  it('migas: renderiza nav y BreadcrumbList con Inicio primero', async () => {
    const html = await render('/obras/', { titulo: 'Obras', descripcion: 'x', migas: [{ nombre: 'Obras', href: '/obras' }] });
    expect(html).toContain('aria-label="Migas de pan"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('"name":"Inicio"');
    expect(html).toContain('aria-current="page"');
  });
  it('emergencias: sin número muestra el slot a confirmar en toda página', async () => {
    const html = await render('/politicas/', { titulo: 'Políticas', descripcion: 'x' });
    expect(html).toContain('data-emergencias="a-confirmar"');
  });
});

describe('Header', () => {
  it('marca la página actual y expone el CTA de emergencias con tel: cuando hay número', async () => {
    const c = await AstroContainer.create();
    const contacto = { ...(await fuenteLocalJson.contacto()), emergencias: { telefono: '0800 555 0000', etiqueta: 'Emergencias' } };
    const html = await c.renderToString(Header, { props: { contacto, rutaActual: '/tarifas/' } });
    expect(html).toContain('href="tel:08005550000"');
    expect(html).toMatch(/href="\/tarifas\/"[^>]*aria-current="page"/);
    expect(html).toContain('popovertarget="menu-mobile"');
  });
});
```
Run: `pnpm test tests/components/layout.test.ts` → FAIL.

- [ ] **Step 2: `src/components/Seo.astro`**

```astro
---
import type { Contacto, Empresa } from '@/lib/datos/esquemas';
import { config } from '@/lib/config';
import { absoluta, ruta } from '@/lib/rutas';
import { jsonLdOrganizacion, jsonLdSitioWeb } from '@/lib/seo';

interface Props {
  titulo: string;
  descripcion: string;
  jsonLd: Record<string, unknown>[];
  tipo: 'website' | 'article';
  imagen?: string;
  empresa: Empresa;
  contacto: Contacto;
}
const { titulo, descripcion, jsonLd, tipo, imagen, empresa, contacto } = Astro.props;
const esHome = Astro.url.pathname === config.base;
const tituloCompleto = esHome ? 'Covicen — Corredor Vial del Centro' : `${titulo} | Covicen`;
// pathname ya trae base y barra final (trailingSlash: always)
const canonical = `${config.sitio}${Astro.url.pathname}`;
const og = imagen ?? absoluta('/og.png');
const inicio = `${config.sitio}${config.base}`;
const bloques = [jsonLdOrganizacion(empresa, contacto, inicio, absoluta('/favicon.svg')), jsonLdSitioWeb(inicio), ...jsonLd];
---
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{tituloCompleto}</title>
<meta name="description" content={descripcion} />
<link rel="canonical" href={canonical} />
{!config.indexable && <meta name="robots" content="noindex, nofollow" />}
<meta name="theme-color" content="#0B1526" />
<link rel="icon" href={ruta('/favicon.svg')} type="image/svg+xml" />
<link rel="apple-touch-icon" href={ruta('/apple-touch-icon.png')} />
<link rel="sitemap" href={ruta('/sitemap-index.xml')} />
<meta property="og:type" content={tipo} />
<meta property="og:site_name" content="Covicen" />
<meta property="og:locale" content="es_AR" />
<meta property="og:title" content={tituloCompleto} />
<meta property="og:description" content={descripcion} />
<meta property="og:url" content={canonical} />
<meta property="og:image" content={og} />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={tituloCompleto} />
<meta name="twitter:description" content={descripcion} />
<meta name="twitter:image" content={og} />
{bloques.map((b) => <script type="application/ld+json" is:inline set:html={JSON.stringify(b)}></script>)}
```

- [ ] **Step 3: `src/components/Header.astro`**

```astro
---
import { ChevronDown, Menu, Phone, X } from '@lucide/astro';
import Logotipo from '@/components/marca/Logotipo.astro';
import type { Contacto } from '@/lib/datos/esquemas';
import { ruta } from '@/lib/rutas';

interface Props { contacto: Contacto; rutaActual: string }
const { contacto, rutaActual } = Astro.props;

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
const telHref = tel ? `tel:${tel.replace(/[^\d+]/g, '')}` : null;
---
<header class="cabecera fixed inset-x-0 top-0 z-50 h-[var(--alto-header)] border-b" transition:animate="none">
  <div class="contenedor flex h-full items-center justify-between gap-6">
    <Logotipo conDescriptor={true} />

    <nav aria-label="Principal" class="hidden lg:block">
      <ul class="nav-lista flex items-center gap-1">
        {items.map((i) => (
          <li>
            <a href={ruta(i.href)} class="nav-item" aria-current={activo(i.href) ? 'page' : undefined}>{i.nombre}</a>
          </li>
        ))}
        <li>
          <details class="desplegable relative" data-desplegable>
            <summary class:list={['nav-item flex cursor-pointer list-none items-center gap-1', { 'is-activo': nosotrosActivo }]} aria-haspopup="true">
              Nosotros <ChevronDown size={16} aria-hidden="true" class="chevron" />
            </summary>
            <ul class="absolute right-0 top-full mt-2 w-64 rounded-md border border-borde bg-superficie-2 p-2 shadow-2xl">
              {nosotros.map((n) => (
                <li><a href={ruta(n.href)} class="block rounded-sm px-3 py-2 text-texto transition-colors hover:bg-superficie hover:text-acento-hover" aria-current={activo(n.href) ? 'page' : undefined}>{n.nombre}</a></li>
              ))}
            </ul>
          </details>
        </li>
        <li><a href={ruta('/contacto')} class="nav-item" aria-current={activo('/contacto') ? 'page' : undefined}>Contacto</a></li>
      </ul>
    </nav>

    <div class="flex items-center gap-3">
      {telHref ? (
        <a href={telHref} class="btn-vial hidden sm:inline-flex" aria-label={`Llamar a emergencias: ${tel}`}>
          <Phone size={18} aria-hidden="true" class="telefono" /> <span>Emergencias</span> <span class="font-extrabold tabular-nums">{tel}</span>
        </a>
      ) : (
        <span class="btn-vial hidden sm:inline-flex opacity-90" data-emergencias="a-confirmar" title="Número a confirmar">
          <Phone size={18} aria-hidden="true" /> <span>Emergencias</span> <span class="text-[0.7rem] font-medium uppercase tracking-wider">número a confirmar</span>
        </span>
      )}
      <button type="button" class="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-md border border-borde text-texto hover:border-borde-fuerte hover:bg-superficie" popovertarget="menu-mobile" aria-label="Abrir menú">
        <Menu size={22} aria-hidden="true" />
      </button>
    </div>
  </div>

  <nav id="menu-mobile" popover class="menu-mobile" aria-label="Menú">
    <div class="flex items-center justify-between border-b border-borde p-5">
      <span class="eyebrow">Menú</span>
      <button type="button" class="inline-flex h-11 w-11 items-center justify-center rounded-md border border-borde hover:bg-superficie" popovertarget="menu-mobile" popovertargetaction="hide" aria-label="Cerrar menú">
        <X size={22} aria-hidden="true" />
      </button>
    </div>
    <ul class="flex flex-col p-3">
      {[...items, ...nosotros, { nombre: 'Contacto', href: '/contacto' }, { nombre: 'Preguntas frecuentes', href: '/preguntas-frecuentes' }].map((i) => (
        <li><a href={ruta(i.href)} class="block rounded-sm px-3 py-3 text-lg font-semibold text-texto hover:bg-superficie hover:text-acento-hover" aria-current={activo(i.href) ? 'page' : undefined}>{i.nombre}</a></li>
      ))}
    </ul>
  </nav>
</header>

<style>
  .cabecera { border-color: transparent; backdrop-filter: blur(12px); }
  @supports (animation-timeline: scroll()) {
    .cabecera { animation: cabecera-fondo linear both; animation-timeline: scroll(root); animation-range: 0 120px; }
  }
  @supports not (animation-timeline: scroll()) {
    .cabecera { background: rgb(16 32 58 / 0.85); border-color: var(--color-borde); }
  }
  @keyframes cabecera-fondo { from { background: transparent; border-color: transparent; } to { background: rgb(16 32 58 / 0.85); border-color: var(--color-borde); } }

  .nav-item {
    position: relative; display: inline-block; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);
    color: var(--color-texto-2); font-weight: 500; text-decoration: none;
    transition: color var(--dur-micro) var(--ease-salida);
  }
  .nav-item::after {
    content: ""; position: absolute; left: 0.75rem; right: 0.75rem; bottom: 0.2rem; height: 2px; border-radius: 1px;
    background: var(--color-acento); transform: scaleX(0); transform-origin: left;
    transition: transform var(--dur-ui) var(--ease-salida);
  }
  .nav-item:hover, .nav-item:focus-visible, .nav-item[aria-current="page"], .nav-item.is-activo { color: var(--color-texto); }
  .nav-item:hover::after, .nav-item[aria-current="page"]::after, .nav-item.is-activo::after { transform: scaleX(1); }
  .desplegable summary::-webkit-details-marker { display: none; }
  .desplegable .chevron { transition: transform var(--dur-ui) var(--ease-salida); }
  .desplegable[open] .chevron { transform: rotate(180deg); }
  .desplegable[open] > ul { animation: aparecer var(--dur-ui) var(--ease-salida) both; }
  @keyframes aparecer { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

  .btn-vial {
    align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; border-radius: var(--radius-md);
    background: var(--color-vial); color: var(--color-fondo); font-weight: 600; text-decoration: none;
    transition: box-shadow var(--dur-ui) var(--ease-salida), transform var(--dur-ui) var(--ease-salida);
  }
  .btn-vial:hover { box-shadow: 0 8px 24px -6px rgb(240 196 25 / 0.45); transform: translateY(-1px); }
  .btn-vial:hover :global(.telefono) { animation: oscilar 0.5s var(--ease-suave) 1; }
  .btn-vial:focus-visible { outline-color: var(--color-vial); }
  @keyframes oscilar { 25% { transform: rotate(-12deg); } 75% { transform: rotate(12deg); } }

  .menu-mobile {
    inset: unset; top: 0; right: 0; height: 100dvh; width: min(100%, 22rem); margin: 0; border: 0; border-left: 1px solid var(--color-borde);
    background: var(--color-fondo-2); color: var(--color-texto); translate: 100% 0;
    transition: translate var(--dur-ui) var(--ease-salida), display var(--dur-ui) allow-discrete, overlay var(--dur-ui) allow-discrete;
  }
  .menu-mobile:popover-open { translate: 0 0; }
  @starting-style { .menu-mobile:popover-open { translate: 100% 0; } }
  .menu-mobile::backdrop { background: rgb(11 21 38 / 0.6); }
</style>
```

- [ ] **Step 4: `src/scripts/menu.ts`** (cierra el desplegable con Esc o clic afuera; ~300 B)

```ts
const iniciar = () => {
  const desplegables = document.querySelectorAll<HTMLDetailsElement>('[data-desplegable]');
  if (!desplegables.length) return;
  document.addEventListener('click', (e) => {
    desplegables.forEach((d) => { if (d.open && !d.contains(e.target as Node)) d.open = false; });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') desplegables.forEach((d) => { d.open = false; });
  });
};
document.addEventListener('astro:page-load', iniciar);
```

- [ ] **Step 5: `src/components/BarraEmergencias.astro`** (mobile, fija abajo)

```astro
---
import { Phone } from '@lucide/astro';
import type { Contacto } from '@/lib/datos/esquemas';
interface Props { contacto: Contacto }
const { contacto } = Astro.props;
const tel = contacto.emergencias.telefono;
---
<div class="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-fondo-2/95 p-3 backdrop-blur sm:hidden" style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))">
  {tel ? (
    <a href={`tel:${tel.replace(/[^\d+]/g, '')}`} class="flex h-12 items-center justify-center gap-2 rounded-md bg-vial font-semibold text-fondo" aria-label={`Llamar a emergencias: ${tel}`}>
      <Phone size={18} aria-hidden="true" /> {contacto.emergencias.etiqueta} <span class="font-extrabold tabular-nums">{tel}</span>
    </a>
  ) : (
    <div class="flex h-12 items-center justify-center gap-2 rounded-md bg-vial/90 text-sm font-semibold text-fondo" data-emergencias="a-confirmar">
      <Phone size={18} aria-hidden="true" /> {contacto.emergencias.etiqueta} · <span class="text-xs font-medium uppercase tracking-wider">número a confirmar</span>
    </div>
  )}
</div>
```
Nota: el Header ya cubre `sm:` en adelante; esta barra cubre `< sm`. Entre los dos, el teléfono está en toda página y en todo ancho.

- [ ] **Step 6: `src/components/HiloRuta.astro`** (progreso de scroll como hilo luminoso)

```astro
---
---
<div class="hilo hidden lg:block" aria-hidden="true"><div class="hilo-luz"></div></div>
<div class="hilo-mobile lg:hidden" aria-hidden="true"></div>
<style>
  .hilo { position: fixed; left: 1.25rem; top: calc(var(--alto-header) + 1rem); bottom: 1.25rem; width: 2px; background: var(--color-borde); z-index: 30; }
  .hilo-luz { position: absolute; left: -1px; top: 0; width: 4px; height: 6rem; border-radius: 2px;
    background: linear-gradient(to bottom, transparent, var(--color-acento), transparent); box-shadow: 0 0 12px var(--color-glow); }
  .hilo-mobile { position: fixed; left: 0; top: var(--alto-header); height: 2px; width: 100%; background: var(--color-acento); transform-origin: left; transform: scaleX(0); z-index: 30; }
  @supports (animation-timeline: scroll()) {
    .hilo-luz { animation: bajar linear both; animation-timeline: scroll(root); }
    .hilo-mobile { animation: crecer linear both; animation-timeline: scroll(root); }
  }
  @supports not (animation-timeline: scroll()) { .hilo, .hilo-mobile { display: none !important; } }
  @keyframes bajar { to { top: calc(100% - 6rem); } }
  @keyframes crecer { to { transform: scaleX(1); } }
</style>
```

- [ ] **Step 7: `src/components/Breadcrumbs.astro`**

```astro
---
import { ChevronRight } from '@lucide/astro';
import { ruta } from '@/lib/rutas';
interface Props { migas: Array<{ nombre: string; href: string }> }
const { migas } = Astro.props;
const todas = [{ nombre: 'Inicio', href: '/' }, ...migas];
---
<nav aria-label="Migas de pan" class="contenedor pt-6">
  <ol class="flex flex-wrap items-center gap-1 text-sm text-texto-2">
    {todas.map((m, i) => (
      <li class="flex items-center gap-1">
        {i > 0 && <ChevronRight size={14} aria-hidden="true" class="opacity-60" />}
        {i < todas.length - 1 ? <a href={ruta(m.href)} class="link-crece text-texto-2 hover:text-texto">{m.nombre}</a> : <span aria-current="page" class="text-texto">{m.nombre}</span>}
      </li>
    ))}
  </ol>
</nav>
```

- [ ] **Step 8: `src/components/Footer.astro`**

```astro
---
import Isotipo from '@/components/marca/Isotipo.astro';
import type { Contacto, Empresa } from '@/lib/datos/esquemas';
import { ruta } from '@/lib/rutas';
import { enlaceWhatsapp } from '@/lib/whatsapp';

interface Props { empresa: Empresa; contacto: Contacto }
const { empresa, contacto } = Astro.props;
const columnas = [
  { titulo: 'Usuarios', links: [['Tarifas', '/tarifas'], ['Medios de pago', '/medios-de-pago'], ['Emergencias', '/emergencias'], ['Seguridad vial', '/seguridad-vial'], ['Preguntas frecuentes', '/preguntas-frecuentes']] },
  { titulo: 'Empresa', links: [['Quiénes somos', '/quienes-somos'], ['Obras', '/obras'], ['Novedades', '/novedades'], ['Políticas', '/politicas'], ['Transparencia', '/transparencia'], ['Trabajá con nosotros', '/trabaja-con-nosotros']] },
] as const;
const interes = [
  ['Vialidad Nacional', 'https://www.argentina.gob.ar/transporte/vialidad-nacional'],
  ['Red Federal de Concesiones', 'https://www.argentina.gob.ar/transporte/vialidad-nacional/red-federal-de-concesiones'],
  ['Boletín Oficial', 'https://www.boletinoficial.gob.ar/'],
  ['TelePASE', 'https://www.telepase.com.ar/'],
] as const;
const aConfirmar = (v: string | null) => v ?? 'a confirmar';
---
<footer class="mt-24 border-t border-borde bg-fondo-2">
  <div class="contenedor grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
    <div>
      <div class="flex items-center gap-3"><Isotipo size={40} /><span class="font-extrabold text-xl">COVICEN</span></div>
      <p class="eyebrow mt-2">{empresa.descriptor}</p>
      <p class="mt-4 text-sm text-texto-2">Concesionaria del Tramo Centro de la Red Federal de Concesiones. {empresa.concesion.rutas.join(' · ')} · {empresa.concesion.provincias.join(' y ')}.</p>
    </div>
    {columnas.map((c) => (
      <nav aria-label={c.titulo}>
        <h2 class="eyebrow mb-4 text-texto">{c.titulo}</h2>
        <ul class="flex flex-col gap-2">{c.links.map(([n, h]) => <li><a href={ruta(h)} class="link-crece text-texto-2 hover:text-texto">{n}</a></li>)}</ul>
      </nav>
    ))}
    <div>
      <h2 class="eyebrow mb-4 text-texto">Contacto</h2>
      <ul class="flex flex-col gap-2 text-texto-2">
        <li>{contacto.whatsapp.numero ? <a href={enlaceWhatsapp(contacto.whatsapp.numero, 'Hola Covicen')} class="link-crece" rel="noopener">WhatsApp</a> : <span>WhatsApp · a confirmar</span>}</li>
        <li>{contacto.email.general ? <a href={`mailto:${contacto.email.general}`} class="link-crece">{contacto.email.general}</a> : <span>Correo · a confirmar</span>}</li>
        <li><a href={ruta('/contacto')} class="link-crece">Formulario de contacto</a></li>
        <li><a href={ruta('/proveedores')} class="link-crece">Proveedores</a></li>
      </ul>
      <h2 class="eyebrow mb-3 mt-8 text-texto">Datos registrales</h2>
      <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-texto-3">
        <dt>Razón social</dt><dd>{aConfirmar(empresa.razonSocial)}</dd>
        <dt>CUIT</dt><dd>{aConfirmar(empresa.cuit)}</dd>
        <dt>Domicilio</dt><dd>{aConfirmar(empresa.domicilioLegal)}</dd>
      </dl>
    </div>
  </div>
  <div class="border-t border-borde">
    <div class="contenedor flex flex-col gap-4 py-6 text-sm text-texto-3 md:flex-row md:items-center md:justify-between">
      <p>{empresa.enFormacion && <span>Sociedad en formación · </span>}Adjudicación: {empresa.concesion.adjudicacion.resolucion}. <a href={ruta('/privacidad')} class="link-crece">Privacidad</a></p>
      <ul class="flex flex-wrap gap-4">{interes.map(([n, h]) => <li><a href={h} rel="noopener noreferrer" target="_blank" class="link-crece">{n}</a></li>)}</ul>
    </div>
  </div>
</footer>
```

- [ ] **Step 9: `src/layouts/Base.astro`**

```astro
---
import '@/styles/global.css';
import { ClientRouter } from 'astro:transitions';
import BarraEmergencias from '@/components/BarraEmergencias.astro';
import Breadcrumbs from '@/components/Breadcrumbs.astro';
import Footer from '@/components/Footer.astro';
import Header from '@/components/Header.astro';
import HiloRuta from '@/components/HiloRuta.astro';
import Seo from '@/components/Seo.astro';
import { datos } from '@/lib/datos';
import { absoluta } from '@/lib/rutas';
import { jsonLdMigas } from '@/lib/seo';

interface Props {
  titulo: string;
  descripcion: string;
  jsonLd?: Record<string, unknown>[];
  tipo?: 'website' | 'article';
  imagen?: string;
  migas?: Array<{ nombre: string; href: string }>;
  claseMain?: string;
}
const { titulo, descripcion, jsonLd = [], tipo = 'website', imagen, migas, claseMain = '' } = Astro.props;
const [empresa, contacto] = await Promise.all([datos.empresa(), datos.contacto()]);
const bloques = migas
  ? [...jsonLd, jsonLdMigas([{ nombre: 'Inicio', url: absoluta('/') }, ...migas.map((m) => ({ nombre: m.nombre, url: absoluta(m.href) }))])]
  : jsonLd;
---
<!doctype html>
<html lang="es-AR">
  <head>
    <Seo {titulo} {descripcion} jsonLd={bloques} {tipo} {imagen} {empresa} {contacto} />
    <ClientRouter />
  </head>
  <body class="flex min-h-dvh flex-col bg-fondo text-texto pb-20 sm:pb-0">
    <a href="#contenido" class="salto">Saltar al contenido</a>
    <Header {contacto} rutaActual={Astro.url.pathname} />
    <HiloRuta />
    <main id="contenido" class:list={['flex-1 pt-[var(--alto-header)]', claseMain]}>
      {migas && <Breadcrumbs {migas} />}
      <slot />
    </main>
    <Footer {empresa} {contacto} />
    <BarraEmergencias {contacto} />
    <script src="../scripts/revelar.ts"></script>
    <script src="../scripts/menu.ts"></script>
  </body>
</html>
<style is:global>
  .salto { position: absolute; left: 1rem; top: -100%; z-index: 100; padding: 0.75rem 1rem; border-radius: var(--radius-md); background: var(--color-vial); color: var(--color-fondo); font-weight: 600; }
  .salto:focus { top: 1rem; }
</style>
```
`src/scripts/revelar.ts` se crea en la Task 8; para que este paso compile, crealo ahora con el contenido de la Task 8 Step 3 (es corto).

- [ ] **Step 10: `src/pages/robots.txt.ts` y `src/pages/404.astro`**

```ts
import type { APIRoute } from 'astro';
import { config } from '@/lib/config';

export const GET: APIRoute = () => {
  const cuerpo = config.indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${config.sitio}${config.base}sitemap-index.xml\n`
    : `User-agent: *\nDisallow: /\n`;
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
```

```astro
---
import Base from '@/layouts/Base.astro';
import { ruta } from '@/lib/rutas';
---
<Base titulo="Página no encontrada" descripcion="La página que buscás no existe.">
  <section class="contenedor py-24">
    <p class="eyebrow">Error 404</p>
    <h1 class="mt-3">Esta ruta no existe.</h1>
    <p class="mt-4 max-w-prose text-texto-2">Puede que el enlace esté vencido o mal escrito. Lo que más se busca: <a href={ruta('/tarifas')}>tarifas</a>, <a href={ruta('/el-tramo')}>el tramo</a> y <a href={ruta('/emergencias')}>emergencias</a>.</p>
  </section>
</Base>
```

- [ ] **Step 11: `src/pages/index.astro` provisoria con `Base`**

```astro
---
import Base from '@/layouts/Base.astro';
---
<Base titulo="Inicio" descripcion="Covicen, concesionaria del Tramo Centro de la Red Federal de Concesiones: RN 9, RN 19 y RN 34 en Córdoba y Santa Fe.">
  <section class="contenedor py-24"><h1>Covicen</h1></section>
</Base>
```
Run: `pnpm test tests/components/layout.test.ts && pnpm check && pnpm build && cat dist/robots.txt`
Expected: tests PASS (6); build OK; `robots.txt` dice `Disallow: /` (demo).

- [ ] **Step 12: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `feat(layout): base con SEO, header, footer, emergencias siempre visibles e hilo de ruta`

---

### Task 8: Sistema de movimiento y primitivas de UI

**Files:**
- Create: `src/styles/movimiento.css` (reemplaza el vacío), `src/scripts/revelar.ts`, `src/components/ui/Boton.astro`, `src/components/ui/Card.astro`, `src/components/ui/Senal.astro`, `src/components/ui/Mojon.astro`, `src/components/ui/Eyebrow.astro`, `src/components/ui/Seccion.astro`, `src/components/HuecoCapacidad.astro`, `tests/components/ui.test.ts`, `tests/presupuesto.test.ts`

**Interfaces:**
- Produces clases CSS: `.revelar`, `.escalonar` (hijos con `style="--i: n"`), `.entrada` (coreografía de carga, hijos con `--i`), `.dibujar` (paths con `pathLength="1000"`), `.baliza`, `.mojon-contador`.
- Produces: `<Boton href? variante="primario"|"secundario"|"vial" class?>` (slot default; slot `icono` opcional); `<Card href? class? etiqueta?>` (slot); `<Senal variante="vial"|"frio">`; `<Mojon valor unidad? etiqueta animar?>`; `<Eyebrow>`; `<Seccion id? indice? eyebrow? titulo? intro? fondo="fondo"|"fondo-2"|"plano" class?>`; `<HuecoCapacidad capacidad titulo descripcion alternativaHref? alternativaTexto?>`.

- [ ] **Step 1: Tests (fallan primero)**

`tests/components/ui.test.ts`:
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Boton from '@/components/ui/Boton.astro';
import Card from '@/components/ui/Card.astro';
import Mojon from '@/components/ui/Mojon.astro';
import Seccion from '@/components/ui/Seccion.astro';
import HuecoCapacidad from '@/components/HuecoCapacidad.astro';

const render = async (C: unknown, props: Record<string, unknown>, slot = 'x') =>
  (await AstroContainer.create()).renderToString(C as never, { props, slots: { default: slot } });

describe('Boton', () => {
  it('con href es <a>, sin href es <button type="button">', async () => {
    expect(await render(Boton, { href: '/tarifas' }, 'Ver')).toMatch(/<a [^>]*href="\/tarifas\/"/);
    expect(await render(Boton, {}, 'Ver')).toContain('<button type="button"');
  });
  it('variante vial usa el token vial', async () => {
    expect(await render(Boton, { variante: 'vial', href: 'tel:123' })).toContain('btn-vial');
  });
});
describe('Card', () => {
  it('con href es un link entero con esquineros', async () => {
    const html = await render(Card, { href: '/obras', etiqueta: 'Obra' }, 'cuerpo');
    expect(html).toMatch(/<a [^>]*class="[^"]*esquineros/);
    expect(html).toContain('href="/obras/"');
  });
});
describe('Mojon', () => {
  it('mantiene el número como texto accesible aunque anime', async () => {
    const html = await render(Mojon, { valor: 681, unidad: 'km', etiqueta: 'de rutas', animar: true });
    expect(html).toContain('>681<');
    expect(html).toContain('style="--meta: 681"');
  });
});
describe('Seccion', () => {
  it('renderiza índice, eyebrow y h2 con id', async () => {
    const html = await render(Seccion, { id: 'tarifas', indice: '03', eyebrow: 'Tarifas', titulo: 'Cuánto cuesta' });
    expect(html).toContain('<section id="tarifas"');
    expect(html).toContain('03');
    expect(html).toContain('<h2');
  });
});
describe('HuecoCapacidad', () => {
  it('muestra el hueco con la alternativa real', async () => {
    const html = await render(HuecoCapacidad, { capacidad: 'estadoRutasEnVivo', titulo: 'Estado de rutas', descripcion: 'Próximamente', alternativaHref: '/emergencias', alternativaTexto: 'Ver emergencias' });
    expect(html).toContain('data-capacidad="estadoRutasEnVivo"');
    expect(html).toContain('href="/emergencias/"');
  });
});
```

`tests/presupuesto.test.ts` (el presupuesto de JS de animación se mide en el fuente; el total en `dist/` lo mide `verificar.ts`):
```ts
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const gz = (p: string) => gzipSync(readFileSync(p)).length;

describe('presupuesto', () => {
  it('los scripts de animación y UI pesan menos de 2 KB gz en total', () => {
    const total = ['src/scripts/revelar.ts', 'src/scripts/menu.ts'].reduce((s, p) => s + gz(p), 0);
    expect(total).toBeLessThan(2048);
  });
  it('el isotipo SVG pesa menos de 12 KB', () => {
    expect(statSync('src/assets/marca/isotipo.svg').size).toBeLessThan(12 * 1024);
  });
});
```
Run: `pnpm test tests/components/ui.test.ts tests/presupuesto.test.ts` → FAIL.

- [ ] **Step 2: `src/styles/movimiento.css`**

```css
/* Sistema de movimiento "La ruta, de noche". CSS primero; JS solo como fallback (src/scripts/revelar.ts).
   Reglas: cada movimiento orienta, jerarquiza o confirma. Nada se anima porque sí. */

/* --- Reveal de sección (scrub con view()) + stagger por --i --- */
@keyframes revelar { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@supports (animation-timeline: view()) {
  .revelar { animation: revelar var(--ease-salida) both; animation-timeline: view(); animation-range: entry 0% entry 35%; }
  .escalonar > * {
    animation: revelar var(--ease-salida) both; animation-timeline: view();
    animation-range: entry calc(var(--i, 0) * 6%) entry calc(35% + var(--i, 0) * 6%);
  }
}
@supports not (animation-timeline: view()) {
  .revelar, .escalonar > * {
    opacity: 0; transform: translateY(18px);
    transition: opacity var(--dur-entrada) var(--ease-salida), transform var(--dur-entrada) var(--ease-salida);
    transition-delay: calc(var(--i, 0) * var(--stagger));
  }
  .revelar.visible, .escalonar.visible > * { opacity: 1; transform: none; }
}

/* --- Coreografía de entrada (hero): no depende del scroll --- */
@keyframes entrar { from { opacity: 0; transform: translateY(14px); filter: blur(4px); } to { opacity: 1; transform: none; filter: blur(0); } }
.entrada > * { animation: entrar var(--dur-entrada) var(--ease-salida) both; animation-delay: calc(120ms + var(--i, 0) * var(--stagger)); }

/* --- Dibujar ruta: paths con pathLength="1000" --- */
.dibujar { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
@keyframes dibujar { to { stroke-dashoffset: 0; } }
.dibujar.al-cargar { animation: dibujar var(--dur-narrativa) var(--ease-suave) 300ms both; }
@supports (animation-timeline: view()) {
  .dibujar.al-scroll { animation: dibujar linear both; animation-timeline: view(); animation-range: entry 10% cover 55%; }
}
@supports not (animation-timeline: view()) { .dibujar.al-scroll { stroke-dashoffset: 0; } }

/* --- Balizas (cabinas) que se encienden en secuencia --- */
@keyframes encender { from { opacity: 0; transform: scale(0.4); } 60% { opacity: 1; transform: scale(1.25); } to { opacity: 1; transform: scale(1); } }
.baliza { transform-box: fill-box; transform-origin: center; }
@supports (animation-timeline: view()) {
  .baliza { animation: encender var(--ease-salida) both; animation-timeline: view(); animation-range: entry calc(30% + var(--i, 0) * 5%) entry calc(50% + var(--i, 0) * 5%); }
}
.baliza.al-cargar { animation: encender var(--dur-ui) var(--ease-salida) calc(900ms + var(--i, 0) * 120ms) both; animation-timeline: auto; }

/* --- Mojón: contador con @property (solo enteros; el texto real queda para lectores y fallback) --- */
@property --n { syntax: '<integer>'; initial-value: 0; inherits: false; }
@keyframes contar { from { --n: 0; } to { --n: var(--meta); } }
@supports (animation-timeline: view()) and (counter-set: n 1) {
  .mojon-contador { counter-set: n var(--n); animation: contar linear both; animation-timeline: view(); animation-range: entry 20% entry 70%; }
  .mojon-contador::before { content: counter(n); }
  .mojon-contador + .mojon-texto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
}

/* --- Parallax leve (fondo del hero): 12% de desplazamiento en la primera pantalla --- */
@keyframes parallax { to { transform: translateY(12%); } }
@supports (animation-timeline: scroll()) {
  .parallax { animation: parallax linear both; animation-timeline: scroll(root); animation-range: 0 100vh; }
}

/* --- Transiciones de página (ClientRouter): fade + 8px, header excluido con transition:animate="none" --- */
::view-transition-old(root) { animation: salir var(--dur-ui) var(--ease-suave) both; }
::view-transition-new(root) { animation: llegar var(--dur-ui) var(--ease-salida) both; }
@keyframes salir { to { opacity: 0; transform: translateY(-8px); } }
@keyframes llegar { from { opacity: 0; transform: translateY(8px); } }

@media (prefers-reduced-motion: reduce) {
  .revelar, .escalonar > *, .entrada > *, .baliza, .mojon-contador { animation: none !important; opacity: 1 !important; transform: none !important; filter: none !important; }
  .dibujar { stroke-dashoffset: 0 !important; animation: none !important; }
  ::view-transition-old(root), ::view-transition-new(root) { animation: none; }
}
```

- [ ] **Step 3: `src/scripts/revelar.ts`**

```ts
// Fallback para navegadores sin scroll-driven animations (Firefox estable, jun-2026).
// Donde hay soporte, no hace nada: el CSS se encarga.
const iniciar = () => {
  if (CSS.supports('animation-timeline: view()')) return;
  const nodos = document.querySelectorAll<HTMLElement>('.revelar:not(.visible), .escalonar:not(.visible)');
  if (!nodos.length) return;
  const io = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  nodos.forEach((n) => io.observe(n));
};
document.addEventListener('astro:page-load', iniciar);
```

- [ ] **Step 4: Primitivas**

`src/components/ui/Boton.astro`:
```astro
---
import { ruta } from '@/lib/rutas';
interface Props { href?: string; variante?: 'primario' | 'secundario' | 'vial'; class?: string; externo?: boolean; ariaLabel?: string }
const { href, variante = 'primario', class: clase = '', externo = false, ariaLabel } = Astro.props;
const esInterno = href !== undefined && href.startsWith('/');
const destino = href === undefined ? undefined : esInterno ? ruta(href) : href;
const clases = ['btn', `btn-${variante}`, clase];
---
{destino ? (
  <a href={destino} class:list={clases} aria-label={ariaLabel} rel={externo ? 'noopener noreferrer' : undefined} target={externo ? '_blank' : undefined}><slot /><slot name="icono" /></a>
) : (
  <button type="button" class:list={clases} aria-label={ariaLabel}><slot /><slot name="icono" /></button>
)}
<style>
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; min-height: 2.75rem; padding: 0.7rem 1.25rem; border-radius: var(--radius-md); font-weight: 600; text-decoration: none; cursor: pointer;
    transition: transform var(--dur-ui) var(--ease-salida), box-shadow var(--dur-ui) var(--ease-salida), background var(--dur-ui), border-color var(--dur-ui), color var(--dur-micro); }
  .btn :global(svg) { transition: transform var(--dur-ui) var(--ease-salida); }
  .btn:hover :global(svg) { transform: translateX(2px); }
  .btn:active { transform: translateY(0) !important; box-shadow: none !important; }
  .btn-primario { background: var(--color-acento); color: var(--color-fondo); }
  .btn-primario:hover { transform: translateY(-1px); box-shadow: 0 10px 28px -10px var(--color-glow); background: var(--color-acento-hover); }
  .btn-secundario { border: 1px solid var(--color-borde); color: var(--color-texto); background: transparent; }
  .btn-secundario:hover { border-color: var(--color-borde-fuerte); background: var(--color-superficie); }
  .btn-vial { background: var(--color-vial); color: var(--color-fondo); }
  .btn-vial:hover { transform: translateY(-1px); box-shadow: 0 10px 28px -8px rgb(240 196 25 / 0.45); }
  .btn-vial:focus-visible { outline-color: var(--color-vial); }
</style>
```

`src/components/ui/Card.astro`:
```astro
---
import { ArrowRight } from '@lucide/astro';
import { ruta } from '@/lib/rutas';
interface Props { href?: string; etiqueta?: string; class?: string; style?: string }
const { href, etiqueta, class: clase = '', style } = Astro.props;
const Tag = href ? 'a' : 'article';
const clases = ['card esquineros block rounded-md border border-borde bg-superficie/60 p-6 no-underline text-texto', clase];
---
<Tag href={href ? ruta(href) : undefined} class:list={clases} style={style}>
  {etiqueta && <p class="eyebrow mb-3">{etiqueta}</p>}
  <slot />
  {href && <span class="card-flecha mt-4 inline-flex items-center gap-1 text-sm font-semibold text-acento">Ver más <ArrowRight size={16} aria-hidden="true" /></span>}
</Tag>
<style>
  .card { transition: transform var(--dur-ui) var(--ease-salida), border-color var(--dur-ui), background var(--dur-ui); }
  a.card:hover, a.card:focus-visible { transform: translateY(-2px); border-color: var(--color-borde-fuerte); background: var(--color-superficie); }
  .card-flecha :global(svg) { transition: transform var(--dur-ui) var(--ease-salida); }
  a.card:hover .card-flecha :global(svg) { transform: translateX(4px); }
</style>
```

`src/components/ui/Senal.astro`:
```astro
---
interface Props { variante?: 'vial' | 'frio'; class?: string }
const { variante = 'vial', class: clase = '' } = Astro.props;
---
<span class:list={['senal inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.12em]', variante === 'vial' ? 'bg-vial text-fondo' : 'bg-superficie-2 text-texto border border-borde-fuerte', clase]}><slot /></span>
```

`src/components/ui/Mojon.astro`:
```astro
---
interface Props { valor: number | string; unidad?: string; etiqueta: string; animar?: boolean; class?: string }
const { valor, unidad, etiqueta, animar = false, class: clase = '' } = Astro.props;
const entero = typeof valor === 'number' && Number.isInteger(valor);
const anima = animar && entero;
---
<div class:list={['mojon relative', clase]}>
  <p class="flex items-baseline gap-2 font-extrabold leading-none tracking-[var(--tracking-titulo)] text-texto" style="font-size: clamp(2.75rem, 2rem + 3.5vw, 5.5rem)">
    {anima ? (
      <span class="relative inline-block"><span class="mojon-contador tabular-nums" aria-hidden="true" style={`--meta: ${valor}`}></span><span class="mojon-texto">{valor}</span></span>
    ) : (
      <span class="tabular-nums">{valor}</span>
    )}
    {unidad && <span class="text-[0.4em] font-medium text-texto-2">{unidad}</span>}
  </p>
  <p class="eyebrow mt-2">{etiqueta}</p>
</div>
```
Nota sobre el contador: sin soporte, `.mojon-contador::before` no existe y se ve `.mojon-texto` (el número real). Con soporte, el contador visible es `::before` y `.mojon-texto` queda solo para lectores de pantalla. El test comprueba que el número real siempre está en el HTML.

`src/components/ui/Eyebrow.astro`:
```astro
---
interface Props { class?: string }
const { class: clase = '' } = Astro.props;
---
<p class:list={['eyebrow flex items-center gap-3', clase]}><span class="inline-block h-px w-6 bg-acento" aria-hidden="true"></span><slot /></p>
```

`src/components/ui/Seccion.astro`:
```astro
---
import Eyebrow from './Eyebrow.astro';
interface Props { id?: string; indice?: string; eyebrow?: string; titulo?: string; intro?: string; fondo?: 'fondo' | 'fondo-2' | 'plano'; class?: string; nivel?: 'h1' | 'h2' }
const { id, indice, eyebrow, titulo, intro, fondo = 'fondo', class: clase = '', nivel = 'h2' } = Astro.props;
const Titulo = nivel;
const fondos = { fondo: 'bg-fondo', 'fondo-2': 'bg-fondo-2', plano: 'bg-fondo-2 plano' };
---
<section id={id} class:list={['py-20 md:py-28', fondos[fondo], clase]}>
  <div class="contenedor">
    {(indice || eyebrow || titulo) && (
      <header class="revelar mb-12 grid gap-4 md:grid-cols-[auto_1fr] md:gap-10">
        {indice && <span class="eyebrow tabular-nums text-texto-3 md:pt-2">{indice}</span>}
        <div class="max-w-3xl">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          {titulo && <Titulo class="mt-3">{titulo}</Titulo>}
          {intro && <p class="mt-4 text-lg text-texto-2">{intro}</p>}
        </div>
      </header>
    )}
    <slot />
  </div>
</section>
```

`src/components/HuecoCapacidad.astro`:
```astro
---
import { Clock } from '@lucide/astro';
import Boton from '@/components/ui/Boton.astro';
import Senal from '@/components/ui/Senal.astro';
import { capacidades, type Capacidad } from '@/lib/datos/capacidades';
interface Props { capacidad: Capacidad; titulo: string; descripcion: string; alternativaHref?: string; alternativaTexto?: string; class?: string }
const { capacidad, titulo, descripcion, alternativaHref, alternativaTexto, class: clase = '' } = Astro.props;
const activa = capacidades[capacidad];
---
{!activa && (
  <div class:list={['hueco esquineros relative rounded-md border border-dashed border-borde-fuerte bg-fondo-2/60 p-6', clase]} data-capacidad={capacidad}>
    <div class="flex items-center gap-3"><Senal variante="frio"><Clock size={12} aria-hidden="true" /> Próximamente</Senal></div>
    <h3 class="mt-4">{titulo}</h3>
    <p class="mt-2 text-texto-2">{descripcion}</p>
    {alternativaHref && alternativaTexto && <div class="mt-5"><Boton href={alternativaHref} variante="secundario">{alternativaTexto}</Boton></div>}
  </div>
)}
{activa && <slot />}
```
Run: `pnpm test tests/components/ui.test.ts tests/presupuesto.test.ts && pnpm check` → PASS.

- [ ] **Step 5: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `feat(ui): sistema de movimiento con fallbacks y primitivas (botón, card, señal, mojón, sección, hueco)`

---

### Task 9: Ilustraciones propias: mapa del tramo, hero de ruta, íconos de vehículos

**Files:**
- Create: `src/components/ilustraciones/MapaTramo.astro`, `src/components/ilustraciones/HeroRuta.astro`, `src/components/ilustraciones/IconoVehiculo.astro`, `tests/components/ilustraciones.test.ts`

**Interfaces:**
- Produces: `<MapaTramo tramo={Tramo} modo="scroll"|"cargar" class? />` (SVG `viewBox="0 0 820 520"`, un `<path class="dibujar">` por ruta, `<g class="baliza">` por cabina con `data-estado`), `<HeroRuta class? />`, `<IconoVehiculo categoria="cat-1".."cat-6" size? class? />`

- [ ] **Step 1: Tests (fallan primero)**

`tests/components/ilustraciones.test.ts`:
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import MapaTramo from '@/components/ilustraciones/MapaTramo.astro';
import IconoVehiculo from '@/components/ilustraciones/IconoVehiculo.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('MapaTramo', () => {
  it('dibuja las 3 rutas, las 6 balizas y etiqueta las ciudades principales', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(MapaTramo, { props: { tramo: await fuenteLocalJson.tramo(), modo: 'scroll' } });
    expect(html.match(/class="dibujar/g)?.length).toBe(9); // 3 rutas × 3 trazos (glow, línea, marcas)
    expect(html.match(/<g class="baliza/g)?.length).toBe(6);
    expect(html).toContain('>Rosario<');
    expect(html).toContain('>Córdoba<');
    expect(html).toContain('pathLength="1000"');
    expect(html).toContain('role="img"');
  });
});
describe('IconoVehiculo', () => {
  it('renderiza cada categoría y falla con una desconocida', async () => {
    const c = await AstroContainer.create();
    for (const cat of ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6']) {
      expect(await c.renderToString(IconoVehiculo, { props: { categoria: cat } })).toContain('<svg');
    }
    await expect(c.renderToString(IconoVehiculo, { props: { categoria: 'cat-9' } })).rejects.toThrow();
  });
});
```
Run: `pnpm test tests/components/ilustraciones.test.ts` → FAIL.

- [ ] **Step 2: `src/components/ilustraciones/MapaTramo.astro`**

```astro
---
import type { Tramo } from '@/lib/datos/esquemas';
interface Props { tramo: Tramo; modo?: 'scroll' | 'cargar'; class?: string; interactivo?: boolean }
const { tramo, modo = 'scroll', class: clase = '', interactivo = true } = Astro.props;
const porSlug = new Map(tramo.ciudades.map((c) => [c.slug, c]));
const d = (slugs: string[]) => slugs.map((s, i) => { const c = porSlug.get(s); if (!c) throw new Error(`Ciudad ${s} no existe`); return `${i === 0 ? 'M' : 'L'}${c.mapa.x} ${c.mapa.y}`; }).join(' ');
const etiquetaRuta = (slugs: string[]) => { const a = porSlug.get(slugs[Math.floor(slugs.length / 2) - 1])!; const b = porSlug.get(slugs[Math.floor(slugs.length / 2)])!; return { x: (a.mapa.x + b.mapa.x) / 2, y: (a.mapa.y + b.mapa.y) / 2 - 10 }; };
const claseDibujar = modo === 'scroll' ? 'dibujar al-scroll' : 'dibujar al-cargar';
const claseBaliza = modo === 'scroll' ? 'baliza' : 'baliza al-cargar';
const descripcion = `Mapa esquemático del Tramo Centro: ${tramo.rutas.map((r) => r.nombre).join(', ')} entre ${tramo.ciudades.filter((c) => c.principal).map((c) => c.nombre).join(', ')}, con ${tramo.cabinas.length} estaciones de peaje.`;
---
<figure class:list={['mapa', clase]}>
  <svg viewBox="0 0 820 520" role="img" aria-label={descripcion} class="h-auto w-full">
    <defs>
      <pattern id="mapa-plano" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgb(255 255 255 / 0.05)"></path></pattern>
      <filter id="mapa-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="4"></feGaussianBlur></filter>
    </defs>
    <rect width="820" height="520" fill="url(#mapa-plano)"></rect>
    {tramo.trazados.map((t) => (
      <g>
        <path d={d(t.ciudades)} fill="none" stroke="var(--color-borde-fuerte)" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"></path>
        <path d={d(t.ciudades)} fill="none" stroke="var(--color-glow)" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" filter="url(#mapa-glow)" pathLength="1000" class={claseDibujar}></path>
        <path d={d(t.ciudades)} fill="none" stroke="var(--color-acento)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" pathLength="1000" class={claseDibujar}></path>
        <path d={d(t.ciudades)} fill="none" stroke="var(--color-vial)" stroke-width="1" stroke-dasharray="6 12" opacity="0.7" pathLength="1000" class={claseDibujar}></path>
        <text x={etiquetaRuta(t.ciudades).x} y={etiquetaRuta(t.ciudades).y} class="ruta-etiqueta" text-anchor="middle">{t.ruta}</text>
      </g>
    ))}
    {tramo.ciudades.map((c) => (
      <g>
        <circle cx={c.mapa.x} cy={c.mapa.y} r={c.principal ? 6 : 3.5} fill="var(--color-fondo)" stroke="var(--color-acento)" stroke-width={c.principal ? 2 : 1.5}></circle>
        {c.principal && <text x={c.mapa.x + (c.mapa.x > 410 ? -12 : 12)} y={c.mapa.y + 5} class="ciudad-etiqueta" text-anchor={c.mapa.x > 410 ? 'end' : 'start'}>{c.nombre}</text>}
      </g>
    ))}
    {tramo.cabinas.map((cab, i) => (
      <g class={claseBaliza} style={`--i: ${i}`} data-estado={cab.estado} data-situacion={cab.situacion} tabindex={interactivo ? 0 : undefined}>
        <title>{`Peaje ${cab.nombre} · ${cab.ruta}${cab.km !== null ? ` km ${cab.km}` : ''} · ${cab.situacion === 'nueva' ? 'estación nueva' : 'estación existente'}`}</title>
        <circle cx={cab.mapa.x} cy={cab.mapa.y} r="14" fill="var(--color-vial)" opacity="0.18" class="baliza-halo"></circle>
        <circle cx={cab.mapa.x} cy={cab.mapa.y} r="6" fill="var(--color-vial)" stroke="var(--color-fondo)" stroke-width="2"></circle>
        <text x={cab.mapa.x} y={cab.mapa.y - 18} class="cabina-etiqueta" text-anchor="middle">{cab.nombre}</text>
      </g>
    ))}
  </svg>
  <figcaption class="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-texto-2">
    <span class="inline-flex items-center gap-2"><span class="inline-block h-0.5 w-6 bg-acento" aria-hidden="true"></span> Rutas del tramo</span>
    <span class="inline-flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-full bg-vial" aria-hidden="true"></span> Estación de peaje</span>
    <span class="inline-flex items-center gap-2"><span class="inline-block h-3 w-3 rounded-full border-2 border-acento" aria-hidden="true"></span> Ciudad</span>
  </figcaption>
</figure>
<style>
  .mapa text { font-family: var(--font-sans); fill: var(--color-texto-2); }
  .ruta-etiqueta { font-size: 13px; font-weight: 800; letter-spacing: 0.12em; fill: var(--color-acento); }
  .ciudad-etiqueta { font-size: 15px; font-weight: 600; fill: var(--color-texto); }
  .cabina-etiqueta { font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; fill: var(--color-vial); opacity: 0; transition: opacity var(--dur-ui) var(--ease-salida); }
  .baliza { cursor: default; outline: none; }
  .baliza:hover .cabina-etiqueta, .baliza:focus-visible .cabina-etiqueta { opacity: 1; }
  .baliza-halo { transition: transform var(--dur-ui) var(--ease-salida), opacity var(--dur-ui); transform-box: fill-box; transform-origin: center; }
  .baliza:hover .baliza-halo, .baliza:focus-visible .baliza-halo { transform: scale(1.4); opacity: 0.35; }
  @media (min-width: 48rem) { .cabina-etiqueta { opacity: 0.9; } }
</style>
```

- [ ] **Step 3: `src/components/ilustraciones/HeroRuta.astro`** (geometría abstracta: tres bandas de asfalto, el hilo luminoso y marcas viales; se dibuja al cargar)

```astro
---
interface Props { class?: string }
const { class: clase = '' } = Astro.props;
---
<svg viewBox="0 0 900 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" class:list={['hero-ruta', clase]}>
  <defs>
    <linearGradient id="hr-asfalto" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16304E" stop-opacity="0"></stop><stop offset="1" stop-color="#16304E"></stop></linearGradient>
    <linearGradient id="hr-luz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#68BCE1" stop-opacity="0"></stop><stop offset=".6" stop-color="#68BCE1"></stop><stop offset="1" stop-color="#8FCDE8"></stop></linearGradient>
    <filter id="hr-glow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"></feGaussianBlur></filter>
  </defs>
  <!-- bandas de asfalto en perspectiva -->
  <path d="M-50 640 C 200 420, 420 300, 640 160 L 760 160 C 560 320, 380 460, 240 640 Z" fill="url(#hr-asfalto)" opacity="0.9"></path>
  <path d="M240 640 C 380 460, 560 320, 760 160 L 880 160 C 720 340, 600 480, 520 640 Z" fill="#10203A" opacity="0.8"></path>
  <!-- borde luminoso de la calzada -->
  <path d="M-50 640 C 200 420, 420 300, 640 160" fill="none" stroke="url(#hr-luz)" stroke-width="10" filter="url(#hr-glow)" opacity="0.7" pathLength="1000" class="dibujar al-cargar"></path>
  <path d="M-50 640 C 200 420, 420 300, 640 160" fill="none" stroke="url(#hr-luz)" stroke-width="2.5" pathLength="1000" class="dibujar al-cargar"></path>
  <!-- marcas viales discontinuas -->
  <path d="M240 640 C 380 460, 560 320, 760 160" fill="none" stroke="#F0C419" stroke-width="3" stroke-dasharray="28 36" opacity="0.85" pathLength="1000" class="dibujar al-cargar marcas"></path>
  <!-- horizonte -->
  <line x1="0" y1="160" x2="900" y2="160" stroke="rgb(255 255 255 / 0.08)"></line>
</svg>
<style>
  .hero-ruta { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .marcas { animation-delay: 700ms; }
</style>
```

- [ ] **Step 4: `src/components/ilustraciones/IconoVehiculo.astro`** (familia propia: línea 1.5, grilla 24)

```astro
---
interface Props { categoria: string; size?: number; class?: string }
const { categoria, size = 28, class: clase = '' } = Astro.props;
// Cada ícono: siluetas de perfil sobre una línea base y=19. Ruedas r=1.8.
const iconos: Record<string, string> = {
  'cat-1': 'M4 17.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0m10 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0M6.5 15l3-5h4l2 3h2M9.5 10l-1-3h2.5M13.5 10 12 8',
  'cat-2': 'M3 16h18v-3l-2.5-1-2-4h-8l-3 4-2.5 1zM7 16.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0m6 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0M9.5 8v4h6',
  'cat-3': 'M2 16h11v-3l-2-1-1.5-3H5l-2 3-1 1zM4 16.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0M13 14h2l1-4h5v6h-1M16 16.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  'cat-4': 'M2 16V8h11v8zM13 11h5l3 3v2h-8M4 16.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0m5 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0m7 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  'cat-5': 'M1 16V9h12v7zM13 11h5l3 3v2h-8M2.5 16.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0m4.5 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0m4.5 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0m4.5 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0',
  'cat-6': 'M1 16V9h13v7zM14 11h4l3 3v2h-7M1.5 16.5a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0m3.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0m3.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0m3.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0m3.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0',
};
const d = iconos[categoria];
if (!d) throw new Error(`IconoVehiculo: categoría desconocida "${categoria}"`);
---
<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class={clase}>
  <path d={d}></path>
  <line x1="1" y1="19" x2="23" y2="19" stroke-dasharray="2 2" opacity="0.5"></line>
</svg>
```
Run: `pnpm test tests/components/ilustraciones.test.ts && pnpm check` → PASS.

- [ ] **Step 5: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `feat(ilustraciones): mapa del tramo dibujable, hero de ruta e íconos de vehículos propios`

---

### Task 10: Home

**Files:**
- Create: `src/components/CuentaRegresiva.astro`, `src/scripts/cuenta-regresiva.ts`, `src/components/Faq.astro`, `src/components/home/Hero.astro`, `src/components/home/AccesosRapidos.astro`, `src/components/home/TarifaDestacada.astro`, `src/components/home/ElTramo.astro`, `src/components/home/ObrasYEstado.astro`, `src/components/home/Servicios.astro`, `src/components/home/NovedadesRecientes.astro`, `src/components/home/Consorcio.astro`, `src/components/home/FaqCorto.astro`, `src/components/home/ContactoCta.astro`, `tests/components/home.test.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: todo lo anterior. Cada componente de home recibe datos **por props** (la página llama a `datos.*()`); así son testeables con el Container sin `astro:content`.
- Produces: `<Faq preguntas={Pregunta[]} />` (`<details>` nativo), `<CuentaRegresiva fecha="YYYY-MM-DD" />`.

- [ ] **Step 1: Tests (fallan primero)**

`tests/components/home.test.ts`:
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Hero from '@/components/home/Hero.astro';
import TarifaDestacada from '@/components/home/TarifaDestacada.astro';
import Faq from '@/components/Faq.astro';
import CuentaRegresiva from '@/components/CuentaRegresiva.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async (C: unknown, props: Record<string, unknown>) => (await AstroContainer.create()).renderToString(C as never, { props });

describe('Hero', () => {
  it('tiene un solo h1, la fecha de inicio y CTAs a tarifas y tramo', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa() });
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain('5 de octubre de 2026');
    expect(html).toContain('href="/tarifas/"');
    expect(html).toContain('href="/el-tramo/"');
    expect(html).toContain('class="entrada');
  });
});
describe('TarifaDestacada', () => {
  it('muestra la tarifa con y sin IVA, el origen y la vigencia', async () => {
    const html = (await render(TarifaDestacada, { tarifario: await fuenteLocalJson.tarifario(), empresa: await fuenteLocalJson.empresa() })).replace(/[  ]/g, ' ');
    expect(html).toContain('$ 1.399');
    expect(html).toContain('$ 1.693');
    expect(html).toContain('Vigencia');
    expect(html).toContain('Tarifa ofertada');
  });
});
describe('Faq', () => {
  it('usa details/summary nativos', async () => {
    const html = await render(Faq, { preguntas: (await fuenteLocalJson.faq()).slice(0, 2) });
    expect(html.match(/<details/g)?.length).toBe(2);
    expect(html).toContain('<summary');
  });
});
describe('CuentaRegresiva', () => {
  it('renderiza texto estático con la fecha y los data-attributes para el script', async () => {
    const html = await render(CuentaRegresiva, { fecha: '2026-10-05' });
    expect(html).toContain('data-cuenta-regresiva');
    expect(html).toContain('data-fecha="2026-10-05"');
    expect(html).toContain('5 de octubre de 2026');
  });
});
```
Run: `pnpm test tests/components/home.test.ts` → FAIL.

- [ ] **Step 2: `CuentaRegresiva.astro` + `scripts/cuenta-regresiva.ts`**

```astro
---
import { fechaLarga } from '@/lib/formato';
interface Props { fecha: string; class?: string }
const { fecha, class: clase = '' } = Astro.props;
const larga = fechaLarga(fecha);
---
<p class:list={['inline-flex items-center gap-3 rounded-md border border-borde bg-fondo-2/70 px-4 py-2 text-sm text-texto-2', clase]} data-cuenta-regresiva data-fecha={fecha} data-despues={`En operación desde el ${larga}`}>
  <span class="inline-block h-2 w-2 rounded-full bg-vial" aria-hidden="true"></span>
  <span data-texto>Inicio de operación: <time datetime={fecha} class="font-semibold text-texto">{larga}</time></span>
</p>
```

`src/scripts/cuenta-regresiva.ts`:
```ts
// Cuenta regresiva al inicio de operación (00:00 hora Argentina, UTC-3). Después de la fecha, muestra data-despues.
const pad = (n: number) => String(n).padStart(2, '0');
const iniciar = () => {
  const nodo = document.querySelector<HTMLElement>('[data-cuenta-regresiva]');
  if (!nodo) return;
  const [y, m, d] = (nodo.dataset.fecha ?? '').split('-').map(Number);
  if (!y || !m || !d) return;
  const objetivo = Date.UTC(y, m - 1, d, 3, 0, 0);
  const texto = nodo.querySelector<HTMLElement>('[data-texto]');
  if (!texto) return;
  const pintar = () => {
    const resta = objetivo - Date.now();
    if (resta <= 0) { texto.textContent = nodo.dataset.despues ?? ''; return; }
    const dias = Math.floor(resta / 86_400_000);
    const horas = Math.floor((resta % 86_400_000) / 3_600_000);
    const minutos = Math.floor((resta % 3_600_000) / 60_000);
    texto.innerHTML = `Inicio de operación en <strong class="tabular-nums text-texto">${dias} d · ${pad(horas)} h · ${pad(minutos)} min</strong>`;
  };
  pintar();
  const id = window.setInterval(pintar, 60_000);
  document.addEventListener('astro:before-swap', () => window.clearInterval(id), { once: true });
};
document.addEventListener('astro:page-load', iniciar);
```

- [ ] **Step 3: `src/components/Faq.astro`**

```astro
---
import { ChevronDown } from '@lucide/astro';
import type { Pregunta } from '@/lib/datos/esquemas';
interface Props { preguntas: Pregunta[]; class?: string }
const { preguntas, class: clase = '' } = Astro.props;
---
<div class:list={['faq escalonar divide-y divide-borde border-y border-borde', clase]}>
  {preguntas.map((p, i) => (
    <details class="faq-item group" id={p.slug} style={`--i: ${i}`}>
      <summary class="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-semibold text-texto transition-colors hover:text-acento-hover">
        <span>{p.pregunta}</span>
        <ChevronDown size={20} aria-hidden="true" class="chevron shrink-0 text-texto-2" />
      </summary>
      <div class="faq-cuerpo"><p class="max-w-prose pb-6 text-texto-2">{p.respuesta}</p></div>
    </details>
  ))}
</div>
<style>
  .faq-item summary::-webkit-details-marker { display: none; }
  .faq-item:hover { background: linear-gradient(to right, var(--color-superficie), transparent); }
  .chevron { transition: transform var(--dur-ui) var(--ease-salida); }
  .faq-item[open] .chevron { transform: rotate(180deg); }
  .faq-cuerpo { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--dur-ui) var(--ease-salida); }
  .faq-cuerpo > p { overflow: hidden; }
  .faq-item[open] .faq-cuerpo { grid-template-rows: 1fr; }
  @supports (interpolate-size: allow-keywords) {
    .faq-item { interpolate-size: allow-keywords; }
    .faq-item::details-content { block-size: 0; overflow: hidden; transition: block-size var(--dur-ui) var(--ease-salida), content-visibility var(--dur-ui) allow-discrete; }
    .faq-item[open]::details-content { block-size: auto; }
    .faq-cuerpo { display: block; }
  }
</style>
```

- [ ] **Step 4: Componentes de Home**

`src/components/home/Hero.astro`:
```astro
---
import { ArrowRight } from '@lucide/astro';
import CuentaRegresiva from '@/components/CuentaRegresiva.astro';
import HeroRuta from '@/components/ilustraciones/HeroRuta.astro';
import Boton from '@/components/ui/Boton.astro';
import Eyebrow from '@/components/ui/Eyebrow.astro';
import type { Empresa } from '@/lib/datos/esquemas';
import { fechaLarga, numero } from '@/lib/formato';
interface Props { empresa: Empresa }
const { empresa } = Astro.props;
const c = empresa.concesion;
---
<section class="plano relative isolate overflow-hidden" style="min-height: calc(100dvh - var(--alto-header))">
  <HeroRuta class="-z-10 opacity-90 parallax" />
  <div class="absolute inset-0 -z-10 bg-gradient-to-r from-fondo via-fondo/90 to-fondo/30" aria-hidden="true"></div>
  <div class="entrada contenedor flex min-h-[calc(100dvh-var(--alto-header))] flex-col justify-center py-20">
    <div style="--i: 0"><Eyebrow>Concesionaria del Tramo Centro · {c.rutas.join(' · ')}</Eyebrow></div>
    <h1 class="mt-6 max-w-4xl" style="--i: 1">Las rutas del centro del país tienen quién responda.</h1>
    <p class="mt-6 max-w-2xl text-lg text-texto-2 md:text-xl" style="--i: 2">
      Covicen es la nueva concesionaria del Tramo Centro de la Red Federal de Concesiones: <strong class="text-texto">{numero(c.km, 2)} km</strong> sobre {c.rutas.join(', ')}, entre {c.provincias.join(' y ')}. Operación desde el <strong class="text-texto">{fechaLarga(c.inicioOperacion)}</strong>, con la tarifa más baja de los {c.tramosEtapa} tramos adjudicados.
    </p>
    <div class="mt-10 flex flex-wrap items-center gap-4" style="--i: 3">
      <Boton href="/tarifas">Ver tarifas <ArrowRight size={18} aria-hidden="true" slot="icono" /></Boton>
      <Boton href="/el-tramo" variante="secundario">Conocer el tramo</Boton>
    </div>
    <div class="mt-10" style="--i: 4"><CuentaRegresiva fecha={c.inicioOperacion} /></div>
  </div>
</section>
<script src="../../scripts/cuenta-regresiva.ts"></script>
```

`src/components/home/AccesosRapidos.astro`:
```astro
---
import { Banknote, CreditCard, Map, Phone } from '@lucide/astro';
import type { Contacto } from '@/lib/datos/esquemas';
import { ruta } from '@/lib/rutas';
interface Props { contacto: Contacto }
const { contacto } = Astro.props;
const tel = contacto.emergencias.telefono;
const accesos = [
  { Icono: Banknote, titulo: 'Tarifas', texto: 'Cuánto cuesta y desde cuándo.', href: ruta('/tarifas') },
  { Icono: Phone, titulo: 'Emergencias', texto: tel ? `Llamá al ${tel}` : 'Auxilio y asistencia en ruta.', href: tel ? `tel:${tel.replace(/[^\d+]/g, '')}` : ruta('/emergencias'), vial: true },
  { Icono: Map, titulo: 'El tramo', texto: 'Rutas, ciudades y peajes.', href: ruta('/el-tramo') },
  { Icono: CreditCard, titulo: 'Medios de pago', texto: 'TelePASE, efectivo y Free Flow.', href: ruta('/medios-de-pago') },
];
---
<section class="relative z-10 -mt-12">
  <ul class="contenedor escalonar grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {accesos.map(({ Icono, ...a }, i) => (
      <li style={`--i: ${i}`}>
        <a href={a.href} class:list={['acceso esquineros flex h-full items-start gap-4 rounded-md border p-5 no-underline', a.vial ? 'border-vial/60 bg-vial text-fondo' : 'border-borde bg-fondo-2 text-texto']}>
          <Icono size={24} aria-hidden="true" class="mt-0.5 shrink-0" />
          <span><span class="block font-extrabold">{a.titulo}</span><span class:list={['mt-1 block text-sm', a.vial ? 'text-fondo/80' : 'text-texto-2']}>{a.texto}</span></span>
        </a>
      </li>
    ))}
  </ul>
</section>
<style>
  .acceso { transition: transform var(--dur-ui) var(--ease-salida), border-color var(--dur-ui), box-shadow var(--dur-ui); }
  .acceso:hover, .acceso:focus-visible { transform: translateY(-2px); border-color: var(--color-borde-fuerte); box-shadow: 0 16px 40px -24px var(--color-glow); }
</style>
```

`src/components/home/TarifaDestacada.astro`:
```astro
---
import { ArrowRight, ExternalLink } from '@lucide/astro';
import IconoVehiculo from '@/components/ilustraciones/IconoVehiculo.astro';
import Boton from '@/components/ui/Boton.astro';
import Seccion from '@/components/ui/Seccion.astro';
import Senal from '@/components/ui/Senal.astro';
import type { Empresa, Tarifario } from '@/lib/datos/esquemas';
import { conIva, fechaCorta, fechaLarga, moneda } from '@/lib/formato';
interface Props { tarifario: Tarifario; empresa: Empresa }
const { tarifario, empresa } = Astro.props;
const auto = tarifario.tarifas.find((t) => t.categoria === 'cat-2');
if (!auto || auto.montoSinIva === null) throw new Error('TarifaDestacada: falta la tarifa de auto');
const sinIva = auto.montoSinIva;
---
<Seccion id="tarifa" indice="01" eyebrow="Tarifa" titulo="La más baja de los ocho tramos." intro="En la Red Federal de Concesiones gana quien ofrece el peaje más barato. Covicen ganó ofreciendo el más barato de todos.">
  <div class="revelar grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
    <div class="esquineros rounded-md border border-borde bg-superficie/50 p-8">
      <div class="flex items-center gap-3 text-texto-2"><IconoVehiculo categoria="cat-2" size={32} /> <span>{auto.nombre} · {auto.descripcion}</span></div>
      <p class="mt-6 flex flex-wrap items-baseline gap-x-3">
        <span class="font-extrabold leading-none tracking-[var(--tracking-titulo)] text-texto" style="font-size: clamp(3rem, 2rem + 5vw, 6.5rem)">{moneda(sinIva)}</span>
        <span class="text-lg text-texto-2">+ IVA</span>
      </p>
      <p class="mt-3 text-texto-2"><strong class="text-texto">{moneda(conIva(sinIva, tarifario.alicuotaIva))}</strong> con IVA incluido.</p>
      <div class="mt-6 flex flex-wrap items-center gap-3">
        <Senal>{tarifario.origen === 'oferta' ? 'Tarifa ofertada' : 'Tarifa homologada'}</Senal>
        <span class="text-sm text-texto-2">Vigencia: {tarifario.vigencia.desde ? `desde el ${fechaLarga(tarifario.vigencia.desde)}` : tarifario.vigencia.descripcion}</span>
      </div>
    </div>
    <div class="flex flex-col gap-5">
      <p class="text-texto-2">Tope de la licitación: <span class="tabular-nums text-texto">{moneda(empresa.concesion.tarifaTopeSinIva)} + IVA</span>. Oferta de Covicen: <span class="tabular-nums text-texto">{moneda(sinIva)} + IVA</span>. Adjudicado el {fechaCorta(empresa.concesion.adjudicacion.fecha)} por {empresa.concesion.adjudicacion.resolucion}.</p>
      <a href={empresa.concesion.adjudicacion.url} rel="noopener noreferrer" target="_blank" class="link-crece inline-flex items-center gap-1 self-start text-sm">Ver la resolución en el Boletín Oficial <ExternalLink size={14} aria-hidden="true" /></a>
      <div><Boton href="/tarifas" variante="secundario">Tarifario completo por categoría <ArrowRight size={18} aria-hidden="true" slot="icono" /></Boton></div>
      <p class="text-xs text-texto-3">Publicado el {fechaCorta(tarifario.publicadoEl)}. {tarifario.avisos[2]}</p>
    </div>
  </div>
</Seccion>
```

`src/components/home/ElTramo.astro`:
```astro
---
import { ArrowRight } from '@lucide/astro';
import MapaTramo from '@/components/ilustraciones/MapaTramo.astro';
import Boton from '@/components/ui/Boton.astro';
import Mojon from '@/components/ui/Mojon.astro';
import Seccion from '@/components/ui/Seccion.astro';
import type { Tramo } from '@/lib/datos/esquemas';
interface Props { tramo: Tramo }
const { tramo } = Astro.props;
---
<Seccion id="tramo" indice="02" eyebrow="El tramo" titulo="Tres rutas, dos provincias, un corredor." intro={`${tramo.rutas.map((r) => `${r.nombre} (${r.descripcion})`).join(', ')}. Las estaciones de peaje, en amarillo.`} fondo="fondo-2">
  <div class="grid gap-12 lg:grid-cols-[2fr_1fr] lg:items-center">
    <div class="revelar"><MapaTramo {tramo} modo="scroll" /></div>
    <div class="escalonar flex flex-col gap-10">
      <div style="--i: 0"><Mojon valor={Math.round(tramo.km)} unidad="km" etiqueta="de rutas nacionales" animar /></div>
      <div style="--i: 1"><Mojon valor={tramo.rutas.length} etiqueta="rutas: RN 9, RN 19 y RN 34" animar /></div>
      <div style="--i: 2"><Mojon valor={tramo.cabinas.length} etiqueta="estaciones de peaje" animar /></div>
      <div style="--i: 3"><Boton href="/el-tramo" variante="secundario">Ver el tramo en detalle <ArrowRight size={18} aria-hidden="true" slot="icono" /></Boton></div>
    </div>
  </div>
</Seccion>
```

`src/components/home/ObrasYEstado.astro`:
```astro
---
import HuecoCapacidad from '@/components/HuecoCapacidad.astro';
import Card from '@/components/ui/Card.astro';
import Seccion from '@/components/ui/Seccion.astro';
import Senal from '@/components/ui/Senal.astro';
import type { Obra } from '@/lib/datos/esquemas';
interface Props { obras: Obra[] }
const { obras } = Astro.props;
const estados = { planificada: 'Planificada', 'en-ejecucion': 'En ejecución', terminada: 'Terminada' } as const;
---
<Seccion id="obras" indice="03" eyebrow="Obras y estado" titulo="Primero las obras. Después, el peaje pleno." intro="El contrato no permite cobrar la tarifa ofertada hasta alcanzar la transitabilidad óptima que verifica Vialidad Nacional. Acá se sigue el avance.">
  <div class="grid gap-8 lg:grid-cols-[1fr_1fr]">
    <ul class="escalonar grid gap-3">
      {obras.map((o, i) => (
        <li style={`--i: ${i}`}>
          <Card href="/obras" etiqueta={o.tipo}>
            <div class="flex flex-wrap items-center gap-3"><h3 class="text-lg">{o.titulo}</h3><Senal variante={o.estado === 'en-ejecucion' ? 'vial' : 'frio'}>{estados[o.estado]}</Senal></div>
            <p class="mt-2 text-sm text-texto-2">{o.descripcion}</p>
          </Card>
        </li>
      ))}
    </ul>
    <div class="revelar lg:sticky lg:top-28 lg:self-start">
      <HuecoCapacidad capacidad="estadoRutasEnVivo" titulo="Estado de las rutas en tiempo real" descripcion="Cortes, desvíos y clima por ruta y kilómetro. Este espacio se conecta al centro de operaciones cuando entre en servicio." alternativaHref="/emergencias" alternativaTexto="Mientras tanto: emergencias y auxilio" />
    </div>
  </div>
</Seccion>
```

`src/components/home/Servicios.astro`:
```astro
---
import { CreditCard, LifeBuoy, ShieldCheck } from '@lucide/astro';
import Card from '@/components/ui/Card.astro';
import Seccion from '@/components/ui/Seccion.astro';
const servicios = [
  { Icono: LifeBuoy, titulo: 'Emergencias y auxilio en ruta', texto: 'Asistencia mecánica y de emergencias en todo el tramo, con un número visible en cada página de este sitio.', href: '/emergencias' },
  { Icono: ShieldCheck, titulo: 'Seguridad vial', texto: 'Móviles de seguridad, señalización renovada y consejos para manejar mejor en RN 9, 19 y 34.', href: '/seguridad-vial' },
  { Icono: CreditCard, titulo: 'Medios de pago', texto: 'TelePASE en todas las estaciones, efectivo en cabina y Free Flow en las estaciones nuevas.', href: '/medios-de-pago' },
];
---
<Seccion id="servicios" indice="04" eyebrow="Servicios al usuario" titulo="Lo que cubre el peaje." fondo="plano">
  <ul class="escalonar grid gap-4 md:grid-cols-3">
    {servicios.map(({ Icono, ...s }, i) => (
      <li style={`--i: ${i}`}><Card href={s.href}><Icono size={28} aria-hidden="true" class="text-acento" /><h3 class="mt-4 text-xl">{s.titulo}</h3><p class="mt-2 text-texto-2">{s.texto}</p></Card></li>
    ))}
  </ul>
</Seccion>
```

`src/components/home/NovedadesRecientes.astro`:
```astro
---
import Card from '@/components/ui/Card.astro';
import Seccion from '@/components/ui/Seccion.astro';
import type { Novedad } from '@/lib/datos/esquemas';
import { fechaLarga } from '@/lib/formato';
interface Props { novedades: Novedad[] }
const { novedades } = Astro.props;
---
{novedades.length > 0 && (
  <Seccion id="novedades" indice="05" eyebrow="Novedades" titulo="Lo último.">
    <ul class="escalonar grid gap-4 md:grid-cols-3">
      {novedades.slice(0, 3).map((n, i) => (
        <li style={`--i: ${i}`}><Card href={`/novedades/${n.slug}`} etiqueta={fechaLarga(n.fecha)}><h3 class="text-xl">{n.titulo}</h3><p class="mt-2 text-texto-2">{n.resumen}</p></Card></li>
      ))}
    </ul>
  </Seccion>
)}
```

`src/components/home/Consorcio.astro`:
```astro
---
import Mojon from '@/components/ui/Mojon.astro';
import Seccion from '@/components/ui/Seccion.astro';
import type { Empresa } from '@/lib/datos/esquemas';
interface Props { empresa: Empresa }
const { empresa } = Astro.props;
---
<Seccion id="consorcio" indice="06" eyebrow="Quiénes somos" titulo="Un consorcio de constructoras viales, con contrato a 20 años." intro="Covicen es la sociedad que integran las tres empresas adjudicatarias del Tramo Centro. Inversión 100% privada, sin subsidios, bajo supervisión de Vialidad Nacional." fondo="fondo-2">
  <div class="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
    <div class="escalonar flex gap-10">
      <div style="--i: 0"><Mojon valor={empresa.concesion.plazoAnios} unidad="años" etiqueta="de concesión" animar /></div>
      <div style="--i: 1"><Mojon valor={empresa.consorcio.length} etiqueta="empresas en el consorcio" animar /></div>
    </div>
    <ul class="escalonar divide-y divide-borde border-y border-borde">
      {empresa.consorcio.map((e, i) => (
        <li class="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between" style={`--i: ${i}`}><span class="font-extrabold text-texto">{e.nombre}</span><span class="text-sm text-texto-2">{e.descripcion}</span></li>
      ))}
    </ul>
  </div>
</Seccion>
```

`src/components/home/FaqCorto.astro`:
```astro
---
import { ArrowRight } from '@lucide/astro';
import Faq from '@/components/Faq.astro';
import Boton from '@/components/ui/Boton.astro';
import Seccion from '@/components/ui/Seccion.astro';
import type { Pregunta } from '@/lib/datos/esquemas';
interface Props { preguntas: Pregunta[] }
const { preguntas } = Astro.props;
---
<Seccion id="faq" indice="07" eyebrow="Preguntas frecuentes" titulo="Lo que más se pregunta.">
  <div class="max-w-3xl"><Faq preguntas={preguntas.filter((p) => p.enHome)} /><div class="mt-8"><Boton href="/preguntas-frecuentes" variante="secundario">Todas las preguntas <ArrowRight size={18} aria-hidden="true" slot="icono" /></Boton></div></div>
</Seccion>
```

`src/components/home/ContactoCta.astro`:
```astro
---
import { MessageCircle } from '@lucide/astro';
import Boton from '@/components/ui/Boton.astro';
import type { Contacto } from '@/lib/datos/esquemas';
import { enlaceWhatsapp } from '@/lib/whatsapp';
interface Props { contacto: Contacto }
const { contacto } = Astro.props;
---
<section class="plano border-y border-borde py-20">
  <div class="contenedor revelar flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
    <div><p class="eyebrow">Contacto</p><h2 class="mt-3">¿Consultas, reclamos, propuestas?</h2><p class="mt-3 max-w-xl text-texto-2">Escribinos por WhatsApp desde el formulario: llega con tus datos y el motivo ya cargados.</p></div>
    <div class="flex flex-wrap gap-3">
      <Boton href="/contacto">Ir al formulario</Boton>
      {contacto.whatsapp.numero && <Boton href={enlaceWhatsapp(contacto.whatsapp.numero, 'Hola Covicen, quiero hacer una consulta.')} variante="secundario" externo><MessageCircle size={18} aria-hidden="true" /> WhatsApp directo</Boton>}
    </div>
  </div>
</section>
```

- [ ] **Step 5: `src/pages/index.astro`**

```astro
---
import Base from '@/layouts/Base.astro';
import AccesosRapidos from '@/components/home/AccesosRapidos.astro';
import Consorcio from '@/components/home/Consorcio.astro';
import ContactoCta from '@/components/home/ContactoCta.astro';
import ElTramo from '@/components/home/ElTramo.astro';
import FaqCorto from '@/components/home/FaqCorto.astro';
import Hero from '@/components/home/Hero.astro';
import NovedadesRecientes from '@/components/home/NovedadesRecientes.astro';
import ObrasYEstado from '@/components/home/ObrasYEstado.astro';
import Servicios from '@/components/home/Servicios.astro';
import TarifaDestacada from '@/components/home/TarifaDestacada.astro';
import { datos } from '@/lib/datos';

const [empresa, contacto, tramo, tarifario, obras, novedades, faq] = await Promise.all([
  datos.empresa(), datos.contacto(), datos.tramo(), datos.tarifario(), datos.obras(), datos.novedades(), datos.faq(),
]);
---
<Base titulo="Inicio" descripcion="Covicen, concesionaria del Tramo Centro de la Red Federal de Concesiones: 681 km sobre RN 9, RN 19 y RN 34 en Córdoba y Santa Fe. Tarifas, peajes, emergencias y obras.">
  <Hero {empresa} />
  <AccesosRapidos {contacto} />
  <TarifaDestacada {tarifario} {empresa} />
  <ElTramo {tramo} />
  <ObrasYEstado {obras} />
  <Servicios />
  <NovedadesRecientes {novedades} />
  <Consorcio {empresa} />
  <FaqCorto preguntas={faq} />
  <ContactoCta {contacto} />
</Base>
```
Run: `pnpm test tests/components/home.test.ts && pnpm check && pnpm build`
Expected: PASS (5); build OK. Abrí `pnpm dev` y mirá la Home en http://localhost:4321/ : hero con la ruta dibujándose, cuenta regresiva viva, accesos rápidos, tarifa, mapa con balizas, obras + hueco, servicios, consorcio, FAQ, contacto. (Juli valida lo visual; vos verificás que no haya errores en consola de Astro.)

- [ ] **Step 6: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `feat(home): hero con ruta y cuenta regresiva, tarifa destacada, mapa, obras, servicios, consorcio, FAQ`

---

### Task 11: Páginas del automovilista: tarifas, el tramo, servicios, emergencias, medios de pago, seguridad vial

**Files:**
- Create: `src/components/TablaTarifas.astro`, `src/pages/tarifas.astro`, `src/pages/el-tramo.astro`, `src/pages/servicios.astro`, `src/pages/emergencias.astro`, `src/pages/medios-de-pago.astro`, `src/pages/seguridad-vial.astro`, `tests/components/tarifas.test.ts`

**Interfaces:**
- Produces: `<TablaTarifas tarifario />` con `<table>` accesible (`<caption>`, `<th scope="col">`), fila por categoría, ícono, guion + "a confirmar" cuando `montoSinIva === null`.

- [ ] **Step 1: Test (falla primero)**

`tests/components/tarifas.test.ts`:
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import TablaTarifas from '@/components/TablaTarifas.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('TablaTarifas', () => {
  it('tabla accesible con vigencia visible, 6 filas y "a confirmar" donde no hay valor', async () => {
    const c = await AstroContainer.create();
    const html = (await c.renderToString(TablaTarifas, { props: { tarifario: await fuenteLocalJson.tarifario() } })).replace(/[  ]/g, ' ');
    expect(html).toContain('<caption');
    expect(html).toContain('scope="col"');
    expect(html.match(/<tr class="fila/g)?.length).toBe(6);
    expect(html).toContain('Vigencia');
    expect(html).toContain('$ 1.399');
    expect(html.match(/a confirmar/g)?.length).toBe(5);
  });
});
```

- [ ] **Step 2: `src/components/TablaTarifas.astro`**

```astro
---
import IconoVehiculo from '@/components/ilustraciones/IconoVehiculo.astro';
import Senal from '@/components/ui/Senal.astro';
import type { Tarifario } from '@/lib/datos/esquemas';
import { conIva, fechaCorta, fechaLarga, moneda } from '@/lib/formato';
interface Props { tarifario: Tarifario }
const { tarifario: t } = Astro.props;
const vigencia = t.vigencia.desde ? `Vigencia: desde el ${fechaLarga(t.vigencia.desde)}.` : `Vigencia: ${t.vigencia.descripcion}`;
---
<div class="revelar">
  <div class="mb-6 flex flex-wrap items-center gap-3">
    <Senal>{t.origen === 'oferta' ? 'Tarifa ofertada' : 'Tarifa homologada'}</Senal>
    <p class="text-texto-2">{vigencia}</p>
  </div>
  <div class="overflow-x-auto rounded-md border border-borde">
    <table class="w-full border-collapse text-left">
      <caption class="sr-only">Tarifas de peaje del Tramo Centro por categoría de vehículo, en pesos argentinos. {vigencia}</caption>
      <thead class="bg-fondo-2 text-sm uppercase tracking-wider text-texto-2">
        <tr><th scope="col" class="px-4 py-3">Categoría</th><th scope="col" class="px-4 py-3">Vehículos</th><th scope="col" class="px-4 py-3 text-right">Sin IVA</th><th scope="col" class="px-4 py-3 text-right">Con IVA</th></tr>
      </thead>
      <tbody class="divide-y divide-borde">
        {t.tarifas.map((f) => (
          <tr class="fila transition-colors hover:bg-superficie">
            <th scope="row" class="px-4 py-4 font-semibold text-texto"><span class="flex items-center gap-3"><IconoVehiculo categoria={f.categoria} class="icono text-texto-2" /> {f.nombre}</span></th>
            <td class="px-4 py-4 text-texto-2">{f.descripcion}{f.nota && <span class="mt-1 block text-xs text-texto-3">{f.nota}</span>}</td>
            <td class="px-4 py-4 text-right tabular-nums text-texto">{f.montoSinIva === null ? <span class="text-texto-3">— <span class="text-xs uppercase tracking-wider">a confirmar</span></span> : moneda(f.montoSinIva)}</td>
            <td class="px-4 py-4 text-right tabular-nums text-texto">{f.montoSinIva === null ? <span class="text-texto-3">—</span> : moneda(conIva(f.montoSinIva, t.alicuotaIva))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  <ul class="mt-6 flex flex-col gap-2 text-sm text-texto-2">{t.avisos.map((a) => <li class="flex gap-2"><span aria-hidden="true">—</span>{a}</li>)}</ul>
  <p class="mt-4 text-xs text-texto-3">Publicado el {fechaCorta(t.publicadoEl)}. Fuente: <a href={t.fuente.url} rel="noopener noreferrer" target="_blank">{t.fuente.nombre}</a>.</p>
</div>
<style>
  .fila:hover .icono { color: var(--color-acento); }
</style>
```
Agregá a `global.css` (`@layer components`): `.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }` (Tailwind ya trae `sr-only`; esta línea solo si el `<caption>` no queda oculto).

- [ ] **Step 3: `src/pages/tarifas.astro`**

```astro
---
import Base from '@/layouts/Base.astro';
import TablaTarifas from '@/components/TablaTarifas.astro';
import Seccion from '@/components/ui/Seccion.astro';
import Boton from '@/components/ui/Boton.astro';
import { datos } from '@/lib/datos';
const [tarifario, empresa] = await Promise.all([datos.tarifario(), datos.empresa()]);
---
<Base titulo="Tarifas" descripcion="Tarifa del peaje del Tramo Centro (RN 9, RN 19 y RN 34): $1.399 más IVA por auto, la más baja de la Red Federal de Concesiones. Categorías, vigencia y fuente oficial." migas={[{ nombre: 'Tarifas', href: '/tarifas' }]}>
  <Seccion nivel="h1" eyebrow="Tarifas" titulo="Cuánto cuesta el peaje." intro={`Tarifa ofertada por Covicen en la adjudicación del Tramo Centro: ${empresa.concesion.tarifaOfertadaSinIva.toLocaleString('es-AR')} pesos más IVA por auto. Tope de la licitación: ${empresa.concesion.tarifaTopeSinIva.toLocaleString('es-AR')} pesos.`} class="pt-10">
    <TablaTarifas {tarifario} />
    <div class="revelar mt-12 flex flex-wrap gap-3">
      <Boton href="/medios-de-pago" variante="secundario">Cómo pagar</Boton>
      <Boton href="/el-tramo" variante="secundario">Dónde están los peajes</Boton>
      <Boton href="/preguntas-frecuentes#desde-cuando-se-cobra" variante="secundario">¿Desde cuándo se cobra?</Boton>
    </div>
  </Seccion>
</Base>
```

- [ ] **Step 4: `src/pages/el-tramo.astro`** (sección sticky narrativa: mapa fijo, paneles que pasan)

```astro
---
import Base from '@/layouts/Base.astro';
import MapaTramo from '@/components/ilustraciones/MapaTramo.astro';
import Mojon from '@/components/ui/Mojon.astro';
import Seccion from '@/components/ui/Seccion.astro';
import Senal from '@/components/ui/Senal.astro';
import { datos } from '@/lib/datos';
import { numero } from '@/lib/formato';
const tramo = await datos.tramo();
const paneles = [
  { valor: Math.round(tramo.km), unidad: 'km', etiqueta: 'de rutas nacionales', texto: `Desde Rosario hasta Pilar por la autopista, y hacia San Francisco, Rafaela y Santa Fe. ${numero(tramo.km, 2)} km bajo una misma concesión.` },
  { valor: tramo.rutas.length, unidad: 'rutas', etiqueta: 'RN 9, RN 19 y RN 34', texto: tramo.rutas.map((r) => `${r.nombre}: ${r.desde} → ${r.hasta}${r.km ? ` (${r.km} km)` : ''}.`).join(' ') },
  { valor: tramo.provincias.length, unidad: 'provincias', etiqueta: tramo.provincias.join(' y '), texto: 'El límite provincial queda a la altura de Leones, sobre la autopista.' },
  { valor: tramo.cabinas.length, unidad: 'peajes', etiqueta: `${tramo.cabinas.filter((c) => c.situacion === 'existente').length} existentes y ${tramo.cabinas.filter((c) => c.situacion === 'nueva').length} nuevos`, texto: 'Las estaciones nuevas nacen con cobro electrónico y Free Flow.' },
];
---
<Base titulo="El tramo" descripcion="El Tramo Centro de la Red Federal de Concesiones: 681,92 km sobre RN 9 (autopista Rosario–Córdoba), RN 19 y RN 34, en Córdoba y Santa Fe. Mapa, ciudades y estaciones de peaje." migas={[{ nombre: 'El tramo', href: '/el-tramo' }]}>
  <Seccion nivel="h1" eyebrow="El tramo" titulo="681 kilómetros de centro." intro="Un corredor que une Rosario con Córdoba y se abre hacia San Francisco, Rafaela y Santa Fe." class="pt-10 pb-0" />
  <section class="contenedor grid gap-10 pb-24 lg:grid-cols-2 lg:gap-16">
    <div class="lg:sticky lg:top-28 lg:self-start"><MapaTramo {tramo} modo="scroll" /></div>
    <ol class="flex flex-col gap-24 lg:gap-[40vh] lg:py-[20vh]">
      {paneles.map((p) => (
        <li class="revelar"><Mojon valor={p.valor} unidad={p.unidad} etiqueta={p.etiqueta} animar /><p class="mt-6 max-w-prose text-lg text-texto-2">{p.texto}</p></li>
      ))}
    </ol>
  </section>
  <Seccion indice="01" eyebrow="Estaciones de peaje" titulo="Dónde se paga." fondo="fondo-2">
    <ul class="escalonar grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {tramo.cabinas.map((c, i) => (
        <li class="esquineros rounded-md border border-borde bg-superficie/50 p-5" style={`--i: ${i}`}>
          <div class="flex items-center justify-between gap-3"><span class="eyebrow">{c.ruta}{c.km !== null && ` · km ${c.km}`}</span><Senal variante={c.situacion === 'nueva' ? 'vial' : 'frio'}>{c.situacion === 'nueva' ? 'Nueva' : 'Existente'}</Senal></div>
          <h3 class="mt-3 text-xl">{c.nombre}</h3>
          <p class="mt-1 text-sm text-texto-2">{c.localidad}, {c.provincia}</p>
          {c.fuente && <p class="mt-3 text-xs text-texto-3">Fuente: <a href={c.fuente.url} rel="noopener noreferrer" target="_blank">{c.fuente.nombre}</a></p>}
        </li>
      ))}
    </ul>
    <ul class="revelar mt-8 flex flex-col gap-2 text-sm text-texto-2">{tramo.avisos.map((a) => <li class="flex gap-2"><span aria-hidden="true">—</span>{a}</li>)}</ul>
  </Seccion>
</Base>
```

- [ ] **Step 5: `src/pages/servicios.astro`, `emergencias.astro`, `medios-de-pago.astro`, `seguridad-vial.astro`**

`servicios.astro`:
```astro
---
import Base from '@/layouts/Base.astro';
import Servicios from '@/components/home/Servicios.astro';
import HuecoCapacidad from '@/components/HuecoCapacidad.astro';
import Seccion from '@/components/ui/Seccion.astro';
---
<Base titulo="Servicios al usuario" descripcion="Servicios de Covicen para quienes circulan por el Tramo Centro: emergencias y auxilio en ruta, seguridad vial, medios de pago y TelePASE." migas={[{ nombre: 'Servicios', href: '/servicios' }]}>
  <Seccion nivel="h1" eyebrow="Servicios" titulo="Lo que cubre el peaje." intro="Además de mantener la ruta, el contrato obliga a prestar servicios al usuario. Estos son los que arrancan con la operación." class="pt-10 pb-0" />
  <Servicios />
  <Seccion indice="02" eyebrow="Más adelante" titulo="Lo que se suma cuando existan los sistemas.">
    <div class="grid gap-4 md:grid-cols-2">
      <HuecoCapacidad capacidad="oficinaVirtual" titulo="Oficina virtual" descripcion="Consulta y pago de facturas de TelePASE y trámites en línea." alternativaHref="/medios-de-pago" alternativaTexto="Ver medios de pago" />
      <HuecoCapacidad capacidad="ticketingReclamos" titulo="Seguimiento de reclamos" descripcion="Número de reclamo y estado en línea." alternativaHref="/contacto" alternativaTexto="Hacer un reclamo por WhatsApp" />
    </div>
  </Seccion>
</Base>
```

`emergencias.astro`:
```astro
---
import { MessageCircle, Phone } from '@lucide/astro';
import Base from '@/layouts/Base.astro';
import Boton from '@/components/ui/Boton.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
import { enlaceWhatsapp } from '@/lib/whatsapp';
const contacto = await datos.contacto();
const tel = contacto.emergencias.telefono;
const pasos = [
  ['Salí de la calzada', 'Detenete en la banquina, lo más a la derecha posible, y encendé las balizas.'],
  ['Protegete', 'Bajá por el lado contrario al tránsito y esperá detrás del guardarraíl si lo hay. Chaleco reflectivo de noche.'],
  ['Llamá', 'Indicá ruta, sentido y kilómetro (los mojones están cada kilómetro). Quedate en línea.'],
  ['Esperá el auxilio', 'El móvil de Covicen llega, asegura el lugar y asiste. No aceptes remolques no identificados.'],
];
---
<Base titulo="Emergencias" descripcion="Emergencias y auxilio en ruta en el Tramo Centro (RN 9, RN 19 y RN 34): qué hacer ante un desperfecto o accidente y a quién llamar." migas={[{ nombre: 'Servicios', href: '/servicios' }, { nombre: 'Emergencias', href: '/emergencias' }]}>
  <Seccion nivel="h1" eyebrow="Emergencias" titulo="Ante una emergencia en la ruta." class="pt-10">
    <div class="revelar esquineros rounded-md border border-vial/50 bg-vial p-8 text-fondo">
      <p class="eyebrow text-fondo/80">{contacto.emergencias.etiqueta} · 24 horas</p>
      {tel ? (
        <a href={`tel:${tel.replace(/[^\d+]/g, '')}`} class="mt-3 inline-flex items-center gap-4 font-extrabold tabular-nums text-fondo no-underline" style="font-size: clamp(2.5rem, 2rem + 4vw, 5rem)"><Phone size={40} aria-hidden="true" /> {tel}</a>
      ) : (
        <p class="mt-3 font-extrabold text-fondo" style="font-size: clamp(1.75rem, 1.25rem + 2vw, 3rem)" data-emergencias="a-confirmar">Número a confirmar antes del inicio de la operación.</p>
      )}
      <p class="mt-4 max-w-prose text-fondo/85">Auxilio mecánico, asistencia en accidentes, animales u objetos en la calzada. {contacto.whatsapp.numero && <a href={enlaceWhatsapp(contacto.whatsapp.numero, 'EMERGENCIA en ruta. Ruta: / Km: / Sentido: ')} class="inline-flex items-center gap-1 font-semibold text-fondo underline" rel="noopener"><MessageCircle size={16} aria-hidden="true" /> También por WhatsApp</a>}</p>
    </div>
    <ol class="escalonar mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {pasos.map(([t, d], i) => (
        <li class="rounded-md border border-borde bg-superficie/40 p-6" style={`--i: ${i}`}><span class="eyebrow tabular-nums">0{i + 1}</span><h2 class="mt-3 text-xl">{t}</h2><p class="mt-2 text-texto-2">{d}</p></li>
      ))}
    </ol>
    <div class="revelar mt-12"><Boton href="/seguridad-vial" variante="secundario">Consejos de seguridad vial</Boton></div>
  </Seccion>
</Base>
```

`medios-de-pago.astro`:
```astro
---
import { ExternalLink } from '@lucide/astro';
import Base from '@/layouts/Base.astro';
import HuecoCapacidad from '@/components/HuecoCapacidad.astro';
import Boton from '@/components/ui/Boton.astro';
import Card from '@/components/ui/Card.astro';
import Seccion from '@/components/ui/Seccion.astro';
const medios = [
  { titulo: 'TelePASE', texto: 'El dispositivo es único para toda la red nacional: si ya lo tenés, funciona en el Tramo Centro. No es obligatorio para circular.' },
  { titulo: 'Efectivo en cabina', texto: 'En las estaciones con cabina (Carcarañá, James Craik, Franck) se puede pagar en efectivo.' },
  { titulo: 'Free Flow', texto: 'Las estaciones nuevas (Leones, San Francisco, Totoras) se construyen sin barreras: pórticos que leen el vehículo sin detenerlo.' },
];
---
<Base titulo="Medios de pago" descripcion="Cómo pagar el peaje en el Tramo Centro: TelePASE, efectivo en cabina y Free Flow en las estaciones nuevas de RN 9, RN 19 y RN 34." migas={[{ nombre: 'Servicios', href: '/servicios' }, { nombre: 'Medios de pago', href: '/medios-de-pago' }]}>
  <Seccion nivel="h1" eyebrow="Medios de pago" titulo="Cómo pagar el peaje." intro="Con dispositivo, en efectivo o sin frenar." class="pt-10">
    <ul class="escalonar grid gap-4 md:grid-cols-3">{medios.map((m, i) => <li style={`--i: ${i}`}><Card><h2 class="text-xl">{m.titulo}</h2><p class="mt-2 text-texto-2">{m.texto}</p></Card></li>)}</ul>
    <div class="revelar mt-8 flex flex-wrap gap-3">
      <Boton href="https://www.telepase.com.ar/" variante="secundario" externo>Gestionar TelePASE <ExternalLink size={16} aria-hidden="true" slot="icono" /></Boton>
      <Boton href="/tarifas" variante="secundario">Ver tarifas</Boton>
    </div>
    <div class="mt-12"><HuecoCapacidad capacidad="oficinaVirtual" titulo="Pagá tu factura en línea" descripcion="Consulta y pago de facturas cuando esté operativo el sistema de facturación." alternativaHref="/contacto" alternativaTexto="Consultar por WhatsApp" /></div>
  </Seccion>
</Base>
```

`seguridad-vial.astro`:
```astro
---
import Base from '@/layouts/Base.astro';
import Seccion from '@/components/ui/Seccion.astro';
const consejos = [
  ['Distancia de seguimiento', 'En autopista, tres segundos respecto del vehículo de adelante. Con lluvia o niebla, el doble.'],
  ['Velocidad', 'Máxima 130 km/h en autopista y 110 en ruta convencional para autos; menos con lluvia, viento o niebla. La mínima en autopista es 60.'],
  ['Luces bajas siempre', 'Es obligatorio circular con luces bajas encendidas de día y de noche en rutas nacionales.'],
  ['Niebla', 'La zona de Leones, Marcos Juárez y la ruta 34 tienen niebla frecuente en otoño e invierno. Bajá la velocidad, luces bajas, no frenes de golpe.'],
  ['Animales sueltos', 'Son frecuentes en RN 19 y RN 34. De noche, atención a los ojos que reflejan la luz. Avisá al número de emergencias.'],
  ['Cansancio', 'Cada dos horas, parada. Si cabeceás, no se pasa con música: se pasa durmiendo veinte minutos.'],
  ['Sobrepaso', 'Solo con línea discontinua y visibilidad completa. En autopista, por la izquierda; después volvé al carril derecho.'],
  ['Cinturón y sillas', 'Todos los ocupantes con cinturón; menores de diez años atrás, con sistema de retención según edad.'],
];
---
<Base titulo="Seguridad vial" descripcion="Consejos de seguridad vial para RN 9, RN 19 y RN 34: distancia, velocidad, niebla, animales sueltos, cansancio y sobrepaso. Por Covicen, concesionaria del Tramo Centro." migas={[{ nombre: 'Seguridad vial', href: '/seguridad-vial' }]}>
  <Seccion nivel="h1" eyebrow="Seguridad vial" titulo="Manejar bien el centro del país." intro="Ocho hábitos que evitan la mayoría de los siniestros en estas tres rutas." class="pt-10">
    <ol class="escalonar grid gap-4 md:grid-cols-2">
      {consejos.map(([t, d], i) => (
        <li class="esquineros rounded-md border border-borde bg-superficie/40 p-6" style={`--i: ${i}`}><span class="eyebrow tabular-nums">0{i + 1}</span><h2 class="mt-3 text-xl">{t}</h2><p class="mt-2 text-texto-2">{d}</p></li>
      ))}
    </ol>
  </Seccion>
</Base>
```
Run: `pnpm test tests/components/tarifas.test.ts && pnpm check && pnpm build && ls dist/tarifas dist/el-tramo dist/servicios dist/emergencias dist/medios-de-pago dist/seguridad-vial`
Expected: PASS; 6 carpetas con `index.html`.

- [ ] **Step 6: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `feat(paginas): tarifas, el tramo, servicios, emergencias, medios de pago, seguridad vial`

---

### Task 12: Páginas institucionales: obras, quiénes somos, políticas, transparencia, trabajá con nosotros, proveedores, privacidad

**Files:**
- Create: `src/components/Formulario.astro`, `src/scripts/formulario.ts`, `src/pages/obras.astro`, `src/pages/quienes-somos.astro`, `src/pages/politicas.astro`, `src/pages/transparencia.astro`, `src/pages/trabaja-con-nosotros.astro`, `src/pages/proveedores.astro`, `src/pages/privacidad.astro`, `tests/components/formulario.test.ts`

**Interfaces:**
- Produces: `<Formulario asunto whatsapp email campos={Campo[]} textoBoton? />` con `Campo = { nombre: string; etiqueta: string; tipo?: 'text' | 'email' | 'tel' | 'textarea' | 'select'; opciones?: string[]; requerido?: boolean; placeholder?: string }`. Sin JS: `action` apunta a `wa.me` (o `mailto:`) con el asunto. Con JS (`scripts/formulario.ts`): arma el texto con todos los campos y abre WhatsApp.

- [ ] **Step 1: Test (falla primero)**

`tests/components/formulario.test.ts`:
```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Formulario from '@/components/Formulario.astro';

const campos = [{ nombre: 'nombre', etiqueta: 'Nombre', requerido: true }, { nombre: 'mensaje', etiqueta: 'Mensaje', tipo: 'textarea' }];

describe('Formulario', () => {
  it('con WhatsApp: action a wa.me, labels asociados, botón de envío', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Formulario, { props: { asunto: 'Consulta', whatsapp: '5493510000000', email: null, campos } });
    expect(html).toContain('action="https://wa.me/5493510000000?text=Asunto%3A%20Consulta"');
    expect(html).toContain('<label for="campo-nombre"');
    expect(html).toContain('id="campo-nombre"');
    expect(html).toContain('required');
    expect(html).toContain('type="submit"');
  });
  it('sin canales: lo dice y no promete envío', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Formulario, { props: { asunto: 'Consulta', whatsapp: null, email: null, campos } });
    expect(html).toContain('data-canal="a-confirmar"');
  });
});
```

- [ ] **Step 2: `src/components/Formulario.astro` + `src/scripts/formulario.ts`**

```astro
---
import { Mail, MessageCircle } from '@lucide/astro';
import { ruta } from '@/lib/rutas';
import { enlaceWhatsapp } from '@/lib/whatsapp';
export interface Campo { nombre: string; etiqueta: string; tipo?: 'text' | 'email' | 'tel' | 'textarea' | 'select'; opciones?: string[]; requerido?: boolean; placeholder?: string }
interface Props { asunto: string; whatsapp: string | null; email: string | null; campos: Campo[]; textoBoton?: string }
const { asunto, whatsapp, email, campos, textoBoton = 'Enviar por WhatsApp' } = Astro.props;
const action = whatsapp ? enlaceWhatsapp(whatsapp, `Asunto: ${asunto}`) : email ? `mailto:${email}?subject=${encodeURIComponent(asunto)}` : '#';
const canal = whatsapp ? 'whatsapp' : email ? 'email' : 'a-confirmar';
---
<form class="formulario grid gap-5" data-formulario data-asunto={asunto} data-whatsapp={whatsapp ?? ''} data-email={email ?? ''} data-canal={canal} action={action} method="get" target="_blank" novalidate>
  {campos.map((c) => (
    <div class="grid gap-2">
      <label for={`campo-${c.nombre}`} class="text-sm font-semibold text-texto">{c.etiqueta}{c.requerido && <span class="text-vial" aria-hidden="true"> *</span>}</label>
      {c.tipo === 'textarea' ? (
        <textarea id={`campo-${c.nombre}`} name={c.nombre} rows="5" required={c.requerido} placeholder={c.placeholder} class="campo"></textarea>
      ) : c.tipo === 'select' ? (
        <select id={`campo-${c.nombre}`} name={c.nombre} required={c.requerido} class="campo">{(c.opciones ?? []).map((o) => <option value={o}>{o}</option>)}</select>
      ) : (
        <input id={`campo-${c.nombre}`} name={c.nombre} type={c.tipo ?? 'text'} required={c.requerido} placeholder={c.placeholder} class="campo" autocomplete={c.tipo === 'email' ? 'email' : c.tipo === 'tel' ? 'tel' : c.nombre === 'nombre' ? 'name' : 'off'} />
      )}
      <p class="error hidden text-sm text-error" data-error-de={c.nombre} aria-live="polite"></p>
    </div>
  ))}
  {canal === 'a-confirmar' ? (
    <p class="rounded-md border border-dashed border-borde-fuerte p-4 text-sm text-texto-2">El canal de contacto se habilita antes del inicio de la operación. Mientras tanto, guardá esta página.</p>
  ) : (
    <div class="flex flex-wrap items-center gap-4">
      <button type="submit" class="btn-enviar inline-flex min-h-11 items-center gap-2 rounded-md bg-acento px-5 py-3 font-semibold text-fondo transition hover:-translate-y-px hover:bg-acento-hover hover:shadow-[0_10px_28px_-10px_var(--color-glow)]">
        {canal === 'whatsapp' ? <MessageCircle size={18} aria-hidden="true" /> : <Mail size={18} aria-hidden="true" />} {canal === 'whatsapp' ? textoBoton : 'Enviar por correo'}
      </button>
      {canal === 'whatsapp' && email && <a href={`mailto:${email}?subject=${encodeURIComponent(asunto)}`} class="link-crece text-sm text-texto-2">o escribinos a {email}</a>}
    </div>
  )}
  <p class="text-xs text-texto-3">Los datos que envíes viajan por el canal que elijas (WhatsApp es un servicio de Meta). Ver <a href={ruta('/privacidad')} class="link-crece">política de privacidad</a>.</p>
</form>
<script src="../scripts/formulario.ts"></script>
<style>
  .campo { width: 100%; border: 1px solid var(--color-borde); border-radius: var(--radius-md); background: var(--color-fondo-2); color: var(--color-texto); padding: 0.75rem 1rem; min-height: 2.75rem; transition: border-color var(--dur-ui), box-shadow var(--dur-ui); }
  .campo:hover { border-color: var(--color-borde-fuerte); }
  .campo:focus { outline: none; border-color: var(--color-acento); box-shadow: 0 0 0 3px var(--color-glow); }
  .campo[aria-invalid="true"] { border-color: var(--color-error); }
  .campo::placeholder { color: var(--color-texto-3); }
</style>
```
`src/scripts/formulario.ts`:
```ts
// Arma el mensaje con todos los campos y lo manda por WhatsApp (o mail). Valida en cliente con mensajes en español.
const mensajeDe = (v: ValidityState): string =>
  v.valueMissing ? 'Completá este campo.' : v.typeMismatch ? 'Revisá el formato.' : v.tooShort ? 'Es muy corto.' : 'Revisá este campo.';
const iniciar = () => {
  document.querySelectorAll<HTMLFormElement>('[data-formulario]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valido = true;
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('.campo').forEach((campo) => {
        const error = form.querySelector<HTMLElement>(`[data-error-de="${campo.name}"]`);
        const ok = campo.checkValidity();
        campo.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (error) {
          error.textContent = ok ? '' : mensajeDe(campo.validity);
          error.classList.toggle('hidden', ok);
        }
        if (!ok) valido = false;
      });
      if (!valido) { form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
      const datos = new FormData(form);
      const lineas = [`Asunto: ${form.dataset.asunto ?? ''}`];
      form.querySelectorAll<HTMLLabelElement>('label').forEach((l) => {
        const nombre = l.htmlFor.replace('campo-', '');
        const valor = String(datos.get(nombre) ?? '').trim();
        if (valor) lineas.push(`${l.textContent?.replace('*', '').trim()}: ${valor}`);
      });
      const texto = lineas.join('\n');
      const wa = form.dataset.whatsapp;
      const mail = form.dataset.email;
      if (wa) window.open(`https://wa.me/${wa}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
      else if (mail) window.location.href = `mailto:${mail}?subject=${encodeURIComponent(form.dataset.asunto ?? '')}&body=${encodeURIComponent(texto)}`;
    });
  });
};
document.addEventListener('astro:page-load', iniciar);

// Todos los scripts de src/scripts/ terminan con esto: sin import/export, TypeScript los trata como
// scripts globales y `iniciar` choca entre archivos ("Cannot redeclare block-scoped variable").
export {};
```
Run: `pnpm test tests/components/formulario.test.ts` → PASS (2). Si `tests/presupuesto.test.ts` ahora falla por el tamaño, sumá `formulario.ts` y `cuenta-regresiva.ts` a su lista con un tope de **4 KB** para los cuatro scripts (el presupuesto del spec de 2 KB era para animación; `revelar.ts` sigue por debajo).

- [ ] **Step 3: Páginas**

`obras.astro`:
```astro
---
import Base from '@/layouts/Base.astro';
import HuecoCapacidad from '@/components/HuecoCapacidad.astro';
import Seccion from '@/components/ui/Seccion.astro';
import Senal from '@/components/ui/Senal.astro';
import { datos } from '@/lib/datos';
import { fechaLarga } from '@/lib/formato';
const obras = await datos.obras();
const estados = { planificada: 'Planificada', 'en-ejecucion': 'En ejecución', terminada: 'Terminada' } as const;
---
<Base titulo="Obras y avance" descripcion="Obras de Covicen en el Tramo Centro: plan de contingencia, rehabilitación de pavimento, señalización e iluminación, cobro electrónico. El peaje pleno se aplica cuando Vialidad Nacional verifica la transitabilidad óptima." migas={[{ nombre: 'Obras', href: '/obras' }]}>
  <Seccion nivel="h1" eyebrow="Obras y avance" titulo="Primero las obras. Después, el peaje pleno." intro="El contrato exige alcanzar condiciones de transitabilidad óptima antes de aplicar la tarifa ofertada. Vialidad Nacional lo verifica con indicadores objetivos." class="pt-10">
    <ol class="escalonar relative grid gap-6 border-l border-borde pl-8">
      {obras.map((o, i) => (
        <li class="relative" style={`--i: ${i}`}>
          <span class="absolute -left-[2.45rem] top-1 h-4 w-4 rounded-full border-2 border-acento bg-fondo" aria-hidden="true"></span>
          <div class="esquineros rounded-md border border-borde bg-superficie/40 p-6">
            <div class="flex flex-wrap items-center gap-3"><span class="eyebrow">{o.tipo} · {o.ruta}</span><Senal variante={o.estado === 'en-ejecucion' ? 'vial' : 'frio'}>{estados[o.estado]}</Senal></div>
            <h2 class="mt-3 text-2xl">{o.titulo}</h2>
            <p class="mt-2 max-w-prose text-texto-2">{o.descripcion}</p>
            {o.avance !== null && <div class="mt-4"><div class="h-1.5 w-full overflow-hidden rounded-full bg-fondo-2"><div class="h-full bg-vial" style={`width: ${o.avance}%`}></div></div><p class="mt-1 text-xs text-texto-3 tabular-nums">{o.avance}% de avance</p></div>}
            {o.inicio && <p class="mt-3 text-xs text-texto-3">Inicio: {fechaLarga(o.inicio)}{o.finEstimado && ` · Fin estimado: ${fechaLarga(o.finEstimado)}`}</p>}
          </div>
        </li>
      ))}
    </ol>
    <div class="mt-12"><HuecoCapacidad capacidad="estadoRutasEnVivo" titulo="Estado de las rutas en tiempo real" descripcion="Cortes, desvíos por obra y clima, por ruta y kilómetro." alternativaHref="/novedades" alternativaTexto="Ver novedades de obras" /></div>
  </Seccion>
</Base>
```

`quienes-somos.astro`:
```astro
---
import { ExternalLink } from '@lucide/astro';
import Base from '@/layouts/Base.astro';
import Mojon from '@/components/ui/Mojon.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
import { fechaLarga, numero } from '@/lib/formato';
const e = await datos.empresa();
const c = e.concesion;
---
<Base titulo="Quiénes somos" descripcion="Covicen es la concesionaria del Tramo Centro de la Red Federal de Concesiones, integrada por AFEMA S.A., Pablo Federico e Hijos S.A. y Guido Mogetta S.A. Concesión a 20 años, adjudicada por Resolución 1379/2026." migas={[{ nombre: 'Quiénes somos', href: '/quienes-somos' }]}>
  <Seccion nivel="h1" eyebrow="Quiénes somos" titulo="Una concesionaria nueva para un tramo que ya existe." intro={`Covicen (${e.descriptor}) es la sociedad que integran las tres empresas adjudicatarias del Tramo Centro. ${e.enFormacion ? 'La sociedad está en formación: los datos registrales se publican cuando se complete la inscripción.' : ''}`} class="pt-10">
    <div class="escalonar grid gap-10 sm:grid-cols-3">
      <div style="--i: 0"><Mojon valor={Math.round(c.km)} unidad="km" etiqueta="de rutas nacionales" animar /></div>
      <div style="--i: 1"><Mojon valor={c.plazoAnios} unidad="años" etiqueta={`de concesión${c.prorrogaAnios ? ` (+${c.prorrogaAnios} prorrogables)` : ''}`} animar /></div>
      <div style="--i: 2"><Mojon valor={c.tramosEtapa} etiqueta="tramos en la Etapa III; el nuestro ofertó la tarifa más baja" animar /></div>
    </div>
  </Seccion>
  <Seccion indice="01" eyebrow="El consorcio" titulo="Tres empresas de construcción vial." fondo="fondo-2">
    <ul class="escalonar grid gap-4 md:grid-cols-3">{e.consorcio.map((s, i) => <li class="esquineros rounded-md border border-borde bg-superficie/40 p-6" style={`--i: ${i}`}><h3 class="text-xl">{s.nombre}</h3><p class="mt-2 text-texto-2">{s.descripcion}</p></li>)}</ul>
  </Seccion>
  <Seccion indice="02" eyebrow="La concesión" titulo="Qué asumimos.">
    <div class="revelar grid gap-8 md:grid-cols-2">
      <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-texto-2">
        <dt class="eyebrow">Régimen</dt><dd>Concesión de obra pública por peaje, inversión 100% privada, sin subsidios.</dd>
        <dt class="eyebrow">Tramo</dt><dd>Centro: {numero(c.km, 2)} km sobre {c.rutas.join(', ')} ({c.provincias.join(' y ')}).</dd>
        <dt class="eyebrow">Plazo</dt><dd>{c.plazoAnios} años desde el {fechaLarga(c.inicioOperacion)}.</dd>
        <dt class="eyebrow">Adjudicación</dt><dd>{fechaLarga(c.adjudicacion.fecha)}, {c.adjudicacion.resolucion}. <a href={c.adjudicacion.url} rel="noopener noreferrer" target="_blank" class="inline-flex items-center gap-1">Boletín Oficial <ExternalLink size={12} aria-hidden="true" /></a></dd>
        <dt class="eyebrow">Control</dt><dd>Dirección Nacional de Vialidad, con indicadores objetivos de desempeño y niveles de servicio.</dd>
      </dl>
      <ul class="flex flex-col gap-3 text-texto-2">
        <li class="flex gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vial" aria-hidden="true"></span>Construir, conservar, mantener y ampliar la ruta durante toda la concesión.</li>
        <li class="flex gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vial" aria-hidden="true"></span>Prestar servicios al usuario: emergencias, auxilio, seguridad vial, cobro electrónico.</li>
        <li class="flex gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vial" aria-hidden="true"></span>No cobrar la tarifa ofertada hasta alcanzar la transitabilidad óptima.</li>
        <li class="flex gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vial" aria-hidden="true"></span>Rendir cuentas ante Vialidad Nacional y ante quienes pagan el peaje.</li>
      </ul>
    </div>
  </Seccion>
</Base>
```

`politicas.astro`:
```astro
---
import Base from '@/layouts/Base.astro';
import HuecoCapacidad from '@/components/HuecoCapacidad.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
const contacto = await datos.contacto();
const politicas = [
  { id: 'calidad', titulo: 'Política de calidad', puntos: ['Cumplir los niveles de servicio del contrato y medirlos con los indicadores de Vialidad Nacional.', 'Mantener la calzada, la señalización y los sistemas de auxilio en condiciones verificables.', 'Publicar en este sitio el avance de obras y los cambios de tarifa con su fecha de vigencia.'] },
  { id: 'seguridad-vial', titulo: 'Política de seguridad vial', puntos: ['La seguridad de quienes circulan está por encima de cualquier meta de tránsito o recaudación.', 'Señalización y balizamiento de obras según normativa; zonas de obra con velocidad reducida.', 'Respuesta a emergencias en todo el tramo, las 24 horas, con un número visible en cada página.'] },
  { id: 'anticorrupcion', titulo: 'Política anticorrupción', puntos: ['Tolerancia cero al soborno, la dádiva y el conflicto de interés en contrataciones y en la relación con el Estado.', 'Contrataciones con criterios objetivos y trazables.', 'Canal de denuncias: hasta que exista un sistema anónimo, por correo al área de ética.'] },
];
---
<Base titulo="Políticas" descripcion="Políticas de calidad, seguridad vial y anticorrupción de Covicen, concesionaria del Tramo Centro." migas={[{ nombre: 'Políticas', href: '/politicas' }]}>
  <Seccion nivel="h1" eyebrow="Políticas" titulo="Cómo nos comprometemos a operar." intro="Tres políticas, escritas para que cualquiera pueda exigirlas." class="pt-10">
    <nav aria-label="Secciones" class="revelar mb-10 flex flex-wrap gap-2">{politicas.map((p) => <a href={`#${p.id}`} class="rounded-md border border-borde px-3 py-1.5 text-sm text-texto-2 hover:border-borde-fuerte hover:text-texto">{p.titulo}</a>)}</nav>
    <div class="escalonar grid gap-6">
      {politicas.map((p, i) => (
        <article id={p.id} class="esquineros scroll-mt-28 rounded-md border border-borde bg-superficie/40 p-8" style={`--i: ${i}`}>
          <h2 class="text-2xl">{p.titulo}</h2>
          <ul class="mt-4 flex flex-col gap-3 text-texto-2">{p.puntos.map((t) => <li class="flex gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-acento" aria-hidden="true"></span>{t}</li>)}</ul>
          {p.id === 'anticorrupcion' && (
            <div class="mt-6">
              <HuecoCapacidad capacidad="canalEticoAnonimo" titulo="Canal ético anónimo" descripcion="Denuncias anónimas con seguimiento. Hasta entonces, el canal es por correo y no es anónimo: lo decimos para que lo sepas antes de escribir." alternativaHref={contacto.email.etica ? `mailto:${contacto.email.etica}` : '/contacto'} alternativaTexto={contacto.email.etica ? `Escribir a ${contacto.email.etica}` : 'Contacto (correo de ética a confirmar)'} />
            </div>
          )}
        </article>
      ))}
    </div>
  </Seccion>
</Base>
```
`HuecoCapacidad` recibe un `alternativaHref` que puede ser `mailto:`; `Boton` ya trata como externo todo lo que no empieza con `/`.

`transparencia.astro`:
```astro
---
import { ExternalLink } from '@lucide/astro';
import Base from '@/layouts/Base.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
const e = await datos.empresa();
const marco = [
  ['Ley 27.742 (Bases)', 'Declaró a Corredores Viales S.A. sujeta a privatización y habilitó el nuevo régimen de concesiones.', 'https://www.boletinoficial.gob.ar/'],
  ['Decreto 97/2025', 'Autorizó la privatización total de Corredores Viales y la Red Federal de Concesiones.', 'https://www.boletinoficial.gob.ar/'],
  [e.concesion.adjudicacion.resolucion, 'Adjudicó los ocho tramos de la Etapa III, entre ellos el Tramo Centro a Covicen.', e.concesion.adjudicacion.url],
  ['Red Federal de Concesiones', 'Programa de Vialidad Nacional: más de 9.000 km en 16 corredores, inversión privada sin subsidios.', 'https://www.argentina.gob.ar/transporte/vialidad-nacional/red-federal-de-concesiones'],
];
---
<Base titulo="Transparencia" descripcion="Marco legal de la concesión del Tramo Centro, control de Vialidad Nacional y acceso a las fuentes oficiales. Covicen publica lo que puede verificarse." migas={[{ nombre: 'Transparencia', href: '/transparencia' }]}>
  <Seccion nivel="h1" eyebrow="Transparencia" titulo="Lo que se puede verificar, con la fuente al lado." intro="Vialidad Nacional supervisa la concesión con indicadores objetivos. Este sitio publica el marco legal, las tarifas con vigencia y el avance de obras, siempre con enlace a la fuente." class="pt-10">
    <ol class="escalonar grid gap-4 md:grid-cols-2">
      {marco.map(([t, d, u], i) => (
        <li class="esquineros rounded-md border border-borde bg-superficie/40 p-6" style={`--i: ${i}`}><h2 class="text-xl">{t}</h2><p class="mt-2 text-texto-2">{d}</p><a href={u} rel="noopener noreferrer" target="_blank" class="link-crece mt-4 inline-flex items-center gap-1 text-sm">Fuente oficial <ExternalLink size={14} aria-hidden="true" /></a></li>
      ))}
    </ol>
    <div class="revelar mt-12 rounded-md border border-borde p-6 text-texto-2">
      <h2 class="text-xl text-texto">Datos registrales</h2>
      <p class="mt-2">{e.enFormacion ? 'La sociedad está en formación. Razón social, CUIT y domicilio legal se publican acá y en el pie de página cuando se complete la inscripción.' : `${e.razonSocial} · CUIT ${e.cuit} · ${e.domicilioLegal}`}</p>
    </div>
  </Seccion>
</Base>
```

`trabaja-con-nosotros.astro`:
```astro
---
import Base from '@/layouts/Base.astro';
import Formulario from '@/components/Formulario.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
const contacto = await datos.contacto();
---
<Base titulo="Trabajá con nosotros" descripcion="Sumate al equipo de Covicen: operación de peajes, auxilio en ruta, mantenimiento vial, administración. Córdoba y Santa Fe." migas={[{ nombre: 'Trabajá con nosotros', href: '/trabaja-con-nosotros' }]}>
  <Seccion nivel="h1" eyebrow="Trabajá con nosotros" titulo="681 km necesitan gente." intro="Operación de estaciones, auxilio en ruta, mantenimiento, seguridad vial y administración, en Córdoba y Santa Fe. Contanos quién sos y en qué querés trabajar." class="pt-10">
    <div class="revelar grid gap-12 lg:grid-cols-[1fr_1.2fr]">
      <ul class="flex flex-col gap-4 text-texto-2">
        <li class="flex gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vial" aria-hidden="true"></span>Las búsquedas se publican en Novedades cuando se abren.</li>
        <li class="flex gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vial" aria-hidden="true"></span>Podés adelantarte: dejá tu perfil y la zona donde vivís.</li>
        <li class="flex gap-3"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-vial" aria-hidden="true"></span>Recibimos el CV por WhatsApp o por correo, como archivo o como link.</li>
      </ul>
      <Formulario asunto="Trabajá con nosotros" whatsapp={contacto.whatsapp.numero} email={contacto.email.rrhh ?? contacto.email.general} textoBoton="Enviar mi perfil por WhatsApp" campos={[
        { nombre: 'nombre', etiqueta: 'Nombre y apellido', requerido: true },
        { nombre: 'zona', etiqueta: 'Zona donde vivís', tipo: 'select', opciones: ['Rosario y alrededores', 'Carcarañá – Leones', 'Villa María – James Craik', 'Pilar – Córdoba', 'San Francisco', 'Rafaela', 'Santa Fe – Franck', 'Otra'], requerido: true },
        { nombre: 'area', etiqueta: 'Área de interés', tipo: 'select', opciones: ['Operación de peajes', 'Auxilio y emergencias', 'Mantenimiento vial', 'Seguridad vial', 'Administración', 'Sistemas', 'Otra'], requerido: true },
        { nombre: 'mensaje', etiqueta: 'Contanos de vos (experiencia, disponibilidad, link a tu CV)', tipo: 'textarea', requerido: true },
      ]} />
    </div>
  </Seccion>
</Base>
```

`proveedores.astro`:
```astro
---
import Base from '@/layouts/Base.astro';
import HuecoCapacidad from '@/components/HuecoCapacidad.astro';
import Formulario from '@/components/Formulario.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
const contacto = await datos.contacto();
---
<Base titulo="Proveedores" descripcion="Proveedores y licitaciones de Covicen para el Tramo Centro: registrate y recibí las convocatorias." migas={[{ nombre: 'Proveedores', href: '/proveedores' }]}>
  <Seccion nivel="h1" eyebrow="Proveedores" titulo="Vamos a comprar mucho. Queremos comprar bien." intro="Insumos viales, señalización, tecnología de cobro, servicios de auxilio, obra civil. El portal de proveedores se habilita con los sistemas; mientras tanto, registrate acá." class="pt-10">
    <div class="revelar grid gap-12 lg:grid-cols-[1fr_1.2fr]">
      <HuecoCapacidad capacidad="portalProveedores" titulo="Portal de proveedores y licitaciones" descripcion="Alta de proveedor, carga de comprobantes, estado de pagos y convocatorias abiertas." />
      <Formulario asunto="Alta de proveedor" whatsapp={contacto.whatsapp.numero} email={contacto.email.proveedores ?? contacto.email.general} textoBoton="Registrarme por WhatsApp" campos={[
        { nombre: 'empresa', etiqueta: 'Empresa', requerido: true },
        { nombre: 'nombre', etiqueta: 'Persona de contacto', requerido: true },
        { nombre: 'rubro', etiqueta: 'Rubro', tipo: 'select', opciones: ['Obra civil y pavimento', 'Señalización y balizamiento', 'Tecnología y cobro electrónico', 'Auxilio y grúas', 'Seguridad e higiene', 'Servicios generales', 'Otro'], requerido: true },
        { nombre: 'mensaje', etiqueta: 'Qué ofrecés y dónde operás', tipo: 'textarea', requerido: true },
      ]} />
    </div>
  </Seccion>
</Base>
```

`privacidad.astro`:
```astro
---
import Base from '@/layouts/Base.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
const [e, contacto] = await Promise.all([datos.empresa(), datos.contacto()]);
---
<Base titulo="Política de privacidad" descripcion="Cómo trata Covicen los datos personales que recibe por sus canales de contacto, según la Ley 25.326 de Protección de Datos Personales." migas={[{ nombre: 'Privacidad', href: '/privacidad' }]}>
  <Seccion nivel="h1" eyebrow="Privacidad" titulo="Qué datos recibimos y qué hacemos con ellos." class="pt-10">
    <div class="revelar prose-covicen max-w-prose text-texto-2">
      <h2>Responsable</h2>
      <p>{e.marca} ({e.descriptor}){e.enFormacion ? ', sociedad en formación' : `, ${e.razonSocial}, CUIT ${e.cuit}`}. Los datos de contacto del responsable se publican en el pie de página cuando se complete la inscripción.</p>
      <h2>Qué datos recibimos</h2>
      <p>Este sitio no tiene cuentas de usuario, no usa cookies de terceros ni herramientas de seguimiento. Los únicos datos personales que recibimos son los que vos decidís enviarnos por WhatsApp o por correo desde los formularios: nombre, contacto y el contenido de tu mensaje.</p>
      <h2>Para qué</h2>
      <p>Para responder consultas y reclamos, gestionar postulaciones laborales y altas de proveedores. No los usamos con otros fines ni los cedemos a terceros, salvo obligación legal.</p>
      <h2>Canales de terceros</h2>
      <p>WhatsApp es un servicio de Meta Platforms, con sus propias condiciones y política de privacidad. El correo electrónico viaja por el proveedor que uses.</p>
      <h2>Tus derechos</h2>
      <p>Según la Ley 25.326 podés acceder, rectificar y suprimir tus datos. Escribinos por el canal de contacto{contacto.email.general ? ` o a ${contacto.email.general}` : ''}. La Agencia de Acceso a la Información Pública, órgano de control de la ley, atiende denuncias por incumplimiento.</p>
      <h2>Conservación</h2>
      <p>Conservamos los mensajes el tiempo necesario para resolver lo que pediste y cumplir obligaciones legales; después, se eliminan.</p>
    </div>
  </Seccion>
</Base>
```
Agregá a `global.css` (`@layer components`):
```css
.prose-covicen h2 { margin-top: 2rem; font-size: 1.35rem; color: var(--color-texto); }
.prose-covicen p { margin-top: 0.75rem; }
.prose-covicen ul { margin-top: 0.75rem; padding-left: 1.25rem; list-style: disc; }
```
Run: `pnpm check && pnpm build && ls dist/obras dist/quienes-somos dist/politicas dist/transparencia dist/trabaja-con-nosotros dist/proveedores dist/privacidad`
Expected: OK, 7 carpetas.

- [ ] **Step 4: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `feat(paginas): obras, quiénes somos, políticas, transparencia, trabajá con nosotros, proveedores, privacidad`

---

### Task 13: Novedades fundacionales (Markdown) y sus páginas

**Files:**
- Create: `src/content/novedades/2026-08-24-adjudicacion-tramo-centro.md`, `src/content/novedades/2026-08-26-que-cambia-el-5-de-octubre.md`, `src/content/novedades/2026-08-27-como-se-fija-la-tarifa.md`, `src/content/novedades/2026-08-27-obras-antes-que-peaje.md`, `src/pages/novedades/index.astro`, `src/pages/novedades/[slug].astro`
- Delete: `src/content/novedades/.gitkeep`

**Interfaces:**
- Consumes: colección `novedades` (Task 4), `datos.novedades()`, `jsonLdArticulo`.
- Slugs = nombre de archivo sin extensión (id del glob loader).

- [ ] **Step 1: Los cuatro posts**

`2026-08-24-adjudicacion-tramo-centro.md`:
```md
---
titulo: "Covicen fue adjudicataria del Tramo Centro de la Red Federal de Concesiones"
fecha: "2026-08-24"
resumen: "La Resolución 1379/2026 del Ministerio de Economía adjudicó los ocho tramos de la Etapa III. El Tramo Centro —RN 9, RN 19 y RN 34— quedó en manos del consorcio que integra Covicen, con la tarifa más baja de todos."
etiquetas: ["adjudicación", "institucional"]
destacada: true
---
El 24 de agosto de 2026 el Ministerio de Economía publicó en el Boletín Oficial la **Resolución 1379/2026**, que adjudica los ocho tramos de la Etapa III de la Red Federal de Concesiones: más de 3.900 km de rutas nacionales en once provincias.

El **Tramo Centro** —681,92 km sobre las rutas nacionales 9, 19 y 34, en Córdoba y Santa Fe— fue adjudicado al consorcio integrado por **AFEMA S.A., Pablo Federico e Hijos S.A. y Guido Mogetta S.A.**, que opera bajo la marca Covicen.

## La tarifa más baja de los ocho tramos

En este régimen el criterio de adjudicación es uno solo: gana quien ofrece la **menor tarifa de peaje**. Covicen ofertó **$1.399 más IVA** por auto, frente a un tope de licitación de $3.200. Fue la oferta más baja de los ocho tramos adjudicados.

## Qué sigue

La sociedad está en formación y la operación comienza el **5 de octubre de 2026**. Antes de aplicar la tarifa ofertada, el contrato exige alcanzar las condiciones de transitabilidad óptima, verificadas por Vialidad Nacional. Este sitio va a publicar cada paso con su fecha.

Fuente: [Resolución 1379/2026 — Boletín Oficial](https://www.boletinoficial.gob.ar/detalleAviso/primera/346271/20260824).
```

`2026-08-26-que-cambia-el-5-de-octubre.md`:
```md
---
titulo: "Qué cambia el 5 de octubre para quien maneja por la 9, la 19 y la 34"
fecha: "2026-08-26"
resumen: "Las estaciones de Carcarañá, James Craik y Franck siguen. San Vicente deja de operar. Se suman Leones, San Francisco y Totoras, con cobro electrónico. Y un número de emergencias para todo el tramo."
etiquetas: ["usuarios", "peajes"]
destacada: true
---
El 5 de octubre de 2026 Covicen toma la operación del Tramo Centro. Esto es lo que cambia, y lo que no, para quien circula.

## Las estaciones

- **Siguen operando:** Carcarañá y James Craik (RN 9) y Franck (RN 19).
- **Deja de operar:** San Vicente (RN 34).
- **Se suman:** Leones (RN 9), San Francisco (RN 19, km 120) y Totoras (RN 34, km 60). Las tres nacen con cobro electrónico y modalidad Free Flow, sin barreras.

## La tarifa

La tarifa ofertada es de $1.399 más IVA por auto. **No se aplica desde el primer día**: el contrato exige antes alcanzar la transitabilidad óptima. Cuando Vialidad Nacional lo habilite, se publica acá con fecha de vigencia.

## TelePASE

Si ya tenés el dispositivo, funciona: es único para toda la red nacional. No es obligatorio.

## Emergencias

Un número para todo el tramo, visible en cada página de este sitio, para auxilio mecánico, accidentes, animales u objetos en la calzada.
```

`2026-08-27-como-se-fija-la-tarifa.md`:
```md
---
titulo: "Cómo se fija la tarifa de peaje, y por qué la nuestra es la más baja"
fecha: "2026-08-27"
resumen: "En la Red Federal de Concesiones no hay subsidios: la ruta se paga con el peaje, y gana la licitación quien pide el peaje más bajo. Así funciona el mecanismo."
etiquetas: ["tarifas", "transparencia"]
destacada: false
---
La Red Federal de Concesiones cambió la lógica de las rutas nacionales concesionadas. Antes, el Estado sostenía a Corredores Viales con aportes. Ahora, **la inversión es privada y sin subsidios**: la ruta se mantiene con lo que se cobra en el peaje.

## El criterio de adjudicación

Cada tramo se licita con una **tarifa tope** (en el Tramo Centro, $3.200 más IVA por auto). Las empresas ofertan una tarifa por debajo de ese tope, y **gana la que ofrece la más baja**. No hay otro criterio de puntaje: la tarifa es la oferta.

Covicen ofertó **$1.399 más IVA**. Fue la más baja de los ocho tramos de la Etapa III.

## Cómo se actualiza

La tarifa se ajusta por **índices oficiales**, según el contrato. Cada actualización se publica en este sitio con su fecha de vigencia y su fuente.

## Cuándo se cobra

Recién cuando el tramo alcance las **condiciones de transitabilidad óptima** que verifica Vialidad Nacional. Primero las obras.
```

`2026-08-27-obras-antes-que-peaje.md`:
```md
---
titulo: "Obras antes que peaje: qué es la transitabilidad óptima"
fecha: "2026-08-27"
resumen: "El contrato no permite cobrar la tarifa ofertada hasta que Vialidad Nacional verifique que la ruta está en condiciones. Qué obras vienen primero y cómo vamos a informar el avance."
etiquetas: ["obras", "transparencia"]
destacada: false
---
Una de las reglas centrales del contrato es simple: **no se cobra la tarifa ofertada hasta alcanzar condiciones de transitabilidad óptima**. Es Vialidad Nacional quien lo verifica, con indicadores objetivos.

## Qué viene primero

1. **Plan de contingencia inicial:** los sectores más deteriorados de calzada, banquinas y drenajes.
2. **Rehabilitación de pavimento** en RN 9, RN 19 y RN 34.
3. **Señalización, iluminación y seguridad:** horizontal, vertical, accesos e intersecciones, más el sistema de auxilio.
4. **Cobro electrónico:** TelePASE en todas las estaciones y Free Flow en las nuevas.

## Cómo vamos a informar

La página de [Obras](/obras/) muestra cada frente con su estado. Cuando entre en servicio el centro de operaciones, se suma el estado de las rutas en tiempo real. Hasta entonces, las novedades de obra se publican acá.
```
Nota: el link `[Obras](/obras/)` es relativo a la raíz; si el sitio corre con `base`, lo corrige el Step 3.

- [ ] **Step 2: `src/pages/novedades/index.astro`**

```astro
---
import Base from '@/layouts/Base.astro';
import Card from '@/components/ui/Card.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
import { fechaLarga } from '@/lib/formato';
const novedades = await datos.novedades();
---
<Base titulo="Novedades" descripcion="Novedades de Covicen: adjudicación, inicio de operación, tarifas, obras y peajes del Tramo Centro." migas={[{ nombre: 'Novedades', href: '/novedades' }]}>
  <Seccion nivel="h1" eyebrow="Novedades" titulo="Lo que pasa en el tramo, con fecha." class="pt-10">
    <ul class="escalonar grid gap-4 md:grid-cols-2">
      {novedades.map((n, i) => (
        <li style={`--i: ${i}`}><Card href={`/novedades/${n.slug}`} etiqueta={fechaLarga(n.fecha)}><h2 class="text-xl">{n.titulo}</h2><p class="mt-2 text-texto-2">{n.resumen}</p>{n.etiquetas.length > 0 && <p class="mt-3 flex flex-wrap gap-2">{n.etiquetas.map((e) => <span class="rounded-sm border border-borde px-2 py-0.5 text-xs text-texto-3">{e}</span>)}</p>}</Card></li>
      ))}
    </ul>
  </Seccion>
</Base>
```

- [ ] **Step 3: `src/pages/novedades/[slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import Base from '@/layouts/Base.astro';
import Boton from '@/components/ui/Boton.astro';
import { datos } from '@/lib/datos';
import { fechaLarga } from '@/lib/formato';
import { absoluta } from '@/lib/rutas';
import { jsonLdArticulo } from '@/lib/seo';
import { config } from '@/lib/config';

export async function getStaticPaths() {
  const entradas = await getCollection('novedades');
  return entradas.map((e) => ({ params: { slug: e.id } }));
}
const { slug } = Astro.params;
const novedad = await datos.novedad(slug!);
// getStaticPaths garantiza que existe; si no, es un bug de build y tiene que romper.
if (!novedad) throw new Error(`Novedad inexistente: ${slug}`);
// El cuerpo Markdown lo renderiza Astro; la página es la raíz de composición y puede tocar astro:content.
const entrada = (await getCollection('novedades')).find((e) => e.id === slug)!;
const { Content } = await render(entrada);
const url = absoluta(`/novedades/${slug}`);
---
<Base titulo={novedad.titulo} descripcion={novedad.resumen} tipo="article" jsonLd={[jsonLdArticulo(novedad, url, `${config.sitio}${config.base}`)]} migas={[{ nombre: 'Novedades', href: '/novedades' }, { nombre: novedad.titulo, href: `/novedades/${slug}` }]}>
  <article class="contenedor py-12">
    <header class="revelar max-w-3xl">
      <p class="eyebrow"><time datetime={novedad.fecha}>{fechaLarga(novedad.fecha)}</time>{novedad.etiquetas.length > 0 && ` · ${novedad.etiquetas.join(' · ')}`}</p>
      <h1 class="mt-4">{novedad.titulo}</h1>
      <p class="mt-6 text-xl text-texto-2">{novedad.resumen}</p>
    </header>
    <div class="prose-covicen revelar mt-12 max-w-prose text-lg text-texto-2" data-base={config.base}><Content /></div>
    <div class="revelar mt-12"><Boton href="/novedades" variante="secundario">Todas las novedades</Boton></div>
  </article>
</Base>
<script>
  // Los links del Markdown se escriben desde la raíz (/obras/). Si el sitio corre con base, se les antepone.
  const contenedor = document.querySelector<HTMLElement>('[data-base]');
  const base = contenedor?.dataset.base ?? '/';
  if (contenedor && base !== '/') contenedor.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach((a) => { a.setAttribute('href', base.replace(/\/$/, '') + a.getAttribute('href')); });
</script>
```
Run: `rm src/content/novedades/.gitkeep && pnpm check && pnpm build && ls dist/novedades`
Expected: `index.html` + 4 carpetas con slug. En la Home aparecen las 3 más recientes.

- [ ] **Step 4: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `feat(novedades): cuatro posts fundacionales, listado y detalle con Article JSON-LD`

---

### Task 14: Preguntas frecuentes y Contacto

**Files:**
- Create: `src/pages/preguntas-frecuentes.astro`, `src/pages/contacto.astro`

- [ ] **Step 1: `preguntas-frecuentes.astro`** (FAQPage)

```astro
---
import Base from '@/layouts/Base.astro';
import Faq from '@/components/Faq.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
import { jsonLdFaq } from '@/lib/seo';
const preguntas = await datos.faq();
const temas = [['general', 'General'], ['tarifas', 'Tarifas'], ['peajes', 'Peajes'], ['pago', 'Pago'], ['servicios', 'Servicios'], ['empresa', 'Empresa']] as const;
---
<Base titulo="Preguntas frecuentes" descripcion="Respuestas sobre el peaje del Tramo Centro: cuánto cuesta, desde cuándo se cobra, dónde están las estaciones, TelePASE, Free Flow, emergencias y reclamos." jsonLd={[jsonLdFaq(preguntas)]} migas={[{ nombre: 'Preguntas frecuentes', href: '/preguntas-frecuentes' }]}>
  <Seccion nivel="h1" eyebrow="Preguntas frecuentes" titulo="Lo que más se pregunta." class="pt-10">
    <nav aria-label="Temas" class="revelar mb-10 flex flex-wrap gap-2">{temas.map(([id, n]) => <a href={`#tema-${id}`} class="rounded-md border border-borde px-3 py-1.5 text-sm text-texto-2 hover:border-borde-fuerte hover:text-texto">{n}</a>)}</nav>
    <div class="grid gap-14">
      {temas.map(([id, n]) => { const lista = preguntas.filter((p) => p.tema === id); return lista.length > 0 && (
        <section id={`tema-${id}`} class="scroll-mt-28"><h2 class="revelar mb-4 text-2xl">{n}</h2><Faq preguntas={lista} /></section>
      ); })}
    </div>
  </Seccion>
</Base>
```

- [ ] **Step 2: `contacto.astro`**

```astro
---
import { Mail, MessageCircle, Phone } from '@lucide/astro';
import Base from '@/layouts/Base.astro';
import Formulario from '@/components/Formulario.astro';
import HuecoCapacidad from '@/components/HuecoCapacidad.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { datos } from '@/lib/datos';
import { enlaceWhatsapp } from '@/lib/whatsapp';
const contacto = await datos.contacto();
const tel = contacto.emergencias.telefono;
---
<Base titulo="Contacto" descripcion="Consultas y reclamos a Covicen por WhatsApp o correo. Emergencias en ruta, las 24 horas." migas={[{ nombre: 'Contacto', href: '/contacto' }]}>
  <Seccion nivel="h1" eyebrow="Contacto" titulo="Escribinos. Llega con tus datos ya cargados." intro="Consultas, reclamos y sugerencias. Para emergencias en la ruta, llamá: el número está en cada página." class="pt-10">
    <div class="revelar grid gap-12 lg:grid-cols-[1fr_1.3fr]">
      <ul class="flex flex-col gap-4">
        <li class="esquineros rounded-md border border-borde bg-superficie/40 p-5"><p class="eyebrow flex items-center gap-2"><Phone size={14} aria-hidden="true" /> Emergencias 24 h</p>{tel ? <a href={`tel:${tel.replace(/[^\d+]/g, '')}`} class="mt-2 block text-2xl font-extrabold tabular-nums text-texto no-underline">{tel}</a> : <p class="mt-2 text-texto-2" data-emergencias="a-confirmar">Número a confirmar antes del inicio de la operación.</p>}</li>
        <li class="esquineros rounded-md border border-borde bg-superficie/40 p-5"><p class="eyebrow flex items-center gap-2"><MessageCircle size={14} aria-hidden="true" /> WhatsApp</p>{contacto.whatsapp.numero ? <a href={enlaceWhatsapp(contacto.whatsapp.numero, 'Hola Covicen')} class="mt-2 block text-texto" rel="noopener">Abrir chat</a> : <p class="mt-2 text-texto-2">A confirmar.</p>}</li>
        <li class="esquineros rounded-md border border-borde bg-superficie/40 p-5"><p class="eyebrow flex items-center gap-2"><Mail size={14} aria-hidden="true" /> Correo</p>{contacto.email.general ? <a href={`mailto:${contacto.email.general}`} class="mt-2 block text-texto">{contacto.email.general}</a> : <p class="mt-2 text-texto-2">A confirmar.</p>}</li>
        <li><HuecoCapacidad capacidad="ticketingReclamos" titulo="Seguimiento de reclamos" descripcion="Número de reclamo y estado en línea, cuando exista el sistema." /></li>
      </ul>
      <Formulario asunto="Consulta o reclamo" whatsapp={contacto.whatsapp.numero} email={contacto.email.general} campos={[
        { nombre: 'motivo', etiqueta: 'Motivo', tipo: 'select', opciones: ['Consulta', 'Reclamo', 'Sugerencia', 'Prensa'], requerido: true },
        { nombre: 'nombre', etiqueta: 'Nombre y apellido', requerido: true },
        { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'tel' },
        { nombre: 'ruta', etiqueta: 'Ruta y kilómetro (si aplica)', placeholder: 'RN 9, km 350' },
        { nombre: 'patente', etiqueta: 'Patente (opcional, para reclamos de cobro)' },
        { nombre: 'mensaje', etiqueta: 'Mensaje', tipo: 'textarea', requerido: true },
      ]} />
    </div>
  </Seccion>
</Base>
```
Run: `pnpm check && pnpm build && ls dist/preguntas-frecuentes dist/contacto && grep -c FAQPage dist/preguntas-frecuentes/index.html`
Expected: OK; `1`.

- [ ] **Step 3: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `feat(paginas): preguntas frecuentes con FAQPage y contacto con formulario a WhatsApp`

---

### Task 15: Imágenes atmosféricas opcionales + master prompt para ChatGPT

**Files:**
- Create: `src/components/ilustraciones/ImagenAtmosfera.astro`, `src/assets/atmosfera/.gitkeep`, `docs/marca/prompts-imagenes.md`
- Modify: `src/components/home/Hero.astro` (fondo opcional), `src/pages/obras.astro` (imagen opcional arriba de la línea de tiempo)

**Interfaces:**
- Produces: `<ImagenAtmosfera nombre="hero-ruta-nocturna" | "obras-nocturnas" | "consorcio" alt="" class? sizes? />`. Si `src/assets/atmosfera/<nombre>.{jpg,png,webp,avif}` no existe, no renderiza nada (el layout ya se ve terminado sin imagen).

- [ ] **Step 1: `ImagenAtmosfera.astro`**

```astro
---
import { Image } from 'astro:assets';
import type { ImageMetadata } from 'astro';
interface Props { nombre: string; alt: string; class?: string; sizes?: string; widths?: number[]; prioridad?: boolean }
const { nombre, alt, class: clase = '', sizes = '100vw', widths = [640, 1024, 1600], prioridad = false } = Astro.props;
const todas = import.meta.glob<{ default: ImageMetadata }>('/src/assets/atmosfera/*.{jpg,jpeg,png,webp,avif}', { eager: true });
const entrada = Object.entries(todas).find(([ruta]) => ruta.replace(/^.*\//, '').replace(/\.[^.]+$/, '') === nombre);
const imagen = entrada?.[1].default;
---
{imagen && (
  <Image src={imagen} {alt} {widths} {sizes} format="avif" quality={55} loading={prioridad ? 'eager' : 'lazy'} decoding="async" class:list={['imagen-atmosfera', clase]} />
)}
<style>
  .imagen-atmosfera { width: 100%; height: 100%; object-fit: cover; filter: saturate(0.85) brightness(0.55); }
</style>
```

- [ ] **Step 2: Enchufar en Hero y Obras**

En `Hero.astro`, antes de `<HeroRuta ... />`:
```astro
<div class="absolute inset-0 -z-20" aria-hidden="true"><ImagenAtmosfera nombre="hero-ruta-nocturna" alt="" prioridad /></div>
```
(con `import ImagenAtmosfera from '@/components/ilustraciones/ImagenAtmosfera.astro';`). El degradado `from-fondo via-fondo/90` que ya existe garantiza el contraste del texto aunque haya foto.

En `obras.astro`, dentro de `<Seccion>` antes del `<ol>`:
```astro
<div class="revelar mb-12 aspect-[21/9] w-full overflow-hidden rounded-md border border-borde bg-fondo-2 empty:hidden"><ImagenAtmosfera nombre="obras-nocturnas" alt="Zona de obra nocturna en autopista, con balizamiento amarillo" sizes="(min-width: 80rem) 80rem, 100vw" /></div>
```
(`empty:hidden` oculta el marco si no hay imagen).

- [ ] **Step 3: `docs/marca/prompts-imagenes.md`** (Juli lo usa con ChatGPT; el sitio funciona sin estas imágenes)

```markdown
# Prompts de imágenes atmosféricas — Covicen

Las imágenes son opcionales: el sitio se ve terminado sin ellas. Cuando existan, se guardan en
`src/assets/atmosfera/<nombre>.jpg` (o .png/.webp) y el build las optimiza a AVIF. Peso objetivo del original: ≤ 2 MB, lado mayor 2400 px.

Reglas comunes (pegar al final de cada prompt):
> No text, no logos, no watermarks, no people's faces, no license plates readable. Photorealistic, editorial documentary style, shot on a full-frame camera, 35mm lens, long exposure where noted. Color palette anchored in deep navy (#0B1526, #16304E), cool cyan highlights (#68BCE1) and a single warm accent of road-marking yellow (#F0C419). Low overall brightness: the image will sit under UI text, so keep the upper-left quadrant dark and uncluttered. No HDR look, no oversaturation, subtle film grain acceptable.

## 1. `hero-ruta-nocturna` — 16:9, 2400×1350
Aerial night view of a straight two-lane national highway in the flat Argentine Pampas (Córdoba–Santa Fe region), seen from a slight elevation, receding to the horizon. Long exposure: red and white vehicle light trails along the road, cool blue-cyan street lighting at a single overpass in the mid-distance, the rest of the landscape in deep navy darkness under a clear night sky. Fresh asphalt with crisp yellow dashed center line catching the light. Mood: calm, precise, infrastructural. Composition: road enters from bottom-right and exits top-center; leave the upper-left third nearly black for headline text.

## 2. `obras-nocturnas` — 21:9, 2520×1080
Night road-works scene on a highway shoulder: a compact asphalt paver and a roller under portable LED work lights, yellow-and-black barrier boards and orange cones in the foreground receding into darkness, wet asphalt reflecting cyan light. Workers only as distant silhouettes in high-visibility vests, no faces. Wide cinematic crop, horizon low, sky deep navy. Mood: work in progress, controlled, safe.

## 3. `consorcio` — 4:3, 2000×1500 (opcional, Quiénes somos)
Dusk photograph of a concrete bridge deck over a rural highway under construction, formwork and rebar in the foreground, a single tower crane against a navy-blue evening sky with the last cyan light on the horizon. No text or signage. Mood: serious engineering, long-term.

## 4. Portadas de novedades — 3:2, 1800×1200 (opcional, una por post)
- `novedad-adjudicacion`: Close-up of an official document on a dark desk, out of focus, with a fountain pen; only cool light from a window. No readable text.
- `novedad-5-de-octubre`: A toll gantry (free-flow, no barriers) over a highway at blue hour, cameras and antennas visible, one lane lit by cyan light, yellow lane markings sharp in the foreground.
```

- [ ] **Step 4: Verificar que el build sigue en verde sin imágenes**

Run: `mkdir -p src/assets/atmosfera && touch src/assets/atmosfera/.gitkeep && pnpm check && pnpm build`
Expected: OK; `grep -c "imagen-atmosfera" dist/index.html` → `0` (no hay imagen todavía, no se renderiza nada).

- [ ] **Step 5: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `feat(imagenes): slots opcionales de imágenes atmosféricas y prompts para generarlas`

---

### Task 16: `scripts/verificar.ts` — evidencia sin navegador

**Files:**
- Create: `scripts/verificar.ts`, `scripts/lib/html.ts`, `tests/scripts/html.test.ts`

**Interfaces:**
- Produces: `pnpm verificar` (build + chequeos). Sale con código 1 y lista los fallos si algo no cumple.
- Produces `scripts/lib/html.ts`: `paginasDe(dist: string): string[]`, `linksInternos(html: string): string[]`, `existeDestino(dist: string, base: string, href: string): boolean`, `jsonLdDe(html: string): unknown[]`

- [ ] **Step 1: Tests de los helpers (fallan primero)**

`tests/scripts/html.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { jsonLdDe, linksInternos, normalizarHref } from '../../scripts/lib/html.ts';

describe('linksInternos', () => {
  it('devuelve solo hrefs internos, sin anclas ni externos ni tel/mailto', () => {
    const html = `<a href="/tarifas/">a</a><a href="/obras/#x">b</a><a href="https://x.com">c</a><a href="tel:1">d</a><a href="mailto:a@b">e</a><a href="#arriba">f</a>`;
    expect(linksInternos(html)).toEqual(['/tarifas/', '/obras/']);
  });
});
describe('normalizarHref', () => {
  it('quita base y resuelve a index.html', () => {
    expect(normalizarHref('/covicen/tarifas/', '/covicen/')).toBe('tarifas/index.html');
    expect(normalizarHref('/covicen/og.png', '/covicen/')).toBe('og.png');
    expect(normalizarHref('/', '/')).toBe('index.html');
  });
});
describe('jsonLdDe', () => {
  it('parsea todos los bloques', () => {
    const html = `<script type="application/ld+json">{"@type":"A"}</script><p></p><script type="application/ld+json">{"@type":"B"}</script>`;
    expect(jsonLdDe(html).map((x) => (x as { '@type': string })['@type'])).toEqual(['A', 'B']);
  });
});
```

- [ ] **Step 2: `scripts/lib/html.ts`**

```ts
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const paginasDe = (dir: string): string[] => {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...paginasDe(ruta));
    else if (nombre.endsWith('.html')) salida.push(ruta);
  }
  return salida;
};

export const linksInternos = (html: string): string[] =>
  [...html.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((h) => h.startsWith('/') && !h.startsWith('//'))
    .map((h) => h.split('#')[0])
    .filter((h) => h !== '');

/** '/covicen/tarifas/' + base '/covicen/' → 'tarifas/index.html' */
export const normalizarHref = (href: string, base: string): string => {
  const sinBase = href.startsWith(base) ? href.slice(base.length) : href.replace(/^\//, '');
  if (sinBase === '' || sinBase.endsWith('/')) return `${sinBase}index.html`;
  return sinBase;
};

export const existeDestino = (dist: string, base: string, href: string): boolean => existsSync(join(dist, normalizarHref(href, base)));

export const jsonLdDe = (html: string): unknown[] =>
  [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
```
Run: `pnpm test tests/scripts/html.test.ts` → PASS.

- [ ] **Step 3: `scripts/verificar.ts`**

```ts
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
  const nombre = relative(DIST, ruta);
  // 1. links internos
  for (const href of new Set(linksInternos(html))) if (!existeDestino(DIST, base, href)) fallo(`${nombre}: link roto → ${href}`);
  // 2. metadatos
  if ((html.match(/<title>/g) ?? []).length !== 1) fallo(`${nombre}: debe haber exactamente un <title>`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) fallo(`${nombre}: falta description (≥ 20 chars)`);
  if (!/<link rel="canonical" href="https?:\/\//.test(html)) fallo(`${nombre}: falta canonical absoluta`);
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) fallo(`${nombre}: debe haber exactamente un <h1>`);
  if (!html.includes('<html lang="es-AR"')) fallo(`${nombre}: falta lang="es-AR"`);
  // 3. JSON-LD
  let bloques: unknown[] = [];
  try { bloques = jsonLdDe(html); } catch (e) { fallo(`${nombre}: JSON-LD inválido (${(e as Error).message})`); }
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
const pares: Array<[string, string]> = [['texto', 'fondo'], ['texto-2', 'fondo'], ['texto-3', 'fondo'], ['acento', 'fondo'], ['vial', 'fondo'], ['texto', 'superficie'], ['texto-2', 'superficie'], ['fondo', 'vial'], ['fondo', 'acento'], ['error', 'fondo']];
for (const [a, b] of pares) { const r = contraste(tokens[a], tokens[b]); if (r < 4.5) fallo(`contraste ${a}/${b} = ${r.toFixed(2)} < 4.5`); }

// 9. presupuesto de JS enviado
const archivosJs = readdirSync(join(DIST, '_astro')).filter((f) => f.endsWith('.js'));
const totalJs = archivosJs.reduce((s, f) => s + gzipSync(readFileSync(join(DIST, '_astro', f))).length, 0);
console.log(`JS total: ${archivosJs.length} archivos, ${(totalJs / 1024).toFixed(1)} KB gz`);
if (totalJs > 30 * 1024) fallo(`JS enviado ${(totalJs / 1024).toFixed(1)} KB gz > 30 KB`);
const og = statSync(join(DIST, 'og.png')).size;
if (og > 300 * 1024) fallo(`og.png pesa ${(og / 1024).toFixed(0)} KB > 300 KB`);

if (fallos.length) { console.error(`\n${fallos.length} fallo(s):\n- ${fallos.join('\n- ')}`); process.exit(1); }
console.log(`\nOK: ${paginas.length} páginas verificadas, 0 fallos.`);
```
Run: `pnpm verificar`
Expected: `OK: N páginas verificadas, 0 fallos.` con N = 22 (home, 17 páginas, 4 novedades) y `JS total` < 30 KB. Si algo falla, **es un bug del sitio, no del script**: arreglalo en el componente.

- [ ] **Step 4: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `chore(verificar): chequeos de links, SEO, JSON-LD, emergencias, contraste y presupuesto sobre dist/`

---

### Task 17: GitHub Actions → GitHub Pages

**Files:**
- Create: `.github/workflows/pages.yml`

- [ ] **Step 1: Workflow**

```yaml
name: Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      # Sin dominio: URL de Pages del repo. Cuando haya dominio: PUBLIC_SITE_URL=https://covicen.com.ar, PUBLIC_BASE_PATH=/, PUBLIC_INDEXABLE=true
      PUBLIC_SITE_URL: https://${{ github.repository_owner }}.github.io
      PUBLIC_BASE_PATH: /${{ github.event.repository.name }}/
      PUBLIC_INDEXABLE: "false"
      FUENTE_DATOS: local
    steps:
      - uses: actions/checkout@v7
      - uses: pnpm/action-setup@v6
        with: { version: 10 }
      - uses: actions/setup-node@v7
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm test
      - run: pnpm verificar
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```
Nota: `pnpm verificar` corre `pnpm build`, que a su vez corre `scripts/generar-og.ts` (resvg tiene binario para linux-x64). Si el repo se llama distinto de `covicen`, el `PUBLIC_BASE_PATH` se ajusta solo. **Si Juli usa una org con repo `<org>.github.io`, cambiá `PUBLIC_BASE_PATH` a `/`.**

- [ ] **Step 2: Validar el YAML y documentar el alta**

Run: `pnpm exec astro --version && node -e "require('node:fs').readFileSync('.github/workflows/pages.yml','utf8')" && gh auth status`
Expected: sin errores. Agregá al `README.md` la sección:
```markdown
## Deploy (GitHub Pages)
1. Crear el repo remoto: `gh repo create covicen --private --source=. --remote=origin` (o público, si Juli quiere).
2. En GitHub → Settings → Pages → Source: **GitHub Actions**.
3. Push a `main`. El workflow corre check + test + verificar y publica. URL: `https://<cuenta>.github.io/covicen/`.
4. Con dominio propio: cambiar las tres variables `PUBLIC_*` del workflow y agregar `public/CNAME`.
```
(Juli crea el repo remoto y hace el push cuando decida commitear.)

- [ ] **Step 3: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `ci: deploy a GitHub Pages con check, test y verificación previa`

---

### Task 18: Documentación: guía de revisión, vault del proyecto, vault global

**Files:**
- Create: `docs/guia-de-revision.md`, `obsidian/Decisiones de arquitectura.md`, `obsidian/Sistema de diseno.md`, `obsidian/Costura de datos.md`
- Modify: `obsidian/Home.md`, `obsidian/Contexto del negocio (Corredores Viales).md` (corrección del PDF: es un manual de marca de 8 páginas; paleta oficial; cabinas confirmadas), `C:\Users\Villex\Obsidian\Proyectos\Covicen.md` (estado + pendientes comerciales)

- [ ] **Step 1: `docs/guia-de-revision.md`**

```markdown
# Guía de revisión — landing Covicen

**URL local:** `pnpm dev` → http://localhost:4321/ (con `.env` copiado de `.env.example` y `PUBLIC_BASE_PATH=/`).
**URL de Pages:** https://<cuenta>.github.io/covicen/ (después del primer push a `main` con Pages habilitado).

Probá en el teléfono también (misma red: `pnpm dev --host` y la IP que imprime). Chrome y Firefox: en Firefox las animaciones de scroll usan el fallback (reveal por IntersectionObserver, hilo de ruta oculto) y tiene que verse igual de terminado.

## Home `/`
- Hero: la ruta se dibuja sola al cargar (≈1 s); título, texto y botones entran escalonados; la cuenta regresiva cambia a "Inicio de operación en N d · HH h · MM min".
- Al scrollear: el header gana fondo translúcido y borde; en desktop, el hilo luminoso del margen izquierdo baja con el scroll; en mobile, la barra fina bajo el header crece.
- Accesos rápidos: cuatro cards; la de Emergencias es amarilla; hover eleva y extiende los esquineros.
- Tarifa: $ 1.399 grande, $ 1.693 con IVA, etiqueta "Tarifa ofertada", vigencia en texto, link al Boletín Oficial.
- Mapa: las tres rutas se dibujan con el scroll; las seis balizas amarillas se encienden en secuencia; hover en una baliza muestra el nombre.
- Mojones (681 km, 3 rutas, 6 peajes): en Chrome cuentan de 0 al valor al entrar; en Firefox aparecen fijos.
- Obras: cuatro cards + el hueco "Estado de rutas — Próximamente" con botón a Emergencias.
- FAQ: abre/cierra con animación; chevron rota.
- Barra de emergencias fija abajo en mobile (< 640 px), con "número a confirmar".

## Tarifas `/tarifas/`
- Tabla: 6 categorías con ícono propio; solo Autos tiene valor; el resto "— a confirmar". Vigencia arriba, avisos y fuente abajo. Hover de fila.

## El tramo `/el-tramo/`
- Desktop: mapa fijo (sticky) mientras pasan cuatro paneles con mojones. Mobile: apilado.
- Estaciones: seis cards con "Nueva"/"Existente" y fuente.

## Servicios, Emergencias, Medios de pago, Seguridad vial
- Emergencias: bloque amarillo con el número (o "a confirmar") y cuatro pasos numerados.
- Medios de pago: tres cards + botón externo a TelePASE + hueco "Pagá tu factura".

## Obras, Quiénes somos, Políticas, Transparencia
- Obras: línea de tiempo vertical con puntos; señal de estado.
- Políticas: navegación por anclas; en Anticorrupción, hueco "Canal ético anónimo" con alternativa por correo.
- Transparencia: cuatro fuentes oficiales con link; datos registrales "en formación".

## Novedades `/novedades/` y detalle
- Listado de 4; detalle con fecha, resumen, cuerpo Markdown y botón volver. Transición de página suave (fade + 8 px).

## Preguntas frecuentes, Contacto, Trabajá con nosotros, Proveedores
- FAQ agrupada por tema con anclas.
- Contacto: formulario con validación en español; "Enviar por WhatsApp" abre `wa.me` con el mensaje armado (si el número está cargado) — hoy muestra "canal a confirmar".

## Pie y navegación
- Footer: 4 columnas, datos registrales "a confirmar", "Sociedad en formación", sitios de interés.
- Menú mobile: se desliza desde la derecha; cierra con la X o con Esc. Dropdown "Nosotros": teclado (Tab/Enter), cierra con Esc o clic afuera.
- Foco visible en todo (Tab por la página).
- `prefers-reduced-motion`: todo estático.

## Qué NO está (por diseño, v1)
Estado de rutas en vivo, oficina virtual, ticketing, portal de proveedores, canal ético anónimo, modo claro, dominio, número de emergencias/WhatsApp/mails, valores de categorías salvo auto, CUIT/razón social.
```

- [ ] **Step 2: Vault del proyecto**

`obsidian/Decisiones de arquitectura.md` — resumir la tabla §2 del spec con el "por qué" y enlazar `[[Costura de datos]]`, `[[Sistema de diseno]]`, `[[Home]]`. Incluir: Astro estático, GitHub Pages sin dominio, editan devs, formularios a WhatsApp, dark-first con tokens semánticos, sin GSAP, verificación sin navegador.

`obsidian/Costura de datos.md` — la estructura de `src/lib/datos`, las 5 reglas, `capacidades.ts`, y **cómo conectar Django mañana** (implementar `fuentes/api.ts` contra `esquemas.ts`, `FUENTE_DATOS=api`, encender flags).

`obsidian/Sistema de diseno.md` — concepto "La ruta, de noche", tokens (marca + semánticos con valores), Archivo, patrones de movimiento y sus fallbacks, micro-interacciones, presupuesto.

`obsidian/Home.md` — agregar las tres notas al índice; en **Estado** agregar la entrada `2026-08-27 — sesión de construcción: brainstorming → spec → plan → landing v1 (Astro). Ver [[Decisiones de arquitectura]]`; corregir `PROMPT_MAESTRO.md` → `docs/PROMPT_MAESTRO.md`.

`obsidian/Contexto del negocio (Corredores Viales).md` — en "Paleta extraída del logo" reemplazar por: el PDF es el **manual de marca "Covicen Marca 9b1" (8 páginas, Claude Design, 19/8/2026)**; paleta oficial (7 colores con hex), tipografía Archivo; el violeta y el verde son "usos incorrectos"; el naranja es un cono. Agregar sección "Cabinas del Tramo Centro (prensa, 25/08/2026)" con las seis y San Vicente, con fuentes.

- [ ] **Step 3: Vault global (comercial, privado)**

En `C:\Users\Villex\Obsidian\Proyectos\Covicen.md` → sección **Estado (2026-08-27)** actualizar: landing v1 construida en local, pendiente commit/push y alta de Pages por Juli. Sección **Pendientes con el cliente**: número de emergencias, WhatsApp, mails, valores por categoría, razón social/CUIT/domicilio, dominio `covicen.com.ar` a nombre de un tercero (NIC.ar exige CUIT), confirmar si "SA" va en el logotipo, imágenes con ChatGPT (`docs/marca/prompts-imagenes.md`). Nada de esto va al repo.

- [ ] **Step 4: Checkpoint**

```bash
git add -A && git status --short
```
Commit (si autorizado): `docs: guía de revisión y vault del proyecto actualizado`

---

### Task 19: Revisión en lane separada, correcciones y verificación final

**Files:**
- Modify: lo que surja de la revisión.

- [ ] **Step 1: Lane de revisión (subagente distinto del que escribió)**

Dispatch de un subagente `general-purpose` con este encargo textual:
> Sos un revisor que NO escribió este código. Invocá las skills `web-design-guidelines` y `page-cro` (están instaladas) y aplicalas sobre `src/` y sobre el HTML construido en `dist/` de este proyecto Astro. Contexto: `docs/superpowers/specs/2026-08-27-landing-covicen-design.md` (leelo). Criterios que mandan: accesibilidad WCAG 2.1 AA, navegación intuitiva y directa (el automovilista encuentra la tarifa en un clic), nada de sobre-animación, copy verificable y en voseo sobrio, dark-first, cero emojis. Devolvé una lista priorizada de hallazgos con archivo:línea, qué está mal, por qué importa y cómo arreglarlo. No arregles nada vos.

- [ ] **Step 2: Atender hallazgos**

Para cada hallazgo: arreglar → `pnpm test` → `pnpm check`. Si un hallazgo contradice el spec, anotarlo en `docs/guia-de-revision.md` bajo "Decisiones tomadas en revisión" con el motivo.

- [ ] **Step 3: `superpowers:verification-before-completion`**

Invocar la skill y pegar la salida **completa** de:
```bash
pnpm check
pnpm test
pnpm verificar
```
Más: `ls dist | head`, `du -sh dist`, y el `JS total` que imprime `verificar.ts`. Ninguna afirmación de "listo" sin estos outputs.

- [ ] **Step 4: Entrega a Juli**

Mensaje final con: URL local exacta, `docs/guia-de-revision.md`, lista de pendientes que dependen del cliente, y la línea para crear el repo remoto y habilitar Pages. Sin commit salvo pedido.
