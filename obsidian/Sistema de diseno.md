# Sistema de diseño

Concepto rector, tokens, tipografía, movimiento. Fuente completa: spec §6. Ver [[Decisiones de arquitectura]] · [[Home]].

## Concepto: "La ruta, de noche"

El sitio es el corredor visto de noche. Navy profundo (asfalto y cielo); **la ruta como hilo luminoso celeste** que une todas las páginas (se dibuja en el hero, acompaña el scroll en el margen, es el trazo del mapa con las **cabinas como balizas**); lo práctico habla en **señalética** (amarillo vial, Archivo 800, mayúsculas); los números grandes son **mojones** (tabulares, enormes, unidad chica). Registro tech: grilla de plano tenue, esquineros finos, glow solo en el hilo y las balizas. Sin glassmorphism, partículas, cursor custom ni scroll-jacking. Cero emojis.

Dos líneas rojas de Juli: navegación intuitiva y directa (la tarifa a un clic) y nada de sobre-animación.

## Tokens (`src/styles/tokens.css`, `@theme` de Tailwind 4)

**Marca** (manual, fijos; no usar en componentes): `marca-900 #1E4870` · `marca-700 #2C688F` · `marca-500 #4A92BA` · `marca-300 #68BCE1` · `gris-texto #5A6472` · `gris-fondo #EEF1F4` · `vial #F0C419`.

**Semánticos, tema oscuro** (los que usan los componentes): `fondo #0B1526` · `fondo-2 #10203A` · `superficie #16304E` · `superficie-2 #1E4870` · `texto #E8EEF5` · `texto-2 #A9C4D8` · `texto-3 #8593A0` (solo sobre fondo/fondo-2) · `acento #68BCE1` · `acento-hover #8FCDE8` · `vial #F0C419` · `error #FF8A80` · `borde rgba(255,255,255,.10)` · `borde-fuerte .18` · `glow rgba(104,188,225,.35)`.

Contraste AA verificado por test (`tests/styles/tokens.test.ts`) para cada par usado. Par sabido que NO cumple: `acento` sobre `superficie-2` (4.4) — no usar para texto normal.

Tema claro: existe desde el 2026-09-13 (sección "Tema claro", abajo): `html[data-tema="claro"]` redefine solo la capa semántica. Para impresión hay tokens aparte, `--color-papel` y `--color-tinta*`, que no dependen del tema (sección "Legibilidad e impresión").

## Tipografía

**Archivo** variable, self-hosted (`@fontsource-variable/archivo`, familia `'Archivo Variable'`). h1/h2 ExtraBold 800 con tracking -0.02em y escala fluida; eyebrows Medium 500 mayúsculas tracking 0.15em; cuerpo Regular 400 ≥ 16px, `tabular-nums` global.

## Movimiento (`src/styles/movimiento.css`)

CSS primero, JS solo como fallback (`src/scripts/revelar.ts`, IntersectionObserver para Firefox estable). Tokens: `--dur-micro 120ms`, `--dur-ui 240ms`, `--dur-entrada 600ms`, `--dur-narrativa 900ms`, `--stagger 60ms`, `--ease-salida` (out-quart), `--ease-suave` (in-out-cubic).

| Patrón | Clase | Técnica |
|---|---|---|
| Reveal con stagger | `.revelar`, `.escalonar > *` + `style="--i: n"` | `animation-timeline: view()` |
| Entrada del hero | `.entrada > *` + `--i` | keyframes con delay |
| Dibujar ruta | `.dibujar.al-cargar` / `.al-scroll` con `pathLength="1000"` | dashoffset |
| Balizas | `.baliza` (+ `.al-cargar`) | keyframes escalonados |
| Contador | `.mojon-contador` + `--meta` | `@property --n` + `counter-set` |
| Hilo de ruta | componente `HiloRuta` | `scroll(root)` |
| Parallax leve | `.parallax` | `scroll(root)`, 12% |
| Transiciones de página | `<ClientRouter />` | View Transitions, header con `transition:animate="none"` |

`prefers-reduced-motion`: todo apagado.

## Componentes de superficie (segunda pasada, 2026-08-27)

- **`.tarjeta`** (`src/styles/tarjetas.css`): un solo elemento con gradiente interior en `padding-box` y un **gradiente cónico de azules que gira** (`@property --angulo`, 9 s) en `border-box`; el `::before` repite el cónico desenfocado como **halo exterior**. Variantes `.tarjeta-vial` (amarillo, emergencias), `.tarjeta-hueco`, `.tarjeta-panel`. Reemplazó a los esquineros. Adaptación propia de la referencia "Binaural Glow Feature Card" de 21st.dev que pidió Juli (excepción explícita a su regla). En táctil el halo no anima (costo de repintado).
- **`Boton` primario** = "Floating Dots CTA" adaptado: gradiente `#2C688F→#1E4870` (blanco encima cumple AA), diez `<i>` que suben (`translateY(-55px)`) con delays negativos, flecha que se dibuja en hover (`stroke-dasharray` 0,20→20,0).
- **Costuras** (`.seccion-cinetica`, `.costura` en `global.css`): fondo en gradiente vertical `fondo→fondo-2→fondo`, `mask-image` que desvanece el canvas en los bordes, y una hairline con marca vial centrada + resplandor radial en cada unión. Resuelve el corte de fondo entre secciones.
- **Flip de tarifa** (`home/TarifaDestacada.astro` + `scripts/flip.ts`): `perspective` + `rotateY(180deg)` en 700 ms; dorso con ítems escalonados y CTA. En táctil, un toque gira.
- **Grilla cinética** (`ilustraciones/GrillaCinetica.astro` + `scripts/grilla-cinetica.ts`): canvas por sección, nodos cada 55 px atraídos al puntero (radio 260, fuerza 24), ondas al clic; dibuja solo cuando está visible y hay movimiento; estática en táctil/reduced-motion. Va en toda `Seccion` con `fondo="fondo-2"|"plano"`.
- **Divisor** (`ui/Divisor.astro`): hairline con ornamento (isotipo en una tinta) entre el hero y el contenido.

## Assets propios

Isotipo vectorial extraído del PDF (`scripts/extraer-isotipo.py` → `src/assets/marca/isotipo.svg` + `isotipo-path.ts`), mapa esquemático del tramo (`MapaTramo.astro`, coordenadas en `tramo.json`), ilustración del hero (`HeroRuta.astro`), familia de íconos de categoría de vehículo (`IconoVehiculo.astro`), imagen OG generada en build con resvg y las TTF de Archivo (`scripts/generar-og.ts`). Imágenes fotográficas opcionales: `docs/marca/prompts-imagenes.md`.

## Tema claro (2026-09-13)

- **Mecanismo:** `<html data-tema="oscuro|claro">`. El bloque `@theme static` de `src/styles/tokens.css` es el oscuro; `html[data-tema="claro"]` redefine SOLO la capa semántica (los siete de marca no cambian). `@theme static` porque Tailwind no ve los `var(--color-*)` de los `<style>` de componentes y podaría tokens.
- **Sin destello:** `<script is:inline define:vars>` en el `<head>` de `Base.astro` aplica el tema antes de pintar y lo reaplica en `astro:after-swap` (el `ClientRouter` reemplaza los atributos de `<html>`). `src/lib/tema.ts`: `TEMA_POR_DEFECTO: 'oscuro' | 'claro' | 'sistema'` (lo decide el cliente), `CLAVE_TEMA` en `localStorage`, `COLOR_TEMA` para el `theme-color`. El interruptor (`InterruptorTema.astro` + `scripts/tema.ts`) emite `tema:cambio`; la grilla cinética relee tokens y el parallax monta la foto que quedó visible.
- **Tokens nuevos por función:** `vial-texto` (amarillo como texto; en claro `#6E5A00`), `sobre-vial`, `sobre-acento`, `ok`/`sobre-ok` (estación operativa, verde), `cabecera`, `tarjeta-interior-1/2/3`, `sombra`, `plano`, `luz`, y la variable `--brillo-foto` (0,62 oscuro / 1 claro). Paleta clara: fondo `#EEF1F4`, fondo-2 `#F7F9FB`, superficie `#FFFFFF`, superficie-2 `#DDE6EE`, texto `#16304E`, texto-2 `#5A6472`, texto-3 `#546070`, acento `#2C688F`, acento-hover `#1E4870`, error `#B3261E`, ok `#1B6B35`. Todos los pares verificados ≥ 4,5:1 en los dos temas (`scripts/lib/pares.ts`, `verificar.ts` y `tests/styles/tokens.test.ts`).
- **Reglas con guarda (tests):** ningún color fijo fuera de `tokens.css`, `Isotipo.astro` y `scripts/lib/color.ts` (`colores-fijos.test.ts`); nada de `text-fondo` ni `text-vial` como texto (`semantica.test.ts`). Los alfa derivados se escriben con `color-mix(in srgb, var(--color-x) N%, transparent)`.
- **Hero por tema (desde 2026-09-15 están las dos fotos):** se renderizan `hero-ruta-nocturna.jpg` y `hero-ruta-diurna.jpg` como `.solo-oscuro` / `.solo-claro`, la del tema por defecto con prioridad; **comparten encuadre (1672×941, punto de fuga 0,78 / 0,595) y por eso también el mapa de profundidad del parallax**, que es procedural. Si faltara la de día, `variantesHero` devuelve una sola y el hero vuelve a ser `.zona-noche`. `.btn-vial` vive una sola vez en `global.css`.
- **Zona oscura (`tokens.css`, una sola regla):** revertir los semánticos a los valores del tema oscuro dentro de un pedazo de página. **Dos usos, la MISMA regla a propósito** — si fueran dos bloques, el día que cambie un color del oscuro uno se queda viejo en silencio, y `tests/styles/tokens.test.ts` lo exige junto. (1) `.zona-noche`: secciones con foto nocturna sin versión de día, hoy solo el panel del Consorcio. (2) **Zona de tinta**: `html[data-tema="claro"] :is(.tarjeta, .bloque-oscuro)`, las tarjetas y los paneles de contenido en el tema claro (pedido de Juli, 15/09/2026 — el fondo #EEF1F4 con tarjetas blancas encandilaba). Fuera quedan el cromo (header, barra superior, barra de emergencias, pie) y los campos de formulario.

  La primera versión reusó los semánticos del tema oscuro y **quedó azul**: el interior de la tarjeta arranca en `--color-tarjeta-interior-1: #17334F`, que al lado del papel se lee celeste, no negro. La zona de tinta usa la escala del **marco del backoffice** (`covicen-sistemas/panel/src/index.css`, tema "Papel con marco de tinta"): fondo `#070E18`, panel `#0B1522`, tarjeta `#0F1A29`, elevado `#152132`, y los grises de texto **neutros** (`0 0% 98/64/54 %` → `#FAFAFA` / `#A3A3A3` / `#8A8A8A`) — la falta de saturación es lo que la hace leer negra. El interior de la tarjeta pasa a ser casi plano, `#152132 → #0B1522`.

  Como una tarjeta pinta su interior sola (`tarjetas.css`, `::after`) y un panel no, `global.css` le pone fondo a `.bloque-oscuro`; el componente que ya tiene el suyo lo declara en `--fondo-bloque` y así le queda igual en los dos temas. **Todo sale de tokens: ningún componente escribe un color**, y el contraste de la tinta se verifica como **un tema más** (`leerTemas` devuelve oscuro, claro y tinta, y `pares.ts` los recorre a los tres; el par más justo es texto-3 sobre la tarjeta, 5,07:1).
- **Velo del hero (`global.css`, `.velo-hero`):** es lo único que hace legible el texto sobre la foto, así que sus porcentajes son **contrato con `tests/styles/hero-foto.test.ts`**, que mide el contraste real píxel a píxel (lee el velo de `global.css`, los tokens de `tokens.css`, simula `object-fit: cover` en once tamaños y exige 4,5:1 en el párrafo y 3:1 en el `h1`). Horizontal en escritorio, donde el texto vive en la mitad izquierda; **vertical debajo de 1024 px**, donde ocupa todo el ancho: transparente sobre el cielo y firme del horizonte para abajo, con `--velo-hero-abajo` por tema (28 % oscuro / 68 % claro: la foto nocturna ya es oscura y pide poco). El párrafo del hero va en `--color-texto`, no en `texto-2`: en gris daba 3,1:1 sobre el asfalto de la foto de día.
- **Disolvencia al cambiar de tema (`.velo-tema` + `src/lib/disolvencia.ts`):** intercambiar las dos fotos es un corte seco (el CSS las alterna con `display`) y encima el canvas del parallax se remonta. El velo tapa el hero entero con el color del fondo **que viene** (0,2 s), ahí se aplica el tema y recién después se destapa (0,42 s). El orden vive en `lib/` y no en el script justo porque es lo que importa: si el tema se aplica antes de que el velo esté arriba, se ve el corte. Sin JS, con `prefers-reduced-motion` o fuera del home, el cambio es instantáneo.

## Legibilidad e impresión (pliego 61.7, Fase 6, 2026-09-14)

Lo que el PETG 61.7 exige al sitio se implementó como reglas globales **con guarda en tests**, para que no se pierda en la próxima edición. Spec §11.

- **Enlaces subrayados en reposo** (regla global en `@layer base` de `global.css`): `a:not(.btn):not(.btn-vial):not(.nav-item)` lleva `text-decoration: underline` de 1 px con `text-underline-offset: .15em`; en `:hover`/`:focus-visible` pasa a 2 px y a `acento-hover`. Lo que el pliego permite sin subrayar (menús, botones, tarjetas-enlace, navs de anclas, footer, migas) usa la utilidad `no-underline` (con `hover:underline` donde ayuda). `.link-crece` desapareció. Los `<a>` del SVG del mapa son botones (`.baliza`, `text-decoration: none`): el subrayado llegaría a la etiqueta de texto.
- **Tamaños:** cuerpo 16 px; ningún texto de contenido menor a 14 px (`text-sm`); las anotaciones (notas y pies de tabla, "sin IVA", fuentes, etiquetas, chips) van exactamente en 12 px con la clase **`.anotacion`** junto a `text-xs`. `Senal` (chip de 12 px) lleva `anotacion` por definición: es la excepción justificada en su comentario. Prohibidos por test: `text-[0.6rem]`, `text-[0.7rem]`, cualquier `font-size` menor a 12 px, `text-xs` sin `anotacion`, `text-justify`.
- **Párrafos:** interlineado 1,6 en el cuerpo; en `.prose-covicen`, `p + p { margin-block-start: 1.5lh }` con fallback `2.4em` (WCAG 1.4.8: separación entre párrafos 1,5 veces el interlineado).
- **Guarda:** `tests/styles/legibilidad.test.ts` recorre `src/components`, `src/pages`, `src/layouts` y `src/styles` y falla ante cualquiera de las prohibiciones de arriba, la ausencia de la regla de subrayado o del `1.5lh`.
- **Impresión** (`src/styles/impresion.css`, importada desde `global.css`, sin `@layer` a propósito para ganarle a `theme`): dentro de `@media print` pisa los tokens semánticos con los de **papel y tinta** de `tokens.css` (`--color-papel #FFFFFF`, `--color-tinta #000000`, `--color-tinta-2 #333333` 12,6:1 sobre papel, `--color-tinta-media #666666`, `--color-tinta-suave #999999`), así todo lo que usa tokens (utilidades de Tailwind incluidas) sale en blanco y negro sin tocar componentes. El amarillo vial pasa a gris medio para que en el mapa las estaciones próximas se distingan de las operativas también en papel. Oculta el cromo (`body > header`, `footer nav`, `.fixed`, `.sticky`, navs de anclas salvo las migas, botones, canvas, costuras, parallax); muestra las URL de los enlaces externos (`a[href^="http"]::after { content: " (" attr(href) ")" }`); destapa las tarjetas de estación que están en `hidden`; la cinta de avisos sale quieta, una sola vez y sin el botón de frenar (`.marquesina-cinta { animation: none }`, la copia `aria-hidden` y `.marquesina-pausa` ocultas); deja las tablas completas (`overflow: visible`) y evita cortes dentro de tarjetas y después de títulos. **Encabezado de la hoja**: `body::before` lee `data-sitio` y `data-fecha` del `<body>` (`Base.astro` los escribe con la fecha del build como fallback sin JS; `scripts/imprimir.ts` la pisa con la del momento de imprimir en `beforeprint`). El botón **Imprimir** (`[data-imprimir]`, `window.print()`) está en `/tarifas/` y en `/peajes/<slug>/` de las estaciones operativas. `verificar.ts` exige que el CSS emitido tenga `@media print`, `attr(data-fecha)` y `attr(href)`; `tests/styles/impresion.test.ts` cubre la hoja y su import.
- **Foco visible:** `<main id="contenido" tabindex="-1">` sin `outline-none`; `#contenido:focus-visible` dibuja el anillo con `outline-offset: -4px` (hacia adentro: `<main>` ocupa todo el ancho y arranca bajo el header fijo). El `<summary>` de Nosotros sincroniza `aria-expanded` con el `<details>`.
- **HTML válido:** html-validate sobre cada página de `dist/` en `verificar.ts`; qué marcó y cómo se resolvió en los componentes está en [[Decisiones de arquitectura]] ("Cosas que aprendimos construyendo").
- **Colores fijos:** la lista `permitidos` de `tests/styles/colores-fijos.test.ts` sigue siendo `tokens.css`, `Isotipo.astro` y `scripts/lib/color.ts`; la hoja de impresión no necesita excepción porque usa los tokens de papel y tinta.

## El contraste del header, y por qué la pill (2026-09-20)

El gerente vio a ojo que el menú se perdía sobre la foto del hero. La medición le dio la razón y, de paso,
desmintió dos intuiciones — las dos mías.

Medido con los píxeles de las dos fotos, nueve tamaños de pantalla y **todo el recorrido del scroll**, con el
método de `tests/styles/hero-foto.test.ts`. Cada celda: menú (`texto-2`) · logotipo y hamburguesa (`texto`).

| Configuración | Oscuro | Claro (foto de día) |
|---|---|---|
| Como estaba: `animation-range: 0 120px`, `--color-cabecera` alfa 0,85 | 8,92 · 14,16 | **2,22** · 4,95 |
| Fondo opaco (alfa 1,00), mismo recorrido | 8,97 · 14,24 | **2,29** · 5,13 |
| Recorrido de 16 px, alfa 0,85 | 8,92 · 14,16 | 4,59 · 10,24 |
| Recorrido de 16 px, alfa 1,00 | 8,97 · 14,24 | 5,29 · 11,82 |

**Tres lecciones durables:**

1. **El peor contraste de una animación está en el medio, no en los extremos.** El fondo del header cumplía a
   scroll 0 (está sobre `--color-fondo`, no sobre la foto) y cumplía al final (opaco), y fallaba a los ~24 px,
   con la foto ya detrás del texto y el fondo a 0,17 de opacidad. Por eso oscurecer el color final no movía nada
   (2,22 → 2,29): la variable no era el color, era **cuándo** termina de pintarse.
2. **Un texto que se apoya en su propia superficie opaca deja de tener un problema de contraste** y pasa a tener
   un par de tokens, que es un problema ya resuelto y con guarda (`scripts/lib/pares.ts` lo verifica en los dos
   temas). Eso hace la pill: el menú deja de depender del scroll, del tema y de qué foto haya.
3. **La medición gana a la discusión.** Yo había objetado la pill con un argumento que sonaba sólido —«no cubre
   el logotipo ni la hamburguesa, que viajan en la misma franja»—, y era **falso**: esas dos piezas van en
   `--color-texto`, bastante más fuerte que el `--color-texto-2` del menú, y ya pasaban con 4,95. La pill que
   pidió Juli resolvía lo único que fallaba, y el vidrio esmerilado del header quedó intacto.

Las dos piezas sin pill entran igual a `tests/styles/header-foto.test.ts`, aunque hoy estén en verde: 0,45 de
margen es poco, y este proyecto ya lo perdió **dos veces** al cambiar la foto del hero.

## Encabezados sin número, y el formulario apagado sin transparencia (2026-09-24)

**Sin números de sección.** El «01», «02» que iba a la izquierda de cada título se sacó de todo el sitio: el cliente
lo marcó dos veces, y sacarlo de dos páginas dejaba el resto con otro estilo. `Seccion` ya no acepta `indice` y una
guarda en `tests/components/ui.test.ts` impide que vuelva de a una página. De paso, el encabezado quedó alineado con
el contenido de abajo (antes entraba sangrado por la columna del número). En El tramo y en la sección Novedades del
inicio, el pedido fue más allá: **el nombre del bloque es el título**, sin eyebrow ni bajada, y coincide con la barra
de anclas. En el resto del sitio los títulos no se tocaron.

**Lección durable: apagar con opacidad transparenta lo que hay detrás.** Los formularios sin canal se apagaban con
`opacity: 0.6` en el `fieldset` y en el botón. Sobre fondo liso eso se lee como «gris»; sobre la **grilla cinética**
(`fondo-2`), los campos dejaban ver las líneas y el cliente lo describió exacto: «se ve transparente y mal». Un
estado apagado se marca con **colores opacos de los tokens** (borde punteado, etiquetas en `texto-2`, botón en
`superficie-2` con `texto-2`, par ya verificado en `scripts/lib/pares.ts`), nunca bajando la opacidad de un
contenedor. Lo guarda `tests/components/formulario.test.ts`. Ver [[Costura de datos]] y [[Home]].

## Logos institucionales del pie (2026-09-25)

**Se pintan como máscara, no se insertan.** Cada logo oficial es un archivo aparte en `src/assets/institucional/`
que el pie usa como `mask-image` sobre un `background-color: currentColor`: el mismo archivo sale blanco en el tema
oscuro, azul marino en el claro y del color de acento al pasar el mouse. La alternativa obvia —el SVG adentro del
HTML— salía cara: los dos escudos pesan ~50 KB cada uno y se hubieran repetido en las 27 páginas. Como archivo, el
navegador lo baja una vez. Tres cosas que hacen falta para que la máscara no falle: ancho y alto explícitos desde la
proporción del archivo (`src/lib/institucional.ts` la lee del viewBox o de las medidas del PNG), `print-color-adjust:
exact` (al imprimir los fondos se omiten y el logo saldría en blanco) y `forced-color-adjust: none` con `LinkText`
para el alto contraste de Windows. Y el archivo tiene que ser **de un solo color, sin blancos ni opacidades**: la
máscara toma la forma, no el color (lo guarda `tests/lib/institucional.test.ts`).

**Trampa al sacar logos de un PDF: la precisión de svgo rompe las letras.** El texto de los logos sale como glifos
definidos en unidades de «em» (entre 0 y 1) y reusados con `<use>`. Con `floatPrecision: 1` el escudo queda
perfecto, pero las letras se deforman («Vialidad» salía con huecos), porque 0,1 em es una letra entera. Con 2 o 3
decimales quedan bien, y el peso casi no cambia: lo pesado es el escudo, no el texto. **Segunda trampa**: los SVG
arrastraban el sello de firma de la página del PDF («IF-2025-… · Página 9 de 22») como glifos lejos del logo —el
borrado por zona de PyMuPDF no los tocó—; no se veían, pero eran el 20 % del peso. Se filtran los `<use>` cuya
posición cae fuera del recorte (lo guarda `tests/lib/institucional.test.ts`). **Tercera**: Vite mete como `data:`
adentro de la página todo asset de menos de 4 KB, también con `?url`; para que los cuatro logos sean archivos
cacheables, el glob usa `?url&no-inline`. Y el hover no les cambia el color (el manual los admite solo en azul, negro o
blanco): se aclaran un poco.
