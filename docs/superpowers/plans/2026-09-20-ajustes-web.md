# Ajustes de la web de Covicen pedidos en la call del 20/09/2026 — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar la web más corta, más institucional y sin un solo dato que no esté confirmado. Se esconde —no se publica con salvedades— todo lo que el área todavía no certificó, y se entrega la lista de qué preguntar y a quién.

**Architecture:** Sitio estático Astro 7 + Tailwind 4, sin islas ni backend. Contenido en `src/content/` (JSON/Markdown) detrás del contrato Zod de `src/lib/datos/esquemas.ts` y la interfaz `FuenteDatos`; los componentes solo importan de `@/lib/datos`. Colores solo desde `src/styles/tokens.css`. Esta tanda agrega **un** módulo nuevo, `src/lib/publicado.ts`: el único lugar que declara qué está confirmado y qué no. Nada de datos nuevos sin fuente.

**Tech Stack:** Astro 7.2, Tailwind 4.3, `@lucide/astro`, Zod (de `astro/zod`), Vitest 4 + `experimental_AstroContainer` + linkedom, `sharp` (medición de píxeles en tests), `html-validate`, pnpm 10, Node ≥ 22.12.

**Spec:** `docs/PROMPT_MAESTRO_AJUSTES_2026-09-20.md`. Ese documento **hace de spec**; cuando dude, manda él. Contexto de la tanda anterior (mismo formato, misma gente): `docs/superpowers/specs/2026-09-13-actualizacion-web-design.md` y `docs/superpowers/plans/2026-09-13-actualizacion-web.md`.

---

## Lo que el prompt dice y el código desmiente

Checkpoint 1 del prompt: contradecir con evidencia antes de ejecutar. Cuatro cosas.

1. **§4.1 — «El mapa interactivo sube a la home: hoy solo en `/el-tramo`». Falso: ya está en la home.**
   `src/components/home/ElTramo.astro:14` renderiza `<MapaInteractivo {tramo} modo="scroll" disposicion="lado" />` desde la tanda de septiembre. No hay nada que mover y el presupuesto de JS no cambia: `mapa.ts` ya viaja. **Efecto en el plan:** la tarea se reduce a *dejar* `ElTramo` en la home (que ya trae el mapa) y reescribirle el texto; se cae el riesgo de presupuesto que el prompt advertía.

2. **§7.1 — «hoy: 489 tests en 51 archivos». Hoy son 510 en 53.**
   Medido al empezar: `pnpm test` → `Test Files 53 passed (53)`, `Tests 510 passed (510)`. El número del prompt es del cierre del 15/09; la tanda de la portada de «Próximamente» (19/09) sumó 21 tests. **Efecto:** el piso a superar al cerrar es 510, no 489.

3. **§4.2 — el diagnóstico del gerente es correcto, y el problema es exactamente uno: el texto del menú.** Medido con los píxeles reales de las dos fotos del hero (mismo método que `tests/styles/hero-foto.test.ts`), recorriendo scroll de 0 a 220 px, nueve tamaños de pantalla, y la banda vertical donde cae el texto. Cada celda va `menú (--color-texto-2)` · `logotipo y hamburguesa (--color-texto)`:

   | Configuración | Tema oscuro | Tema claro (foto de día) |
   |---|---|---|
   | **Hoy**: `animation-range: 0 120px`, `--color-cabecera` alfa 0,85 | 8,92 · 14,16 | **2,22** · 4,95 |
   | Rango 120 px, alfa final 1,00 (fondo opaco) | 8,97 · 14,24 | **2,29** · 5,13 |
   | Rango 16 px, alfa 0,85 | 8,92 · 14,16 | 4,59 · 10,24 |
   | Rango 16 px, alfa 1,00 | 8,97 · 14,24 | 5,29 · 11,82 |

   Tres cosas salen de ahí:

   - **Oscurecer u opacar el fondo NO arregla nada**: 2,22 → 2,29. El peor momento no es el final de la animación sino el medio (scroll ≈ 24 px, alfa ≈ 0,17), cuando la foto ya pasa por detrás del texto y el fondo del header todavía es casi transparente.
   - **El logotipo y la hamburguesa nunca fueron el problema**: van en `--color-texto`, bastante más fuerte que el `--color-texto-2` del menú, y ya dan **4,95:1** hoy, arriba del 4,5 que pide el pliego. *(Esto tira abajo una objeción que yo mismo había levantado contra las pills. Era falsa: la medición la desmintió.)*
   - El problema es **solo del tema claro** y solo en la home: es la única página con foto a sangre bajo el header. En reposo tampoco existe: `Base.astro:66` le da `pt-[var(--alto-header)]` al `<main>`, así que a scroll 0 el header está sobre `--color-fondo`, no sobre la foto.

   **Solución elegida por Juli (la que planteó en la call y confirmó el 20/09): pills.** Cada ítem del menú lleva su propia superficie opaca, «para que se sigan leyendo correctamente pese a lo que cambie» detrás. El ítem deja de apoyarse en la foto y pasa a apoyarse en un token: su contraste deja de depender del scroll, del tema y de qué foto haya, y pasa a ser un par de tokens, que es lo que `scripts/lib/pares.ts` ya verifica en los dos temas para siempre.

   **Qué NO se toca, en consecuencia:** el fondo del header, su alfa y su animación de 120 px quedan como están. **El vidrio esmerilado sobrevive entero.** Y el botón del 140 ya es una pill sólida (`.btn-vial`): la pill no es un idioma nuevo en esta barra, es el que ya estaba.

   **Una nota, para que quede dicho:** el logotipo y la hamburguesa pasan con 0,45 de margen (4,95 contra 4,5). Es poco, y este proyecto ya perdió ese margen **dos veces** al cambiar la foto del hero (ver [[Sistema de diseno]], 15/09). Por eso los dos entran igual al test de la Tarea 1.3, aunque hoy estén en verde: el día que entre una foto más clara, avisa el test y no un gerente.

4. **§4.11 — `fuente` es obligatorio en el contrato.** `esquemaServicio.fuente` y `esquemaTramite.fuente` son `z.string().min(1)` (no opcionales) y hoy se pintan como «Fuente: PETG art. …» en `/servicios/`, `/tramites/` y `/medios-de-pago/`. **Criterio que aplico** (el mismo que el prompt fija para `freeFlow` en §4.6): *se apaga en la UI, no se rompe el contrato*. El dato queda en el JSON —es la trazabilidad de por qué la web dice lo que dice— y deja de renderizarse fuera de `/transparencia/`.

   Además el prompt lista las citas con código (`PETG`, `PETP`) pero hay menciones al pliego **escritas con todas las letras** que ningún regex de siglas agarra: `src/content/tramo.json:340` («según el Pliego de Especificaciones Técnicas Particulares del Tramo Centro»), `quienes-somos.astro:39`, `servicios.astro:13` y `:32`, `contacto.astro:23`, `el-tramo.astro:49`, `tramites.astro:10`, `faq/10`, `faq/15`. El gerente dijo «hace mención del pliego, esas cosas que no aparezcan», así que **la guarda prohíbe también la palabra `pliego`**, con la misma excepción de `/transparencia/`. Es más trabajo de reescritura, pero es lo que pidió y es lo único que se puede verificar de forma mecánica.

---

## Global Constraints

- **Rama `web-ajustes-2026-09-20`**, salida de `main`. **Un commit por tarea**, `git add` con rutas explícitas (nunca `-A`), mensajes en castellano con prefijo (`feat`, `fix`, `test`, `docs`, `refactor`) y las dos líneas de atribución de la sesión. **Sin push.**
- **Corrido, sin pausas por tarea.** La única parada con Juli es la elección del texto de la portada (Tarea 6.1).
- **Nada sin confirmar se publica.** Si no hay fuente, se esconde y va a `docs/pendientes-de-confirmacion.md`.
- **Ninguna cifra inventada.** Ni un porcentaje, ni un recargo, ni un servicio de un área de descanso.
- **Esconder, no «a confirmar».** Un dato que falta no se renderiza: ni rótulo, ni guion, ni «próximamente».
- **Un solo interruptor.** Todo lo que se esconde por falta de confirmación se declara en `src/lib/publicado.ts` y en ningún otro lado. Volver a mostrar algo = cambiar un `false` por `true`.
- **Colores solo desde `src/styles/tokens.css`** (guarda `tests/styles/colores-fijos.test.ts`), contraste ≥ 4,5:1 en los dos temas, 14 px mínimo y 12 px solo con `.anotacion` (guarda `tests/styles/legibilidad.test.ts`).
- **Sin pruebas visuales.** No se abre Chrome. Se verifica con `pnpm check && pnpm test && pnpm verificar` y Juli mira a mano con `docs/guia-de-revision.md`.
- **Sin trabajo a medias.** Nada de `TODO`, `test.skip`, `it.only` ni ramas sin implementar. Lo que se traba se reporta como bloqueo.
- **TDD obligatorio** en: contraste del header (Tarea 1.3 / 2.1), prohibidos del pliego (Tarea 10.1), interruptor de lo oculto (Tarea 1.1).
- **Autoría y revisión separadas.** `ux-bro` implementa; `rev-bro` aprueba **sobre código que no escribió**. Nadie se autoaprueba.
- **Comandos** (desde `C:\Users\Villex\dev\Covicen`): `pnpm check`, `pnpm test`, `pnpm verificar`, `pnpm verificar:portada`, `pnpm build && pnpm originalidad <urls>`.
- **Cierre de cada frente grande** (home, tarifas, obras, tramo): los gates en verde antes de seguir. No se acumula.
- **Todo archivo que se le nombre a Juli va con ruta absoluta de Windows.** Adentro del código y de este plan, las relativas están bien.

### Estado de partida (medido el 2026-09-20)

| Gate | Hoy |
|---|---|
| `pnpm check` | 0 errores (171 archivos) |
| `pnpm test` | **510 tests en 53 archivos**, 0 fallos |
| `pnpm verificar` | 30 páginas, 0 fallos, JS 7,5 KB gz (tope 30) |
| `pnpm verificar:portada` | 1 página, 0 fallos, 0 KB de JS |

**Al cierre el conteo de páginas baja a 28**: se van `/obras/` (oculta) y `/trabaja-con-nosotros/` (eliminada). Queda dicho en el commit de cada una.

---

## Fase 1 — Las compuertas primero (TDD)

Resultado: existe el único interruptor de lo no confirmado, con su test; existe la guarda de contraste del header, **en rojo**, midiendo el problema real; existe la guarda de citas del pliego, **en rojo**. Ninguna de las tres cambia todavía una sola pantalla.

> Las dos guardas en rojo (1.3 y 1.4) **no se commitean solas**: romperían `pnpm test` / `pnpm verificar` para el resto del plan. Se escriben acá, se dejan en el árbol y se commitean **junto con** el cambio que las pone en verde (Tareas 2.1 y 10.2). El commit de esta fase lleva solo 1.1 y 1.2.

### Tarea 1.1: El interruptor único de lo no confirmado

**Files:**
- Create: `src/lib/publicado.ts`
- Create: `tests/lib/publicado.test.ts`

**Interfaces:**
- Produces: `export const publicado` — objeto congelado, claves booleanas, una por sección que se esconde. `export type ClavePublicada = keyof typeof publicado`.

- [x] **Step 1: Escribir el test que falla**

Crear `tests/lib/publicado.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { publicado } from '@/lib/publicado';

// El valor de este módulo NO es lo que dice hoy: es que sea el ÚNICO lugar donde se dice. Si mañana alguien esconde
// una sección con un `if (false)` suelto en una página, el dato que falta deja de estar en la lista que Juli le lleva
// al gerente y nadie se entera. Por eso el test mira las dos cosas: la forma del módulo y que nadie lo esquive.
describe('publicado', () => {
  it('declara las secciones que esperan confirmación del área', () => {
    for (const clave of [
      'obras', 'descuentosPorFrecuencia', 'tarifaDiferencial', 'pasasteSinPagar',
      'excesoDeCarga', 'categoriasFuturas', 'tramiteVecinosFrentistas', 'serviciosDeAreaDescanso',
    ] as const) {
      expect(publicado, `falta la clave ${clave}`).toHaveProperty(clave);
      expect(typeof publicado[clave], `${clave} tiene que ser booleano`).toBe('boolean');
    }
  });

  it('todas las claves son booleanas y nada más', () => {
    for (const [k, v] of Object.entries(publicado)) expect(typeof v, k).toBe('boolean');
  });

  it('el objeto está congelado: prenderlo en runtime no es una opción', () => {
    expect(Object.isFrozen(publicado)).toBe(true);
  });

  // Volver a mostrar una sección tiene que ser cambiar un false por un true. Si el módulo leyera variables de entorno
  // o hiciera cuentas, dejaría de ser un interruptor y pasaría a ser un lugar donde hay que entender algo.
  it('el módulo son literales: ni entorno, ni lógica, ni imports', () => {
    const fuente = readFileSync('src/lib/publicado.ts', 'utf8');
    expect(fuente).not.toMatch(/import\.meta\.env|process\.env/);
    expect(fuente).not.toMatch(/^\s*import\s/m);
    expect(fuente).not.toMatch(/\?|&&|\|\||=>/);
  });
});
```

- [x] **Step 2: Escribir `src/lib/publicado.ts` hasta que pase**

```ts
// Qué está confirmado y qué no. ÚNICO lugar del sitio donde se decide si una sección se publica.
//
// Regla de la casa (desde sept. 2026): esconder, no «a confirmar». Un dato que el área todavía no certificó no se
// publica con salvedades: la sección entera no se renderiza, y el pedido de confirmación vive en
// docs/pendientes-de-confirmacion.md, que es lo que Juli le lleva al gerente.
//
// Para volver a mostrar algo: cambiar su `false` por `true`. Nada más. El que carga el dato no tiene que entender
// código ni buscar dónde estaba el `if`. Si algún día una sección necesita más que un booleano, la complejidad va
// en el componente, NO acá: este archivo se lee de un vistazo o no sirve para lo que fue hecho.
//
// Criterio del 20/09/2026 (call con el gerente): queda lo que tiene fuente oficial publicada —el cuadro tarifario de
// la Res. 248/2026, las exenciones del contrato, los trámites nacionales de argentina.gob.ar— y se esconde todo lo
// que dependa de que alguien del área diga «sí, es así».
export const publicado = Object.freeze({
  /** Página /obras/ y sus enlaces. Momentáneo: «no se sabe nada del tema obras». El contenido queda en el repo. */
  obras: false,
  /** Tarifas 01 · «que esté certificada la info del porcentaje que te van a descontar». */
  descuentosPorFrecuencia: false,
  /** Tarifas 03 y el trámite: montos y alcance de vecinos, frentistas y docentes. «Certificar con el responsable del área». */
  tarifaDiferencial: false,
  /** Tarifas 04 · recargos por pasar sin pagar. «Certificar que va a ser así». */
  pasasteSinPagar: false,
  /** Tarifas 05 · multiplicadores por exceso de carga. Mismo pedido, por los recargos. */
  excesoDeCarga: false,
  /** Tarifas 06 · categorías que rigen después de las obras iniciales. En la lista de certificar. */
  categoriasFuturas: false,
  /** Trámites · tarifa diferencial para vecinos, frentistas y docentes (sin fuente oficial verificable todavía). */
  tramiteVecinosFrentistas: false,
  /** El tramo 04 · qué hay de verdad en cada área de descanso (agua, baños). El dato no existe: nadie lo cargó. */
  serviciosDeAreaDescanso: false,
});

export type ClavePublicada = keyof typeof publicado;
```

- [x] **Step 3: Verificar** — `pnpm test tests/lib/publicado.test.ts` en verde, `pnpm check` sin errores.

- [x] **Step 4: Commit** — `feat(datos): un solo interruptor para lo que todavía no está confirmado`.

---

### Tarea 1.2: Renumerar secciones sin contar a mano

**Files:**
- Create: `src/lib/indices.ts`
- Create: `tests/lib/indices.test.ts`

**Interfaces:**
- Produces: `indices(visibles: boolean[]): (string | undefined)[]` — dado el orden de las secciones y cuáles se ven, devuelve `'01'`, `'02'`… corridos, y `undefined` para las escondidas.

**Por qué existe:** Tarifas y El tramo pierden secciones según el interruptor, y el prompt pide renumerar los `indice=`. Escribir los números a mano en el `.astro` los vuelve a romper la próxima vez que se prenda o apague algo. Con esto, prender `descuentosPorFrecuencia` renumera solo.

- [x] **Step 1: Escribir el test que falla**

```ts
import { describe, expect, it } from 'vitest';
import { indices } from '@/lib/indices';

describe('indices', () => {
  it('numera de corrido solo lo visible', () => {
    expect(indices([true, true, true])).toEqual(['01', '02', '03']);
  });
  it('la escondida no gasta número y las de abajo se corren', () => {
    expect(indices([false, true, false, true])).toEqual([undefined, '01', undefined, '02']);
  });
  it('dos dígitos siempre, hasta la 99', () => {
    expect(indices(Array(11).fill(true)).at(-1)).toBe('11');
    expect(indices([true])).toEqual(['01']);
  });
  it('sin secciones visibles, no hay números', () => {
    expect(indices([false, false])).toEqual([undefined, undefined]);
    expect(indices([])).toEqual([]);
  });
});
```

- [x] **Step 2: Implementar `src/lib/indices.ts`**

```ts
// Numeración corrida de las secciones de una página cuando algunas se esconden (src/lib/publicado.ts).
// Los números se escribían a mano en cada `indice=` y quedaban salteados apenas se apagaba una sección.
export const indices = (visibles: boolean[]): (string | undefined)[] => {
  let n = 0;
  return visibles.map((v) => (v ? String(++n).padStart(2, '0') : undefined));
};
```

- [x] **Step 3: Verificar y commitear** — `feat(ui): los índices de sección se corren solos cuando algo se esconde`.

---

### Tarea 1.3: Guarda de contraste del header sobre la foto del hero (queda en ROJO)

**Files:**
- Create: `tests/styles/header-foto.test.ts`

**Interfaces:**
- Consumes: `src/styles/tokens.css` (`--color-texto-2`, `--color-texto`, `--color-cabecera`, `--brillo-foto`, y el token de fondo de la pill), `src/components/Header.astro` (`animation-range` y la regla `.nav-item`), `src/assets/atmosfera/hero-ruta-{diurna,nocturna}.jpg`.

**Nota de método:** este test es hermano de `tests/styles/hero-foto.test.ts` y comparte su idea: el contraste de un texto que cae sobre una foto no se verifica con un par de tokens, hay que mirar los píxeles. La diferencia es que acá la variable es **el scroll**: el fondo del header se opaca con `animation-timeline: scroll(root)`, así que hay que probar todo el recorrido y no un estado. El peor contraste de esta animación está **en el medio**, no en los extremos.

**Lo que el test modela, y por qué eso es justo lo que cambia:** para cada pieza del header calcula sobre qué se apoya realmente su texto. El logotipo y la hamburguesa se apoyan en `cabecera + foto` (no llevan pill). Los ítems del menú se apoyan en **la pill, si la pill es opaca**; si `.nav-item` no declara un fondo opaco, se apoyan en `cabecera + foto` igual que hoy. Por eso el test da rojo hoy (2,22:1 en claro) y verde con la pill puesta, sin tener que reescribirlo en el medio.

No se modela `backdrop-filter: blur(12px)`: un desenfoque promedia píxeles vecinos, no aclara una zona oscura, y además no está garantizado en todos los navegadores. Medir sin él es el lado seguro.

- [x] **Step 1: Escribir el test**

```ts
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { bloqueClaro, bloqueRoot, bloqueTheme, declaracionesDe } from '../../scripts/lib/contraste.ts';

// El texto del header cae sobre la foto del hero mientras el fondo de la barra se va opacando con el scroll. El
// gerente lo vio a ojo el 20/09/2026 y la medición le dio la razón: en tema claro el peor momento daba 2,22:1, y NO
// era al final de la animación sino en el medio (scroll ~24 px), con el fondo del header casi transparente y la foto
// ya pasando por detrás de las letras. Subir la opacidad final no lo arregla (2,22 -> 2,29): el arreglo es que cada
// ítem del menú lleve su propia superficie opaca (la pill), así deja de depender de lo que pase por atrás.
// El logotipo y la hamburguesa NO llevan pill y hoy pasan con 4,95:1: entran igual, porque 0,45 de margen es poco y
// este proyecto ya perdió ese margen dos veces al cambiar la foto del hero.
type Crudo = { data: Buffer; info: { width: number; height: number; channels: number } };
type Sharp = (archivo: string) => {
  resize: (ancho: number, alto: number, opciones: { fit: 'fill' }) => { raw: () => { toBuffer: (o: { resolveWithObject: true }) => Promise<Crudo> } };
};
const sharp = createRequire(import.meta.url)('sharp') as Sharp;

const css = { tokens: readFileSync('src/styles/tokens.css', 'utf8'), header: readFileSync('src/components/Header.astro', 'utf8') };
const RATIO_FOTO = 1672 / 941;

const canal = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const luminancia = ([r, g, b]: number[]) => 0.2126 * canal(r!) + 0.7152 * canal(g!) + 0.0722 * canal(b!);
const contraste = (a: number[], b: number[]) => {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const sobre = (foto: number[], fondo: number[], alfa: number) => foto.map((c, i) => c * (1 - alfa) + fondo[i]! * alfa);

/** `#RRGGBB` o `rgb(r g b / a)` a color y alfa. Un token con alfa NO sirve de pill: la foto se cuela por abajo. */
const aColor = (valor: string): { rgb: number[]; alfa: number } => {
  const m = /rgb\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\s*\)/.exec(valor);
  if (m) return { rgb: [Number(m[1]), Number(m[2]), Number(m[3])], alfa: m[4] === undefined ? 1 : Number(m[4]) };
  const h = valor.trim();
  return { rgb: [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), alfa: 1 };
};

/** El token de fondo de la pill del menú, leído de la regla `.nav-item` de Header.astro. `null` = no hay pill. */
const tokenPill = (): string | null => {
  const regla = /\.nav-item\s*\{([\s\S]*?)\}/.exec(css.header)?.[1] ?? '';
  return /background:\s*var\(--color-([\w-]+)\)/.exec(regla)?.[1] ?? null;
};

/** Los px de scroll en los que la animación del fondo del header termina. */
const rangoAnimacion = () => {
  const m = /animation-range:\s*0\s+(\d+)px/.exec(css.header);
  expect(m, 'no encontré `animation-range: 0 Npx` en Header.astro').toBeTruthy();
  return Number(m![1]);
};

const leerFoto = async (archivo: string, brillo: number) => {
  const { data, info } = await sharp(archivo).resize(400, 225, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  return (fx: number, fy: number) => {
    const x = Math.round(Math.min(Math.max(fx, 0), 1) * (info.width - 1));
    const y = Math.round(Math.min(Math.max(fy, 0), 1) * (info.height - 1));
    const i = (y * info.width + x) * info.channels;
    return [data[i]! * brillo, data[i + 1]! * brillo, data[i + 2]! * brillo];
  };
};

const oscuro = { ...declaracionesDe(bloqueTheme(css.tokens)), ...declaracionesDe(bloqueRoot(css.tokens)) };
const claro = { ...oscuro, ...declaracionesDe(bloqueClaro(css.tokens)) };

const PANTALLAS: Array<[string, number, number]> = [
  ['celular chico 360x740', 360, 740], ['celular 390x844', 390, 844], ['celular grande 414x896', 414, 896],
  ['tablet 768x1024', 768, 1024], ['justo en el corte 1024', 1024, 800], ['notebook 1280x832', 1280, 832],
  ['escritorio 1440x900', 1440, 900], ['monitor 1920x1080', 1920, 1080], ['monitor grande 2560x1440', 2560, 1440],
];
const CORTE = 1024;                  // --alto-header baja a 4.5rem abajo de acá (tokens.css)
const ALTO_ANCHO = 112, ALTO_ANGOSTO = 72;
const ALTO_BARRA = 40;               // BarraSuperior: opaca (bg-fondo-2) y solo en escritorio
const SCROLL_MAX = 220;

describe('contraste del header sobre la foto del hero (pliego 61.7)', () => {
  it('la pill del menú existe y su fondo es un token opaco', () => {
    const token = tokenPill();
    expect(token, 'los ítems del menú no declaran fondo: siguen apoyados en la foto').not.toBeNull();
    for (const [tema, tokens] of [['oscuro', oscuro], ['claro', claro]] as const) {
      const valor = tokens[`color-${token}`];
      expect(valor, `el tema ${tema} no define --color-${token}`).toBeDefined();
      expect(aColor(valor!).alfa, `la pill del tema ${tema} tiene alfa: la foto se cuela por abajo`).toBe(1);
    }
  });

  const temas = [
    { nombre: 'claro, foto de día', archivo: 'src/assets/atmosfera/hero-ruta-diurna.jpg', tokens: claro },
    { nombre: 'oscuro, foto de noche', archivo: 'src/assets/atmosfera/hero-ruta-nocturna.jpg', tokens: oscuro },
  ];

  for (const tema of temas) {
    it(`tema ${tema.nombre}: todo el texto del header llega a 4,5:1 en cualquier punto del scroll`, async () => {
      const cabecera = aColor(tema.tokens['color-cabecera']!);
      const token = tokenPill();
      const pill = token ? aColor(tema.tokens[`color-${token}`] ?? '#000000') : null;
      const rango = rangoAnimacion();
      const foto = await leerFoto(tema.archivo, Number(tema.tokens['brillo-foto']));
      // Cada pieza del header con su color de texto y sobre qué se apoya de verdad.
      const piezas = [
        { cual: 'menú', texto: aColor(tema.tokens['color-texto-2']!).rgb, pill },
        { cual: 'logotipo y hamburguesa', texto: aColor(tema.tokens['color-texto']!).rgb, pill: null },
      ];
      const flojos: string[] = [];

      for (const [nombre, vw, vh] of PANTALLAS) {
        const altoHeader = vw >= CORTE ? ALTO_ANCHO : ALTO_ANGOSTO;
        const filaTop = vw >= CORTE ? ALTO_BARRA : 0;           // arriba de esto manda BarraSuperior, que es opaca
        const bandaTop = filaTop + 24, bandaBot = filaTop + 48; // el texto, centrado en su fila de 4,5rem
        const alto = vh - altoHeader;
        const porAlto = vw / alto < RATIO_FOTO;
        const anchoFoto = porAlto ? alto * RATIO_FOTO : vw;
        const altoFoto = porAlto ? alto : vw / RATIO_FOTO;
        const offX = (anchoFoto - vw) / 2, offY = (altoFoto - alto) / 2;

        for (const pieza of piezas) {
          // Con pill opaca el texto se apoya en la pill y el scroll deja de importar: una sola cuenta.
          if (pieza.pill && pieza.pill.alfa === 1) {
            const r = contraste(pieza.pill.rgb, pieza.texto);
            if (r < 4.5) flojos.push(`${nombre}, ${pieza.cual} sobre la pill: ${r.toFixed(2)}:1`);
            continue;
          }
          for (let s = 0; s <= SCROLL_MAX; s += 2) {
            const alfa = cabecera.alfa * Math.min(1, s / rango);
            for (let y = bandaTop; y <= bandaBot; y += 2) {
              const heroY = s + y - altoHeader;   // y dentro del hero; negativo = todavía no hay foto detrás
              if (heroY < 0) continue;
              for (let vx = 0.02; vx <= 0.98; vx += 0.02) {
                const px = sobre(foto((vx * vw + offX) / anchoFoto, (heroY + offY) / altoFoto), cabecera.rgb, alfa);
                const r = contraste(px, pieza.texto);
                if (r < 4.5) flojos.push(`${nombre}, scroll ${s}px, ${pieza.cual}: ${r.toFixed(2)}:1`);
              }
            }
          }
        }
      }
      const muestra = flojos.slice(0, 5).join(String.fromCharCode(10));
      expect(flojos.length, `${flojos.length} puntos por debajo de 4,5:1${String.fromCharCode(10)}${muestra}`).toBe(0);
    });
  }
});
```

- [x] **Step 2: Correr y comprobar que falla por la razón correcta** — `pnpm test tests/styles/header-foto.test.ts` tiene que dar **rojo en tema claro** por el *menú* (≈ 2,22:1) y **verde en oscuro**; el logotipo no debe aparecer entre los flojos (hoy va 4,95:1). Si falla en oscuro, o si el flojo es el logotipo, el modelo está mal y hay que revisarlo **antes** de tocar CSS.

- [x] **Step 3: NO commitear todavía.** Va junto con la Tarea 2.1.

---

### Tarea 1.4: Guarda de citas del pliego en `verificar.ts` (queda en ROJO)

**Files:**
- Modify: `scripts/verificar.ts:22` (lista `PROHIBIDOS` + lista nueva `PROHIBIDOS_USUARIO`)
- Modify: `tests/scripts/html.test.ts` (o crear `tests/scripts/prohibidos.test.ts`)

**Interfaces:**
- Produces: `PROHIBIDOS_USUARIO: RegExp[]` — se aplica a toda página **salvo** `transparencia/`.

- [x] **Step 1: Agregar la lista y la excepción en `scripts/verificar.ts`**

Junto a `PROHIBIDOS` (línea 22):

```ts
// Citas del pliego en la cara del público. Pedido del gerente (call del 20/09/2026): «hace mención del pliego; esas
// cosas que no aparezcan». Vale para las siglas y para la palabra escrita con todas las letras: las dos son la misma
// mención, y hay ocho lugares que la escriben larga («según el Pliego de Especificaciones Técnicas Particulares…»).
// EXCEPCIÓN: /transparencia/, donde la normativa ES el contenido y citarla es justamente lo institucional. La fuente
// de cada dato no se borra de src/content/ —es la trazabilidad de por qué la web dice lo que dice—: se deja de pintar.
const PROHIBIDOS_USUARIO = [/\bPET[GP]\b/, /\bpliego/i];
const SIN_PLIEGO = (nombre: string) => !nombre.startsWith('transparencia');
```

Y dentro del bucle de páginas, al lado del chequeo 10:

```ts
if (SIN_PLIEGO(nombre)) for (const p of PROHIBIDOS_USUARIO) if (p.test(html)) fallo(`${nombre}: cita el pliego en la cara del público (${p})`);
```

- [x] **Step 2: Escribir el test de la guarda** en `tests/scripts/prohibidos.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// No se puede importar verificar.ts (corre al importarse y lee dist/). Lo que hay que fijar acá es el CONTRATO de la
// guarda, no su implementación: que las dos formas de nombrar el pliego estén prohibidas y que la excepción sea
// exactamente /transparencia/ y ninguna otra. Si alguien la afloja para que le pase su página, este test lo dice.
const fuente = readFileSync('scripts/verificar.ts', 'utf8');
const lista = /const PROHIBIDOS_USUARIO = \[([^\]]*)\]/.exec(fuente)?.[1] ?? '';
const patrones: RegExp[] = lista ? eval(`[${lista}]`) : [];

describe('prohibidos del pliego en la cara del público', () => {
  it('la lista existe y agarra las dos formas de nombrarlo', () => {
    expect(patrones.length, 'falta PROHIBIDOS_USUARIO en scripts/verificar.ts').toBeGreaterThan(0);
    for (const texto of ['(PETG art. 52)', 'PETP art. 3', 'según el pliego', 'Pliego de Especificaciones Técnicas']) {
      expect(patrones.some((p) => p.test(texto)), `pasa "${texto}"`).toBe(true);
    }
  });
  it('no agarra cosas que no son citas', () => {
    for (const texto of ['plegado', 'Resolución 248/2026', 'el contrato lo exige']) {
      expect(patrones.some((p) => p.test(texto)), `falso positivo con "${texto}"`).toBe(false);
    }
  });
  it('la única página exceptuada es transparencia', () => {
    const excepcion = /const SIN_PLIEGO = [^;]+;/.exec(fuente)?.[0] ?? '';
    expect(excepcion).toContain("startsWith('transparencia')");
    expect(excepcion.match(/startsWith/g)?.length, 'hay más de una página exceptuada').toBe(1);
  });
  it('la guarda se aplica dentro del bucle de páginas', () => {
    expect(fuente).toMatch(/SIN_PLIEGO\(nombre\)[\s\S]{0,120}PROHIBIDOS_USUARIO/);
  });
});
```

- [x] **Step 3: Correr `pnpm verificar` y comprobar que falla** con ~15 páginas citando el pliego. Anotar la lista: es el mapa exacto de la Tarea 10.2.

- [x] **Step 4: NO commitear todavía.** Va junto con la Tarea 10.2.

---

## Fase 2 — El header

Resultado: cada opción del menú va en su propia pill y se lee sobre la foto en los dos temas y en todo el recorrido del scroll, con test que lo mide; el menú pierde Obras y Trabajá con nosotros, y gana Proveedores. El vidrio esmerilado del header queda intacto.

### Tarea 2.1: Cada opción del menú en su propia pill

**Files:**
- Modify: `src/components/Header.astro` (regla `.nav-item` y `.nav-item::after` del bloque `<style>`)
- Modify: `scripts/lib/pares.ts` (solo si el par del token elegido no estuviera ya en la lista)
- Include: `tests/styles/header-foto.test.ts` (de la Tarea 1.3)

**Interfaces:**
- Produces: `.nav-item` con `background: var(--color-superficie)` (opaco), borde hairline y radio; estado activo distinguible **por forma además de por color**.

**Decisión de diseño (de Juli, call del 20/09):** «cada opción en una pill elegante y premium, para que se sigan leyendo correctamente pese a lo que cambie» detrás. El botón del 140 (`.btn-vial`) ya es una pill sólida en esa misma fila, así que la barra gana coherencia en vez de perderla.

**Qué no se toca, y por qué:** el fondo del header, su alfa (0,85) y su `animation-range: 0 120px` quedan **como están**. El vidrio esmerilado es parte del diseño y, medido, no es el culpable: el logotipo y la hamburguesa ya pasan con 4,95:1 sin pill. Tampoco se toca `.btn-vial`, que el prompt marca explícitamente como intocable.

**Token de fondo: `--color-superficie`.** Razones: (a) su par con `texto-2` y con `texto` **ya está en `scripts/lib/pares.ts`**, o sea que su contraste ya se verifica en los dos temas en `pnpm verificar` y en `tests/styles/tokens.test.ts` — la pill hereda una guarda que ya existe en vez de inventar una; (b) es opaco en los dos temas (`#FFFFFF` en claro, navy claro en oscuro); (c) es el mismo token que ya usa el hover del menú hoy, así que el reposo pasa a verse como el hover de antes y no hay que inventar un color nuevo. **Confirmar en el Step 1** que los dos pares están en la lista; si falta alguno, agregarlo ahí (y no en otro lado).

- [x] **Step 1: Comprobar los pares** — `scripts/lib/pares.ts` tiene que tener `['texto', 'superficie']` y `['texto-2', 'superficie']`. Si falta alguno, agregarlo.

- [x] **Step 2: La pill, en `Header.astro`**

```css
/* Cada opción en su propia pill (pedido de Juli, 20/09/2026). No es solo estética: el fondo del header es
   traslúcido y se opaca con el scroll, así que hasta ahora el texto del menú se apoyaba en la foto del hero y en
   tema claro caía a 2,22:1 (medido sobre los píxeles de la foto, nueve pantallas, todo el recorrido del scroll).
   Con una superficie opaca propia, el contraste del menú pasa a ser un par de tokens y deja de depender de lo que
   pase por detrás: del scroll, del tema y de qué foto haya. Lo guarda tests/styles/header-foto.test.ts.
   El fondo del header NO se tocó: el logotipo y la hamburguesa van en --color-texto y ya daban 4,95:1. */
.nav-item {
  position: relative; display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.55rem 0.9rem; border-radius: 999px;
  background: var(--color-superficie);
  border: 1px solid var(--color-borde);
  color: var(--color-texto-2); font-weight: 500; line-height: 1.2; text-decoration: none; white-space: nowrap;
  transition: color var(--dur-micro) var(--ease-salida), border-color var(--dur-micro) var(--ease-salida),
              box-shadow var(--dur-ui) var(--ease-salida), transform var(--dur-ui) var(--ease-salida);
}
.nav-item:hover, .nav-item:focus-visible { color: var(--color-texto); border-color: var(--color-borde-fuerte); transform: translateY(-1px); box-shadow: 0 6px 18px -8px var(--color-sombra); }
.nav-item[aria-current="page"], .nav-item.is-activo { color: var(--color-texto); border-color: var(--color-acento); }
```

  El `gap` de la lista sube de `gap-1` a `gap-2` para que las pills respiren; se ajusta en el marcado (`ul.nav-lista`), que es donde vive hoy.

- [x] **Step 3: El indicador de página actual, con forma y no solo con color** — hoy lo dibuja `.nav-item::after` (una barrita que crece de ancho). Con la pill, esa barrita queda **adentro**, pegada al borde de abajo y acortada a los lados:

```css
/* El estado "estás acá" no puede distinguirse SOLO por color (pliego 61.7, y el criterio que este proyecto ya
   aplicó con la severidad del mapa el 14/09: forma además de color). La barrita sigue, ahora dentro de la pill. */
.nav-item::after {
  content: ""; position: absolute; left: 0.9rem; right: 0.9rem; bottom: 0.3rem; height: 2px; border-radius: 1px;
  background: var(--color-acento); transform: scaleX(0); transform-origin: left;
  transition: transform var(--dur-ui) var(--ease-salida);
}
.nav-item:hover::after, .nav-item:focus-visible::after,
.nav-item[aria-current="page"]::after, .nav-item.is-activo::after { transform: scaleX(1); }
```

- [x] **Step 4: El desplegable «Nosotros»** — su `<summary>` ya lleva `.nav-item`, así que hereda la pill sin tocar nada. **Verificar dos cosas**: que el panel que se abre (`ul` absoluto, `top-full mt-2`) no quede pegado a la pill ni tapado por el borde, y que el `chevron` siga alineado adentro del radio nuevo.

- [x] **Step 5: La hamburguesa del celular** — hoy ya es un cuadro con borde (`border border-borde`) y sin fondo. Se le pone `background: var(--color-superficie)` y el radio de la pill, por coherencia visual. **No es por contraste** (va en `--color-texto` y pasa con 4,95:1): es para que la barra no tenga dos idiomas.

- [x] **Step 6: Verificar** — `pnpm test tests/styles/header-foto.test.ts tests/styles/tokens.test.ts tests/styles/colores-fijos.test.ts` en verde. El test de la pill tiene que dar el contraste del par de tokens, no el de la foto. Después `pnpm check && pnpm test && pnpm verificar`.

- [x] **Step 7: Anotar el número real** para el cierre: el contraste del menú sobre la pill en los dos temas, que es lo que se le reporta a Juli.

- [x] **Step 8: Commit** (lleva la Tarea 1.3 adentro) — `fix(header): cada opción del menú en su propia pill, legible sobre la foto del hero`.

---

### Tarea 2.2: Menú de arriba y pie: sale Obras, sale Trabajá con nosotros, entra Proveedores

**Files:**
- Modify: `src/components/Header.astro:14-24` (`items`, `nosotros`)
- Modify: `src/components/Footer.astro:15` (columna «Empresa»)
- Modify: `tests/components/layout.test.ts`

**Interfaces:**
- Produces: `items` sin `Obras`; `nosotros` sin `Trabajá con nosotros` y con `Proveedores`; el menú de celular hereda los dos arreglos, así que no hay que tocarlo aparte.

- [x] **Step 1: Test primero** — en `tests/components/layout.test.ts`, sobre el HTML del `Header` y del `Footer`:

```ts
it('el menú no ofrece Obras ni Trabajá con nosotros, y sí Proveedores', async () => {
  const html = await render(Header, { contacto: await fuenteLocalJson.contacto(), rutaActual: '/' });
  expect(html).not.toContain('href="/obras/"');
  expect(html).not.toContain('href="/trabaja-con-nosotros/"');
  expect(html).toContain('href="/proveedores/"');
  // El menú de celular se arma con los mismos dos arreglos: si alguien los desdobla, esto lo agarra.
  expect(html.match(/href="\/proveedores\/"/g)?.length, 'Proveedores tiene que estar en escritorio y en celular').toBe(2);
});
```

Y el equivalente para el pie (que ya tiene Proveedores en la columna de Contacto: ahí solo se van los dos enlaces).

- [x] **Step 2: Aplicar** — `Header.astro`: sacar `{ nombre: 'Obras', href: '/obras' }` de `items`; en `nosotros`, cambiar `Trabajá con nosotros` por `{ nombre: 'Proveedores', href: '/proveedores' }`. `Footer.astro`: la columna «Empresa» queda `Quiénes somos · Novedades · Políticas · Transparencia`.

- [x] **Step 3: Verificar y commitear** — `feat(nav): Proveedores al menú; salen Obras y Trabajá con nosotros`.

---

## Fase 3 — Obras: ocultar, no borrar

Resultado: `/obras/` **no existe en el build** (ni HTML, ni sitemap, ni enlaces), el contenido sigue versionado, y prender `publicado.obras` la devuelve entera.

### Tarea 3.1: La página deja de generarse

**Files:**
- Delete/Move: `src/pages/obras.astro` → `src/pages/obras/[...resto].astro`
- Modify: `astro.config.mjs` si hiciera falta filtrar el sitemap (ver Step 3)
- Create: `tests/components/obras-oculta.test.ts`

**Interfaces:**
- Produces: `getStaticPaths()` que devuelve `[]` con el interruptor apagado.

**Por qué así:** Astro decide las rutas por el filesystem y no deja quitarlas desde un hook (ya lo sufrimos con `astro:routes:resolved`, que entrega una copia del array: ver `scripts/lib/solo-portada.ts`). Pero una **ruta rest** sí se puede vaciar: `getStaticPaths` devolviendo `[]` no genera nada, y de yapa el sitemap no la lista, porque el sitemap se arma con las rutas generadas. Es nativo, es un `false` → `true`, y no hace falta podar `dist/` a mano.

- [x] **Step 1: Escribir el test que falla**

```ts
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { publicado } from '@/lib/publicado';

describe('obras oculta', () => {
  // Una página viva sin enlaces igual se indexa: el pedido fue que no exista en el build, no que no se enlace.
  it('la página es una ruta rest que se apaga con el interruptor, no un archivo suelto', () => {
    expect(existsSync('src/pages/obras.astro'), '/obras sigue siendo una ruta fija: se genera sí o sí').toBe(false);
    expect(existsSync('src/pages/obras/[...resto].astro')).toBe(true);
  });
  it('con el interruptor apagado no hay ninguna ruta que generar', async () => {
    const { getStaticPaths } = await import('@/pages/obras/[...resto].astro');
    expect(publicado.obras).toBe(false);
    expect(await getStaticPaths()).toEqual([]);
  });
});
```

- [x] **Step 2: Mover la página y agregarle el `getStaticPaths`**

En `src/pages/obras/[...resto].astro`, arriba del frontmatter que ya tenía:

```ts
import { publicado } from '@/lib/publicado';

// Ruta rest con un solo destino: `resto: undefined` genera /obras/ tal cual estaba. Con el interruptor apagado
// devuelve [] y Astro no genera NADA: ni el HTML, ni la entrada del sitemap. Prender publicado.obras la devuelve
// completa, con su contenido intacto en src/content/obras/. Es momentáneo: «no se sabe nada del tema obras».
export const getStaticPaths = () => (publicado.obras ? [{ params: { resto: undefined } }] : []);
```

- [x] **Step 3: Comprobar el sitemap** — correr `pnpm verificar` y confirmar que `dist/sitemap-0.xml` no lista `/obras/` y que `dist/obras/` no existe. Si `@astrojs/sitemap` la listara igual (no debería: se alimenta de las rutas generadas), agregarle `filter` en `astro.config.mjs`; si no, no se toca nada.

- [x] **Step 4: Verificar y commitear** — `feat(obras): /obras deja de existir en el build hasta que haya algo que contar` (mencionando la baja del conteo de páginas).

---

### Tarea 3.2: Sacar obras de la home y barrer las menciones

**Files:**
- Modify: `src/components/home/Home.astro` (se va `ObrasYEstado`)
- Delete: `src/components/home/ObrasYEstado.astro`
- Modify: `src/pages/quienes-somos.astro:30` y `:19`
- Modify: `src/content/faq/05-desde-cuando-se-cobra.json`
- Modify: `src/content/novedades/2026-08-27-obras-antes-que-peaje.md`, `src/content/novedades/2026-08-27-como-se-fija-la-tarifa.md`
- Modify: `src/content/obras/*.json` (solo si alguna se cita fuera de `/obras/`)
- Modify: `tests/components/quienes-somos.test.ts`

**Decisiones:**
- `ObrasYEstado` **se borra**, no se comenta: el componente mezclaba dos cosas (la lista de obras y el estado de la traza) y las dos se van de la home por motivos distintos (obras se oculta; el estado no va porque `src/content/estado-ruta.json` son datos de ejemplo). Devolver obras a la home el día que haya algo que contar es volver a enlazar `/obras/`, no resucitar este componente. El estado de la traza sigue vivo en `/el-tramo/`, que es donde tiene sentido.
- Las **novedades que hablan de obras no se borran**: son parte del archivo público y llevan fecha. Lo que se saca es el **enlace a `/obras/`** (si no, el link queda roto y `verificar.ts` lo canta) y la frase que promete una página que ya no está. El contenido histórico queda.
- `2026-08-27-obras-antes-que-peaje.md` enlaza dos veces a `/obras/` y su razón de ser es esa página. **Se despublica**: se mueve a `src/content/novedades/_borradores/` (el guion bajo la saca de la colección de Astro) y vuelve cuando vuelva `/obras/`. Va a la lista de pendientes.

- [x] **Step 1: Test primero** — `tests/components/home.test.ts` y `tests/components/quienes-somos.test.ts`:

```ts
it('la home no habla de obras ni muestra el estado de la traza de ejemplo', async () => {
  const html = await render(Home, {});
  expect(html).not.toContain('href="/obras/"');
  expect(html).not.toContain('Datos de ejemplo');
  expect(html).not.toContain('Primero las obras');
});
```

- [x] **Step 2: Aplicar los cambios de texto**

- `quienes-somos.astro:30`: «Por eso el orden es este: primero las obras, después el peaje pleno. El contrato lo exige y nosotros lo firmamos.» → reescribir sin prometer una página de obras ni anticipar el orden de trabajos que nadie confirmó. Propuesta: *«No venimos a inaugurar una ruta: venimos a hacernos cargo de una que ya existe y que la gente usa todos los días. Las obligaciones de conservación y de inversión están en el contrato de concesión, y se cumplen desde el primer día.»*
- `quienes-somos.astro:19` («con el plan de conservación que fija el pliego») → *«con su plan de conservación, según el contrato de concesión»* (también lo pide §4.11).
- `faq/05`: sacar «Primero las obras; después el peaje pleno.» y la referencia a las obras iniciales como cronograma. Queda el hecho verificable: rige el cuadro de la Res. 248/2026 y la tarifa ofertada se aplica cuando Vialidad Nacional homologue el cuadro propio.
- `2026-08-27-como-se-fija-la-tarifa.md`: la sección «Cuándo se cobra» dice «Primero las obras». Se reescribe sin la consigna, manteniendo el dato con fuente (transitabilidad óptima verificada por Vialidad Nacional).
- Mover `2026-08-27-obras-antes-que-peaje.md` a `src/content/novedades/_borradores/` (crear la carpeta con un `README.md` de una línea que diga por qué está y qué la devuelve).

- [x] **Step 3: Verificar** — `pnpm verificar` sin links rotos y sin `/obras/`. `pnpm check && pnpm test`.

- [x] **Step 4: Commit** — `feat(obras): la home y el resto del sitio dejan de hablar de obras`.

---

## Fase 4 — Trabajá con nosotros: eliminar

Resultado: la página no existe, no queda ni un enlace, y la FAQ que la nombraba habla solo de proveedores.

### Tarea 4.1: Borrar la página y lo que quedaba colgando

**Files:**
- Delete: `src/pages/trabaja-con-nosotros.astro`
- Modify: `src/content/faq/13-trabajar-o-proveer.json`
- Modify: `tests/components/proximamente.test.ts:35` (la lista de rastros que la portada no debe tener nombra «Trabajá con nosotros»: hay que cambiar el centinela por uno que siga existiendo, si no el test se vuelve vacuo)
- Modify: `docs/guia-de-revision.md` (§ «Políticas, Privacidad, Trabajá con nosotros, Proveedores»)

**Nota:** ya fue: el ítem del menú y el del pie salieron en la Tarea 2.2.

- [x] **Step 1: Test primero** — que no exista ningún enlace a `/trabaja-con-nosotros/` en ninguna página renderizada (lo va a cazar `verificar.ts` como link roto, pero un test lo dice más rápido y con mejor mensaje).

- [x] **Step 2: Aplicar**

- Borrar el archivo.
- `faq/13`: pregunta pasa a «¿Cómo puedo ser proveedor de Covicen?» y la respuesta pierde la primera oración. Ajustar `slug` a `ser-proveedor` **solo si** ninguna página lo enlaza por ancla (verificar con `grep -rn "trabajar-o-proveer" src/`); si lo enlaza, se deja el slug y se cambia el texto.
- `tests/components/proximamente.test.ts:35`: reemplazar el centinela `'Trabajá con nosotros'` por `'Proveedores'` (existe y no debe aparecer en la portada), así el test sigue probando algo.

- [x] **Step 3: Verificar y commitear** — `feat(rrhh): se elimina Trabajá con nosotros` (mencionando la baja del conteo de páginas).

---

## Fase 5 — Free Flow fuera de la cara al público

Resultado: Leones, San Francisco y Totoras dicen **«Próxima»** a secas. El campo `freeFlow` sigue en el contrato y en los datos; nadie lo pinta.

### Tarea 5.1: Apagar Free Flow en la UI sin tocar el contrato

**Files:**
- Modify: `src/lib/tramo.ts:7-9` (`estadoCabina`)
- Modify: `src/content/tramo.json:341` (aviso) y `:340` (mención larga al pliego, §4.11)
- Modify: `src/pages/medios-de-pago.astro:11-12, 22, 34-36` (se va la sección `#free-flow` entera y la variable `freeFlow`)
- Modify: `src/pages/el-tramo.astro:68` (bajada de Estaciones)
- Modify: `src/pages/peajes/[slug].astro:41`
- Modify: `src/components/home/AccesosRapidos.astro:14`
- Modify: `src/components/home/Servicios.astro:11`
- Delete: `src/content/faq/08-free-flow.json`
- Modify: `src/content/novedades/2026-08-26-que-cambia-el-5-de-octubre.md`
- Modify: `src/content/obras/06-cobro-electronico.json` (título y descripción; el contenido sigue oculto con `/obras/`, pero no se deja una mentira guardada)
- Modify: `tests/lib/tramo.test.ts:8-10`, `tests/components/estacion.test.ts:26`, `tests/components/ilustraciones.test.ts:16`
- **No tocar:** `src/lib/datos/esquemas.ts:120` (`freeFlow` queda en el contrato), `tests/fixtures/api/tramo.json`, `tests/lib/contrato.test.ts`, `tests/lib/fuente-api.test.ts`, `docs/contrato/*.schema.json`

**Decisión sobre la FAQ 08:** el prompt dice «tocá … `src/content/faq/08-free-flow.json`». La pregunta es «¿Qué es el Free Flow?» y la respuesta *entera* es sobre Free Flow: reescribirla es inventar otra pregunta. **Se borra el archivo.** El `orden` de las demás no se renumera (el esquema solo ordena, no exige consecutivos) — confirmar leyendo `esquemaPregunta` y el componente `Faq`; si hubiera hueco visible, se renumeran.

- [x] **Step 1: Tests primero** — actualizar las tres aserciones que hoy exigen «Free Flow», dejándolas exigir lo contrario:

```ts
// tests/lib/tramo.test.ts
it('operativa para las existentes, próxima a secas para las nuevas', () => {
  expect(estadoCabina(por('carcarana'))).toEqual({ clave: 'operativa', etiqueta: 'Operativa' });
  expect(estadoCabina(por('leones'))).toEqual({ clave: 'proxima', etiqueta: 'Próxima' });
});
// Pedido del gerente (20/09/2026): «no está asegurado que sea de esa manera y no se sabe cómo va a ser». El campo
// sigue en el contrato porque el backend lo va a mandar igual; lo que se apaga es la etiqueta.
it('freeFlow sigue en el dato aunque no se muestre', async () => {
  const t = await fuenteLocalJson.tramo();
  expect(t.cabinas.find((c) => c.slug === 'leones')?.freeFlow).toBe(true);
});
```

Y un test nuevo, transversal, que es el que evita la recaída:

```ts
// tests/components/sin-free-flow.test.ts
it('ninguna página de usuario nombra Free Flow', async () => {
  // Barrido sobre src/: el gate final lo hace verificar.ts sobre dist/, pero acá se cae más rápido y más claro.
  const sospechosos = archivosDe('src').filter((a) => /\.(astro|json|md|ts)$/.test(a) && !a.includes('esquemas.ts'));
  const culpables = sospechosos.filter((a) => /free\s*flow/i.test(readFileSync(a, 'utf8')));
  expect(culpables, `nombran Free Flow: ${culpables.join(', ')}`).toEqual([]);
});
```

(Excluye `esquemas.ts`, donde el nombre del campo es parte del contrato. Si el comentario de `tramo.ts` lo menciona, se reescribe el comentario.)

- [x] **Step 2: Aplicar**

`src/lib/tramo.ts`:
```ts
/** Verde (cobra hoy) o amarillo (cobra cuando Vialidad la habilite).
 *  La modalidad de cobro de las nuevas NO se anuncia: al 20/09/2026 no está definida, y la web no publica lo que no
 *  está confirmado. El campo `freeFlow` sigue en el contrato (esquemas.ts) porque el backend lo va a mandar igual. */
export const estadoCabina = (c: Cabina): EstadoOperativo =>
  cabinaOperativa(c) ? { clave: 'operativa', etiqueta: 'Operativa' } : { clave: 'proxima', etiqueta: 'Próxima' };
```

`src/content/tramo.json`, los dos avisos:
```json
"Longitudes, extremos, progresivas y vías según el contrato de concesión del Tramo Centro. La habilitación de cada estación la define Vialidad Nacional.",
"Las estaciones nuevas (Leones, San Francisco y Totoras) cobran cuando Vialidad Nacional las habilite.",
```

`medios-de-pago.astro`: se va la sección `#free-flow` entera y la variable `freeFlow`; las siguientes se renumeran con `indices()` (Tarea 1.2). **Ojo con el ancla:** `/medios-de-pago#free-flow` no está enlazado desde ningún lado (verificar con `grep -rn "free-flow" src/`), pero sí hay un `/medios-de-pago#sin-pagar` citado desde Tarifas: ese sobrevive con número nuevo, y el ancla es por `id`, no por índice, así que no se rompe.

`el-tramo.astro:68`, bajada de Estaciones: *«Tres estaciones ya operativas y tres que cobran cuando Vialidad Nacional las habilite. La ficha de cada una está en el mapa de arriba y en su propia página.»*

`peajes/[slug].astro:41`: *«Esta estación todavía no cobra: la habilita Vialidad Nacional cuando esté construida. Va a regir el mismo cuadro tarifario que Carcarañá.»*

`AccesosRapidos.astro:14`: `'TelePASE y pago en la vía.'`
`Servicios.astro:11`: *«TelePASE gratis y en todas las estaciones, y pago en la vía donde haya cabinas.»*

- [x] **Step 3: Verificar y commitear** — `feat(tramo): las estaciones nuevas dicen «Próxima» y nada más`.

---

## Fase 6 — La home

Resultado: la home queda en **Hero → AccesosRapidos → ElTramo (con el mapa) → NovedadesRecientes → ContactoCta** y nada más. Los textos de la portada los eligió Juli.

### Tarea 6.1: Los textos de la portada — **CHECKPOINT CON JULI · CERRADO**

> **Resuelto el 20/09/2026:** Juli eligió con su equipo la **opción B, «la magnitud primero»**. Aplicada, con los km y la fecha saliendo del dato y no escritos a mano. `pnpm originalidad` contra Corresur y CVSA: 0 secuencias de 6 palabras en común.

**Files:**
- Modify: `src/components/home/Hero.astro:41-48`

**Esto es la única parada de la ejecución.** Se presentan con `AskUserQuestion` + `preview` para comparar lado a lado. Borradores, para que Juli los vea ya al aprobar el plan (el texto final sale del checkpoint, y antes de aplicarlo se corre `pnpm originalidad https://www.corresur.com.ar/ https://cvsa.com.ar/`):

**Opción A — la función, sin adjetivos**
> **Concesionaria del Tramo Centro de la Red Federal de Concesiones.**
> 679,03 km de las rutas nacionales 9, 19 y 34, en Córdoba y Santa Fe, bajo la responsabilidad de Covicen desde el 5 de octubre de 2026.

**Opción B — la magnitud primero**
> **679 kilómetros de rutas nacionales, bajo una misma responsabilidad.**
> Covicen opera y conserva el Tramo Centro de la Red Federal de Concesiones: rutas nacionales 9, 19 y 34, entre Córdoba y Santa Fe. La operación comienza el 5 de octubre de 2026.

**Opción C — institucional con destinatario**
> **Al servicio de quien transita el centro del país.**
> Covicen es la concesionaria del Tramo Centro de la Red Federal de Concesiones: 679,03 km sobre las rutas nacionales 9, 19 y 34, en Córdoba y Santa Fe, desde el 5 de octubre de 2026.

- [x] **Step 1: `AskUserQuestion` con las tres, `preview` con el h1 y el párrafo juntos.**
- [x] **Step 2: Aplicar la elegida** manteniendo lo que el `<p>` ya hace bien: los `<strong>` de los km y de la fecha, `{numero(c.km, 2)}` y `{fechaLarga(c.inicioOperacion)}` desde los datos (nunca a mano), y la clase `text-texto` en color pleno — hay un test (`tests/components/home.test.ts`) y una guarda de píxeles (`tests/styles/hero-foto.test.ts`) que dependen de eso.
- [x] **Step 3: `pnpm build && pnpm originalidad https://www.corresur.com.ar/ https://cvsa.com.ar/`** → 0 secuencias de 6 palabras en común. Si aparece alguna, se ajusta el texto elegido y se vuelve a correr.
- [x] **Step 4: Commit** — `feat(home): la portada habla en clave institucional`.

---

### Tarea 6.2: La home se recorta a cinco secciones

**Files:**
- Modify: `src/components/home/Home.astro`
- Modify: `src/components/home/ElTramo.astro` (título y bajada; el mapa ya está adentro)
- Modify: `src/components/home/NovedadesRecientes.astro` (índice)
- Modify: `tests/components/home.test.ts`
- **No se borran** `TarifaDestacada.astro`, `Servicios.astro`, `Consorcio.astro`, `FaqCorto.astro`: `Servicios` lo usa `/servicios/` y los otros tres quedan disponibles. Se dejan de importar en la home, nada más.

> **Recordatorio (ver «Lo que el prompt dice y el código desmiente», punto 1):** el mapa interactivo **ya está** en la home dentro de `ElTramo.astro`. Acá no se mueve nada; se le cambia el texto.

- [x] **Step 1: Test primero**

```ts
it('la home tiene exactamente las cinco secciones acordadas, en orden', async () => {
  const html = await render(Home, {});
  const ids = [...html.matchAll(/<section[^>]*id="([^"]+)"/g)].map((m) => m[1]);
  expect(ids).toEqual(['tramo', 'novedades']);          // las que llevan id; hero, accesos y cta no lo necesitan
  for (const fuera of ['id="tarifa"', 'id="obras"', 'id="servicios"', 'id="consorcio"', 'id="faq"']) {
    expect(html, `la home todavía trae ${fuera}`).not.toContain(fuera);
  }
  expect(html).toContain('data-mapa');                   // el mapa interactivo viaja en la home
});
```

(Los `id` exactos se confirman leyendo cada componente antes de escribir la aserción; lo que no se negocia es que no queden los cinco que se van.)

- [x] **Step 2: Aplicar** — `Home.astro` queda con `Hero`, `AccesosRapidos`, `ElTramo`, `NovedadesRecientes`, `ContactoCta`, y se sacan los imports y los `await` de datos que ya nadie usa (`tarifario`, `obras`, `faq`, `estado`). Renumerar `indice`: `ElTramo` pasa a `01` y `NovedadesRecientes` a `02`.

- [x] **Step 3: El texto de la sección El tramo** — «Tres rutas, dos provincias, un corredor.» pasa a institucional. Propuesta: **«Tres rutas nacionales bajo una misma concesión.»** con bajada *«RN 9, RN 19 y RN 34 en Córdoba y Santa Fe. Tocá una estación para ver su ficha: en verde las que cobran hoy, en amarillo las próximas.»* — es el mismo título que el gerente aprobó en `/el-tramo/` sección 01 («está perfecta»), así que la home y la página interior dicen lo mismo.

- [x] **Step 4: Verificar** — `pnpm check && pnpm test && pnpm verificar`. Mirar el JS emitido: sacar secciones solo puede bajarlo.

- [x] **Step 5: Commit** — `feat(home): la home queda en cinco secciones`.

---

## Fase 7 — Tarifas

Resultado: queda el cuadro tarifario por estación tal cual está y las dos tarjetas de discapacidad y Malvinas; se esconden cinco secciones detrás del interruptor y las exenciones se acortan.

### Tarea 7.1: Las cinco secciones que esperan certificación

**Files:**
- Modify: `src/pages/tarifas.astro`
- Modify: `tests/components/tarifas.test.ts`

- [x] **Step 1: Test primero**

```ts
// Lo que el gerente pidió mantener tal cual: «hay tarifas, cuadro tarifario, y que esté para cada estación lo que
// cuesta, así como está». Sale de la Res. 248/2026 publicada en el Boletín Oficial: tiene fuente, queda.
it('el cuadro por estación y las dos tarjetas de exención siguen estando', async () => {
  const html = await render(Tarifas, {});
  for (const estacion of ['Carcarañá', 'James Craik', 'Franck']) expect(html).toContain(estacion);
  expect(html).toContain('Ex combatientes de Malvinas');
  expect(html).toContain('Personas con discapacidad');
});
it('las secciones sin certificar no se renderizan', async () => {
  const html = await render(Tarifas, {});
  for (const t of ['Descuentos por frecuencia', 'Tarifa diferencial', 'Si pasaste sin pagar', 'Exceso de carga', 'Las categorías que van a regir']) {
    expect(html, `sigue publicada la sección "${t}"`).not.toContain(t);
  }
  // Y que no quede el rastro: ni el porcentaje, ni el multiplicador, ni el recargo.
  for (const dato of ['15 %', '25 %', '35 %', '50 veces', '100 veces', 'dos tarifas']) expect(html).not.toContain(dato);
});
it('los índices de las secciones que quedan van corridos', async () => {
  const html = await render(Tarifas, {});
  const vistos = [...html.matchAll(/tabular-nums text-texto-3[^>]*>(\d{2})</g)].map((m) => m[1]);
  expect(vistos).toEqual(['01']);   // solo sobrevive Exenciones
});
```

- [x] **Step 2: Aplicar** — envolver cada `<Seccion>` en `{publicado.X && (...)}` y calcular los `indice` con `indices([...])` de la Tarea 1.2. Las constantes `descuentos`, `excesoDeCarga` y `futuras` **quedan en el archivo** (son el contenido que vuelve al prender el interruptor), dentro del mismo bloque condicional para que no queden sueltas.

  **Ojo:** al esconderse `04 · Si pasaste sin pagar`, se va también el enlace a `/medios-de-pago#sin-pagar` que salía de ahí. Esa sección de Medios de pago **no se esconde** (el prompt no la nombra y el recargo ahí ya vivía antes) — pero el recargo es el mismo dato sin certificar. **Decisión:** `publicado.pasasteSinPagar` gobierna **las dos** apariciones (Tarifas 04 y Medios de pago 04): un dato, un interruptor. Queda anotado en `publicado.ts`.

- [x] **Step 3: Verificar y commitear** — `feat(tarifas): se esconden las secciones que el área todavía no certificó`.

---

### Tarea 7.2: Exenciones, más corta

**Files:**
- Modify: `src/pages/tarifas.astro` (constante `exentos` y sección 02)
- Modify: `src/content/faq/15-exenciones.json`

**Qué se acorta y qué no:** las **dos tarjetas con los enlaces a discapacidad y ex combatientes de Malvinas se quedan sí o sí** (el gerente las marcó dos veces como «está genial, tiene que estar»). Lo que pesa es la lista de ocho viñetas de vehículos exentos.

- [x] **Step 1: Test primero** — que las dos tarjetas y sus dos enlaces sigan enteros, y que la lista sea más corta que hoy sin perder las dos categorías que la gente busca (discapacidad y Malvinas).

- [x] **Step 2: Aplicar** — la lista pasa de ocho ítems a **una frase agrupada** más las dos categorías que tienen trámite:

```ts
// El listado largo era el que pesaba (pedido del gerente, 20/09/2026). Las categorías del contrato se agrupan en una
// frase; las dos que tienen trámite del usuario se mantienen como ítem propio porque son las que la gente busca.
const exentos = [
  'Vehículos de emergencia y de organismos del Estado: ambulancias, bomberos, Fuerzas Armadas y de Seguridad, Vialidad Nacional, Agencia Nacional de Seguridad Vial y Cruz Roja (Ley 27.547).',
  'Vehículos afectados a personas con discapacidad, según el reglamento de Vialidad Nacional.',
  'Vehículos afectados a ex combatientes de Malvinas, según el reglamento de Vialidad Nacional.',
];
```

La bajada pierde la cita del artículo (§4.11) y queda: *«Solo los vehículos de esta lista, según el contrato de concesión. Deben contar con el dispositivo TelePASE habilitado a ese efecto.»*

`faq/15` se acorta con el mismo agrupamiento y pierde «del pliego».

- [x] **Step 3: Verificar y commitear** — `feat(tarifas): las exenciones se dicen en tres líneas`.

---

## Fase 8 — El tramo y las estaciones

Resultado: se va la sección de cuadros tarifarios (vive en Tarifas), la 01 queda intacta, y las áreas de descanso solo muestran lo que está cargado.

### Tarea 8.1: Fuera la sección 03 y renumerar

**Files:**
- Modify: `src/pages/el-tramo.astro:24` (`bloques`), `:85-90` (sección 03)
- Modify: `tests/components/el-tramo.test.ts`

**Cuidado con la nav de anclas:** `bloques` alimenta la barra sticky de arriba. Sacar `['tarifas', 'Cuadros tarifarios']` de ahí **y** la sección, o queda un ancla a ninguna parte (y `verificar.ts` lo canta como link roto).

**La sección 01 no se toca** («está perfecta», dijo el gerente), salvo la palabra «pliego» de su bajada, que es §4.11.

- [x] **Step 1: Test** — que no haya `id="tarifas"` ni tabla de tarifas en `/el-tramo/`, que la nav tenga tres ítems y que los `indice` queden `01 · 02 · 03`.
- [x] **Step 2: Aplicar** — borrar la sección, sacar el ítem de `bloques`, renumerar con `indices()`. Los imports de `TablaTarifas` y `cabinasDelCuadro` se van con ella; `tarifario` deja de pedirse en el frontmatter. El botón «Descuentos, exenciones y detalle» que vivía ahí se **conserva** moviéndolo al final de la sección 02 (Estaciones): es el puente a Tarifas y sin él la página queda sin salida hacia el precio.
- [x] **Step 3: Verificar y commitear** — `feat(tramo): los cuadros tarifarios viven en Tarifas y no se repiten`.

---

### Tarea 8.2: Áreas de descanso: solo lo que está cargado

**Files:**
- Modify: `src/pages/el-tramo.astro` (sección de servicios)
- Modify: `src/components/TarjetaEstacion.astro` (la ficha del mapa) — solo si hoy no lista los servicios; si ya los lista vía `serviciosDeCabina`, no se toca
- Modify: `src/lib/publicado.ts` (uso de `serviciosDeAreaDescanso`)

**Estado real:** `serviciosDeCabina()` ya devuelve **solo los servicios que existen** y `leyendaServicios()` ya lista **solo los que alguna estación tiene**. O sea: el mecanismo de esconder ya está hecho y funciona. Lo que **no existe** es el dato: hoy ninguna estación tiene `areaDescanso`, `detencionSegura` ni `sanitarios` en `true`.

**Qué queda por hacer, entonces:** que la sección entera no se renderice cuando no hay ni una estación con servicios cargados, en vez de mostrar un encabezado con una lista vacía debajo. Y que el pedido del dato quede escrito en `docs/pendientes-de-confirmacion.md`.

- [x] **Step 1: Test** — con los datos de hoy, `/el-tramo/` no muestra el encabezado «Áreas de descanso y servicios»; con una cabina con `servicios.sanitarios: true` (fixture), sí lo muestra y lista solo sanitarios. **Es la forma de probar que prender el dato lo devuelve sin tocar código.**
- [x] **Step 2: Aplicar** — condicionar la sección a `conServicios.length > 0`, renumerar, y dejar el enlace a `/servicios/` (que sí tiene contenido) fuera del condicional.
- [x] **Step 3: Verificar y commitear** — `feat(tramo): las áreas de descanso aparecen cuando haya datos, no antes`.

> **No se inventa nada del mapa.** Las ubicaciones exactas y qué paradas tiene cada estación están a determinar (§4.8): van a pendientes y el mapa queda como está.

---

## Fase 9 — La guía de trámites guía de verdad

Resultado: cada trámite dice **qué podés hacer, cómo lo hacés y qué documentación necesitás**, y solo están los que tienen fuente oficial verificable.

### Tarea 9.1: Fichas con los tres campos

**Files:**
- Modify: `src/lib/datos/esquemas.ts` (`esquemaTramite`: campo `queEs` opcional)
- Modify: `src/content/tramites.json`
- Modify: `src/pages/tramites.astro`
- Modify: `tests/lib/datos/esquemas.test.ts`, `tests/components/*` según corresponda

**Qué queda y qué se esconde:**

| Trámite | Fuente | Estado |
|---|---|---|
| Exención por discapacidad | argentina.gob.ar | **queda** (hay que agregarle la `url` oficial: hoy no la tiene) |
| Exención ex combatientes de Malvinas | argentina.gob.ar | **queda** (ya tiene `url`) |
| Alta de TelePASE | telepase.com.ar | **queda** |
| Tarifa diferencial vecinos y frentistas | ninguna | **se esconde** (`publicado.tramiteVecinosFrentistas`) |
| Tarifa diferencial docentes | ninguna | **se esconde** (mismo interruptor: es el mismo beneficio) |

**Contrato:** el campo nuevo `queEs` va **opcional** (`z.string().min(1).optional()`), igual que el resto de lo que se agregó en septiembre. `pnpm contrato` y commitear `docs/contrato/*.schema.json` si el esquema de trámites se exporta (verificar: hoy `pnpm contrato` exporta solo tramo y tarifario; si trámites no viaja, no hay nada que regenerar).

- [x] **Step 1: Test primero** — cada trámite visible tiene los tres campos con contenido, y los dos de tarifa diferencial no se renderizan.

- [x] **Step 2: Reestructurar `tramites.json`** — agregar `queEs` a los tres que quedan, y revisar `requisitos` para que diga **qué documentación hay que llevar**, que es el pedido textual («para que cuando lo inicies, lo inicies completo y no te demore tener que estar presentando documentación»). Los requisitos de discapacidad y Malvinas **se verifican contra argentina.gob.ar** antes de tocarlos: no se agrega ni un requisito que la página oficial no liste.

- [x] **Step 3: Rehacer la ficha en `tramites.astro`** — tres bloques claros: *Qué es* (párrafo), *Qué necesitás* (lista), *Cómo se hace* (pasos numerados), más el enlace oficial. La nav de anclas de arriba se arma con los trámites visibles.

- [x] **Step 4: El `<select>` del formulario** — sus opciones salen de `tramites.map(t => t.nombre)`: si se filtra la lista, el select se arregla solo. Comprobarlo.

- [x] **Step 5: Verificar y commitear** — `feat(tramites): la guía dice qué es, qué necesitás y cómo se hace`.

---

## Fase 10 — Tono institucional y fuera las citas del pliego

Resultado: `pnpm verificar` prohíbe las citas del pliego fuera de Transparencia, el sitio no las tiene, y las páginas institucionales suenan como el gerente pidió.

### Tarea 10.1: (ya escrita en la Tarea 1.4) Confirmar que la guarda está en rojo

- [x] **Step 1:** correr `pnpm verificar` y anotar la lista completa de páginas que fallan. Esa lista es el checklist del Step siguiente.

---

### Tarea 10.2: El barrido

**Files:** `src/pages/{tarifas,el-tramo,servicios,medios-de-pago,tramites,quienes-somos,contacto}.astro`, `src/components/{Canales,Header,ui/Senal}.astro` (comentarios: no renderizan, pero se corrigen para que no confundan), `src/content/{tramo,servicios,tramites,contacto,tarifario}.json`, `src/content/faq/*.json`, `src/content/novedades/*.md`, `src/content/obras/*.json`.

**Cómo se reemplaza** (no es borrar: es decir lo mismo sin citar):

| Hoy | Queda |
|---|---|
| `(PETG art. 53.3)` | «Es una obligación del contrato de concesión.» |
| `(PETG art. 52)` | «según el contrato de concesión» |
| `Fuente: PETG art. 59 y 60.4` (anotación) | **no se renderiza** (el dato queda en el JSON) |
| «Los que fija el pliego (art. 58)» | «Los plazos son los que fija el contrato de concesión.» |
| «según el Pliego de Especificaciones Técnicas Particulares del Tramo Centro (art. 1 y 2)» | «según el contrato de concesión del Tramo Centro» |
| «Todos están en el pliego de la concesión.» | «Todos están en el contrato de concesión.» |
| «con el artículo del pliego que los exige» | (se va: ya no se muestra el artículo) |

- [x] **Step 1: Dejar de pintar `fuente`** en `servicios.astro` (dos lugares), `tramites.astro` y `medios-de-pago.astro`. **El campo no se toca en los JSON ni en Zod.** Comentario en cada sitio explicando por qué el dato sigue ahí.
- [x] **Step 2: Reescribir las prosas** de la tabla de arriba, página por página, siguiendo la lista del Step 1 de la Tarea 10.1.
- [x] **Step 3:** `pnpm verificar` en verde: 0 fallos. `pnpm test` con el test de la Tarea 1.4 en verde.
- [x] **Step 4: Commit** (lleva la Tarea 1.4 adentro) — `feat(contenido): el sitio deja de citarle el pliego al usuario`.

---

### Tarea 10.3: Tono institucional en las páginas que faltan

**Files:** `src/pages/{el-tramo,servicios,quienes-somos,politicas,transparencia}.astro`, `src/components/home/Servicios.astro`, `src/pages/peajes/[slug].astro`.

**Alcance:** más breve y más conciso. **No se toca:** la sección 01 de El tramo («está perfecta»), ni Contacto, reclamos y sugerencias (el gerente ya los dio por buenos: retoque mínimo, solo lo que pidan §4.11 y §4.6).

**Referencia de tono: Corresur** (`https://www.corresur.com.ar/`). **Referencia de tono, no de texto:** `scripts/originalidad.ts` exige **cero** secuencias de 6 palabras en común, y se corre al cerrar la fase.

- [x] **Step 1:** pasada página por página, acortando bajadas y sacando el registro de folleto. Cada cambio conserva el dato con fuente; ningún cambio agrega un dato nuevo.
- [x] **Step 2:** `pnpm build && pnpm originalidad https://www.corresur.com.ar/ https://cvsa.com.ar/` → 0 coincidencias. Si aparece alguna, se reescribe esa frase.
- [x] **Step 3: Commit** — `feat(contenido): tono institucional en el resto del sitio`.

---

## Fase 11 — Entregables

### Tarea 11.1: `docs/pendientes-de-confirmacion.md`

**Files:** Create: `docs/pendientes-de-confirmacion.md`

Es lo que Juli le lleva al gerente. Una fila por dato, con estas columnas —el pedido textual del prompt §8.3—:

| Qué falta | **Qué hay que preguntar, exactamente** | A quién | Qué vuelve a aparecer | Dónde se carga |
|---|---|---|---|---|

Filas mínimas (una por cada `false` de `src/lib/publicado.ts`, más las que no dependen del interruptor):

1. Porcentajes de descuento por frecuencia · *«¿Se confirman 15 %, 25 % y 35 % a partir de las pasadas 36, 45 y 61, por estación y por mes, solo para categoría 1 con TelePASE? ¿Desde cuándo rigen?»* · responsable de Tarifas · Tarifas 01 · `publicado.descuentosPorFrecuencia` + los montos en `tarifas.astro`.
2. Tarifa diferencial (vecinos, frentistas, docentes) · *«¿Existe el beneficio desde el día uno? ¿Cuál es el monto o el porcentaje? ¿Dónde se tramita: TAD, la estación, la web? ¿Qué documentación piden?»* · responsable del área · Tarifas 03 + el trámite en la Guía · `publicado.tarifaDiferencial`, `publicado.tramiteVecinosFrentistas`, `src/content/tramites.json`.
3. Recargos por pasar sin pagar · *«¿Se confirma una tarifa extra dentro de los 30 días y dos después, con intereses a tasa activa del Banco Nación? ¿Por qué medio se regulariza?»* · responsable del área · Tarifas 04 y Medios de pago 04 · `publicado.pasasteSinPagar`, `contacto.cuentaRegularizacion`.
4. Exceso de carga · *«¿Se confirman los multiplicadores de 50 y 100 tarifas? ¿Hay balanzas operativas el 5/10?»* · responsable del área · Tarifas 05 · `publicado.excesoDeCarga`.
5. Categorías futuras · *«¿Se publica ya la estructura de categorías que va a regir después de las obras iniciales?»* · responsable del área · Tarifas 06 · `publicado.categoriasFuturas`.
6. Obras · *«¿Hay plan de obras confirmado y fechas? ¿Se puede publicar el listado y el avance?»* · gerencia · la página `/obras/` entera, su ítem de menú y la novedad despublicada · `publicado.obras` + `src/content/novedades/_borradores/`.
7. Modalidad de cobro de las estaciones nuevas · *«¿Leones, San Francisco y Totoras van a ser Free Flow? ¿Confirmado o todavía no?»* · gerencia · la etiqueta «Free Flow» en el estado de cada estación y la sección de Medios de pago · `src/lib/tramo.ts` + `tramo.json`.
8. Servicios de cada área de descanso · *«¿Qué hay realmente en cada estación: agua, baños, sector de detención segura, colocación de TelePASE? ¿Horarios?»* · Operaciones · El tramo 04 y la ficha del mapa · `src/content/tramo.json` → `cabinas[].servicios.*`.
9. Ubicaciones exactas y paradas del mapa · *«¿Coordenadas o kilómetro exacto de cada estación y de cada área de descanso?»* · Operaciones · precisión del mapa · `tramo.json` → `cabinas[].mapa`, `ciudades[]`.
10. Estado de la traza · *«¿Cuándo hay centro de operaciones para publicar cortes y desvíos reales?»* · Operaciones · el módulo de estado (hoy con datos de ejemplo, fuera de la home) · `src/content/estado-ruta.json` → `ejemplo: false`.

Más un recordatorio corto de que **lo de `docs/guia-de-revision.md` § «Qué está oculto hasta tener el dato» sigue vigente** (razón social, CUIT, 0800, WhatsApp, casilla, póliza, redes…) y que esa lista no se duplica acá: se enlaza.

- [x] **Step 1: Escribirlo.** Cada fila con la pregunta redactada para copiar y pegar en un mail o leer en una reunión. Sin tecnicismos.
- [x] **Step 2: Commit** — `docs: la lista de qué falta preguntar y a quién`.

---

### Tarea 11.2: `docs/guia-de-revision.md` al día

**Files:** Modify: `docs/guia-de-revision.md`

- [x] **Step 1:** sección nueva arriba, **«Lo que cambió el 20 de septiembre — mirá esto primero»**, con la lista de la tanda y qué mirar de cada cosa.
- [x] **Step 2:** sacar del índice las páginas que ya no existen (`/obras/`, `/trabaja-con-nosotros/`) y sus bloques; ajustar el bloque de Políticas/Privacidad/Proveedores.
- [x] **Step 3:** actualizar Home (cinco secciones), Tarifas (qué se ve y qué no), El tramo (sin cuadros), Trámites (fichas nuevas), Medios de pago (sin Free Flow), y la sección «Qué está oculto hasta tener el dato» enlazando a `docs/pendientes-de-confirmacion.md`.
- [x] **Step 4:** agregar cómo se prende lo escondido: «abrí `src/lib/publicado.ts` y cambiá el `false` por `true`».
- [x] **Step 5: Commit** — `docs: guía de revisión al día con la tanda del 20/09`.

---

### Tarea 11.3: El vault

**Files:** `obsidian/Home.md`, `obsidian/Arquitectura de informacion de la landing.md`, `obsidian/Obligaciones del pliego para la web.md`, `obsidian/Costura de datos.md`

- [x] **Step 1: `Home.md`** — entrada de estado nueva del 2026-09-20, con la verificación y los números reales (no los esperados): `astro check`, tests, `verificar` (28 páginas), `verificar:portada`, JS gz, `originalidad`.
- [x] **Step 2: `Arquitectura de informacion de la landing.md`** — la home cambia de forma: cinco secciones y por qué; `/obras/` y `/trabaja-con-nosotros/` fuera del mapa del sitio; Proveedores sube al menú.
- [x] **Step 3: `Obligaciones del pliego para la web.md`** — qué se dejó de mostrar y por qué. **Ojo con el matiz:** el pliego obliga *contenido*, no obliga *citar el pliego*; lo que se sacó son las citas, no las obligaciones. Anotar que Transparencia es la excepción y que ahí la normativa sigue entera.
- [x] **Step 4: `Costura de datos.md`** — el interruptor: qué es `src/lib/publicado.ts`, por qué es uno solo, cómo se prende, y la distinción con `capacidades.ts` (aquello es «el sistema no existe»; esto es «el dato no está confirmado»). Sumar las dos lecciones durables del header, que van a [[Sistema de diseno]]: *(1) el peor contraste de una animación está en el medio, no en los extremos — el fondo del header cumplía en los dos extremos y fallaba a los 24 px de scroll; (2) un texto que se apoya en su propia superficie opaca deja de tener un problema de contraste y pasa a tener un par de tokens, que es un problema ya resuelto y con guarda.* Y la anécdota de método: **mi objeción contra las pills («el logotipo queda igual de ilegible») era falsa, y la tiró abajo la medición, no la discusión** — el logotipo va en `--color-texto` y ya pasaba con 4,95:1.
- [x] **Step 5:** notas atómicas, enlazadas con `[[wikilinks]]`, sin duplicar el código.
- [x] **Step 6: Commit** — `docs(vault): la tanda del 20/09 en el árbol`.

---

## Definition of Done

- [x] `pnpm check` → 0 errores
- [x] `pnpm test` → todo verde (piso: **510**; van a ser más)
- [x] `pnpm verificar` → **28 páginas**, 0 fallos, JS ≤ 30 KB gz
- [x] `pnpm verificar:portada` → 1 página, 0 fallos, 0 KB de JS
- [x] `pnpm build && pnpm originalidad https://www.corresur.com.ar/ https://cvsa.com.ar/` → 0 secuencias de 6 palabras en común
- [x] Guardas que no se negocian, en verde: `colores-fijos`, `legibilidad`, `contraste`, `hero-foto`, **`header-foto`** (nueva), `presupuesto`
- [x] Ni un `TODO`, `test.skip`, `it.only` ni rama sin implementar en los archivos tocados
- [x] `docs/pendientes-de-confirmacion.md` escrito
- [x] `docs/guia-de-revision.md` actualizada
- [x] Vault al día
- [x] `rev-bro` aprobó **sobre código que no escribió**, con la salida real de los comandos
- [x] Rama `web-ajustes-2026-09-20`, un commit por tarea, **sin push**
- [x] Cierre para Juli en criollo: qué cambió, qué quedó escondido y por qué, qué falta preguntar, y los números de la verificación
