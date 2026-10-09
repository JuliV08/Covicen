# Fase A · Encabezados centrados, títulos con degradé y fuera la grilla animada

**Fecha:** 5 de octubre de 2026 · **Rama:** `web-detalles-2026-10-05` · **Para:** antes del lanzamiento del 7/10.

Primera de tres fases de la tanda estética del 05/10. Las otras dos quedan fuera de este documento:
**B**, el borde de abajo del hero (la cinta de avisos rediseñada y sin botón de pausa, y el separador con el
isotipo), y **C**, el mapa interactivo nuevo (más grande, con el vehículo que recorre la ruta).

## Qué se busca

Que la web se vea premium y cara, distinta de Corresur, **sin perder nada de usabilidad ni accesibilidad**,
sobre todo para el que está en la ruta con el celular y necesita algo urgente. Esta fase trata lo que se ve en
todas las páginas: cómo se presentan el título y la bajada de cada sección, y el fondo que tienen detrás.

Lo que dijo Juli:
- «Todo el contenido actualmente flota hacia la izquierda […] quedaría mejor si estuviera centrado».
- «El background que agregamos de 21st […] en modo claro molesta a la hora de leer la descripción de cualquier
  sección, hay que dar una vuelta de tuerca al diseño, tanto de los títulos como de las descripciones».
- Para los títulos propuso el GradientText de reactbits «con los colores de Covicen y una animación sutil para no
  sobresaturar».
- «Me acaban de pedir también que saque el background grid animado que sigue al mouse». El reemplazo lo busca
  Juli en 21st; no es parte de esta fase.

Decisiones tomadas en la conversación:
- **El hero de la home queda a la izquierda.** En la foto la ruta se va hacia la derecha: el texto a la izquierda
  equilibra la imagen y le da al hero su lugar de tapa.
- **En las páginas internas, todo centrado, migas de pan incluidas.**
- **Todos los títulos llevan el degradé; solo se mueve el título principal de cada página.**

## 1 · Alineación

- **El encabezado de `Seccion` va centrado**: la etiqueta chica (eyebrow), el título y la bajada, en una columna
  centrada (`mx-auto`, `text-center`). Es el único componente que arma encabezados en 46 lugares del sitio, así que
  el cambio vive ahí.
- **La etiqueta chica centrada lleva una línea a cada lado** («── EL TRAMO ──»). Hoy lleva una sola, a la
  izquierda. `Eyebrow` suma la variante centrada; la de una línea sigue para el hero, que queda a la izquierda.
- **Las migas de pan van centradas** (`Breadcrumbs`).
- **Los bloques sueltos al final de una sección** (un botón solo, como «Ver el tramo en detalle», una nota corta,
  un enlace) pasan al centro. El plan los enumera uno por uno recorriendo los 46 usos de `Seccion` y los
  encabezados armados a mano (por ejemplo el de Contacto de la home, que hoy es una fila con el texto a la izquierda
  y los botones a la derecha, y pasa a una columna centrada).
- **Grillas de tarjetas, tablas y textos largos** (Privacidad, preguntas frecuentes, la guía de trámites) quedan como
  bloque centrado en la página, **con el texto alineado a la izquierda adentro**: un párrafo largo centrado se lee
  peor, y eso pesa más que la simetría.
- **Escape para las excepciones**: `Seccion` acepta `alinear="izquierda"` para el caso que no funcione centrado. El
  plan dice cuáles, si hay alguno, y por qué.
- **El hero de la home no cambia de alineación.**

## 2 · Títulos con degradé

- **El degradé va del color del texto al azul de la marca y vuelve**: `linear-gradient(texto → acento → texto)`.
  En tema oscuro eso es del blanco azulado (#E8EEF5) al celeste de la marca (#68BCE1); en tema claro, del navy del
  texto (#16304E) al azul de la marca (#2C688F). Adentro de las tarjetas y paneles oscuros del tema claro, los dos
  tokens ya cambian solos (`.zona-noche`, `.bloque-oscuro`), así que el degradé sigue al color de lo que tiene debajo.
- **No hace falta ningún color nuevo**: `texto` y `acento` ya están medidos contra `fondo`, `fondo-2` y `superficie`
  en los dos temas (`scripts/lib/pares.ts`). Los colores intermedios del degradé caen entre esos dos, que en cada tema
  son los dos claros o los dos oscuros.
- **Todos los títulos** (`h1` y `h2` con estilo de título) llevan el degradé, **quieto**. Quedan afuera los `h2` con
  estilo de etiqueta (los del pie, `.eyebrow`) y los que no se ven (`.sr-only`). Los `h3` de las tarjetas no cambian.
- **Solo se mueve el título principal de cada página**, el `h1` (el sitio tiene uno solo por página: lo controla
  `verificar.ts`). La animación es lenta y de ida y vuelta (unos 10 segundos por recorrido): la franja de azul
  recorre el título.
- **Puro CSS**: `background-clip: text` con `background-position` animado. Nada de React ni de librerías: el
  componente de reactbits usa React y `motion`, y el sitio no tiene React. Peso de JavaScript agregado: cero.
- **El degradé abarca el ancho del texto, no el de la caja** (`width: fit-content`), para que un título corto
  muestre el degradé entero. Centrado con `margin-inline: auto`; a la izquierda en el hero.
- **Accesibilidad, sin excepciones:**
  - Con «reducir movimiento» del sistema, el `h1` queda quieto.
  - Con el modo de alto contraste de Windows (`forced-colors`), sin degradé: el título va en el color del sistema.
  - Al imprimir, color pleno (`impresion.css`).
  - El texto seleccionado de un título se tiene que poder leer.
  - **Sobre la foto (el `h1` del hero y el de la portada de «Próximamente») no va el azul**: medido con
    `tests/styles/hero-foto.test.ts`, el `acento` sobre el velo de la foto queda entre 1,65 y 2,7:1 en tema claro y
    en 2,05:1 a 1023 px en oscuro (el mínimo para un título es 3:1); una mezcla a mitad de camino entre texto y
    acento tampoco pasa a 1023 y 1024 px. Ahí la franja que recorre el título es un **barrido de brillo hacia más
    contraste**: de `texto` a `--color-titulo-brillo` y vuelta, que es blanco (#FFFFFF) en tema oscuro y un navy más
    profundo (#0B1526) en tema claro. Se lee siempre igual o mejor que hoy. Lo decidió Juli el 05/10, con la medición
    a la vista. `hero-foto.test.ts` suma ese color al `h1` de las dos cajas, en los dos temas.

## 3 · Bajadas

- Centradas, en una columna de ancho cómodo (`max-w-2xl`, unos 65 caracteres por renglón), un poco más grandes que
  hoy en escritorio, y sin una palabra sola en el último renglón (`text-wrap: pretty`).
- El color no cambia: `texto-2` ya cumple 4,5:1 en los dos temas. Lo que molestaba en el tema claro eran las líneas
  de la grilla animada pasando por detrás del texto, y la grilla se va (punto 4).

## 4 · Fuera la grilla animada

- Se van `GrillaCinetica.astro`, `scripts/grilla-cinetica.ts`, sus estilos y sus menciones (el presupuesto de
  `tests/presupuesto.test.ts`, la hoja de impresión), de `Seccion` y del bloque de Contacto de la home.
- Las secciones con fondo alternado **conservan** el tono (de `fondo` a `fondo-2` y vuelta) y las costuras con la
  marca vial del medio: así se siguen distinguiendo una de otra. La clase `.seccion-cinetica` pasa a llamarse
  `.seccion-tono`, que es lo que es ahora, en los cinco archivos que la nombran (incluido
  `tests/components/contacto-telepase.test.ts`).
- **La luz suave que sigue al cursor en el hero queda**: no es la grilla, no pasa por detrás de ningún texto de
  sección, y no la pidieron sacar.
- **El fondo que traiga Juli de 21st** entra después, en su propio cambio, y solo si cumple: nada que se mueva por
  detrás del texto, y el contraste del texto medido contra lo que quede debajo.

## 5 · Mapa: dos arreglos chicos

- El rótulo «RN 19» queda tapado por el de Franck: hoy va en el medio del segmento Franck → empalme, a 45 unidades
  de la estación.
- «Santa Fe» se monta sobre Franck y la punta de la RN 19: va a la izquierda de la ciudad, que es justo donde está
  la estación.
- **Solo se mueven esos rótulos**, dentro del dibujo actual; las coordenadas de ciudades y estaciones no se tocan (son
  un contrato con el panel del backend). Requisito, que el test verifica con geometría: ningún rótulo de ruta o de
  ciudad se superpone con el halo de una estación (radio 19) ni con el rótulo de una estación, y todos quedan dentro
  del dibujo (820 × 520). El plan propone la regla (por ejemplo, el rótulo de ruta en el medio del segmento más largo
  del trazado) y comprueba que no mueva mal los de RN 9 y RN 34.
- El rediseño del mapa es la fase C.

## Verificación

- Tests de cada punto: encabezado centrado y su escape; etiqueta con dos líneas; migas centradas; la regla del
  degradé en `global.css` y sus exclusiones; la animación solo en `h1` y apagada con «reducir movimiento»;
  alto contraste e impresión; ningún rastro de la grilla en el sitio armado; los rótulos del mapa.
- `pnpm check`, `pnpm test`, `pnpm verificar` y, al final, `pnpm verificar:portada`.
- Medición automática de desbordes en todas las páginas, de 320 a 1440 px, en los dos temas, con Chrome sin ventana
  **en modo escritorio** (`mobile: false`: en modo celular Chrome agranda la pantalla hasta que el contenido entre y
  esconde el desborde).
- Revisión aparte con rev-bro.
- Sin pruebas visuales durante la ejecución. Al cierre, la guía de revisión con qué mirar a mano.

## Fuera de esta fase

- La cinta de avisos y el separador con el isotipo (fase B), el mapa nuevo (fase C) y el fondo de 21st.
- Cualquier cambio de texto: esta tanda es estética.
