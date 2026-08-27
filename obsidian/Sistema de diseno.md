# Sistema de diseño

Concepto rector, tokens, tipografía, movimiento. Fuente completa: spec §6. Ver [[Decisiones de arquitectura]] · [[Home]].

## Concepto: "La ruta, de noche"

El sitio es el corredor visto de noche. Navy profundo (asfalto y cielo); **la ruta como hilo luminoso celeste** que une todas las páginas (se dibuja en el hero, acompaña el scroll en el margen, es el trazo del mapa con las **cabinas como balizas**); lo práctico habla en **señalética** (amarillo vial, Archivo 800, mayúsculas); los números grandes son **mojones** (tabulares, enormes, unidad chica). Registro tech: grilla de plano tenue, esquineros finos, índices `01 / 09`, glow solo en el hilo y las balizas. Sin glassmorphism, partículas, cursor custom ni scroll-jacking. Cero emojis.

Dos líneas rojas de Juli: navegación intuitiva y directa (la tarifa a un clic) y nada de sobre-animación.

## Tokens (`src/styles/tokens.css`, `@theme` de Tailwind 4)

**Marca** (manual, fijos; no usar en componentes): `marca-900 #1E4870` · `marca-700 #2C688F` · `marca-500 #4A92BA` · `marca-300 #68BCE1` · `gris-texto #5A6472` · `gris-fondo #EEF1F4` · `vial #F0C419`.

**Semánticos, tema oscuro** (los que usan los componentes): `fondo #0B1526` · `fondo-2 #10203A` · `superficie #16304E` · `superficie-2 #1E4870` · `texto #E8EEF5` · `texto-2 #A9C4D8` · `texto-3 #8593A0` (solo sobre fondo/fondo-2) · `acento #68BCE1` · `acento-hover #8FCDE8` · `vial #F0C419` · `error #FF8A80` · `borde rgba(255,255,255,.10)` · `borde-fuerte .18` · `glow rgba(104,188,225,.35)`.

Contraste AA verificado por test (`tests/styles/tokens.test.ts`) para cada par usado. Par sabido que NO cumple: `acento` sobre `superficie-2` (4.4) — no usar para texto normal.

Modo claro futuro: redefinir solo la capa semántica bajo `[data-tema="claro"]`.

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

## Assets propios

Isotipo vectorial extraído del PDF (`scripts/extraer-isotipo.py` → `src/assets/marca/isotipo.svg` + `isotipo-path.ts`), mapa esquemático del tramo (`MapaTramo.astro`, coordenadas en `tramo.json`), ilustración del hero (`HeroRuta.astro`), familia de íconos de categoría de vehículo (`IconoVehiculo.astro`), imagen OG generada en build con resvg y las TTF de Archivo (`scripts/generar-og.ts`). Imágenes fotográficas opcionales: `docs/marca/prompts-imagenes.md`.
