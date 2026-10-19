# Fase C · El mapa nuevo: más grande, terminado como un mapa profesional, y con el auto que viaja

**Fecha:** 5 de octubre de 2026 · **Rama:** `web-detalles-2026-10-05` (worktree `C:\Users\Villex\dev\Covicen-detalles`).

## Qué se busca

El mapa interactivo de la home y de El tramo, rediseñado: **más grande** (el dibujo de las rutas, no la tarjeta que lo
contiene), **legible**, y con **un detalle llamativo**: un auto que viaja rápido por las rutas hasta la estación que se
toca. La vara (Juli, 05/10): «debe verse premium y caro, nada de líneas cortadas o dibujos SVG "así nomás", hay que
hacerlo profesional y llamativo, obvio sin ser un show de luces».

Decisiones tomadas en la conversación:
- **Vuelta en U**: si la estación queda para atrás, el auto dibuja una U al costado de la ruta y sale de frente. Nunca
  marcha atrás.
- **Auto visto desde arriba**, chico y limpio, blanco con detalles en el azul de la marca y faros suaves.
- **El mapa a todo el ancho del panel, encuadrado sobre las rutas, con la ficha flotando** en la compu; en el celular,
  la ficha debajo.
- **Ficha flotante compacta**: la ficha completa (unos 350 × 330 px) no entra en ningún hueco del dibujo sin tapar la
  RN 9 o James Craik. La flotante lleva ruta y km, nombre, estado, servicios y los enlaces (cuadro tarifario, ficha
  completa, asistencia, 140 y 0800); «Vías» y «Sentido» quedan en la página de la estación. En el celular, la ficha
  completa, como hoy.
- **Dónde flota**: arriba a la izquierda, en el hueco entre Córdoba y San Francisco, por encima de la RN 9 (unos
  330 × 320 px a 1280 de pantalla). Abajo a la izquierda, que fue lo que se mostró primero, el hueco tiene unos 250 px
  de ancho: no entra.

Lo que no cambia: las coordenadas de ciudades y estaciones (`mapa` en `src/content/tramo.json`, contrato con el panel
del backend), los estados (verde operativa, amarillo próxima), la leyenda, los incidentes del estado de la traza (hoy
escondido) y que sin JavaScript cada estación sea un enlace a su página y todas las fichas estén a la vista.

## 1 · El dibujo

- **Encuadre**: el `viewBox` deja de ser el lienzo fijo de 820 × 520 y pasa a ser la caja que contiene todas las
  rutas, estaciones, ciudades y rótulos, con un margen. Lo calcula una función pura (`encuadreDelMapa` en
  `src/lib/tramo.ts`). Las coordenadas no se tocan; cambia solo qué parte del lienzo se muestra.
- **Fondo limpio**: se va la grilla cuadriculada (`mapa-plano`). Queda un degradé radial apenas perceptible con los
  tokens del tema.
- **Rutas**: una cinta continua en tres capas, sin trazos discontinuos:
  - un halo muy suave (el `glow` del tema, desenfocado, baja opacidad);
  - el cuerpo de la ruta, como asfalto (un tono de superficie);
  - un filo de luz fino en el `acento`.
  En cada pueblo la cinta dobla con una curva redondeada (`trazoRedondeado`), no quebrada. Se van las marcas viales
  que fluyen (`marcas-vivas`) y la luz que recorre la ruta en loop (`luz-viaja`): lo único que se mueve es el auto. Se
  queda el dibujo de las rutas al entrar en pantalla (`dibujar`), que pasa una sola vez.
- **Estaciones**: anillos concéntricos nítidos, del mismo tamaño en todas. **Operativa**: punto lleno verde con anillo.
  **Próxima**: anillo amarillo con el centro hueco, para que se distinga por la forma y no solo por el color (antes era
  un anillo discontinuo). El halo ya no late todo el tiempo: late una vez cuando el auto llega.
- **Rótulos**: el de cada estación va sobre una placa sutil (fondo del panel, borde fino, esquinas redondeadas) para que
  se lea siempre igual, pase lo que pase por detrás. Las placas usan las cajas de `rotulosDelMapa`, que ya calcula dónde
  va cada texto sin pisarse. Ciudades: punto fino y nombre en un peso más liviano.
- **Tamaños de letra**: con el mapa más grande, las letras se ajustan para verse entre 13 y 16 px en la compu. En
  pantallas angostas los rótulos de estación siguen escondidos salvo el de la elegida, como hoy.

## 2 · El auto

- **Dibujo**: un auto visto desde arriba, hecho con cuidado: carrocería con un degradé leve (de `sobre-marca` hacia un
  gris claro), parabrisas y luneta oscuros, el brillo del techo, faros con un cono de luz que se desvanece hacia
  adelante, y una sombra suave debajo. Unas 22 × 11 unidades del dibujo, en proporción al ancho de la ruta. Solo con
  tokens de color (la guarda `colores-fijos` no admite colores escritos a mano).
- **Al cargar**: estacionado en la primera estación operativa, mirando hacia donde sigue su ruta.
- **Al elegir una estación**: la ficha cambia en el acto (no espera al auto) y el auto viaja por el camino más corto de
  la red de rutas (`caminoEntre`: la RN 9 y la RN 34 se juntan en Rosario; la RN 34 y la RN 19, en el empalme). El viaje
  sigue las mismas curvas redondeadas de la cinta, dura entre 0,5 y 2 segundos según la distancia, y arranca y frena
  suave. El auto gira de forma continua con la ruta, sin saltos de ángulo.
- **Vuelta en U**: si el primer tramo del viaje va en contra de hacia dónde mira el auto, antes de salir hace una U
  chica (un arco limpio) por el costado derecho de la ruta.
- **Al llegar**: el halo de la estación se abre una vez.
- **Toques en pleno viaje**: el auto termina el tramo en el que está y de ahí toma el camino a la nueva estación.
- **Con «reducir movimiento»**: el auto aparece en la estación elegida, sin viajar, y el halo no late.
- **Accesibilidad**: el auto es decorativo (`aria-hidden`, sin eventos de puntero). Todo lo que comunica el mapa sigue en
  las estaciones, la leyenda y la ficha.
- **Rendimiento**: el auto solo se anima cuando se elige una estación (requestAnimationFrame mientras dura el viaje);
  quieto el resto del tiempo. Las cuentas del camino y de la curva viven en funciones puras de un módulo propio,
  `src/lib/red.ts`, sin dependencias: `src/lib/tramo.ts` importa el esquema de datos (zod) y, si el script del navegador
  lo usara, se llevaría el validador entero. El script del mapa (`src/scripts/mapa.ts`) usa `red.ts` para mover el auto. El JavaScript sumado tiene que entrar en el
  presupuesto de `tests/presupuesto.test.ts`.

## 3 · La ficha y el lugar

- **Compu grande (≥ 1280 px)**: el mapa ocupa todo el ancho del panel. La ficha de la estación elegida flota arriba a
  la izquierda, en el hueco entre Córdoba y San Francisco por encima de la RN 9: panel opaco con el borde de luz de las
  tarjetas del sitio y una sombra profunda. Versión compacta: sin «Vías» ni «Sentido» (se esconden por CSS en ese modo;
  el marcado es el mismo). Desde 1280 y no desde 1024: medido el 05/10, a 1024 el hueco queda en unos 260 × 210 px y la
  ficha compacta (unos 300 × 250) no entra; a 1280, unos 330 × 270.
- **Por debajo de 1280 px (compu chica, tablet y celular)**: el mapa a todo el ancho y la ficha completa debajo.
- **Requisito**: a 1280 y 1440 px de pantalla, la ficha flotante no tapa ninguna ruta, estación ni rótulo. Lo fija un
  test de geometría y se controla con capturas durante el armado.

## Verificación

- Tests de las funciones puras: el grafo de la red, `caminoEntre` (Carcarañá → Leones directo; Carcarañá → Franck por
  Rosario, Totoras y el empalme; James Craik → San Francisco por Leones, Carcarañá, Rosario, Totoras y el empalme),
  `trazoRedondeado`, `encuadreDelMapa` (contiene todo con margen) y la detección de la vuelta en U.
- Tests del componente: sin grilla ni trazos discontinuos ni luces en loop; el auto `aria-hidden`; próxima con centro
  hueco; placas detrás de los rótulos; la ficha compacta esconde vías y sentido solo en el modo flotante.
- La guarda de legibilidad (`tests/styles/legibilidad.test.ts`) se recalcula con el ancho y el encuadre nuevos.
- Capturas propias durante el armado para controlar la terminación (no son tests): compu y celular, los dos temas,
  antes y después de elegir estaciones.
- Juli lo mira en Pages.

## Fuera de esta fase

- El estado de la traza en vivo (sigue escondido; si vuelve, sus marcadores se adaptan al estilo nuevo).
- Cualquier cambio de texto o de datos.
