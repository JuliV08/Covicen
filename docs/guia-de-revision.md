# Guía de revisión — web de Covicen

**Al día al 20 de septiembre de 2026.** Empezá por «Lo que cambió el 20 de septiembre», que es la tanda más nueva; lo que sigue después es el estado de septiembre, con un aviso en cada pantalla que cambió.

Todo lo de la rama `web-actualizacion-2026-09` (Fases 0 a 6 del plan `docs/superpowers/plans/2026-09-13-actualizacion-web.md`, más la **revisión final del 14 y 15 de septiembre**) se hizo **sin pruebas visuales**: esta guía es la lista de lo que hay que mirar a mano, pantalla por pantalla, más lo que quedó oculto a propósito y cómo cargarlo.

**Cómo levantarlo:** `pnpm dev` → http://localhost:4321/ (con `.env` copiado de `.env.example` y `PUBLIC_BASE_PATH=/`; sin `.env` también anda). Para verlo en el celular, `pnpm dev --host` y la IP que imprime. **Ojo con Asistencia:** el celular solo entrega la ubicación en sitios con HTTPS (o `localhost`), así que por `http://IP` el botón "Obtener mi ubicación" no va a funcionar; probalo en la compu (localhost vale) o en la URL de Pages después del deploy.
**URL de Pages:** https://juliv08.github.io/Covicen/ (se publica al pushear a `main`; el push lo decidís vos).

**Lo que ya verificó la máquina** (no hace falta mirarlo), al cierre de la revisión final: `astro check` sin errores (160 archivos); **434 tests** en 48 archivos; `pnpm verificar` sobre las 30 páginas: links internos, un solo `<h1>`, `description`, `canonical`, JSON-LD, `tel:140` en toda página, textos prohibidos ausentes ("a confirmar", "Corredor Vial del Centro", "681"), 679 km en la home y en El tramo, "Última actualización" en el pie, `noindex` según entorno, `alt` en toda imagen, sin emojis, HTML válido (html-validate), `target=_blank` con `noopener`, **ningún `href` con un esquema raro** (ni `javascript:` ni `data:`), contraste 4,5:1 de todos los pares en los dos temas, hoja de impresión emitida, **JS 6,3 KB gz** (tope 30). Lo que sigue es lo que un script no puede juzgar: cómo se ve y cómo se siente.

**Navegadores:** lo atado a scroll-driven animations (dibujo del mapa al scrollear, parallax del hero, fondo del header) anda en Chrome, Edge y Safari; en Firefox estable aparece ya dibujado o fijo.

**Si tenés "reducir movimiento" activado en Windows** (Configuración › Accesibilidad › Efectos visuales): todo queda estático, **la cinta de avisos no desfila** (se recorre a mano, de costado) y el botón de pausa ni aparece, porque no hay nada que frenar. El cambio de tema también es instantáneo, sin la disolvencia. Si no usás esa opción, ignorá este punto.

---

## Lo que cambió el 20 de septiembre — mirá esto primero

Es la tanda que salió de la call con el gerente. Está en la rama `web-ajustes-2026-09-20`, **sin push**: para verlo,
`git switch web-ajustes-2026-09-20` y `pnpm dev`.

La idea de fondo de toda la tanda: **lo que no está confirmado no se publica con salvedades, se esconde.** Qué quedó
escondido, qué hay que ir a preguntar y a quién está en
**`C:\Users\Villex\dev\Covicen\docs\pendientes-de-confirmacion.md`**, que es el papel que le llevás al gerente.

**El sitio pasó de 30 páginas a 27**: se fueron `/obras/` (escondida) y `/trabaja-con-nosotros/` (eliminada), y
además se despublicó una novedad que hablaba de obras.

### 1 · El menú, en pastillas

Cada opción del menú ahora va en su propia pastilla, con fondo sólido y un borde finito. **No es solo estético:** el
fondo del header es traslúcido y se va opacando con el scroll, así que las letras del menú caían sobre la foto del
hero y, en **tema claro**, quedaban en 2,22 de contraste cuando el mínimo exigido es 4,5. Con la pastilla, el menú se
apoya en su propio fondo y deja de depender de lo que pase por detrás.

- **Qué mirar:** poné el **tema claro** (el sol/luna arriba a la derecha), parate en la portada y **scrolleá despacio**
  los primeros centímetros. El menú tiene que leerse en todo momento. Probá también en tema oscuro.
- El **vidrio esmerilado del header quedó igual**: no se tocó ni el color ni la animación.
- El logo y el botón del 140 **no** llevan pastilla: se midió y ya se leían bien (4,95). El 140 ya era una pastilla.
- En el celular, la hamburguesa también quedó redonda con fondo, para que la barra tenga un solo idioma.

### 2 · La portada, en cinco secciones

Quedó: **foto y título → los cuatro botones de acceso → El tramo con el mapa → novedades → cierre de contacto.**
Nada más.

- Se fueron de la portada: la tarifa destacada, obras, servicios, el consorcio y las preguntas frecuentes. **Siguen
  existiendo en sus páginas**, a las que se llega por el menú.
- El mapa interactivo **ya estaba** en la portada desde septiembre: no hubo que moverlo.
- El texto de la sección El tramo pasó a ser el mismo que el gerente dio por perfecto en la página El tramo.
- **Lo que falta:** el título y el párrafo grandes de la portada **todavía no se cambiaron**. Están esperando que
  elijas entre las opciones. Hasta entonces siguen los de antes.

### 3 · Obras: escondida, no borrada

- **`/obras/` no existe en el sitio publicado.** No es que no esté enlazada: no se genera. Si la escribís a mano en
  el navegador, no está. Esto es a propósito: una página viva sin enlaces la indexa Google igual.
- Salió del menú de arriba y del pie.
- Se barrieron las menciones a obras de la portada, de Quiénes somos, de una pregunta frecuente y de una novedad.
- La novedad que *era* la página de obras se despublicó entera.
- **Todo el contenido sigue en el repo** y vuelve cambiando un `false` por un `true`.

### 4 · Trabajá con nosotros: eliminada

Pedido explícito: «directamente sacarlo». Se fue la página, el ítem del menú, el del pie y la pregunta frecuente que
la nombraba, que ahora habla solo de proveedores.

### 5 · Proveedores subió al menú

Estaba solo en el pie. Ahora está en el desplegable **Nosotros**, arriba, y también en el menú del celular.

### 6 · Free Flow: fuera de toda la web

«No está asegurado que sea de esa manera y no se sabe cómo va a ser».

- Leones, San Francisco y Totoras ahora dicen **«Próxima»** a secas, en el mapa, en las tarjetas y en su página.
- Se fue la sección «Free Flow» de Medios de pago y la pregunta frecuente que lo explicaba.
- **Qué mirar:** buscá «Free Flow» en cualquier página. No tiene que aparecer en ningún lado.

### 7 · Tarifas: queda el cuadro, se esconde lo que no está certificado

- **Queda tal cual** lo que pediste mantener: el cuadro tarifario por estación, con el precio de cada categoría en
  Carcarañá, James Craik y Franck. Y **las dos tarjetas de discapacidad y Malvinas**, que marcaste dos veces.
- **Se escondieron enteras** (ni el título, ni los números): descuentos por frecuencia, tarifa diferencial, qué pasa
  si pasás sin pagar, exceso de carga y las categorías futuras.
- **Exenciones quedó más corta**: las ocho viñetas de vehículos se agruparon en tres líneas. No se sacó ninguna
  categoría, se dicen en menos renglones.
- Los tres botones del final (Cómo pagar · Dónde están los peajes · Preguntas frecuentes) **siguen**: vivían adentro
  de una sección que se escondió y se mudaron afuera.
- **Qué mirar:** que los números del cuadro estén completos y que no haya quedado ningún porcentaje ni recargo suelto
  en la página.

### 8 · El tramo: sin cuadros repetidos y sin áreas de descanso vacías

- Se fue la sección **«Cuadros tarifarios»**: era reiterativa, eso vive en Tarifas. Queda un botón que lleva ahí.
- Se fue **«Áreas de descanso y servicios»**: lo único cargado era «tiene área de descanso» y «grúa gratuita», igual
  para las tres estaciones, que no responde qué hay de verdad (baños, agua). Vuelve cuando exista el dato.
- **La sección 01 no se tocó**, salvo la cita al pliego.
- La barra de anclas de arriba ahora tiene **dos** ítems en vez de cuatro.

### 9 · Guía de trámites: ahora guía

Cada trámite dice **qué es · qué necesitás · cómo se hace**, en ese orden, con la documentación **antes** de los
pasos. Y solo están los que tienen fuente oficial verificable.

**Ojo, esto es importante:** al ir a la fuente oficial aparecieron **dos trámites mal publicados**.

- **Exención por discapacidad:** decíamos «presentás la solicitud ante Vialidad Nacional según su reglamento». El
  trámite real es **100 % digital por la app Mi Argentina** y pide el **Símbolo Internacional de Acceso vinculado al
  dominio**, que no nombrábamos. Alguien pudo haber ido a una oficina al pedo. Ya está corregido, y ahora enlaza
  directo al trámite oficial (antes no tenía enlace).
- **Exención de ex combatientes de Malvinas:** pedíamos certificado de veterano, cédula del vehículo y TelePASE. El
  trámite real es **una declaración jurada más copia del DNI, por correo a atencionalusuario@vialidad.gob.ar**. Ya
  está corregido.
- **TelePASE quedó más corto a propósito:** su sitio oficial no publica qué documentación piden, y no se inventa. Va
  a pendientes.
- Los dos trámites de tarifa diferencial se escondieron: mandar a alguien a juntar papeles para un beneficio que
  capaz no existe es peor que no decir nada.

### 10 · Fuera las citas del pliego

Ninguna página le cita el pliego al usuario. Donde decía «(PETG art. 52)» o «según el pliego», ahora dice «el
contrato de concesión». **La única excepción es Transparencia**, donde la normativa es el contenido.

**Hallazgo del camino, que conviene saber:** la guarda marcó las 27 páginas, incluidas Privacidad y Proveedores, que
no hablan de tarifas. La causa era un comentario interno nuestro en el código del header. **Los comentarios escritos
en formato HTML se publican al navegador**, así que esa nota venía viajando en todas las páginas del sitio. Ya no.

### 11 · Tono institucional

Se reescribieron los títulos que sonaban a folleto. Por ejemplo: «Vamos a comprar mucho. Queremos comprar bien.» →
«Registro de proveedores.» · «Somos quienes van a cuidar las rutas del centro.» → «La concesionaria del Tramo
Centro.» · «Qué te da el peaje, y qué se cobra aparte.» → «Servicios al usuario.»

**No se tocó** la sección 01 de El tramo ni Contacto, reclamos y sugerencias, que ya diste por buenos.

### Cómo volver a mostrar algo que está escondido

Abrís **`C:\Users\Villex\dev\Covicen\src\lib\publicado.ts`**, buscás la línea de la sección y cambiás su `false` por
`true`. Nada más: la sección vuelve entera y los números de sección se reacomodan solos. Cuál es cuál y qué dato hace
falta antes está en `C:\Users\Villex\dev\Covicen\docs\pendientes-de-confirmacion.md`.

## La portada de «Próximamente» (19 de septiembre) — mirá esto primero

Es **lo único que ve el público** hasta que salga la primera versión, así que es lo primero a revisar.

**Cómo verla:** `pnpm verificar:portada` y después abrí `dist/index.html`. Con `pnpm dev` **no** la ves: tu `.env` tiene `PUBLIC_SITIO_COMPLETO=true` y te muestra el sitio entero, que es lo que querés para todo lo demás.

Qué mirar:

- [ ] Se lee **PRÓXIMAMENTE** grande, con la marca arriba y la foto de la ruta atrás, **quieta** (sin parallax ni movimiento: se sacó a propósito).
- [ ] El texto se lee bien **sobre la foto**, en la compu y en el celular. Va a la izquierda, no centrado: el velo del hero tapa fuerte de ese lado y casi nada del otro.
- [ ] El botón amarillo del **140** se ve y al tocarlo abre el marcador del teléfono.
- [ ] **No hay menú, ni pie, ni cinta de avisos, ni nada clickeable que lleve a otra página.** Es una pantalla sola.
- [ ] Si tenés el tema claro guardado de antes, la pantalla sale clara y con la foto de día. No hay interruptor de tema acá: se respeta lo que hayas elegido antes.
- [ ] Dice los **679,03 km** y desde cuándo opera. No dice ningún 0800 (todavía no existe).
- [ ] Abajo de todo, la franja con la fecha de última actualización va sobre **fondo sólido**, no sobre la foto (sobre la foto no llegaba al contraste que pide el pliego).

Lo que ya verificó la máquina sobre este modo: que en el build quede **una sola página** (más su copia como 404), que el sitemap liste una sola URL, que el `robots.txt` esté cerrado, que la portada conserve el `tel:140`, que **no enlace a ninguna página despublicada** y que la poda no se haya llevado ni dejado de más ningún archivo que la portada usa. También el **contraste real del texto sobre la foto**, medido píxel a píxel en once tamaños de pantalla y en los dos temas: la portada tiene su propio velo (`.velo-portada`) porque su caja es más alta que la del hero y la foto se recorta distinto. Corre en CI antes que la verificación del sitio entero.

**Para que producción la muestre** no alcanza con pushear: hoy el sitio no sale de git. Hay que pedirle a infra que baje `main`, vuelva a subir e **invalide la cache de CloudFront**. Ver `README.md`, «Cómo se publica hoy».

**Para volver al sitio completo**, una sola cosa: `PUBLIC_SITIO_COMPLETO=true` donde se buildee. No hay nada borrado.

---

## Lo que cambió en la revisión final (14 y 15 de septiembre) — mirá esto primero

Después de cerrar las seis fases se revisó todo de punta a punta, sección por sección de la spec, y los hallazgos se aplicaron en tandas; la última es la del 15 de septiembre. Antes de tocar nada, cada hallazgo pasó por tres lentes que trabajan por separado: una intenta refutarlo, otra chequea si lo que pide está escrito en la spec o en el pliego, y otra calibra qué tan grave es y si el arreglo no rompe otra cosa. Uno se descartó con ese filtro (abajo, en «Lo que se revisó y se dejó como estaba»). Lo que sigue es lo nuevo respecto de lo que ya habías visto; cada punto está explicado en su pantalla, más abajo.

| Dónde | Qué cambió | Lo que hay que mirar |
|---|---|---|
| `/asistencia/` | **El cambio más grande.** Los campos del formulario ahora se escriben (antes estaban grises y bloqueados) y hay un botón "Armar el texto para copiar" que deja el mensaje completo a la vista. | Cargá los datos, pedí la ubicación y armá el texto. Pegalo en WhatsApp o en las notas. |
| Todos los formularios | Los desplegables arrancan en "Elegí una opción" y marcan error si no los tocás. Antes se mandaba la primera opción sin que la hubieras elegido. | Mandá uno vacío y mirá el error en rojo. |
| `/privacidad/` | Sección nueva **"Ubicación"**. | Leela y decí si te cierra cómo está redactada. |
| Hero de la home | **Ya no rota**: el carrusel que alternaba el título con las novedades destacadas se sacó. La primera pantalla dice una sola cosa y la dice quieta. | Quedate mirando el hero medio minuto: no se tiene que mover nada más que la foto. Las destacadas siguen estando, más abajo, en Novedades. |
| Cinta de avisos | Los avisos salieron de la barra de arriba del navbar y ahora **desfilan en una cinta**, con la etiqueta amarilla fija a la izquierda. En la home va pegada al borde de abajo del hero; en el resto de las páginas, arriba del contenido. | Mirala desfilar; pasale el mouse por encima (se frena); tocá el botón de pausa de la derecha; entrá a un aviso. |
| Tarjetas en tema claro | **El cambio más grande de esta tanda.** El fondo de la página sigue claro y las tarjetas, las tablas y los paneles pasan al **negro del marco del backoffice** (`#0F1A29` la tarjeta, `#070E18` el fondo del panel). La primera versión usó el navy del tema oscuro y quedó azul: el interior arrancaba en `#17334F`, que al lado del papel se lee celeste. | Prendé el tema claro y recorré la home, /tarifas/ y /el-tramo/. Tiene que leerse como negro, no como azul. |
| `/el-tramo/` | Cartel **"DATOS DE EJEMPLO"** arriba del mapa; bloque "Estado de la traza" debajo; cada severidad con su forma (triángulo / rombo / círculo); letras del mapa más grandes. | Que el cartel se vea bien: abajo hay un corte inventado en la RN 34. Que ningún nombre del mapa se pise. |
| `/tarifas/` | Bloque nuevo **"Exceso de carga" (05)**; el de categorías futuras pasó a 06 y cambió de fondo. | Que ninguna sección quede con el mismo fondo que la de al lado. |
| Home (tarjeta que gira) | Con el teclado se queda dada vuelta; con el mouse, un clic la fija hasta que hagas clic afuera. | Probala con Tab y con clic. |
| `/preguntas-frecuentes/` y home | **Al imprimir salen las respuestas** (antes solo las preguntas). | Ctrl+P y mirá la vista previa, sin gastar papel. |
| Menú "Nosotros" | Corrección invisible para lectores de pantalla. | Que siga abriendo y cerrando igual, con mouse y con teclado. |
| `/tarifas/` y home | Si alguna vez una estación tiene un cuadro propio, la tabla ya no mezcla su precio con el general; con el mismo precio sin IVA, TelePASE y pago en la vía muestran el mismo número. La tarjeta grande del home se esconde si la categoría destacada no tiene precio, en vez de romper la página. | Que las tres tablas sigan iguales y que la tarjeta del home muestre $ 1.500. |
| `/transparencia/` | Los botones de la **Ley 27.742** y el **Decreto 97/2025** abrían avisos del Boletín Oficial que no eran esas normas. Ahora abren la norma que dicen. | Tocá los dos y mirá que el Boletín muestre la ley y el decreto. |
| `/servicios/`, `/contacto/`, `/quienes-somos/` | El **0800** figuraba con acuse "24 horas" y el pliego le da acuse **inmediato**; la prórroga de respuesta ya no dice "una sola vez" (el pliego no lo pone); los **tiempos de grúa** se publican como los compromete el pliego (30 minutos en al menos el 90 % de los casos, nunca más de 40) y no como promesa lisa. | Que el 0800 diga "inmediato" arriba y abajo en la misma página. |
| `/el-tramo/` | Los cuatro links de la sub-navegación dejaban el título de la sección tapado detrás de las barras de arriba. Ahora aterrizan bien. El mapa, además, tiene su propio encabezado para lectores de pantalla. | Tocá los cuatro links de la sub-navegación y mirá que se vea el título de cada bloque. |
| Tema claro (panel del Consorcio) | La foto del Consorcio es de noche y no tiene versión de día, así que ese panel se sigue viendo oscuro en los dos temas. El hero ya salió de ese caso: tiene una foto por tema. | Prendé el tema claro: el único bloque que se ve "de noche" sin ser una tarjeta es el del Consorcio. |
| Tema claro (botón amarillo del 140) | El anillo que marca dónde está el foco cuando navegás con Tab era amarillo sobre fondo claro: no se veía. Ahora es ocre. | En tema claro, tabulá hasta el botón "140" del encabezado y mirá el recuadro. |
| `/el-tramo/` (mapa, tema claro) | Los puntos de las **estaciones próximas** y los rombos de "Precaución" eran amarillo claro sobre panel casi blanco. Ahora usan el mismo ocre que la leyenda: el mapa y la leyenda por fin coinciden. | En tema claro, mirá que Leones, San Francisco y Totoras se distingan en el mapa. |
| Mapa (RN 9) | La línea de la RN 9 seguía **35 km más allá de donde termina la concesión** (llegaba a Córdoba capital, y la concesión termina en Pilar). Se cortó en Pilar; Córdoba sigue dibujada como ciudad de referencia, sin línea, igual que Rafaela y Santa Fe. | Que la línea celeste de la RN 9 termine antes de Córdoba y que el marcador del aviso de James Craik caiga sobre la estación. |
| Estado de la traza (dato de ejemplo) | El aviso inventado de niebla nombraba **Rafaela**, que no está sobre la RN 19 ni dentro del tramo. Ahora dice "entre San Carlos Centro y el empalme con la RN 34". | Leelo en la home y en El tramo. |
| Fotos del hero al cambiar de tema | **Bug que encontraste vos, y encontrado de verdad con tus capturas.** El efecto de profundidad seguía el mouse leyendo la posición dentro de su propio elemento; la foto que el tema tiene escondida mide cero, la división daba infinito y el valor no se recuperaba nunca. Al cambiar de tema, esa foto aparecía pidiéndole a la placa un punto imposible de la imagen y pintaba un manchón liso que la tapaba entera. **Hacía falta mover el mouse por el hero**, que es justo lo que yo no hacía al probar. | Pasá el mouse por el hero, cambiá de tema, repetí varias veces en los dos sentidos. La foto tiene que estar siempre, y tiene que seguir moviéndose apenas con el mouse. |

### Lo que se revisó y se dejó como estaba

- **La provincia de la estación San Francisco (RN 19 km 120) sigue diciendo "Córdoba" — y hay que preguntarle a
  Covicen.** El pliego ubica el km 120 dentro del ejido de **Frontera, que es Santa Fe**: la RN 19 concesionada termina
  en el límite entre las dos provincias en el km 127,19, o sea siete kilómetros más adelante. El sitio lo publica como
  hecho firme en la página de la estación (`/peajes/san-francisco/`), en el texto que ve Google y en la tarjeta de El
  tramo. **No se cambió a propósito**: la spec dice textual "no se cambia sin confirmación", y acá inventar el dato es
  peor que dejar el que vino de la fuente periodística. Es un dato de una sola palabra: apenas Covicen conteste, se
  corrige en un minuto. **Es lo primero de la lista para preguntarles.**
- **Las marcas viales amarillas de las rutas del mapa quedan como están.** Se propuso oscurecerlas junto con las
  balizas, y se midió que sería peor: esas rayitas van *arriba* de la línea celeste (el asfalto), no sobre el fondo, así
  que en ocre casi desaparecerían. El amarillo ahí está bien.

---

## Todas las páginas

**Cinta de avisos** (reemplaza a los anuncios que rotaban arriba del navbar)
- Los avisos de `src/content/avisos.json` (hoy tres: el de la toma de posesión, que **vence el 5 de octubre** y desaparece solo en el build de ese día; emergencias 140; tarifas) **desfilan en una sola línea continua**, con la etiqueta amarilla "AVISOS" fija a la izquierda. Cada aviso es un link a su página.
- **Dónde está**: en la home, apoyada en el borde de abajo del hero (como en la referencia de Corresur que me pasaste). En el resto de las páginas, arriba del contenido, abajo del header.
- **Cómo se frena**: con el mouse encima, con el foco adentro (si vas con Tab) y con el botón de pausa de la derecha, que es el que manda: una vez pausado **no rearranca solo**.
- El contenido sale del mismo archivo de siempre, así que el día que exista el backoffice se edita desde ahí sin tocar la web.

**Barra superior (40 px, solo en escritorio)**
- Quedó con **TelePASE** (abre telepase.com.ar en otra pestaña), **Mi cuenta** (hoy lleva a Medios de pago › Mi cuenta; cuando exista la URL de la oficina virtual, la abre en otra pestaña) y el **sol/luna**.
- **En el celular ya no existe**: esos tres accesos viven en el menú y, sin los avisos, la barra quedaba vacía comiendo 40 px de pantalla. El header pasa a medir 72 px en vez de 112.

**Header (72 px)**
- Logo **sin descriptor** (ya no dice "Corredor Vial del Centro" en ningún lado: ni en el header, ni en el título, ni en la imagen para redes).
- Menú: Tarifas · El tramo · Servicios · Obras · Novedades · **Nosotros** (desplegable: abre con clic o Enter, cierra con Esc o clic afuera, el chevron gira) · Contacto. La página actual queda subrayada en celeste.
- **Probá "Nosotros" con el mouse y también con el teclado** (Tab hasta que quede marcado, Enter): tiene que funcionar exactamente igual que antes. Lo que se corrigió no se ve: era un dato que el sitio le pasaba a los lectores de pantalla y estaba mal, decía "cerrado" aunque el menú estuviera abierto.
- El **140 grande** amarillo con "Emergencias" arriba, desde 640 px de ancho. Debajo de 640 px desaparece del header y aparece la **barra fija de abajo** con el 140 y, a la derecha, el botón de asistencia (ícono de mira) que lleva a `/asistencia/`.
- Al scrollear, el header gana fondo translúcido y borde.

**Interruptor de tema**
- Nace oculto y **aparece con JavaScript**: sin JS no puede funcionar, así que no se muestra un botón muerto. Si lo ves sin JS habilitado, es un bug.
- Tocarlo cambia todo el sitio de una: el ícono pasa de sol (en oscuro) a luna (en claro); en el celular cambia el color de la barra del navegador (`theme-color`: navy `#0B1526` en oscuro, gris `#EEF1F4` en claro).
- **Recargar en claro:** no tiene que haber un destello oscuro antes de pintar (el tema se aplica en el `<head>`, antes del primer frame). Navegar entre páginas en claro: se mantiene (queda en `localStorage`, clave `covicen:tema`). En modo privado dura la visita.
- Qué mirar en **tema claro**: el amarillo vial como texto pasa a ocre (`#6E5A00`), no es un error; las tarjetas con halo sobre gris claro; las tablas; los chips verdes "Operativa"/"Gratis" (verde `#1B6B35`); los links celestes se leen (acento `#2C688F`); el **hero cambia de foto con el tema** (la nocturna en oscuro, la diurna en claro) y el cambio va con una disolvencia, no de golpe: mirá el punto siguiente. El panel del Consorcio, en la home, sí sigue viéndose oscuro en los dos temas, porque esa foto no tiene versión de día.
- El tema con el que arranca quien nunca eligió es `TEMA_POR_DEFECTO` en `src/lib/tema.ts` (hoy `'oscuro'`; puede ser `'claro'` o `'sistema'`). Lo decide Covicen.

**Footer**
- Columna marca: isotipo + COVICEN, texto "Concesionaria del Tramo Centro… RN 9 · RN 19 · RN 34 · Córdoba y Santa Fe". La fila de redes **no aparece** (no hay cuentas cargadas).
- Usuarios (Tarifas, Medios de pago, Emergencias, Asistencia en ruta, Guía de trámites, Seguridad vial, Preguntas frecuentes) y Empresa (Quiénes somos, Obras, Novedades, Políticas, Transparencia, Trabajá con nosotros). Los links del footer no van subrayados hasta el hover (son menú).
- Contacto: "Emergencias 140" (llama), Formulario de contacto, Proveedores. **Ocultos** hasta tener el dato: 0800, correo de atención al usuario, WhatsApp.
- **Datos registrales: no aparecen** (razón social, CUIT y domicilio son `null`). Cuando existan los tres, aparece la columna y, si además está `public/qr-afip.png`, el QR de Data Fiscal enlazando a la constancia.
- **Fila institucional**: Vialidad Nacional · Secretaría de Transporte · Presidencia de la Nación · Red Federal de Concesiones · TelePASE, hoy como rótulos de texto (cuando tengas los SVG oficiales monocromos en `src/assets/institucional/<id>.svg` se reemplazan solos), más el botón amarillo 140. Todos abren en otra pestaña.
- Línea inferior: "Sociedad en formación · Adjudicación: Resolución 1379/2026 del Ministerio de Economía. Privacidad · Boletín Oficial" y **"Última actualización: <fecha y hora>"**. Es la fecha y hora **del build**, en hora argentina, no la de la visita: en local es el momento en que corriste `pnpm dev`/`build`; en Pages, el último deploy (el workflow reconstruye a diario a las 03:00, así que nunca tiene más de un día).

**Formularios (todos los del sitio)**
- Los **desplegables ahora arrancan en "Elegí una opción"** en vez de mostrar la primera opción real ya elegida: Contacto (Motivo y Tema), TelePASE (Tipo de consulta), Trámites (Trámite), Proveedores (Rubro), Trabajá con nosotros (Zona y Área) y Asistencia (Qué pasó y Vehículo). Si mandás el formulario sin tocarlos, tiene que aparecer en rojo **"Elegí una opción."** debajo del desplegable. Antes se mandaba la primera opción sin que vos la hubieras elegido.
- Debajo del botón aparece una **línea de aviso al mandarlo** ("Abrimos WhatsApp en otra pestaña con el mensaje armado. Si no se abrió, fijate si el navegador bloqueó la ventana."). Hoy, sin canal cargado, eso solo se ve en `/asistencia/`.

**Legibilidad (pliego 61.7), en cualquier página**
- Los links dentro del texto van **subrayados** (1 px; en hover 2 px). Menú, botones, tarjetas-enlace, navs de anclas y footer no (el pliego lo permite).
- Ningún texto menor de 14 px, salvo las **anotaciones** de 12 px: "sin IVA" bajo los precios, "Fuente: PETG art. …", "Publicado el…", las etiquetas de las novedades, los chips ("Cuadro vigente", "Gratis", "Operativa"). Nada justificado.
- Teclado: apretá Tab al entrar → aparece "Saltar al contenido" (amarillo) → Enter → un **anillo celeste hacia adentro** marca el contenido. Seguí con Tab por menú, 140, cinta de avisos, mapa (cada estación), formularios: siempre se ve dónde estás. La cinta se frena sola cuando el foco entra en ella.
- **Imprimir** (Ctrl+P en cualquier página): papel blanco, tinta negra, sin header ni barras ni footer de navegación ni botones ni fondos animados; arriba el encabezado **"Covicen · <sitio> · impreso el <fecha de hoy>"**; los enlaces externos muestran su URL entre paréntesis; las migas quedan. El detalle en Tarifas, abajo.
- Al navegar entre páginas hay un fundido suave; el header no parpadea y el tema no cambia.
- 404: `/lo-que-sea/` muestra la página de error con los accesos.

---

## Home `/`

> **Ojo:** lo de abajo describe cómo quedó en septiembre. La tanda del 20/09 cambió la portada: leé primero «Lo que cambió el 20 de septiembre», arriba de todo.

- **Hero fijo** (cambió el 15/09/2026, pedido tuyo): volanta, el título "Las rutas del centro del país tienen quien responda", el párrafo con "679,03 km sobre RN 9, RN 19, RN 34", los botones Ver tarifas / Conocer el tramo y la cuenta regresiva al 5 de octubre. **No rota nada**: el carrusel que alternaba esto con las novedades destacadas se sacó. Las destacadas siguen en la home, en la sección Novedades. **No hay popup** de bienvenida a propósito.
- Lo que hay que mirar es justamente que **no se mueva**: quedate medio minuto en la home y lo único que se tiene que mover es la foto (avance lento) y la cuenta regresiva.
- Abajo del todo del hero, pegada al borde, está la **cinta de avisos**. Fijate que no le tape nada al texto ni a la cuenta regresiva, ni en la compu ni en el celular.
- **Foto del hero, una por tema** (nueva, 15/09/2026): la nocturna en tema oscuro y la diurna en tema claro, mismo encuadre. Parallax 2.5D en desktop (movete con el mouse); en el celular, la foto con un zoom lento.
- **La disolvencia al cambiar de tema** es lo nuevo que hay que mirar, y conviene hacerlo despacio: parate en el home, tocá el sol/luna y seguí el hero. Tiene que **fundirse al color del tema que viene** (se apaga, texto incluido), cambiar la foto por debajo y **volver a aparecer**, un poco más lento de lo que se fue. En total algo más de medio segundo. Lo que NO tiene que pasar: ver el corte de una foto a la otra, ver un parpadeo blanco o negro que no sea el color del tema, ni que el texto quede ilegible en el medio. Probalo en los dos sentidos, y también en el celular.
- **El resto de la página cambia en el medio de esa disolvencia**, no al instante de tocar el botón: es a propósito, así el corte queda escondido. Si te parece que el botón responde lento, avisame y bajo los tiempos.
- **Contraste del texto sobre la foto**: en tema claro, el párrafo del hero va en color pleno (antes era gris) porque sobre el asfalto de la foto de día el gris quedaba en 3,1:1 y el pliego pide 4,5:1. En el celular el velo cambia de horizontal a vertical: se ve el cielo limpio arriba y la parte de abajo queda más tapada, que es donde cae el texto. Mirá que en un celular, en los dos temas, **todo el texto del hero se lea cómodo**; si algo te parece justo, decímelo con la captura y lo mido.
- **Accesos rápidos**: Tarifas, Emergencias 140 (tarjeta amarilla; es un enlace `tel:` con la frase completa), El tramo, Medios de pago.
- **Tarifa (01)**: una tarjeta que gira. Frente: ícono de auto, chip verde "Cuadro vigente", "Categoría 1 · Autos · por paso", **$ 1.500 con IVA** grande y "$ 1.239,67 sin IVA". Dorso (mouse encima o un toque): rige en Carcarañá, James Craik y Franck igual con TelePASE que en la vía; vigente desde el 26 de febrero de 2026; Resolución 248/2026; botón al tarifario completo; link a la resolución en el Boletín Oficial. Debajo, "Publicado el … Se actualiza por índices oficiales según el contrato." **Ya no dice "tarifa ofertada" ni $1.399**: la ofertada quedó como dato histórico en Quiénes somos, no como precio.
- **Probá esa tarjeta con el teclado**: Tab hasta que quede marcada con el recuadro celeste (antes ese recuadro no aparecía) y seguí con Tab dos veces más. Tiene que **quedarse dada vuelta todo el tiempo**, mostrando el dorso con los dos enlaces. Antes se volvía al frente y quedabas apretando Enter sobre un enlace que no se veía.
- **Y con el mouse**: si le hacés clic encima (no sobre un enlace), ahora **se queda dada vuelta aunque saques el mouse**, hasta que hagas clic en cualquier otro lado de la página. Es un cambio de conducta que viene del mismo arreglo, y es lo mismo que ya hacía en el celular; si te molesta, se afina.
- **El tramo (02)**: panel con el **mapa** a la izquierda y una tarjeta de estación a la derecha. Tres rutas celestes; estaciones **verdes** (Carcarañá, James Craik, Franck: cobran hoy) y **amarillas con anillo discontinuo** (Leones, San Francisco, Totoras: próximas). **Tocá Franck**: la tarjeta cambia (chip "Operativa", "RN 19 · km 19,95", "Franck, Santa Fe", vías 6, "Cobra en ambos sentidos", servicios Área de descanso y Grúa gratuita, links a su cuadro tarifario, ficha completa, asistencia y 140). Arranca en Carcarañá. La estación elegida queda con un anillo. Con Tab se recorren las seis y Enter las elige. Sin JS quedan las seis tarjetas listadas y cada estación enlaza a su página.
- **En el celular, los nombres de las estaciones sobre el mapa solo se ven al tocar una** (el nombre está en la tarjeta que aparece debajo): con seis etiquetas en 360 px se pisaban. Decisión a tu criterio: ver al final.
- Leyenda: rutas, estación operativa, estación próxima, ciudad, y solo los servicios que alguna estación tiene (área de descanso, grúa gratuita). En la home el mapa **no** muestra incidentes (sí en El tramo).
- Mojones: **679 km · 3 rutas · 3 estaciones operativas de 6**; cuentan al entrar en pantalla.
- **Obras y estado (03)**: izquierda, las **seis obras del pliego** (todas "Planificada"); derecha, pegado al scrollear, el **Estado de la traza**: cartel **"Datos de ejemplo: el módulo se activa con la operación"**, una fila por ruta con su chip: RN 9 Precaución (2 avisos), RN 19 Precaución (1 aviso), RN 34 **Corte** (1 aviso), cada aviso con km, sentido y texto; abajo "Última actualización: 13 de septiembre de 2026…". **Todo eso es inventado a modo de muestra** (`src/content/estado-ruta.json`, `ejemplo: true`): que nadie lo lea como real. Cuando exista el centro de operaciones, el sistema manda la misma forma con `ejemplo: false` y el cartel desaparece.
- Servicios; Novedades (las 3 últimas); **Consorcio (06)**: el panel usa de fondo la foto `consorcio.jpg` **oscurecida al 62 % en oscuro** (antes estaba al 50 %; se aclaró para que la foto se vea): mirá que los mojones "20 años · 3 empresas" y los nombres de las tres empresas se lean bien encima. En tema claro el panel se ve igual que en oscuro (zona oscura fija) porque esa foto no tiene versión de día; el hero ya salió de ese caso, el panel es el único que queda. Decisión a tu criterio: ver al final.
- FAQ corto (cinco preguntas en acordeón, con botón a todas) y el CTA de contacto. **Al imprimir la home** salen con su respuesta, aunque en pantalla estén cerradas (ver Preguntas frecuentes, más abajo).
- **Imprimir la home** (Ctrl+P): tiene que salir el título grande y, más abajo, la **cinta de avisos quieta y una sola vez** (en pantalla va duplicada para que el desfile empalme). El botón de pausa no sale: eso está bien.

## Tarifas `/tarifas/`

> **Ojo:** lo de abajo describe cómo quedó en septiembre. La tanda del 20/09 cambió tarifas: leé primero «Lo que cambió el 20 de septiembre», arriba de todo.

- Cabecera: ícono de auto, "Categoría 1 · …", **$ 1.500 al público, con IVA**, "$ 1.239,67 sin IVA · igual con TelePASE que con pago en la vía". Chips "Cuadro vigente" (verde) y "Desde el 26 de febrero de 2026". "Resolución 248/2026 de la Dirección Nacional de Vialidad. Ver en el Boletín Oficial." "Rige el mismo cuadro en Carcarañá, James Craik, Franck." Botón **Imprimir el cuadro**.
- **Imprimir**: tocá el botón (o Ctrl+P). En la vista previa: papel blanco, sin header ni barras, el encabezado "Covicen · <sitio> · impreso el <hoy>", las **tres tablas completas** (sin scroll horizontal, con todas las filas), los enlaces externos con la URL entre paréntesis, sin botones. Cerrá sin imprimir.
- Nav de anclas con las tres estaciones y **tres tablas iguales**, una por estación: Categoría (con ícono) · Tipo de vehículo · **TelePASE** · **Pago electrónico o manual**. Las dos columnas tienen **el mismo valor** hoy: la Res. 248/2026 fija un solo precio (la diferencia llega cuando las vías sean 100 % automáticas). Cinco categorías: $ 1.500 · $ 3.000 · $ 4.500 · $ 6.000 · $ 7.500 con IVA; el sin IVA en chico debajo de cada precio. La fila se tiñe al pasar el mouse. En el celular: "Deslizá la tabla hacia el costado…" y scroll horizontal. Debajo de cada tabla, los avisos y "Publicado el … Fuente: Resolución 248/2026…" (link al BO).
- "**Estaciones sin habilitar**": Leones, San Francisco, Totoras cobran cuando Vialidad las habilite, con el cuadro de Carcarañá; hasta entonces no se paga.
- **Descuentos por frecuencia (01)**: 15 % · 25 % · 35 % a partir de la pasada 36 · 45 · 61 del mes (PETG 53.3).
- **Exenciones (02)**: los ocho ítems con el texto literal del Anexo B (incluido "según el reglamento de Vialidad Nacional" en discapacidad y Malvinas); tarjetas con link al trámite de Malvinas (argentina.gob.ar) y a la guía de trámites.
- **Tarifa diferencial (03)**: vecinos, frentistas y docentes, solo categoría 1; **sin monto** (no lo tenemos: "se informa al hacer el trámite").
- **Si pasaste sin pagar (04)**: dentro de 30 días, la tarifa más una; después, la tarifa más dos con intereses (PETG 51.1.4); el medio para pagar se publica en Medios de pago cuando exista.
- **Exceso de carga (05)** — **bloque nuevo**: si una balanza detecta que un camión lleva más peso del permitido, el peaje de esa pasada se multiplica: **50 veces** si se pasa entre 10 % y 30 %, y **100 veces** si se pasa de más del 30 %. Está leído del PDF del pliego (art. 83) y copiado tal cual de su cuadro. La spec decía "50x y 100x" a secas; el pliego además parte el exceso en esos dos tramos, y se publican los tramos porque sin ellos el número no se entiende.
- **Después de las obras iniciales (06)**: la tabla de categorías futuras del PETG 53.2 (0 a 8 y Especial, con el múltiplo de la tarifa básica), sin precios. Las categorías **7 "Más de 6 ejes" (×7) y 8 "Más de 8 ejes" (×9) se solapan**: así lo escribe el pliego y se publica literal, con la cita. Decisión a tu criterio: ver al final. **Ojo**: este bloque era el 05 y pasó a 06 al entrar el de exceso de carga; se le cambió el fondo para que la página siga alternando fondo liso y fondo con la grilla, que es como venía. Mirá que **ninguna sección quede con el mismo fondo que la de al lado** y que el encabezado gris de esa tabla (Categoría / Vehículos / Tarifa básica ×) se siga distinguiendo del fondo.
- Tres botones al pie: Cómo pagar · Dónde están los peajes · Preguntas frecuentes.

## El tramo `/el-tramo/`

> **Ojo:** lo de abajo describe cómo quedó en septiembre. La tanda del 20/09 cambió el tramo: leé primero «Lo que cambió el 20 de septiembre», arriba de todo.

- Título "679 kilómetros de centro." y, debajo, la **sub-navegación pegada** bajo el header (Rutas y longitudes · Estaciones de peaje · Cuadros tarifarios · Áreas de descanso y servicios); en el celular se desliza de costado.
- **Cartel gris arriba del mapa: "DATOS DE EJEMPLO: EL MÓDULO SE ACTIVA CON LA OPERACIÓN".** Es lo más importante de esta pantalla: abajo hay un marcador rojo sobre la RN 34 que anuncia un **corte total por vuelco de camión** y ese corte **es inventado**. Mientras el cartel esté, nadie lo puede leer como real; cuando Covicen cargue el estado de verdad (`ejemplo: false`), el cartel se va solo.
- **Mapa** igual al de la home, más los **cuatro incidentes de ejemplo** ubicados por km sobre el trazo (obra en RN 9 km 352, tránsito en RN 9 km 588, niebla en RN 19 km 61, **corte** en RN 34 km 118). **Cada severidad tiene su forma, no solo su color**: el corte es un **triángulo**, la precaución un **rombo** y la informativa un **círculo** (antes eran los tres el mismo triángulo y solo cambiaba el color: con el mapa en blanco y negro o con daltonismo no se distinguían). Pasá el mouse por encima de cada uno: el globito arranca con la palabra ("Corte — RN 34 km 118: …"). La posición es aproximada: el mapa es esquemático, no está a escala.
- **Referencias del mapa**: suman tres renglones con esos mismos dibujitos y su nombre — Corte, Precaución, Información. Salen **solo los que hay**: si un día no hay ningún corte, ese renglón no aparece.
- **Letras del mapa más grandes** (nombres de ciudad, números de ruta, nombres de estación): antes quedaban por debajo del mínimo del pliego porque el dibujo se achica al entrar en la página. Mirá que **ningún nombre se pise con otro ni se salga del dibujo**, acá y en la home. **Ojo en el celular**: ahí el dibujo entero se achica con la pantalla, así que las letras siguen siendo chicas. No está arreglado (habría que cambiar cómo se dibuja el mapa en pantallas chicas); si al verlo te molesta, se encara aparte.
- **Estado de la traza**, debajo del mapa: bloque nuevo con las tres rutas, su bolita (verde, amarilla o roja) y los avisos de cada una — el mismo que ya estaba en la home y en `/obras/`. Fijate que se lea bien y que no quede apretado contra el mapa. **Ya no está** la línea chiquita "Estado de la traza actualizado el 13 de septiembre de 2026, 09:00.": esa fecha ahora la dice el bloque nuevo abajo de todo, como "Última actualización". Si te parece que se perdió algo, decilo.
- **Los avisos muestran la hora** (acá, en la home y en `/obras/`): "km 352 · sentido ascendente · de 06:00 a 18:00" en el bacheo, "km 118 · sentido descendente · desde las 07:40" en el corte. Es hora de Argentina, reloj de 24. Si un aviso no trae hora, no se inventa ninguna: simplemente no aparece.
- **Rutas y longitudes (01)**: tabla Ruta · Desde · Hasta · **Progresivas** · Longitud: RN 9 km 297 a 660,16 (363,16 km); RN 19 km 0 a 127,19 (127,19 km); RN 34 km 0 a 188,68 (188,68 km); total **679,03 km** "según el pliego". Mojones: 679 km · 2 provincias · 6 peajes (3 operativos y 3 próximos).
- **Estaciones de peaje (02)**: seis tarjetas con ruta · km (Carcarañá RN 9 km 340, James Craik RN 9 km 588, Franck RN 19 km 19,95, Leones RN 9 km 454, San Francisco RN 19 km 120, Totoras RN 34 km 60), nombre (link a su página), localidad y chip verde/amarillo. Debajo, los avisos del tramo (fuente PETP, estaciones nuevas con Free Flow, San Vicente deja de operar).
- **Cuadros tarifarios (03)**: las tres tablas en versión compacta (sin avisos ni fuente) y botón a Tarifas.
- **Áreas de descanso y servicios (04)**: solo las estaciones con servicios cargados (las tres operativas: área de descanso, grúa gratuita); link a Servicios.

## Páginas de estación `/peajes/<slug>/`

> **Ojo:** lo de abajo describe cómo quedó en septiembre. La tanda del 20/09 cambió las páginas de estación: leé primero «Lo que cambió el 20 de septiembre», arriba de todo.

- **`/peajes/carcarana/`** (operativa): título "Peaje Carcarañá", eyebrow "RN 9 · km 340", intro "Carcarañá, Santa Fe. Operativa."; a la izquierda la tarjeta completa (10 vías, ambos sentidos, servicios, "Pedir asistencia", 140); a la derecha **su tabla de tarifas y el botón Imprimir**; abajo "Cómo pagar" y "Emergencias 140" (amarillo). Migas: Inicio › El tramo › Peaje Carcarañá. El título de la pestaña lleva la ubicación ("Peaje Carcarañá — RN 9 km 340 | Covicen").
- **`/peajes/totoras/`** (próxima): chip amarillo "Próxima · Free Flow"; en vez de la tabla, el texto "Esta estación todavía no cobra: la habilita Vialidad Nacional cuando esté construida. Va a operar con Free Flow… con el mismo cuadro tarifario que Carcarañá"; sin botón Imprimir; la tarjeta dice "Cobra cuando Vialidad Nacional la habilite".
- Las seis: `carcarana`, `james-craik`, `franck`, `leones`, `san-francisco`, `totoras`.

## Servicios `/servicios/`

> **Ojo:** lo de abajo describe cómo quedó en septiembre. La tanda del 20/09 cambió servicios: leé primero «Lo que cambió el 20 de septiembre», arriba de todo.

- **Sin costo (01)**: seis tarjetas con chip verde "Gratis": Emergencias 140; Grúa y remolque para despejar la calzada (30 min livianos / 60 pesados); Móviles de seguridad vial; TelePASE sin costo; Atención al usuario; Sanitarios públicos. Cada una con alcance, tiempos y "Fuente: PETG art. …" en 12 px.
- **Con costo (02)**: Mecánica general; Remolque más allá del punto gratuito (chip "Con costo").
- **Canales y plazos (03)**: tabla completa Canal · Disponibilidad · Acuse · Respuesta, seis filas: Emergencias 140 (inmediato), Botón de asistencia en ruta, Formulario web (acuse 24 h, respuesta 5 días hábiles), Correo, Línea 0800, WhatsApp. Los tres últimos **no muestran un dato inventado**: dicen "Se habilita con la toma de posesión, el 5 de octubre de 2026".
- **Más adelante (04)**: huecos "Oficina virtual" y "Seguimiento de reclamos" (Próximamente + alternativa real).

## Emergencias `/emergencias/`

- Tarjeta amarilla: "Emergencias · 24 horas · gratis desde cualquier celular", el **140 enorme** (tocar llama). Sin "También por WhatsApp" (el número es `null`; aparece solo cuando exista).
- Botón amarillo **"Pedir asistencia con mi ubicación"** → `/asistencia/`.
- **Cinco pasos** numerados: Salí de la calzada · Protegete · Llamá al 140 · Esperá el auxilio · Compartí tu ubicación (mismo JSON que Seguridad vial).
- Tarjeta "Grúa y remolque…: gratis y con tiempos comprometidos" con los tiempos y la fuente; tabla de canales compacta; botón a Seguridad vial.

## Asistencia en ruta `/asistencia/`

- Arriba, el **140 gigante** amarillo ("Tocá el número para llamar. Decí ruta, sentido y kilómetro, y qué pasó.").
- **Compartí tu ubicación**: botón amarillo **"Obtener mi ubicación"** → dice "Buscando tu ubicación…" y el navegador pide permiso → aparece un cuadro con las coordenadas (latitud y longitud con cinco decimales, la precisión en metros y un link a Google Maps con ese punto) + botón **Copiar** ("Ubicación copiada.") + **se completa solo el campo de solo lectura del formulario** → "Listo. Dictale estas coordenadas al operador del 140 o copialas.". Si negás el permiso: "No diste permiso de ubicación. Podés seguir: decile al operador el kilómetro del mojón más cercano." Si el navegador no puede: aviso equivalente. Texto fijo: "Tu ubicación no se guarda en ningún lado". **Nada se guarda ni se envía solo.**
- **Cómo probarlo en el celular**: hace falta HTTPS. Por `http://<IP>:4321` el celular no entrega la ubicación (regla de los navegadores): probá en la URL de Pages después de un deploy, o en la compu en `localhost` (Chrome/Edge piden permiso y dan la ubicación aproximada).
- **Contanos qué pasó** — **este es el cambio grande de la pantalla y hay que mirarlo sí o sí**. Los campos **ahora se escriben** (antes estaban grises y bloqueados, o sea que la página pedía datos que no dejaba cargar). Probá: cargá **Qué pasó**, **Vehículo**, cuántas personas y un teléfono, apretá **"Obtener mi ubicación"** (en el celular, con el sitio en https) y después **"Armar el texto para copiar"**. Abajo tiene que aparecer un recuadro con el mensaje completo — asunto, cada campo, y las coordenadas con el link a Google Maps — y un cartelito que diga **"Texto copiado. Pegalo donde quieras o dictáselo al operador del 140."**. Pegalo en WhatsApp o en las notas para ver que salga bien.
- Si el navegador **no deja copiar solo** (pasa en algunos Android viejos, o si la página no está en https), el cartel dice "No se pudo copiar solo: seleccioná el texto de acá abajo y copialo a mano". **El texto igual queda a la vista: eso es lo importante.**
- **Ya no aparece "Respuesta inmediata"** al lado del botón: mientras no haya WhatsApp ni correo cargados nadie recibe el mensaje, así que prometer un plazo sería mentira. Cuando el 5 de octubre se cargue el número, vuelve solo junto con el botón de enviar por WhatsApp.
- Con el WhatsApp cargado, el botón pasa a "Pedir asistencia por WhatsApp" y abre `wa.me` con el mensaje armado (qué pasó, vehículo, personas, ubicación, referencia, teléfono).

## Medios de pago `/medios-de-pago/`

> **Ojo:** lo de abajo describe cómo quedó en septiembre. La tanda del 20/09 cambió medios de pago: leé primero «Lo que cambió el 20 de septiembre», arriba de todo.

- Tres modalidades del pliego con fuente: Prepago con TelePASE · Pospago con TelePASE · Contado en la vía (Carcarañá, James Craik, Franck).
- **TelePASE (01)**: "Gratis, y en todas las estaciones" (adhesión, dispositivo, colocación, renovación sin costo, PETG 50.5); "Cómo adherirte" con botón a TelePASE; "Dónde se coloca" con texto genérico hasta que Covicen defina los sectores (`servicios.colocacionTelepase` por estación).
- **Free Flow (02)**: Leones, San Francisco, Totoras: pórticos sin barreras; cobran cuando Vialidad las habilite.
- **Mi cuenta (03)**: chip "Se habilita con la toma de posesión" + "El acceso se publica acá y en la barra superior…". Con `contacto.enlaces.oficinaVirtual` cargado pasa a ser el botón "Entrar a Mi cuenta".
- **Pasaste sin pagar (04)**: las dos tarjetas de recargo y "El medio para pagar la deuda se publica acá cuando esté habilitado" (la cuenta bancaria es `null`).

## Guía de trámites `/tramites/`

> **Ojo:** lo de abajo describe cómo quedó en septiembre. La tanda del 20/09 cambió la guía de trámites: leé primero «Lo que cambió el 20 de septiembre», arriba de todo.

- Nav de anclas y **cinco trámites**: tarifa diferencial para vecinos y frentistas; para docentes; exención por discapacidad; exención para ex combatientes de Malvinas; alta de TelePASE. Cada uno con "Quién puede", Requisitos, Pasos, plazo, "Sitio oficial del trámite" cuando hay URL (Malvinas, TelePASE) y "Fuente: …" en 12 px. "Todos son gratuitos."
- **Iniciá tu trámite**: formulario con select de trámite, deshabilitado con el aviso hasta tener canal.

## Contacto `/contacto/`

- Izquierda: tarjeta amarilla con el 140; **tabla de canales compacta** (Canal · Acuse · Respuesta); hueco "Seguimiento de reclamos en línea". Derecha: **formulario de reclamos, consultas y sugerencias** (motivo, tema, ruta y km o estación, fecha, patente, nombre, apellido, DNI, correo, teléfono, mensaje), hoy deshabilitado con el aviso; con canal, "Enviar por WhatsApp" o "Enviar por correo" y los plazos "Acuse en 24 horas · Respuesta en 5 días hábiles" al lado del botón.
- **TelePASE (01)**: texto con link al sitio de TelePASE y un **segundo formulario** (tipo de consulta, patente, TAG, estación, fecha, correo, qué pasó). Las respuestas a TelePASE tienen prioridad (PETG 61.5 b).
- **Cómo hacer un reclamo (02)**: cuatro pasos con plazos (número de gestión en 24 h; respuesta en 5 días hábiles; prórroga una sola vez; escalar a Vialidad Nacional).
- La validación en español del formulario (campos obligatorios, correo válido) se ve solo cuando esté habilitado.

## Quiénes somos `/quienes-somos/`

> **Ojo:** lo de abajo describe cómo quedó en septiembre. La tanda del 20/09 cambió quiénes somos: leé primero «Lo que cambió el 20 de septiembre», arriba de todo.

- Texto **original** (se chequeó con `pnpm originalidad` contra otras concesionarias): "Nacimos de tres empresas… ganaron ofreciendo el peaje más bajo de los 8 tramos…"; párrafo "La sociedad está en formación. Cuando se complete la inscripción, publicamos acá y en el pie de página la razón social, el CUIT y los domicilios." **Ya no dice "+10 prorrogables"**: era un dato de prensa sin artículo del pliego que lo respalde. Decisión: ver al final.
- Mojones 20 años · 6 peajes. **Ocho compromisos** exigibles (conservar los 679 km, losas de hormigón, banquinas Rosario–Carcarañá, puente sobre el Carcarañá, rehabilitación asfáltica, auxilio gratis 30/60 min, 140 con personas, cobrar solo lo habilitado), todos con base en el pliego.
- Quién nos controla: ficha (régimen, tramo, plazo, adjudicación con link al BO, control) y misión/visión.
- El consorcio: foto 21:9 (`consorcio.jpg`) y tres tarjetas. **Organigrama**: la sección aparece solo si existe `src/assets/institucional/organigrama.png`.

## Transparencia `/transparencia/`

- **Normativa aplicable**: cinco tarjetas. Res. 1379/2026, Res. 248/2026, Ley 27.742 y Decreto 97/2025 con "Ver o descargar" al Boletín Oficial; "Pliegos de la concesión" dice "Sin versión definitiva publicada todavía" (hasta tener los firmados).
- **Póliza de responsabilidad civil (01)**: "Se publica con la toma de posesión, el 5 de octubre de 2026" (con `empresa.polizaRc` cargado aparece la ficha: aseguradora, número, vigencia, documento).
- **Datos registrales (02)**: "La sociedad está en formación…" hasta tener razón social, CUIT y domicilio.

## Obras `/obras/` — **no existe desde el 20/09/2026**

La página se escondió entera (call con el gerente: «no se sabe nada del tema obras»). **No está en el sitio**: no
es que no esté enlazada, directamente no se genera. Escribirla a mano en el navegador da 404.

Vuelve, con todo su contenido intacto, cambiando `obras` a `true` en `C:\Users\Villex\dev\Covicen\src\lib\publicado.ts`.
Qué hay que preguntar antes: punto 6 de `C:\Users\Villex\dev\Covicen\docs\pendientes-de-confirmacion.md`.

## Seguridad vial `/seguridad-vial/`

- **Ocho hábitos** numerados en dos columnas (distancia, velocidad, luces bajas, niebla, animales sueltos, cansancio, sobrepaso, cinturón y sillas) y "**Ante una emergencia**": los cinco pasos en fila. Botones "Llamar al 140" (amarillo) y "Emergencias y auxilio". El texto lo tiene que revisar Seguridad Vial de Covicen (pendiente de ellos).

## Preguntas frecuentes `/preguntas-frecuentes/`

> **Ojo:** lo de abajo describe cómo quedó en septiembre. La tanda del 20/09 cambió las preguntas frecuentes: leé primero «Lo que cambió el 20 de septiembre», arriba de todo.

- Nav por seis temas (General, Tarifas, Peajes, Pago, Servicios, Empresa); **17 preguntas** con acordeón (`<details>`, chevron que gira); `FAQPage` en JSON-LD (verificado por script).
- **Imprimila** (Ctrl+P y mirá la vista previa, no hace falta gastar papel): antes salía la lista de preguntas y **ninguna respuesta**, porque el navegador imprime las preguntas tal como están en pantalla, o sea cerradas. Ahora tienen que salir **todas las preguntas con su respuesta abajo**, aunque en pantalla estén cerradas. Fijate que ninguna pregunta quede en el pie de una hoja con la respuesta arrancando en la siguiente. Lo mismo en la home, en el bloque de preguntas frecuentes del final (el 07).
- **Y te lo digo derecho:** ese arreglo es solo de CSS y se apoya en algo que los navegadores nuevos entienden y los muy viejos no. En Chrome, Edge, Safari y Firefox actualizados tiene que andar. Si alguna vez imprimís desde un navegador viejo y las respuestas no salen, no es que se rompió: es el límite de este arreglo. La alternativa era sumar JavaScript que abriera todas las preguntas al momento de imprimir, y no valía la pena cargar código de más en todas las páginas para eso. Si lo probás y falla en el navegador que usás, se rehace con JS.
- **En pantalla las preguntas no cambian en nada**: se siguen abriendo y cerrando de a una como antes. Si notás que alguna quedó abierta sola o que la animación de apertura se puso rara, avisá: eso sí sería un bug de este cambio.

## Novedades `/novedades/` y detalle

- Listado de **cinco** con fecha y etiquetas (12 px, anotación). La más nueva (13/9) explica qué cuadro tarifario rige desde el 5 de octubre. Las marcadas como destacadas ya no suben al hero (que dejó de rotar): se ven acá y en la sección Novedades de la home.
- Detalle: prosa con **más aire entre párrafos** (1,5 veces el interlineado, como pide el pliego), links subrayados, botón volver.

## Políticas, Privacidad, Proveedores

- **Políticas**: tres artículos por anclas; en Anticorrupción, hueco "Canal ético anónimo" cuya alternativa hoy es el formulario de contacto (el correo de ética es `null`).
- **Privacidad**: responsable "Covicen, sociedad en formación"; sin cuentas, cookies de terceros ni seguimiento; los datos viajan por el canal que elige el usuario. **Sección nueva "Ubicación"**, entre "Qué datos recibimos" y "Para qué", con un enlace a `/asistencia/`: dice que la ubicación se pide solo ahí, solo si tocás el botón y das permiso, que no se guarda ni se envía sola. **Leela para ver si te cierra cómo está redactada.**
- **Proveedores** (hueco "Portal de proveedores y licitaciones"): formulario deshabilitado con el aviso hasta tener canal. Desde el 20/09 el título es "Registro de proveedores." y la página se enlaza desde el menú Nosotros, no solo desde el pie.
- **Trabajá con nosotros: eliminada el 20/09/2026.** Pedido explícito del gerente. No está la página, ni el ítem del menú, ni el del pie.

---

## Qué está oculto hasta tener el dato

Nada de esto dice "a confirmar" ni "próximamente" en el sitio: directamente no se renderiza, y `pnpm verificar` falla si alguna página dijera "a confirmar".

> **Esta lista es la de los datos de la empresa y de contacto** (razón social, CUIT, 0800, WhatsApp, redes,
> póliza…), que esperan desde septiembre. Lo que se escondió el **20/09 por falta de certificación del área**
> —descuentos, tarifa diferencial, recargos, exceso de carga, categorías futuras, obras, áreas de descanso— va en
> una lista aparte, con la pregunta ya redactada para cada uno:
> **`C:\Users\Villex\dev\Covicen\docs\pendientes-de-confirmacion.md`**

- Razón social, CUIT, domicilio legal y comercial, constancia de inscripción y QR de Data Fiscal (footer, Transparencia, Privacidad).
- Número 0800, correo de atención al usuario, WhatsApp (footer, canales, formularios habilitados, "También por WhatsApp" en Emergencias).
- Redes sociales (footer).
- URL de la oficina virtual (Mi cuenta en barra superior, menú y Medios de pago) y de la atención al usuario de la DNV (footer).
- Cuenta para regularizar deuda (Medios de pago).
- Póliza de responsabilidad civil (Transparencia).
- Teléfono, horario de atención, sectores de detención segura, sanitarios y colocación de TelePASE por estación (tarjetas y leyenda del mapa).
- Organigrama (Quiénes somos), logos institucionales en SVG (footer), foto del hero de día (tema claro).
- Monto de la tarifa diferencial (Tarifas, Trámites): se dice que se informa al tramitar.
- **Cuántos pasajeros lleva la grúa** (PETG 54.3): el pliego obliga a publicarlo junto con los tiempos, y hoy la tarjeta "Grúa y remolque" de `/servicios/` (y la de `/emergencias/`) no lo dice porque **Covicen todavía no pasó el dato**. No hay campo propio en el contrato: se carga como texto (ver la tabla de abajo).
- Ubicación y horario de los **sectores de detención segura** (`cabinas[].servicios.detencionSegura` en `tramo.json`): hoy ninguna estación lo tiene cargado, así que ni la tarjeta ni la leyenda del mapa lo nombran.

## Datos de ejemplo (no reales)

- **Estado de la traza** (home, Obras, incidentes del mapa de El tramo): `src/content/estado-ruta.json` con `ejemplo: true`. Lleva el cartel "Datos de ejemplo: el módulo se activa con la operación". Cuando el centro de operaciones exista, la misma forma con `ejemplo: false` la manda el sistema.
- Todo lo demás (tarifas, km, estaciones, vías, plazos, servicios, normas, obras) sale del pliego o de las resoluciones, con la fuente al lado.

## Cómo cargar lo que falta (sin tocar componentes)

| Campo | Archivo | Efecto |
|---|---|---|
| `razonSocial`, `cuit`, `domicilioLegal` (los tres) | `src/content/empresa.json` | Columna "Datos registrales" del footer y bloque en Transparencia; responsable en Privacidad. |
| `domicilioComercial` | `src/content/empresa.json` | Fila extra en los datos registrales. |
| `constanciaUrl` + archivo `public/qr-afip.png` | `src/content/empresa.json` / `public/` | QR de Data Fiscal en el footer, enlazando a la constancia (aparece solo con `cuit` cargado). |
| `enFormacion: false` | `src/content/empresa.json` | Saca "Sociedad en formación" del footer y el párrafo de Quiénes somos. |
| `polizaRc { aseguradora, numero, vigenciaHasta, url? }` | `src/content/empresa.json` | Ficha de la póliza en Transparencia. |
| `lineaGratuita` (0800) | `src/content/contacto.json` | Fila "Atención al usuario 0800…" en el footer. También `canales[].valor` del canal `linea-0800` para la tabla. |
| `atencionUsuario` (correo) | `src/content/contacto.json` | Correo en el footer; los formularios pasan a "Enviar por correo" si no hay WhatsApp. También `canales[].valor` del canal `correo`. Solo cuando la casilla funcione. |
| `whatsapp.numero` | `src/content/contacto.json` | WhatsApp en el footer, "También por WhatsApp" en Emergencias, formularios habilitados con "Enviar por WhatsApp". También `canales[].valor` del canal `whatsapp`. |
| `email.rrhh`, `email.proveedores`, `email.etica`, `email.general` | `src/content/contacto.json` | Destinos alternativos de Trabajá, Proveedores, canal ético y formularios. |
| `redes { instagram, facebook, linkedin, youtube, x }` | `src/content/contacto.json` | Fila de redes en el footer (por nombre; logos oficiales después). |
| `enlaces.oficinaVirtual` | `src/content/contacto.json` | "Mi cuenta" abre la oficina virtual (barra superior, menú, Medios de pago). |
| `enlaces.atencionDnv` | `src/content/contacto.json` | Link "Atención al usuario de Vialidad Nacional" en el footer. |
| `cuentaRegularizacion` | `src/content/contacto.json` | Cómo pagar la deuda en "Pasaste sin pagar". |
| Cuántos pasajeros lleva la grúa (PETG 54.3) | `src/content/servicios.json`, servicio `grua-y-remolque` | **No tiene campo propio**: va como **un ítem más del array `tiempos`** (queda como un renglón más abajo de los tiempos de respuesta, que es donde el pliego lo pide) o, si preferís que se lea como parte del alcance, sumado al texto de `alcance`. Aparece en la tarjeta de `/servicios/` y en la de `/emergencias/`. Ejemplo: `"Llevamos hasta N acompañantes del vehículo remolcado."` |
| `cabinas[].telefono`, `horarioAtencion` | `src/content/tramo.json` | Filas en la tarjeta de la estación. |
| `cabinas[].servicios { detencionSegura, sanitarios, colocacionTelepase, areaDescanso, gruaGratuita }` | `src/content/tramo.json` | Chips en la tarjeta, leyenda del mapa, "Dónde se coloca" el TelePASE. |
| `cabinas[].operativa: true` | `src/content/tramo.json` | La estación pasa a verde, con tabla de tarifas y botón Imprimir en su página. |
| Un aviso `{ id, texto, url?, tono, desde?, hasta? }` | `src/content/avisos.json` | Entra a la cinta de avisos en el build; sale solo al vencer `hasta`. |
| `ejemplo: false` (cuando sean reales) | `src/content/estado-ruta.json` | Desaparece el cartel "Datos de ejemplo". |
| `src/assets/institucional/organigrama.png` | imagen | Sección Organigrama en Quiénes somos. |
| `src/assets/institucional/<id>.svg` (`vialidad-nacional`, `transporte`, `presidencia`, `red-federal`, `telepase`), monocromos | imagen | Reemplazan los rótulos de texto de la fila institucional. |
| ~~`src/assets/atmosfera/hero-ruta-diurna.jpg`~~ | imagen | **Ya está cargada** (15/09/2026). El hero usa la nocturna en tema oscuro y la diurna en claro. |
| `TEMA_POR_DEFECTO` | `src/lib/tema.ts` | Tema con el que arranca quien nunca eligió: `'oscuro'`, `'claro'` o `'sistema'`. |
| Nueva novedad | `src/content/novedades/*.md` | Listado y home. `destacada: true` ya no cambia nada en el hero: quedó sin uso desde que el hero dejó de rotar. |
| `avance` (0–100), `estado`, `inicio`, `finEstimado` | `src/content/obras/*.json` | Barra y fechas en Obras. |
| Valores del cuadro | `src/content/tarifario.json` (o la API con `FUENTE_DATOS=api`) | Todas las tablas y la home. |

Después de cualquier carga: `pnpm check && pnpm test && pnpm verificar`.

## Migración a dominio propio (pliego 61.7)

El paso a paso completo está en `README.md` ("Migración al dominio propio"). En corto: dominio personalizado `www.covicen.com.ar` en GitHub Pages (Settings → Pages) con el `www` en CNAME a `juliv08.github.io` y el apex con registros A/AAAA a GitHub, para que `covicen.com.ar` redirija con 301 al `www`; en el workflow, `PUBLIC_SITE_URL=https://www.covicen.com.ar`, `PUBLIC_BASE_PATH=/`, `PUBLIC_INDEXABLE=true`. **La URL va en la cartelería de las cabinas: no cambiarla después.**

## Qué NO está (por diseño)

Backoffice y sistemas (repo aparte), estado de rutas en vivo (datos de ejemplo hasta que exista el centro de operaciones), oficina virtual, seguimiento de reclamos, portal de proveedores, canal ético anónimo, popup de novedades, pagos en línea, calculadora de tarifa, chatbot, página por ruta, franjas horarias.

## Decisiones tomadas en la ejecución que quedan a tu criterio

- **El pie de página quedó claro.** Las tarjetas, las tablas y los paneles pasaron al navy oscuro en tema claro, pero el cromo de la página —header, barra superior, barra de emergencias y pie— se quedó como estaba, porque es el marco y no el contenido. Si querés que el pie también sea oscuro (queda bastante bien: cierra la página con un bloque parejo), es un renglón.
- **Los campos de formulario siguen claros** por el mismo criterio: son para escribir, no para leer. Si te resultan un salto muy grande al lado de las tarjetas oscuras, se pasan también.
- **La etiqueta de la cinta dice "AVISOS".** En Corresur dice "ESTADO DE LA RUTA" porque ahí la cinta muestra el estado de la traza; la nuestra muestra los avisos generales de `avisos.json`. Si preferís que muestre el estado de la ruta, es otro contenido y hay que decidir de dónde sale (hoy los datos del estado son de ejemplo).

- **Brillo de las fotos de fondo en oscuro: 62 %** (antes 50 %). Afecta la foto del hero y la del panel de Consorcio (la de Obras tiene su propio 80 %). Si el texto encima te parece justo de contraste, se baja en `--brillo-foto` de `src/styles/tokens.css`.
- **Foto de día del hero: ya está** (15/09/2026). El hero dejó de ser una zona oscura fija: en claro se ve la foto de día y en oscuro la nocturna. El panel del Consorcio sigue oscuro en los dos temas porque esa foto no tiene versión de día; si querés, se genera igual que la del hero y se saca la clase.
- **Cómo se ve el cambio de tema en la home.** Tocar el sol/luna en el home ya no corta la foto de golpe: el hero se funde al color del tema que viene (0,2 s), las fotos se cambian por debajo y la nueva aparece (0,4 s). El resto de la página cambia en el medio de esa disolvencia. Si el navegador está en "menos movimiento", el cambio es instantáneo, como antes. En el resto de las páginas no hay nada que disolver y el cambio es instantáneo siempre.
- **Interruptor de tema oculto sin JS**: sin JavaScript no puede cambiar nada, así que no se muestra. La alternativa (mostrarlo siempre) dejaría un botón que no hace nada.
- **Nombres de las estaciones sobre el mapa en el celular**: solo al tocar una (o al enfocarla); desde 768 px se ven siempre. El nombre está en la tarjeta que aparece debajo.
- **Estado de la traza e incidentes del mapa son datos de ejemplo** con cartel. Si preferís que no se vea nada hasta tener datos reales, es `disponible: false` en `estado-ruta.json` (aparece el hueco "Próximamente").
- **Categorías futuras 7 y 8 de la tabla de Tarifas se solapan** ("Más de 6 ejes" ×7 y "Más de 8 ejes" ×9): así lo escribe el PETG 53.2 y se publica literal con la cita, antes que corregir al pliego por nuestra cuenta.
- **Se quitó "+10 prorrogables"** de Quiénes somos: era un dato de prensa sin artículo del pliego. El campo `prorrogaAnios` sigue en `empresa.json` por si aparece la fuente.
- **`Senal` (los chips) usa 12 px** como única excepción justificada a la regla de 14 px: un chip es una anotación por definición.
- **La tarjeta de estación escribe el 140 literal** (no lo lee de `contacto.json`): lo fija el pliego (PETG 59) y `verificar.ts` exige `tel:140` en toda página.
- **`verificar.ts` no busca los textos prohibidos en js/css/svg**: en esos archivos "681" haría match en hashes de assets, y ningún texto de usuario vive ahí. Sí los busca en el HTML crudo (meta, alt, JSON-LD incluidos), en los JSON y en el sitemap.
- **Fila del tarifario sin valor** (si algún día una categoría no tiene precio): muestra un guion con texto para lectores de pantalla, no "a confirmar".
- **El mapa sin JavaScript no usa `:target`** (la spec lo pedía así y no se hizo): sin JS quedan listadas las seis tarjetas de estación debajo del mapa y **cada baliza es un enlace a `/peajes/<slug>/`**, la ficha completa de esa estación. Quedó mejor que lo especificado — una URL compartible y una página real, en vez de un salto dentro de la misma pantalla —, así que se deja como está y se anota la diferencia.
- **El carrusel del hero se dio de baja entero** (lo pediste el 15/09/2026). Con él se fueron el `scroll-snap` que la spec pedía para deslizar con el dedo, los controles, los puntos y el script que los movía. El JS de cliente bajó de 6,3 a 5,4 KB.
- **Las respuestas de las preguntas frecuentes se imprimen con un truco de CSS moderno**, no con JavaScript: en navegadores viejos pueden no salir. Es un límite conocido, no un bug; si te pasa, se rehace con JS (ver Preguntas frecuentes).
- **En el celular, las letras del mapa siguen chicas**: el dibujo entero se achica con la pantalla. En desktop ya se agrandaron; arreglarlo en celular pide cambiar cómo se dibuja el mapa en pantallas chicas, y se encara aparte si te molesta al verlo.
- **El exceso de carga se publica con los dos tramos** (50× entre 10 % y 30 %, 100× arriba del 30 %) y no como "50x y 100x" a secas, que es lo que decía la spec: el pliego parte el exceso así y sin los tramos el número no se entiende.
- **Filtro de URLs del contrato** (no se ve en pantalla): los enlaces que vengan del backend solo pueden ser `http(s)`. Si querés comprobar que no se rompió nada, tienen que seguir andando el enlace "Resolución en el Boletín Oficial" del dorso de la tarjeta que gira en la home, y el renglón "Resolución 248/2026 de la Dirección Nacional de Vialidad. Ver en el Boletín Oficial." de arriba a la derecha en `/tarifas/`.
- **Los tamaños de letra no cambiaron en pantalla**: lo que se hizo fue dejar por escrito que las volantas (los rótulos chiquitos en mayúsculas — "01 · TARIFA" arriba de cada sección, los títulos de columna del pie, la línea "RN 9 · km 352" de cada estación) van a 12 px a propósito, y poner un test que a partir de ahora **hace fallar la compilación** si alguien mete un texto nuevo de 12 px sin marcarlo como anotación. Es una traba para el futuro, no un cambio visual.
