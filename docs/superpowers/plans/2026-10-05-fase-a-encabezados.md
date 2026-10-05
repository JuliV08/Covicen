# Fase A · Encabezados centrados y títulos con degradé — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centrar los encabezados de todo el sitio (menos el hero), poner el degradé de Covicen en los títulos (animado solo
en el `h1`), sacar la grilla animada que sigue al mouse y arreglar dos rótulos del mapa, sin perder contraste ni
accesibilidad.

**Architecture:** Casi todo vive en tres piezas compartidas: `Seccion.astro` (arma el encabezado en 46 lugares),
`global.css` (la clase `.titulo` con el degradé) y `tokens.css` (un color nuevo para el título sobre la foto). Lo
demás son retoques puntuales de clases en páginas y una función pura nueva en `src/lib/tramo.ts` que ubica los rótulos
del mapa sin que se pisen. Cero JavaScript nuevo; se borra el de la grilla.

**Tech Stack:** Astro 7 (estático), Tailwind v4, vitest + `experimental_AstroContainer`, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-05-fase-a-encabezados-design.md`

## Global Constraints

- Se trabaja SOLO en el worktree `C:\Users\Villex\dev\Covicen-detalles`, rama `web-detalles-2026-10-05`. Hay otra sesión
  trabajando en `C:\Users\Villex\dev\Covicen`: no se toca esa carpeta ni se deshace nada que no se haya hecho acá.
- Commits: solo si Juli los autorizó al elegir cómo se ejecuta el plan. Si no, se acumula y se commitea al final con
  su OK. Siempre `git add` con rutas explícitas; nunca `git add -A` ni `git stash` a secas.
- Contraste: 4,5:1 para texto, 3:1 para títulos (texto grande), medido en los dos temas (`scripts/lib/pares.ts`,
  `tests/styles/tokens.test.ts`, `tests/styles/hero-foto.test.ts`).
- Sin JavaScript nuevo. El efecto del título es CSS puro.
- `prefers-reduced-motion: reduce` deja el título quieto.
- Esta tanda es estética: **ningún texto visible cambia**.
- El hero de la home queda alineado a la izquierda.
- Las coordenadas del mapa (viewBox 820 × 520 y `mapa` de `src/content/tramo.json`) NO se tocan: son contrato con el
  panel del backend.
- Comentarios en español rioplatense, explicando el porqué con fecha, como el resto del repo.
- Sin pruebas visuales con Chrome durante la ejecución (regla de Juli). La medición automática de desbordes de la
  Tarea 7 no es una prueba visual: es un script.
- `pnpm verificar:portada` pisa `dist/`: va siempre último.

## Review Focus

1. **Un título largo a 320 px con `width: fit-content`** no tiene que correr la página de costado (pasó el 05/10 con
   «Póliza de responsabilidad civil.»). Lo fija la medición de desbordes de la Tarea 7, en modo escritorio.
2. **El texto seleccionado de un título con degradé** se tiene que leer (con `color: transparent` desaparecería). Lo
   fija el test de `.titulo::selection` de la Tarea 2.
3. **Cambiar de tema con la página abierta**: el degradé tiene que seguir al tema sin recargar, o sea salir solo de
   variables, nunca de colores fijos. Lo fija el test de la Tarea 2 que exige `var(--color-texto)` y `var(--titulo-b)`.
4. **Un título de tarjeta** (las de Medios de pago, Novedades, Trámites) no lleva degradé: el degradé es de los títulos
   de página y de sección. Lo fija el test de la Tarea 3 sobre Medios de pago y Novedades.
5. **«Reducir movimiento» junto con la regla global** `* { animation-duration: 0.01ms !important }`: el `h1` tiene que
   quedar quieto, no saltar al final del recorrido. Lo fija el test de la Tarea 2 que exige `animation: none`.

---

### Task 1: Fuera la grilla animada

**Files:**
- Delete: `src/components/ilustraciones/GrillaCinetica.astro`, `src/scripts/grilla-cinetica.ts`, `src/scripts/lib/color.ts`, `tests/scripts/color.test.ts`
- Modify: `src/components/ui/Seccion.astro`, `src/components/home/ContactoCta.astro`, `src/styles/global.css:60-85`, `src/styles/impresion.css:45,50`, `src/lib/fondos.ts:1-4`
- Modify (tests): `tests/presupuesto.test.ts:11-15`, `tests/styles/colores-fijos.test.ts:8`, `tests/components/contacto-telepase.test.ts:21-24`
- Create: `tests/components/fase-a.test.ts`

**Interfaces:**
- Produces: la clase `.seccion-tono` (reemplaza a `.seccion-cinetica`); `Seccion` con `fondo="fondo-2" | "plano"` la pone.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/components/fase-a.test.ts`:

```ts
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ContactoCta from '@/components/home/ContactoCta.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

// Fase A de la tanda estética del 05/10/2026: docs/superpowers/specs/2026-10-05-fase-a-encabezados-design.md.
const render = async (C: unknown, props: Record<string, unknown> = {}) =>
  (await AstroContainer.create()).renderToString(C as never, { props });
const fuentes = (dir: string, ext: RegExp) =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) => ext.test(f)).map((f) => join(dir, f));

// «Me acaban de pedir también que saque el background grid animado que sigue al mouse» (Juli, 05/10/2026).
describe('fuera la grilla animada', () => {
  it('no quedan ni el componente, ni el script, ni su ayudante de color, ni la clase vieja', () => {
    for (const f of ['src/components/ilustraciones/GrillaCinetica.astro', 'src/scripts/grilla-cinetica.ts', 'src/scripts/lib/color.ts']) {
      expect(existsSync(f), f).toBe(false);
    }
    const rastros = fuentes('src', /\.(astro|ts|css)$/).filter((f) => /data-grilla|GrillaCinetica|grilla-cinetica|seccion-cinetica/.test(readFileSync(f, 'utf8')));
    expect(rastros).toEqual([]);
  });
  it('una sección con tono no trae canvas, y conserva el tono y las dos costuras', async () => {
    const html = await render(Seccion, { titulo: 'Prueba.', fondo: 'fondo-2' });
    expect(html).not.toContain('<canvas');
    expect(html).toMatch(/<section[^>]*class="[^"]*seccion-tono/);
    expect(html.match(/class="costura /g)?.length).toBe(2);
  });
  it('el bloque de Contacto de la home tampoco trae canvas', async () => {
    const html = await render(ContactoCta, { contacto: await fuenteLocalJson.contacto() });
    expect(html).not.toContain('<canvas');
    expect(html).toMatch(/<section[^>]*class="[^"]*seccion-tono/);
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `pnpm vitest run tests/components/fase-a.test.ts`
Expected: FAIL — los tres archivos existen y el HTML trae `<canvas`.

- [ ] **Step 3: Borrar la grilla**

```bash
git rm src/components/ilustraciones/GrillaCinetica.astro src/scripts/grilla-cinetica.ts src/scripts/lib/color.ts tests/scripts/color.test.ts
```

`src/scripts/lib/color.ts` solo lo usaba la grilla (`grep -rn "lib/color" src` no da nada más).

- [ ] **Step 4: `Seccion.astro` sin grilla**

En `src/components/ui/Seccion.astro`: borrar la línea `import GrillaCinetica from '@/components/ilustraciones/GrillaCinetica.astro';` y la línea `  {cinetica && <GrillaCinetica />}`. Cambiar el comentario de la prop y la clase:

```astro
  /** 'fondo' = liso; 'fondo-2' y 'plano' = sección con tono de fondo, fundida con las vecinas y con costuras. */
```

```astro
<section id={id} class:list={['relative py-20 md:py-28', cinetica ? 'seccion-tono' : 'bg-fondo', clase]}>
```

(La variable `cinetica` pasa a llamarse `conTono` en las tres líneas donde aparece.)

- [ ] **Step 5: `ContactoCta.astro` sin grilla**

Borrar `import GrillaCinetica from '@/components/ilustraciones/GrillaCinetica.astro';` y `  <GrillaCinetica />`, y en el `<section>` cambiar `seccion-cinetica` por `seccion-tono`.

- [ ] **Step 6: CSS**

En `src/styles/global.css`, reemplazar el bloque de la sección con grilla (desde el comentario `/* Sección con grilla cinética…` hasta el cierre de `.seccion-cinetica > canvas { … }`) por:

```css
  /* Sección con tono, fundida con las vecinas: el fondo va de `fondo` a `fondo-2` y vuelve, y una "costura" (hairline
     + marca vial centrada) une los bloques. Hasta el 05/10/2026 llevaba además la grilla animada que seguía al
     puntero; se sacó a pedido («saquen el background grid animado que sigue al mouse») y en tema claro las líneas
     pasaban por detrás de las bajadas. */
  .seccion-tono {
    overflow: hidden;
    background: linear-gradient(180deg, var(--color-fondo) 0%, var(--color-fondo-2) 16%, var(--color-fondo-2) 84%, var(--color-fondo) 100%);
  }
```

Y el comentario `/* resplandor que "derrama" la grilla hacia la sección vecina */` pasa a `/* resplandor que "derrama" el tono hacia la sección vecina */`.

En `src/styles/impresion.css`: en la línea 45 sacar `[data-grilla], ` de la lista; en la línea 50 cambiar `.seccion-cinetica` por `.seccion-tono`.

En `src/lib/fondos.ts`, primeras líneas: «alternan fondo liso y grilla cinética» → «alternan fondo liso y fondo con tono», y «La primera va con grilla» → «La primera va con tono».

- [ ] **Step 7: Tests que nombraban la grilla**

`tests/presupuesto.test.ts`: sacar `'src/scripts/grilla-cinetica.ts', ` del arreglo `animacion` y `'src/scripts/lib/color.ts', ` del arreglo `todos`. Al comentario de la línea 15 sumarle: ` La grilla se fue el 05/10/2026.`

`tests/styles/colores-fijos.test.ts:8`: sacar `'src/scripts/lib/color.ts'` del `Set` de permitidos.

`tests/components/contacto-telepase.test.ts`: `seccion-cinetica` → `seccion-tono`, y el comentario «pasa a llevar la grilla» → «pasa a llevar el tono».

- [ ] **Step 8: Correr todo**

Run: `pnpm vitest run tests/components/fase-a.test.ts && pnpm test`
Expected: PASS. Si algún otro test buscaba `seccion-cinetica`, cambiarlo a `seccion-tono` (el `grep -rn seccion-cinetica tests` del 05/10 solo dio `contacto-telepase.test.ts`).

- [ ] **Step 9: Commit (si Juli autorizó commits por tarea)**

```bash
git add src/components/ui/Seccion.astro src/components/home/ContactoCta.astro src/styles/global.css src/styles/impresion.css src/lib/fondos.ts tests/presupuesto.test.ts tests/styles/colores-fijos.test.ts tests/components/contacto-telepase.test.ts tests/components/fase-a.test.ts
git commit -m "feat(fase-a): fuera la grilla animada que seguia al mouse"
```

---

### Task 2: El degradé de los títulos (CSS y color nuevo)

**Files:**
- Modify: `src/styles/tokens.css:27,112,164,219`, `src/styles/global.css` (capa `components`), `src/styles/impresion.css`, `scripts/lib/pares.ts:12`
- Modify (tests): `tests/styles/hero-foto.test.ts:108-145`
- Create: `tests/styles/titulos.test.ts`

**Interfaces:**
- Produces: clases `.titulo` (degradé quieto; animado si es `h1`) y `.titulo-foto` (la franja va hacia `--color-titulo-brillo`); token `--color-titulo-brillo`.

- [ ] **Step 1: Escribir el test que falla**

Crear `tests/styles/titulos.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { paresContraste } from '../../scripts/lib/pares';

// Títulos con el degradé de Covicen (fase A, 05/10/2026). CSS puro: el GradientText de reactbits que propuso Juli usa
// React y `motion`, y el sitio no tiene React.
const global = readFileSync('src/styles/global.css', 'utf8');
const impresion = readFileSync('src/styles/impresion.css', 'utf8');
const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regla = (css: string, selector: string) => new RegExp(`(?:^|[\\s}])${escapar(selector)}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

describe('títulos con degradé', () => {
  it('.titulo pinta texto → acento → texto, recortado a las letras y al ancho del texto, solo con variables', () => {
    const r = regla(global, '.titulo');
    expect(r).toContain('--titulo-b: var(--color-acento)');
    expect(r).toContain('linear-gradient(90deg, var(--color-texto) 0%, var(--titulo-b) 50%, var(--color-texto) 100%)');
    expect(r).toContain('background-clip: text');
    expect(r).toContain('color: transparent');
    expect(r).toContain('width: fit-content');
    expect(r).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
  it('sobre la foto, la franja va hacia más contraste, no hacia el azul', () => {
    expect(regla(global, '.titulo-foto')).toContain('--titulo-b: var(--color-titulo-brillo)');
  });
  it('solo el h1 se mueve, lento, y se queda quieto con «reducir movimiento»', () => {
    expect(regla(global, 'h1.titulo')).toContain('animation: titulo-recorre 10s');
    expect(global).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*h1\.titulo\s*\{\s*animation: none;/);
    expect(global).not.toMatch(/h2\.titulo\s*\{[^}]*animation/);
  });
  it('con alto contraste de Windows va en el color del sistema, y lo seleccionado se lee', () => {
    expect(global).toMatch(/@media \(forced-colors: active\)\s*\{\s*\.titulo\s*\{\s*background: none; color: CanvasText;/);
    expect(regla(global, '.titulo::selection')).toContain('color: var(--color-fondo)');
  });
  it('al imprimir, color pleno y quieto', () => {
    const r = regla(impresion, '.titulo');
    expect(r).toContain('background: none !important');
    expect(r).toContain('color: var(--color-texto) !important');
    expect(r).toContain('animation: none !important');
  });
  it('--color-titulo-brillo existe en los cuatro bloques: blanco en oscuro, navy profundo en claro', () => {
    const valores = [...tokens.matchAll(/--color-titulo-brillo:\s*(#[0-9A-Fa-f]{6})/g)].map((m) => m[1]!.toUpperCase());
    expect(valores).toEqual(['#FFFFFF', '#0B1526', '#FFFFFF', '#FFFFFF']);
  });
  it('el build mide el brillo contra el fondo en los dos temas', () => {
    expect(paresContraste).toContainEqual(['titulo-brillo', 'fondo']);
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `pnpm vitest run tests/styles/titulos.test.ts`
Expected: FAIL — no existe `.titulo` ni el token.

- [ ] **Step 3: El token, en los cuatro bloques de `tokens.css`**

Debajo de cada línea `--color-acento:` agregar la línea del brillo, con la sangría del bloque:
- línea 27 (`@theme static`, oscuro): `  --color-titulo-brillo: #FFFFFF; /* la franja del título sobre la foto: hacia MÁS contraste (05/10/2026) */`
- línea 112 (`html[data-tema="claro"]`): `  --color-titulo-brillo: #0B1526;`
- línea 164 (`.zona-noche`): `    --color-titulo-brillo: #FFFFFF;`
- línea 219 (`html[data-tema="claro"] :is(.tarjeta, .bloque-oscuro)`): `    --color-titulo-brillo: #FFFFFF;`

En `scripts/lib/pares.ts`, después de la fila de TelePASE:

```ts
  // La franja del título sobre la foto del hero y de la portada (05/10/2026): va hacia más contraste que el texto.
  ['titulo-brillo', 'fondo'],
```

- [ ] **Step 4: La clase en `global.css`**

Dentro de `@layer components { … }`, después de la regla `.eyebrow { … }`, en este orden (el test busca `.titulo {` antes que `h1.titulo {`):

```css
  /* Títulos con el degradé de Covicen (fase A, 05/10/2026). Del color del texto al azul de la marca y vuelta, recortado
     a las letras. Sale solo de variables: cambia con el tema sin recargar y, adentro de una zona oscura del tema claro,
     sigue al color de lo que tiene debajo. `texto` y `acento` ya están medidos en pares.ts, y los colores intermedios
     caen entre los dos. Ancho del texto y no de la caja, para que un título corto muestre el degradé entero. */
  .titulo {
    --titulo-b: var(--color-acento);
    width: fit-content;
    background-image: linear-gradient(90deg, var(--color-texto) 0%, var(--titulo-b) 50%, var(--color-texto) 100%);
    background-size: 200% 100%;
    background-position: 0% 50%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  /* Con el color transparente, lo seleccionado no se vería: se pinta como una selección común. */
  .titulo::selection { color: var(--color-fondo); background-color: var(--color-acento); }
  /* Sobre la foto (hero y portada) el azul no llega a 3:1 (medido el 05/10/2026: entre 1,65 y 2,7:1 en claro, 2,05:1 a
     1023 px en oscuro). Ahí la franja va hacia MÁS contraste: blanco en oscuro, navy profundo en claro. */
  .titulo-foto { --titulo-b: var(--color-titulo-brillo); }
  /* Solo el título principal de la página se mueve (hay uno por página: lo controla verificar.ts). */
  h1.titulo { animation: titulo-recorre 10s var(--ease-suave) infinite alternate; }
  @keyframes titulo-recorre { to { background-position: 100% 50%; } }
  /* Explícito: la regla global de «reducir movimiento» acorta la animación a 0,01 ms pero no la apaga. */
  @media (prefers-reduced-motion: reduce) {
    h1.titulo { animation: none; }
  }
  @media (forced-colors: active) {
    .titulo { background: none; color: CanvasText; }
  }
```

- [ ] **Step 5: Imprimir**

En `src/styles/impresion.css`, después de la línea `h1, h2, h3 { break-after: avoid; }`:

```css
  /* El navegador no imprime fondos por defecto, y el título con degradé es un fondo recortado a las letras: sin esto
     saldría en blanco. */
  .titulo { background: none !important; color: var(--color-texto) !important; animation: none !important; }
```

- [ ] **Step 6: La franja sobre la foto, medida**

En `tests/styles/hero-foto.test.ts`, dentro del `it(...)` del loop por tema: debajo de `const texto = aRgb(tema.tokens['color-texto']!);` agregar

```ts
        // La franja del degradé del h1 sobre la foto (fase A, 05/10/2026): tiene que llegar a 3:1 igual que el texto.
        const franja = aRgb(tema.tokens['color-titulo-brillo']!);
```

y reemplazar la línea

```ts
                peor = Math.min(peor, contraste(sobre(foto(fx, fy), fondo, opacidad(angosta ? vy : vx)), texto));
```

por

```ts
                const pixel = sobre(foto(fx, fy), fondo, opacidad(angosta ? vy : vx));
                for (const color of cual === 'h1' ? [texto, franja] : [texto]) peor = Math.min(peor, contraste(pixel, color));
```

Y el título del `it`: `el párrafo llega a 4,5:1 y el h1 a 3:1 en toda pantalla` → `el párrafo llega a 4,5:1 y el h1, con la franja del degradé, a 3:1 en toda pantalla`.

- [ ] **Step 7: Correr**

Run: `pnpm vitest run tests/styles/titulos.test.ts tests/styles/hero-foto.test.ts tests/styles/tokens.test.ts && pnpm test`
Expected: PASS. Si `tokens.test.ts` falla porque el bloque claro y el de tinta tienen que redefinir EXACTAMENTE los mismos tokens, revisar que el token esté en los cuatro bloques (Step 3).

- [ ] **Step 8: Commit (si Juli autorizó commits por tarea)**

```bash
git add src/styles/tokens.css src/styles/global.css src/styles/impresion.css scripts/lib/pares.ts tests/styles/titulos.test.ts tests/styles/hero-foto.test.ts
git commit -m "feat(fase-a): el degrade de Covicen en los titulos, con brillo sobre la foto"
```

---

### Task 3: El degradé llega a todos los títulos

**Files:**
- Modify: `src/components/ui/Seccion.astro`, `src/components/home/Hero.astro:45`, `src/layouts/Proximamente.astro:90`, `src/pages/404.astro:8`, `src/pages/novedades/[slug].astro:28`, `src/components/home/ContactoCta.astro:18`, `src/pages/emergencias.astro:35`, `src/pages/preguntas-frecuentes.astro:18`, `src/pages/transparencia/[...resto].astro:33`, `src/pages/tramites.astro:60,66`, `src/pages/asistencia.astro:20,29`
- Test: `tests/components/fase-a.test.ts`

**Interfaces:**
- Consumes: `.titulo` y `.titulo-foto` (Task 2).

- [ ] **Step 1: Escribir el test que falla**

Sumar a `tests/components/fase-a.test.ts` (imports nuevos arriba: `Hero` de `@/components/home/Hero.astro`, `Proximamente` de `@/layouts/Proximamente.astro`, `Emergencias` de `@/pages/emergencias.astro`, `PreguntasFrecuentes` de `@/pages/preguntas-frecuentes.astro`, `Asistencia` de `@/pages/asistencia.astro`, `MediosDePago` de `@/pages/medios-de-pago.astro`, `NovedadesIndice` de `@/pages/novedades/index.astro`):

```ts
const pagina = async (Pagina: unknown, url: string) =>
  (await AstroContainer.create()).renderToString(Pagina as never, { request: new Request(`https://covicen.test${url}`) });
const conTitulo = (tag: string) => /\bclass="[^"]*\btitulo\b/.test(tag);

describe('el degradé llega a todos los títulos', () => {
  it('todo <h1> escrito a mano lleva .titulo', () => {
    const sin = fuentes('src', /\.astro$/).flatMap((f) =>
      [...readFileSync(f, 'utf8').matchAll(/<h1\s[^>]*>/g)].filter((m) => !conTitulo(m[0])).map((m) => `${f}: ${m[0]}`));
    expect(sin).toEqual([]);
  });
  it('el título de Seccion lleva .titulo, como h2 y como h1', async () => {
    expect((await render(Seccion, { titulo: 'Prueba.' })).match(/<h2[^>]*>/)?.[0]).toMatch(/\btitulo\b/);
    expect((await render(Seccion, { titulo: 'Prueba.', nivel: 'h1' })).match(/<h1[^>]*>/)?.[0]).toMatch(/\btitulo\b/);
  });
  it('el h1 del hero y el de la portada van con el brillo de foto', async () => {
    expect((await render(Hero, { empresa: await fuenteLocalJson.empresa() })).match(/<h1[^>]*>/)?.[0]).toMatch(/\btitulo titulo-foto\b/);
    expect((await render(Proximamente)).match(/<h1[^>]*>/)?.[0]).toMatch(/\btitulo titulo-foto\b/);
  });
  it('los h2 sueltos de contenido también', async () => {
    expect(await pagina(Emergencias, '/emergencias/')).toMatch(/<h2 class="[^"]*\btitulo\b[^"]*"[^>]*>Canales de atención<\/h2>/);
    const faq = await pagina(PreguntasFrecuentes, '/preguntas-frecuentes/');
    const temas = [...faq.matchAll(/<section id="tema-[^"]*"[^>]*><h2[^>]*>/g)].map((m) => m[0]);
    expect(temas.length).toBeGreaterThan(0);
    for (const t of temas) expect(t).toMatch(/\btitulo\b/);
    const asistencia = await pagina(Asistencia, '/asistencia/');
    for (const t of ['Compartí tu ubicación', 'Contanos qué pasó']) expect(asistencia).toMatch(new RegExp(`<h2 class="[^"]*\\btitulo\\b[^"]*"[^>]*>${t}</h2>`));
  });
  it('los títulos de tarjeta no llevan degradé', async () => {
    for (const html of [await pagina(MediosDePago, '/medios-de-pago/'), await pagina(NovedadesIndice, '/novedades/')]) {
      const deTarjeta = [...html.matchAll(/<h2 class="text-xl"[^>]*>/g)];
      expect(deTarjeta.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `pnpm vitest run tests/components/fase-a.test.ts`
Expected: FAIL en los cuatro primeros casos del bloque nuevo.

- [ ] **Step 3: Poner la clase**

- `Seccion.astro`: `<Titulo class:list={['titulo', eyebrow && 'mt-3']}>{titulo}</Titulo>`.
- `Hero.astro:45`: `<h1 class="titulo titulo-foto mt-6 max-w-4xl" style="--i: 1">`.
- `Proximamente.astro:90`: `<h1 class="titulo titulo-foto mt-6">Próximamente</h1>`.
- `404.astro:8`: `<h1 class="titulo mt-3">`.
- `novedades/[slug].astro:28`: `<h1 class="titulo mt-4">`.
- `ContactoCta.astro:18`: `<h2 class="titulo mt-3">`.
- `emergencias.astro:35`: `<h2 class="titulo mb-4 text-2xl">Canales de atención</h2>`.
- `preguntas-frecuentes.astro:18`: `<h2 class="titulo revelar mb-4 text-2xl">`.
- `transparencia/[...resto].astro:33`: `<h2 class="titulo revelar mb-6 text-2xl">Normativa aplicable</h2>`.
- `tramites.astro:60`: `<h2 class="titulo text-2xl">¿Tenés una consulta sobre un trámite?</h2>`; `tramites.astro:66`: `<h2 class="titulo text-2xl">Iniciá tu trámite</h2>`.
- `asistencia.astro:20` y `:29`: `<h2 class="titulo text-2xl">`.

No llevan `.titulo` (títulos de tarjeta o de paso): los `h2` adentro de `Card`/`.tarjeta` (Medios de pago, Novedades,
Trámites `t.nombre`, Obras, Políticas, la tarjeta de la grúa de Emergencias) y los de los pasos de Emergencias.

- [ ] **Step 4: Correr**

Run: `pnpm vitest run tests/components/fase-a.test.ts && pnpm test`
Expected: PASS. Si algún test existente compara el `<h1>` o `<h2>` exacto (por ejemplo `/<h2[^>]*>Cuánto cuesta<\/h2>/`), sigue pasando porque los regex aceptan clases.

- [ ] **Step 5: Commit (si Juli autorizó commits por tarea)**

```bash
git add src/components/ui/Seccion.astro src/components/home/Hero.astro src/layouts/Proximamente.astro src/pages/404.astro "src/pages/novedades/[slug].astro" src/components/home/ContactoCta.astro src/pages/emergencias.astro src/pages/preguntas-frecuentes.astro "src/pages/transparencia/[...resto].astro" src/pages/tramites.astro src/pages/asistencia.astro tests/components/fase-a.test.ts
git commit -m "feat(fase-a): todos los titulos con el degrade; animado solo el principal"
```

---

### Task 4: Encabezados y migas centrados

**Files:**
- Modify: `src/components/ui/Seccion.astro`, `src/components/ui/Eyebrow.astro`, `src/components/Breadcrumbs.astro:9`
- Test: `tests/components/fase-a.test.ts`

**Interfaces:**
- Consumes: `.titulo` (Task 3 ya lo puso en el título de `Seccion`).
- Produces: `Seccion` acepta `alinear?: 'centro' | 'izquierda'` (por defecto `'centro'`); `Eyebrow` acepta `centrado?: boolean`.

- [ ] **Step 1: Escribir el test que falla**

Sumar a `tests/components/fase-a.test.ts` (import nuevo: `Breadcrumbs` de `@/components/Breadcrumbs.astro`):

```ts
describe('encabezados centrados', () => {
  const encabezado = (html: string) => /<header[^>]*>[\s\S]*?<\/header>/.exec(html)?.[0] ?? '';
  it('por defecto: columna centrada, etiqueta con una línea a cada lado, título y bajada al medio', async () => {
    const h = encabezado(await render(Seccion, { eyebrow: 'El tramo', titulo: 'Prueba.', intro: 'Bajada.' }));
    expect(h.match(/<header[^>]*>/)?.[0]).toMatch(/\bmx-auto\b.*\btext-center\b|\btext-center\b.*\bmx-auto\b/);
    expect(h.match(/<p class="eyebrow[^"]*"/)?.[0]).toContain('justify-center');
    expect(h.match(/class="inline-block h-px w-6 bg-acento"/g)?.length).toBe(2);
    expect(h.match(/<h2[^>]*>/)?.[0]).toMatch(/\bmx-auto\b/);
    expect(h.match(/<p class="[^"]*\bmax-w-2xl\b[^"]*">Bajada\.<\/p>/)?.[0]).toMatch(/\bmx-auto\b/);
  });
  it('alinear="izquierda" deja el encabezado como antes', async () => {
    const h = encabezado(await render(Seccion, { eyebrow: 'X', titulo: 'Prueba.', intro: 'Bajada.', alinear: 'izquierda' }));
    expect(h).not.toContain('text-center');
    expect(h.match(/class="inline-block h-px w-6 bg-acento"/g)?.length).toBe(1);
  });
  it('las migas de pan van centradas', async () => {
    const html = await render(Breadcrumbs, { migas: [{ nombre: 'Tarifas', href: '/tarifas' }] });
    expect(html.match(/<ol[^>]*>/)?.[0]).toContain('justify-center');
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `pnpm vitest run tests/components/fase-a.test.ts`
Expected: FAIL en los tres casos nuevos.

- [ ] **Step 3: `Eyebrow.astro`**

Reemplazar el archivo entero por:

```astro
---
// `centrado` (fase A, 05/10/2026): la etiqueta de un encabezado centrado lleva una línea a cada lado («── EL TRAMO ──»).
// Sin él queda la de una sola línea, a la izquierda, que es la del hero.
interface Props { class?: string; centrado?: boolean }
const { class: clase = '', centrado = false } = Astro.props;
---
<p class:list={['eyebrow flex items-center gap-3', centrado && 'justify-center', clase]}><span class="inline-block h-px w-6 bg-acento" aria-hidden="true"></span><slot />{centrado && <span class="inline-block h-px w-6 bg-acento" aria-hidden="true"></span>}</p>
```

- [ ] **Step 4: `Seccion.astro`**

En `Props`, sumar:

```ts
  /** Encabezado centrado por defecto (fase A, 05/10/2026: «quedaría mejor si estuviera centrado»). 'izquierda' es el
   *  escape para la sección que no funcione centrada; hoy no la usa ninguna. */
  alinear?: 'centro' | 'izquierda';
```

En la desestructuración sumar `alinear = 'centro'` y debajo `const centrado = alinear === 'centro';`. El `<header>` queda:

```astro
      <header class:list={['revelar mb-12 max-w-3xl', centrado && 'mx-auto text-center']}>
        {eyebrow && <Eyebrow {centrado}>{eyebrow}</Eyebrow>}
        {titulo && <Titulo class:list={['titulo', eyebrow && 'mt-3', centrado && 'mx-auto']}>{titulo}</Titulo>}
        {intro && <p class:list={['mt-4 max-w-2xl text-lg text-texto-2 md:text-xl', centrado && 'mx-auto']}>{intro}</p>}
      </header>
```

(`text-wrap: pretty` ya lo pone la regla global de `p`. El contenido del `<slot />` no cambia: grillas, tablas y textos
largos siguen alineados a la izquierda adentro de su bloque.)

- [ ] **Step 5: `Breadcrumbs.astro:9`**

`<ol class="flex flex-wrap items-center justify-center gap-1 text-sm text-texto-2">`

- [ ] **Step 6: Correr**

Run: `pnpm vitest run tests/components/fase-a.test.ts tests/components/ui.test.ts && pnpm test`
Expected: PASS.

- [ ] **Step 7: Commit (si Juli autorizó commits por tarea)**

```bash
git add src/components/ui/Seccion.astro src/components/ui/Eyebrow.astro src/components/Breadcrumbs.astro tests/components/fase-a.test.ts
git commit -m "feat(fase-a): encabezados y migas centrados"
```

---

### Task 5: Lo suelto al centro

**Files:**
- Modify: `src/components/home/ContactoCta.astro`, `src/components/home/ElTramo.astro:27`, `src/pages/el-tramo.astro:96`, `src/pages/emergencias.astro:22,35,36`, `src/pages/tarifas.astro:102,140`, `src/pages/medios-de-pago.astro:61`, `src/pages/seguridad-vial.astro:20`, `src/pages/tramites.astro:59-62`, `src/pages/novedades/[slug].astro:24-33`, `src/pages/404.astro`, `src/pages/preguntas-frecuentes.astro:18`, `src/pages/transparencia/[...resto].astro:33`
- Test: `tests/components/fase-a.test.ts`

**Interfaces:**
- Consumes: `Eyebrow` con `centrado` (Task 4); `.titulo` (Task 3).

- [ ] **Step 1: Escribir el test que falla**

Sumar a `tests/components/fase-a.test.ts`:

```ts
// Lo que quedaba suelto a la izquierda al final de una sección pasa al centro (fase A). Es una lista cerrada, sacada
// recorriendo los 46 usos de Seccion y los encabezados armados a mano el 05/10/2026.
const CENTRADOS: Array<[string, RegExp]> = [
  ['src/components/home/ElTramo.astro', /<div class="revelar mt-8 flex justify-center"><Boton href="\/el-tramo"/],
  ['src/pages/el-tramo.astro', /<div class="revelar mt-8 flex justify-center"><Boton href="\/tarifas">/],
  ['src/pages/emergencias.astro', /<div class="revelar mt-6 flex justify-center"><Boton href="\/asistencia"/],
  ['src/pages/emergencias.astro', /<h2 class="titulo mx-auto mb-4 text-center text-2xl">Canales de atención<\/h2>/],
  ['src/pages/emergencias.astro', /<div class="revelar mt-12 flex justify-center"><Boton href="\/seguridad-vial"/],
  ['src/pages/tarifas.astro', /<div class="revelar flex justify-center"><Boton href="\/tramites"/],
  ['src/pages/tarifas.astro', /<div class="revelar flex flex-wrap justify-center gap-3">\s*<Boton href="\/medios-de-pago"/],
  ['src/pages/medios-de-pago.astro', /<div class="revelar flex flex-wrap items-center justify-center gap-4">\s*<Boton href=\{oficina\}/],
  ['src/pages/seguridad-vial.astro', /<div class="revelar mt-8 flex flex-wrap justify-center gap-3"><Boton href="tel:140"/],
  ['src/pages/tramites.astro', /<div class="revelar mt-16 flex flex-col items-center gap-4 text-center">/],
  ['src/pages/tramites.astro', /<h2 class="titulo mx-auto text-2xl">¿Tenés una consulta sobre un trámite\?<\/h2>/],
  ['src/pages/novedades/[slug].astro', /<header class="revelar mx-auto max-w-3xl text-center">/],
  ['src/pages/novedades/[slug].astro', /<h1 class="titulo mx-auto mt-4">/],
  ['src/pages/novedades/[slug].astro', /<div class="prose-covicen revelar mx-auto mt-12 max-w-prose text-lg text-texto-2">/],
  ['src/pages/novedades/[slug].astro', /<div class="revelar mt-12 flex justify-center"><Boton href="\/novedades"/],
  ['src/pages/404.astro', /<section class="contenedor py-24 text-center">/],
  ['src/pages/404.astro', /<h1 class="titulo mx-auto mt-3">/],
  ['src/pages/404.astro', /<p class="mx-auto mt-4 max-w-prose text-texto-2">/],
  ['src/pages/preguntas-frecuentes.astro', /<h2 class="titulo revelar mx-auto mb-4 text-center text-2xl">/],
  ['src/pages/transparencia/[...resto].astro', /<h2 class="titulo revelar mx-auto mb-6 text-center text-2xl">Normativa aplicable<\/h2>/],
];

describe('lo suelto, al centro', () => {
  it.each(CENTRADOS)('%s: %s', (archivo, patron) => {
    expect(readFileSync(archivo, 'utf8')).toMatch(patron);
  });
  it('el bloque de Contacto de la home es una columna centrada', async () => {
    const html = await render(ContactoCta, { contacto: await fuenteLocalJson.contacto() });
    expect(html).toMatch(/class="contenedor revelar relative z-10 flex flex-col items-center gap-6 text-center"/);
    expect(html.match(/class="inline-block h-px w-6 bg-acento"/g)?.length).toBe(2);
    expect(html).toMatch(/<div class="flex flex-wrap justify-center gap-3">/);
    expect(html.match(/<h2[^>]*>/)?.[0]).toMatch(/\btitulo mx-auto\b/);
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `pnpm vitest run tests/components/fase-a.test.ts`
Expected: FAIL en los casos nuevos.

- [ ] **Step 3: Los cambios, uno por uno** (solo clases; ningún texto cambia)

- `ElTramo.astro:27`: `<div class="revelar mt-8">` → `<div class="revelar mt-8 flex justify-center">`.
- `el-tramo.astro:96`: `<div class="revelar mt-8">` → `<div class="revelar mt-8 flex justify-center">`.
- `emergencias.astro:22`: `<div class="revelar mt-6">` → `<div class="revelar mt-6 flex justify-center">`.
- `emergencias.astro:35`: `<h2 class="titulo mb-4 text-2xl">` → `<h2 class="titulo mx-auto mb-4 text-center text-2xl">`.
- `emergencias.astro:36`: `<div class="revelar mt-12">` → `<div class="revelar mt-12 flex justify-center">`.
- `tarifas.astro:102`: `<div class="revelar">` → `<div class="revelar flex justify-center">`.
- `tarifas.astro:140`: `<div class="revelar flex flex-wrap gap-3">` → `<div class="revelar flex flex-wrap justify-center gap-3">`.
- `medios-de-pago.astro:61`: `<div class="revelar flex flex-wrap items-center gap-4">` → `<div class="revelar flex flex-wrap items-center justify-center gap-4">`.
- `seguridad-vial.astro:20`: `<div class="revelar mt-8 flex flex-wrap gap-3">` → `<div class="revelar mt-8 flex flex-wrap justify-center gap-3">`.
- `tramites.astro:59`: `<div class="revelar mt-16 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">` → `<div class="revelar mt-16 flex flex-col items-center gap-4 text-center">`; y en la línea 60 el `h2` pasa a `class="titulo mx-auto text-2xl"`.
- `novedades/[slug].astro`: `<header class="revelar max-w-3xl">` → `<header class="revelar mx-auto max-w-3xl text-center">`; `<h1 class="titulo mt-4">` → `<h1 class="titulo mx-auto mt-4">`; `<div class="prose-covicen revelar mt-12 max-w-prose text-lg text-texto-2">` → `<div class="prose-covicen revelar mx-auto mt-12 max-w-prose text-lg text-texto-2">` (el texto del artículo sigue a la izquierda); `<div class="revelar mt-12"><Boton href="/novedades"` → `<div class="revelar mt-12 flex justify-center"><Boton href="/novedades"`.
- `404.astro`: `<section class="contenedor py-24">` → `<section class="contenedor py-24 text-center">`; `<h1 class="titulo mt-3">` → `<h1 class="titulo mx-auto mt-3">`; `<p class="mt-4 max-w-prose text-texto-2">` → `<p class="mx-auto mt-4 max-w-prose text-texto-2">`.
- `preguntas-frecuentes.astro:18`: `<h2 class="titulo revelar mb-4 text-2xl">` → `<h2 class="titulo revelar mx-auto mb-4 text-center text-2xl">`.
- `transparencia/[...resto].astro:33`: `<h2 class="titulo revelar mb-6 text-2xl">` → `<h2 class="titulo revelar mx-auto mb-6 text-center text-2xl">`.
- `ContactoCta.astro`: import `Eyebrow from '@/components/ui/Eyebrow.astro'`; el contenedor
  `contenedor revelar relative z-10 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between` →
  `contenedor revelar relative z-10 flex flex-col items-center gap-6 text-center`; `<p class="eyebrow">Contacto</p>` →
  `<Eyebrow centrado>Contacto</Eyebrow>`; el `h2` → `class="titulo mx-auto mt-3"`; el párrafo `mt-3 max-w-xl text-texto-2` →
  `mx-auto mt-3 max-w-xl text-texto-2`; el contenedor de botones `flex flex-wrap gap-3` → `flex flex-wrap justify-center gap-3`.
  Actualizar el comentario de arriba del párrafo si nombra la disposición en fila.

- [ ] **Step 4: Correr**

Run: `pnpm vitest run tests/components/fase-a.test.ts && pnpm test && pnpm check`
Expected: PASS y 0 errores.

- [ ] **Step 5: Commit (si Juli autorizó commits por tarea)**

```bash
git add src/components/home/ContactoCta.astro src/components/home/ElTramo.astro src/pages/el-tramo.astro src/pages/emergencias.astro src/pages/tarifas.astro src/pages/medios-de-pago.astro src/pages/seguridad-vial.astro src/pages/tramites.astro "src/pages/novedades/[slug].astro" src/pages/404.astro src/pages/preguntas-frecuentes.astro "src/pages/transparencia/[...resto].astro" tests/components/fase-a.test.ts
git commit -m "feat(fase-a): botones y bloques sueltos al centro"
```

---

### Task 6: Los rótulos del mapa sin pisarse

**Files:**
- Modify: `src/lib/tramo.ts` (función nueva al final), `src/components/ilustraciones/MapaTramo.astro:20-25,54,64-66`
- Test: `tests/lib/tramo.test.ts`

**Interfaces:**
- Produces (en `src/lib/tramo.ts`):
  - `type Rotulo = { x: number; y: number; ancla: 'start' | 'middle' | 'end' }`
  - `type Caja = { x0: number; y0: number; x1: number; y1: number }`
  - `const TAM_ROTULO: { ruta: { tam: 15; factor: 0.78 }; ciudad: { tam: 17; factor: 0.6 }; cabina: { tam: 14; factor: 0.74 } }`
  - `cajaTexto(r: Rotulo, texto: string, tam: number, factor: number): Caja`
  - `cajaCirculo(x: number, y: number, radio: number): Caja`
  - `chocan(a: Caja, b: Caja): boolean`
  - `rotulosDelMapa(t: Tramo): { rutas: Array<Rotulo & { ruta: string }>; ciudades: Array<Rotulo & { slug: string; nombre: string }> }`

- [ ] **Step 1: Escribir el test que falla**

Sumar a `tests/lib/tramo.test.ts` (import: `cajaCirculo, cajaTexto, chocan, rotulosDelMapa, TAM_ROTULO` de `@/lib/tramo`):

```ts
// 05/10/2026: «en RN19 se tapa por Franck y parecido abajo con el punto, que dice Santa Fe». Las coordenadas de ciudades
// y estaciones no se tocan (contrato con el backend): se mueven solo los rótulos.
describe('rotulosDelMapa', async () => {
  const t = await fuenteLocalJson.tramo();
  const { rutas, ciudades } = rotulosDelMapa(t);
  const cajasRutas = rutas.map((r) => cajaTexto(r, r.ruta, TAM_ROTULO.ruta.tam, TAM_ROTULO.ruta.factor));
  const cajasCiudades = ciudades.map((c) => cajaTexto(c, c.nombre, TAM_ROTULO.ciudad.tam, TAM_ROTULO.ciudad.factor));
  const halos = t.cabinas.map((c) => cajaCirculo(c.mapa.x, c.mapa.y, 19));
  const rotulosCabina = t.cabinas.map((c) => cajaTexto({ x: c.mapa.x, y: c.mapa.y - 18, ancla: 'middle' }, c.nombre.toUpperCase(), TAM_ROTULO.cabina.tam, TAM_ROTULO.cabina.factor));

  it('hay un rótulo por ruta y uno por ciudad principal', () => {
    expect(rutas.map((r) => r.ruta).sort()).toEqual(t.trazados.map((x) => x.ruta).sort());
    expect(ciudades.map((c) => c.slug).sort()).toEqual(t.ciudades.filter((c) => c.principal).map((c) => c.slug).sort());
  });
  it('ningún rótulo de ruta o de ciudad pisa una estación, el rótulo de una estación u otro rótulo', () => {
    const propios = [...cajasRutas, ...cajasCiudades];
    for (const [i, a] of propios.entries()) {
      for (const b of [...halos, ...rotulosCabina]) expect(chocan(a, b), `rótulo ${i}`).toBe(false);
      for (const [j, b] of propios.entries()) if (i !== j) expect(chocan(a, b), `rótulos ${i} y ${j}`).toBe(false);
    }
  });
  it('todos quedan adentro del dibujo (820 × 520)', () => {
    for (const c of [...cajasRutas, ...cajasCiudades]) {
      expect(c.x0).toBeGreaterThanOrEqual(0); expect(c.y0).toBeGreaterThanOrEqual(0);
      expect(c.x1).toBeLessThanOrEqual(820); expect(c.y1).toBeLessThanOrEqual(520);
    }
  });
  it('los dos casos que marcó Juli', () => {
    const franck = t.cabinas.find((c) => c.slug === 'franck')!.mapa;
    const rn19 = rutas.find((r) => r.ruta === 'RN 19')!;
    expect(Math.hypot(rn19.x - franck.x, rn19.y - franck.y)).toBeGreaterThan(80);
    const santaFe = ciudades.find((c) => c.slug === 'santa-fe')!;
    expect(santaFe.ancla).not.toBe('end');
  });
});
```

- [ ] **Step 2: Correrlo y ver que falla**

Run: `pnpm vitest run tests/lib/tramo.test.ts`
Expected: FAIL — `rotulosDelMapa` no existe.

- [ ] **Step 3: La función, al final de `src/lib/tramo.ts`**

Sumar `Tramo` al import de tipos si no está, y:

```ts
// Rótulos del mapa sin pisarse (05/10/2026: «en RN19 se tapa por Franck y parecido abajo con el punto, que dice Santa
// Fe»). Las coordenadas de ciudades y estaciones son contrato con el backend y no se tocan: se elige solo dónde va cada
// rótulo. Los anchos son estimados por arriba (caracteres × tamaño × factor de Archivo, con el espaciado de cada
// rótulo); las unidades son las del dibujo, 820 × 520.
export type Rotulo = { x: number; y: number; ancla: 'start' | 'middle' | 'end' };
export type Caja = { x0: number; y0: number; x1: number; y1: number };
const ANCHO_MAPA = 820;
const ALTO_MAPA = 520;
export const TAM_ROTULO = { ruta: { tam: 15, factor: 0.78 }, ciudad: { tam: 17, factor: 0.6 }, cabina: { tam: 14, factor: 0.74 } } as const;
export const cajaTexto = (r: Rotulo, texto: string, tam: number, factor: number): Caja => {
  const ancho = texto.length * tam * factor;
  const x0 = r.ancla === 'start' ? r.x : r.ancla === 'end' ? r.x - ancho : r.x - ancho / 2;
  return { x0, y0: r.y - tam * 0.8, x1: x0 + ancho, y1: r.y + tam * 0.25 };
};
export const cajaCirculo = (x: number, y: number, radio: number): Caja => ({ x0: x - radio, y0: y - radio, x1: x + radio, y1: y + radio });
export const chocan = (a: Caja, b: Caja): boolean => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const adentro = (c: Caja) => c.x0 >= 0 && c.y0 >= 0 && c.x1 <= ANCHO_MAPA && c.y1 <= ALTO_MAPA;

export const rotulosDelMapa = (t: Tramo) => {
  const punto = new Map(t.ciudades.map((c) => [c.slug, c.mapa]));
  // Lo que un rótulo no puede tapar: el halo de cada estación (radio 19, con margen), su nombre, y los puntos de ciudades
  // y empalmes. Cada rótulo elegido se suma, para que el siguiente tampoco lo pise.
  const ocupado: Caja[] = [
    ...t.cabinas.map((c) => cajaCirculo(c.mapa.x, c.mapa.y, 22)),
    ...t.cabinas.map((c) => cajaTexto({ x: c.mapa.x, y: c.mapa.y - 18, ancla: 'middle' }, c.nombre.toUpperCase(), TAM_ROTULO.cabina.tam, TAM_ROTULO.cabina.factor)),
    ...t.ciudades.map((c) => cajaCirculo(c.mapa.x, c.mapa.y, 8)),
  ];
  const libre = (c: Caja) => adentro(c) && !ocupado.some((o) => chocan(c, o));

  // Ruta: arriba del medio de su segmento más largo; si ahí choca, el siguiente más largo.
  const rutas = t.trazados.map((tr) => {
    const pts = tr.ciudades.map((s) => punto.get(s)!);
    const candidatos: Rotulo[] = pts.slice(1)
      .map((b, i) => ({ a: pts[i]!, b }))
      .sort((p, q) => Math.hypot(q.b.x - q.a.x, q.b.y - q.a.y) - Math.hypot(p.b.x - p.a.x, p.b.y - p.a.y))
      .map(({ a, b }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 10, ancla: 'middle' }));
    const elegido = candidatos.find((r) => libre(cajaTexto(r, tr.ruta, TAM_ROTULO.ruta.tam, TAM_ROTULO.ruta.factor))) ?? candidatos[0]!;
    ocupado.push(cajaTexto(elegido, tr.ruta, TAM_ROTULO.ruta.tam, TAM_ROTULO.ruta.factor));
    return { ruta: tr.ruta, ...elegido };
  });

  // Ciudad: del lado de siempre (hacia el centro del dibujo); si choca, el otro lado, abajo, arriba, y más lejos.
  const ciudades = t.ciudades.filter((c) => c.principal).map((c) => {
    const { x, y } = c.mapa;
    const haciaElCentro: Rotulo = x > ANCHO_MAPA / 2 ? { x: x - 12, y: y + 6, ancla: 'end' } : { x: x + 12, y: y + 6, ancla: 'start' };
    const candidatos: Rotulo[] = [
      haciaElCentro,
      x > ANCHO_MAPA / 2 ? { x: x + 12, y: y + 6, ancla: 'start' } : { x: x - 12, y: y + 6, ancla: 'end' },
      { x, y: y + 26, ancla: 'middle' },
      { x, y: y - 14, ancla: 'middle' },
      { x, y: y + 40, ancla: 'middle' },
      { x, y: y - 28, ancla: 'middle' },
    ];
    const elegido = candidatos.find((r) => libre(cajaTexto(r, c.nombre, TAM_ROTULO.ciudad.tam, TAM_ROTULO.ciudad.factor))) ?? haciaElCentro;
    ocupado.push(cajaTexto(elegido, c.nombre, TAM_ROTULO.ciudad.tam, TAM_ROTULO.ciudad.factor));
    return { slug: c.slug, nombre: c.nombre, ...elegido };
  });
  return { rutas, ciudades };
};
```

Lo que da con el `tramo.json` del 05/10 (para chequear a mano): RN 9 en (567,5; 412), RN 19 en (562; 116), RN 34 en
(648,5; 248); Córdoba y Rafaela del lado de siempre; Rosario abajo del punto (a la izquierda pisaba el halo de
Carcarañá); Santa Fe 40 unidades abajo (a la izquierda pisaba Franck, a la derecha se sale del dibujo, arriba pisa el
halo de Franck y a 26 el punto de Santo Tomé).

- [ ] **Step 4: Usarla en `MapaTramo.astro`**

Borrar la función `etiquetaRuta` (líneas 20-25). Sumar `rotulosDelMapa` al import de `@/lib/tramo` y, debajo de `const claseBaliza = …`:

```ts
// Dónde va cada rótulo, sin pisarse (lib/tramo.ts, 05/10/2026).
const rotulos = rotulosDelMapa(tramo);
const rotuloRuta = new Map(rotulos.rutas.map((r) => [r.ruta, r]));
const rotuloCiudad = new Map(rotulos.ciudades.map((r) => [r.slug, r]));
```

Línea 54: `<text x={rotuloRuta.get(t.ruta)!.x} y={rotuloRuta.get(t.ruta)!.y} class="ruta-etiqueta" text-anchor="middle">{t.ruta}</text>`

Líneas 64-66:

```astro
        {c.principal && (
          <text x={rotuloCiudad.get(c.slug)!.x} y={rotuloCiudad.get(c.slug)!.y} class="ciudad-etiqueta" text-anchor={rotuloCiudad.get(c.slug)!.ancla}>{c.nombre}</text>
        )}
```

- [ ] **Step 5: Correr**

Run: `pnpm vitest run tests/lib/tramo.test.ts && pnpm test && pnpm check`
Expected: PASS y 0 errores.

- [ ] **Step 6: Commit (si Juli autorizó commits por tarea)**

```bash
git add src/lib/tramo.ts src/components/ilustraciones/MapaTramo.astro tests/lib/tramo.test.ts
git commit -m "fix(mapa): RN 19 y Santa Fe ya no se pisan con Franck"
```

---

### Task 7: Verificación completa, guía y revisión

**Files:**
- Modify: `docs/guia-de-revision.md` (sección nueva arriba de todo), `obsidian/Home.md` (entrada en «Estado»)
- Scratchpad (no va al repo): `C:\Users\Villex\AppData\Local\Temp\claude\C--Users-Villex-dev-Covicen\6e6ab41a-4575-45e0-ba01-22c5a77bb04a\scratchpad\rev\desborde-fase-a.mjs`

- [ ] **Step 1: Las verificaciones del repo**

Run: `pnpm check && pnpm test && pnpm verificar`
Expected: 0 errores; todos los tests en verde; `OK: 26 páginas verificadas, 0 fallos.` (incluye contraste de todos los pares, `titulo-brillo` incluido, y HTML válido).

- [ ] **Step 2: Medición de desbordes, en modo escritorio**

Con `dist/` del sitio completo (lo deja `pnpm verificar`), copiar el script corregido de la revisión y apuntarlo al worktree:

```bash
S="C:/Users/Villex/AppData/Local/Temp/claude/C--Users-Villex-dev-Covicen/6e6ab41a-4575-45e0-ba01-22c5a77bb04a/scratchpad/rev"
sed -e 's#servir(`${REV}/dist-nuevo`, 4891)#servir("C:/Users/Villex/dev/Covicen-detalles/dist", 4891)#' \
    -e "s#\['/', '/contacto/', '/el-tramo/', '/transparencia/', '/tarifas/', '/tramites/', '/emergencias/', '/proveedores/'\]#['/', '/tarifas/', '/el-tramo/', '/medios-de-pago/', '/servicios/', '/emergencias/', '/asistencia/', '/tramites/', '/seguridad-vial/', '/preguntas-frecuentes/', '/quienes-somos/', '/novedades/', '/contacto/', '/proveedores/', '/privacidad/', '/transparencia/', '/peajes/carcarana/', '/peajes/franck/']#" \
    -e "s#\[1024, 1100, 1150, 1200, 1280, 768, 390, 320\]#[320, 360, 390, 768, 1024, 1280, 1440]#" \
    -e "s#perfil-d3#perfil-fase-a#" "$S/desborde3.mjs" > "$S/desborde-fase-a.mjs"
node "$S/desborde-fase-a.mjs" > "$S/desborde-fase-a.txt" 2>&1; grep -c " ok$" "$S/desborde-fase-a.txt"; grep -v " ok$" "$S/desborde-fase-a.txt"
```

Expected: ningún renglón fuera de los `ok` del build nuevo. Los que ya fallaban antes de esta fase (Carcarañá a 390 px,
`/tramites/` y `/el-tramo/` a 320 px, medidos por la revisión del 05/10) se informan aparte y no se arreglan acá.

- [ ] **Step 3: La guía de revisión**

En `docs/guia-de-revision.md`, cambiar la línea de «Al día al…» a «Al día al 5 de octubre de 2026 (fase A estética).» y
sumar arriba de «## Lo que cambió el 5 de octubre — mirá esto primero» la sección
«## Fase A estética (5 de octubre) — mirá esto primero», con qué mirar a mano en los dos temas, en compu y en celular:
encabezados centrados (Tarifas, Servicios, El tramo, Contacto), la etiqueta con dos líneas, las migas centradas, el
degradé quieto en los títulos de sección y moviéndose lento en el principal, el brillo blanco (oscuro) o navy (claro)
sobre la foto del hero, que ya no hay grilla siguiendo al mouse, el bloque de Contacto de la home en columna, los
botones sueltos al centro, la 404 y una novedad, el mapa con «RN 19» arriba del tramo San Francisco–empalme y «Santa
Fe» debajo de su punto, y con «reducir movimiento» activado el título quieto. Seleccionar con el mouse un título y
comprobar que se lee.

- [ ] **Step 4: El vault**

En `obsidian/Home.md`, arriba de la entrada «2026-10-05, tercera tanda», una entrada «2026-10-05, fase A estética
(worktree `C:\Users\Villex\dev\Covicen-detalles`)» con: grilla animada fuera; `.titulo` con el degradé (CSS puro, por qué
no reactbits); sobre la foto el azul no llega a 3:1 y va el brillo (`--color-titulo-brillo`); encabezados centrados con
`alinear="izquierda"` de escape; `rotulosDelMapa` en `lib/tramo.ts`.

- [ ] **Step 5: La portada, al final**

Run: `pnpm verificar:portada`
Expected: `OK: 1 páginas verificadas, 0 fallos.`

- [ ] **Step 6: Revisión aparte**

Mandar a `rev-bro` a revisar la rama contra el spec y este plan: correctness, accesibilidad (contraste del degradé en los
dos temas y sobre la foto, «reducir movimiento», alto contraste, selección), que ningún texto haya cambiado
(`git diff main -- src/content` vacío, y en `.astro` solo cambian clases y comentarios), y que repita la medición de
desbordes. Arreglar lo que encuentre y volver a pasarlo.

- [ ] **Step 7: Integrar con lo que haya subido la otra sesión, y preguntar**

Run: `git fetch origin && git log --oneline HEAD..origin/main`
Si hay commits nuevos en `main`, `git merge origin/main` en la rama, resolver conflictos sin deshacer nada ajeno, y
repetir los Steps 1 y 5. Después, preguntarle a Juli si se publica.
