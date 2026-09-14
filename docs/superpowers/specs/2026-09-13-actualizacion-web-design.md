# Actualización de la web de Covicen (septiembre 2026) — diseño (spec)

- **Fecha:** 2026-09-13
- **Estado:** aprobado por secciones en brainstorming con Juli; pendiente de revisión del documento escrito.
- **Alcance:** **solo la web pública** (landing Astro, GitHub Pages). El backoffice y los sistemas se trabajan en otra sesión; acá todo lo "administrable" se resuelve como datos del repo detrás de la costura ([[Costura de datos]]), listos para que el sistema los alimente después.
- **Contexto:** `obsidian/Home.md` → [[Contexto del negocio (Corredores Viales)]], [[Arquitectura de informacion de la landing]], [[Decisiones de arquitectura]], [[Sistema de diseno]]. Spec anterior: `docs/superpowers/specs/2026-08-27-landing-covicen-design.md` (esta la extiende; donde se contradicen, manda esta).
- **Fuentes de los cambios:**
  1. Documento "Punteo de tareas Covicen" (Google Docs, recopilación del equipo).
  2. Reunión de revisión con el gerente (video, ~41 min, transcripción en `C:\Users\Villex\Downloads\transcript.md`), comparando la web contra Corresur y CVSA.
  3. **Pliego de Especificaciones Técnicas Generales** (PETG, `IF-2026-17763777-APN-DNV#MEC`, 158 páginas, firmado el 20/02/2026) y **Pliego de Especificaciones Técnicas Particulares del Tramo Centro** (PETP, 18 páginas). Los PDF disponibles llevan marca de agua **"PRELIMINAR"**: los datos se toman de ahí y se marcan para reconfirmar contra la versión firmada cuando exista.
  4. Investigación web del 2026-09-13 sobre el cuadro tarifario vigente (Boletín Oficial, cvsa.com.ar, corresur.com.ar).

## 1. Qué se construye y para qué

La misma landing, llevada de "producto para vender el proyecto" a **sitio que cumple lo que el contrato de concesión exige a la web** desde la toma de posesión (5 de octubre de 2026), con los cambios pedidos por el cliente en la reunión. Tres cosas mandan, en este orden:

1. **El pliego.** El PETG art. 61.6 lista lo que el sitio *debe* tener y el 61.7 cómo debe estar hecho (ver §13). La mitad de los pedidos de la reunión no son gusto: son contrato.
2. **El automovilista del 5 de octubre**, que sigue siendo la audiencia principal: cuánto, dónde, cómo pago, a quién llamo. Ahora con el 140 en todos lados y un botón de asistencia.
3. **El cliente**, que quiere verse en la web: header con TelePASE y Mi cuenta, mapa con tarjetas, tarifas por estación, Quiénes somos de verdad, y poder ver el sitio en claro.

Regla de contenido que atraviesa todo: **esconder lo que no está, no publicar "a confirmar"**. Y la de siempre: **solo afirmaciones verificables**, cada dato con su fuente (artículo del pliego, resolución, URL).

## 2. Decisiones cerradas

| Tema | Decisión | Por qué |
|---|---|---|
| Alcance | Solo web. Nada de backoffice en esta spec. | Pedido de Juli. Lo administrable = datos en `src/content/` + método en `FuenteDatos`. |
| Emergencias | **140**, fijo y grande en todo el sitio, con `tel:140`. | Confirmado por Juli; es el número corto obligatorio del PETG art. 59. |
| Marca | **Se elimina "Corredor Vial del Centro"** de todo el sitio. **"Tramo Centro" queda.** | Pedido del cliente. "Tramo Centro" es el nombre oficial de la concesión y lo que la gente googlea. |
| Placeholders | **Esconder hasta tener el dato.** El slot queda en el código. | Un sitio de servicio público lleno de "a confirmar" resta credibilidad antes del arranque. |
| Tema | **Oscuro por defecto por ahora + interruptor claro/oscuro.** En claro, el hero usa la misma foto pero de día. El tema por defecto lo define el cliente después (constante). | El gerente dijo dos veces "muy oscura". El contraste del oscuro cumple el pliego de sobra (medido: texto 15,6:1), así que es gusto, no obligación; el interruptor permite decidir viendo. |
| Orden del trabajo | **Tokens y tema primero (Fase 0)**, después todo lo demás sobre los dos temas. | Cada componente nuevo se hace una vez. Contenido primero implicaba retrabajo en cada pieza. |
| Header | **Dos filas**: barra superior de 40 px (anuncios + TelePASE · Mi cuenta · tema) y header de 72 px (logo · menú completo desde 1024 px · 140). | Con una fila no entra: hoy quedan ~45 px libres en desktop. El cliente quiere el menú desplegado en desktop. |
| Barra de anuncios | **Siempre visible**, rotativa, con avisos en el repo (`avisos.json`) detrás del contrato. Si la lista quedara vacía, no se muestra la sección de anuncios; la barra queda con TelePASE, Mi cuenta y el interruptor (robustez, no requisito). | Pedido del doc; Juli la quiere lista para que el módulo de novedades del backoffice la alimente. |
| Tarifas: qué cuadro | El **cuadro heredado de Corredores Viales** (Res. 248/2026, vigente desde el 26/02/2026), idéntico en las tres estaciones existentes, con origen y vigencia explícitos. | Es lo que el PETP art. 3 manda aplicar desde la toma de posesión, y lo que pidió el gerente. |
| Tarifas: columna manual | **Dos columnas (TelePASE / Pago electrónico o manual) con el mismo valor hoy**, y la leyenda del sector al pie. | La Res. 248/2026 fija un solo precio ("Modalidad de Pago Manual y Automático"). El doble es el esquema propio de Corresur; publicarlo acá atribuiría a la resolución un valor que no fija. |
| Tarifas: estimaciones | **No se publica** ninguna actualización estimada (el "~$1.900" de la reunión). | Dato de tercera mano, sin resolución. |
| Correo `atencionalusuario@covicen.com.ar` | **No se publica hasta que la casilla funcione.** Slot listo. | El pliego exige acuse en 24 hs; un correo que rebota es peor que ninguno. El dominio se registra con el CUIT y apoderamiento de Covicen. |
| CUIT / datos registrales / QR AFIP | **Ocultos** hasta tener la inscripción. | Todavía no está el CUIT. |
| Quiénes somos | **Texto nuevo, original y persuasivo**, verificado contra las webs de otras concesionarias. Sin el mojón de km. | El actual es relleno ("guitarrita"). "Proyectando tu camino" era una frase en broma de la reunión: no existe. |
| Popup de novedades | **No.** | Postergado en la reunión ("eso esperemos todavía"); va contra "óptima experiencia y usabilidad" del pliego. |
| Contrato compartido | En `tramo` y `tarifario` **solo campos opcionales o valores nuevos en enumeraciones**. | El backend valida sus respuestas contra `docs/contrato/*.schema.json`; un campo requerido nuevo le rompe la CI. Un opcional o un valor más en un enum no cambian lo que él ya manda. |
| Datos del tramo | **679,03 km** y extremos oficiales del PETP art. 1. | El sitio decía 681,92 (prensa). El pliego manda. |
| Pliegos en la web | **No se publican** los PDF hasta tener la versión definitiva y el OK de Covicen. | Los que hay dicen "PRELIMINAR". |
| Hero de día | Lo genera Juli con la herramienta con la que hizo la nocturna, con el prompt del Anexo A. Bloom no sirve (0 créditos). | Misma composición → se reutiliza el mapa de profundidad, que es procedural. |

## 3. Datos oficiales que corrigen lo publicado

### 3.1 El tramo (PETP art. 1)

| RN | PK inicial | PK final | Desde | Hasta | Longitud |
|---|---|---|---|---|---|
| 9 | 297,00 | 660,16 | Empalme RN A-008 (Rosario, Santa Fe) | Inicio de concesión de la Red de Accesos a Córdoba (Pilar, Córdoba) | 363,16 km |
| 19 | 0,00 | 127,19 | Empalme RN 11 (Santo Tomé, Santa Fe) | Límite Santa Fe / Córdoba | 127,19 km |
| 34 | 0,00 | 188,68 | Empalme RN A-008 (Rosario, Santa Fe) | Empalme RN 19 | 188,68 km |
| **Total** | | | | | **679,03 km** |

Consecuencias: la RN 34 concesionada **no llega a Rafaela** (termina en el empalme con la RN 19); la RN 19 **arranca en Santo Tomé**, no en "Santa Fe"; el total es **679,03**, no 681,92 ni 681. En pantalla, "679 km".

### 3.2 Estaciones de peaje (PETP art. 2, confirmado en la imagen de la pág. 5)

| Estación | Ruta | Progresiva | Vías | Situación | Color en el mapa |
|---|---|---|---|---|---|
| Carcarañá | RN 9 | km 340 | 10 | existente, operativa | verde |
| James Craik | RN 9 | km 588 | 8 | existente, operativa | verde |
| Franck | RN 19 | km 19,95 | 6 | existente, operativa | verde |
| Leones | RN 9 | km 454 | — | nueva, a construir, Free Flow desde el inicio | amarillo |
| San Francisco | RN 19 | km 120 | — | nueva, a construir, Free Flow | amarillo |
| Totoras | RN 34 | km 60 | — | nueva, a construir, Free Flow | amarillo |

Las nuevas cobran cuando exista el acta de finalización de la Obra Inicial de Puesta en Valor y la estación esté construida. El cuadro tarifario de la nueva estación es el de Carcarañá (PETP art. 3). La estación San Vicente (RN 34 km 160) deja de operar.

**Para confirmar con Covicen:** la estación "San Francisco" está en el km 120 y el tramo termina en el límite provincial en el km 127,19; por progresiva quedaría del lado de Santa Fe (Frontera), no en Córdoba como dice hoy el JSON. No se cambia sin confirmación.

### 3.3 Cuadro tarifario vigente (Res. 248/2026 DNV)

- **Norma:** RESOL-2026-248-APN-DNV#MEC, Boletín Oficial 24/02/2026 (`https://www.boletinoficial.gob.ar/detalleAviso/primera/338657/20260224`), anexo `IF-2026-18452702-APN-DNV#MEC`. Vigencia desde el 26/02/2026 a las 0:00. CVSA la cita por su número GDE (`RESOL-2026-18463734`): es el mismo acto.
- **Idéntico en Carcarañá, James Craik y Franck.** Una sola columna de precio: "Modalidad de Pago Manual y Automático".

| Cat. | Tipo de vehículo (criterio del esquema de 5 categorías) | Sin IVA | Al público (IVA 21 %) |
|---|---|---|---|
| 1 | Hasta 2 ejes, hasta 2,30 m de altura, sin rueda doble | 1.239,67 | **1.500** |
| 2 | Hasta 2 ejes y más de 2,30 m y/o rueda doble; más de 2 y hasta 4 ejes, menos de 2,30 m, sin rueda doble | 2.479,34 | **3.000** |
| 3 | Más de 2 y hasta 4 ejes, más de 2,30 m y/o rueda doble | 3.719,01 | **4.500** |
| 4 | Más de 4 y hasta 6 ejes | 4.958,68 | **6.000** |
| 5 | Más de 6 ejes | 6.198,35 | **7.500** |

El criterio de las categorías es el que publica Corresur para el mismo esquema de 5 categorías; CVSA no lo publica. Se cita como tal. Las categorías 0 a 8 del PETG art. 53.2 (motos ×0,5, hasta ×9) rigen **después** de las Obras Iniciales de Puesta en Valor; se publican como información, sin precios.

### 3.4 Otros datos del pliego que van a la web

- **Descuentos por frecuencia** (PETG 53.3, autos, vía TelePASE, por estación y mes calendario, ambos sentidos): 15 % desde la pasada 36, 25 % desde la 45, 35 % desde la 61.
- **Exentos** (PETG 52, con TelePASE habilitado obligatorio): ambulancias; Fuerzas Armadas y de Seguridad; bomberos; vehículos y agentes de la DNV; ANSV; Cruz Roja (Ley 27.547); personas con discapacidad y ex combatientes de Malvinas según reglamento de la DNV.
- **Falta de pago** (PETG 51.1.4): +1 tarifa si paga dentro de los 30 días; +2 tarifas más intereses (tasa activa BNA) después. Cuenta bancaria del concesionario para regularizar.
- **Modalidades de pago** (PETG 51.1): prepago y pospago con TelePASE (factura con detalle de pasadas en la autogestión de TelePASE / plataforma convalidada), contado en vías habilitadas.
- **TelePASE gratuito** (PETG 50.5): adhesión, primer TAG por vehículo, colocación, renovación, cancelación, reposición y gastos administrativos.
- **Grúa y remolque gratuitos** (PETG 54): despeje de calzada y traslado hasta la localidad o estación de servicio más próxima. Tiempos: livianos 30 min en el 90 % de los casos y 40 min como máximo; pesados 60 / 72 min. Obligación de informar los tiempos y cuántos pasajeros lleva la grúa (54.3).
- **Servicios con costo** (PETG 55): mecánica general; remolque más allá del punto gratuito.
- **Sectores de detención segura** (PETG 56): gestiones de TelePASE (comercial, exentos, tarifa diferencial/vecinal), mínimo 8 hs en días hábiles entre 8 y 20; señalizados con días y horarios.
- **Canales y plazos** (PETG 58): ver §9.2.
- **Actualización tarifaria trimestral** (PETG 82 d). **Exceso de carga** (PETG 83): 50× y 100× la tarifa.
- **Tarifa diferencial** (PETP art. 4; CVSA): vecino/frentista y docente, solo categoría 1, reempadronamiento anual, trámite gratuito por TAD. **El monto no es público.**
- **Obras obligatorias** (PETP art. 6): reconstrucción de losas de hormigón en RN 9 y RN 19; banquinas pavimentadas en RN 9 entre Rosario y Carcarañá; mantenimiento del puente sobre el río Carcarañá en RN 34. Rehabilitación asfáltica por secciones (art. 7).
- **Móviles de seguridad vial** (PETP art. 13): uno en RN 9 y uno en RN 19.

## 4. Tema claro/oscuro (Fase 0)

### 4.1 Mecanismo

- `<html data-tema="oscuro"|"claro">`. El bloque `@theme` actual de `src/styles/tokens.css` es el tema oscuro. Un bloque nuevo `[data-tema="claro"] { --color-…: … }` redefine **solo la capa semántica**; los tokens de marca no cambian. Los componentes siguen usando los mismos nombres.
- `color-scheme` por tema (`dark` / `light`) y `<meta name="theme-color">` actualizado por script.
- `src/lib/tema.ts`: `export const TEMA_POR_DEFECTO: 'oscuro' | 'claro' | 'sistema' = 'oscuro'`. Con `'sistema'` sigue `prefers-color-scheme`. El cliente decide el valor después; es una palabra.
- **Sin destello:** un `<script is:inline>` en el `<head>` de `Base.astro` (antes de cualquier estilo que dependa del tema) lee `localStorage['covicen:tema']` (`CLAVE_TEMA`, con `try/catch`), cae a `TEMA_POR_DEFECTO`, y fija `data-tema` y `theme-color` antes del primer pintado. Como el sitio usa `<ClientRouter />`, el mismo snippet se reaplica en `astro:after-swap` (los atributos de `<html>` se reemplazan en cada navegación).
- **Interruptor:** botón en la barra superior (ícono sol/luna de lucide), `aria-label="Cambiar a tema claro"` / `"…oscuro"`, `aria-pressed`. Guarda en `localStorage['covicen:tema']` y emite `document.dispatchEvent(new CustomEvent('tema:cambio'))` para que el canvas de la grilla y el parallax reaccionen. En celular vive dentro del menú.

### 4.2 Tokens semánticos del tema claro (verificados ≥ 4,5:1 con el script de contraste)

| Token | Oscuro (hoy) | Claro | Notas |
|---|---|---|---|
| `fondo` | `#0B1526` | `#EEF1F4` (gris-fondo del manual) | |
| `fondo-2` | `#10203A` | `#F7F9FB` | |
| `superficie` | `#16304E` | `#FFFFFF` | tarjetas |
| `superficie-2` | `#1E4870` | `#DDE6EE` | desplegables, badges fríos |
| `texto` | `#E8EEF5` | `#16304E` | 11,8:1 sobre fondo claro |
| `texto-2` | `#A9C4D8` | `#5A6472` (gris-texto del manual) | 5,3:1 |
| `texto-3` | `#8593A0` | `#546070` | 5,6:1; en ningún tema va sobre `superficie-2` |
| `acento` | `#68BCE1` | `#2C688F` (marca-700) | links; el celeste da 2,2:1 sobre blanco |
| `acento-hover` | `#8FCDE8` | `#1E4870` | |
| `vial` | `#F0C419` | `#F0C419` | solo como fondo de señalética |
| `vial-texto` **(nuevo)** | `#F0C419` | `#6E5A00` | amarillo usado como texto; 5,9:1 en claro |
| `sobre-vial` **(nuevo)** | `#0B1526` | `#0B1526` | texto sobre amarillo, 11:1 |
| `sobre-acento` **(nuevo)** | `#0B1526` | `#FFFFFF` | texto de botón primario; 6,0:1 en claro |
| `ok` **(nuevo)** | `#7BD389` | `#1B6B35` | estación operativa; 10:1 / 5,8:1 |
| `sobre-ok` **(nuevo)** | `#0B1526` | `#FFFFFF` | |
| `error` | `#FF8A80` | `#B3261E` | 5,8:1 en claro |
| `borde` / `borde-fuerte` | blanco .10 / .18 | `rgb(30 72 112 / .14)` / `.28` | |
| `glow` | celeste .35 | `rgb(44 104 143 / .25)` | |
| `sombra` **(nuevo)** | `rgb(0 0 0 / .6)` | `rgb(30 72 112 / .18)` | |
| `cabecera` **(nuevo)** | `rgb(16 32 58 / .85)` | `rgb(238 241 244 / .85)` | fondo del header al scrollear |
| `tarjeta-interior-1/2/3` **(nuevo)** | `#17334F` `#10203A` `#0B1526` | `#FFFFFF` `#F7F9FB` `#EEF1F4` | degradé interior de `.tarjeta` |
| `plano` **(nuevo)** | blanco .04 | `rgb(30 72 112 / .06)` | grilla de fondo |
| `luz` **(nuevo)** | celeste .09 | `rgb(44 104 143 / .08)` | resplandores |
| `--brillo-foto` **(nuevo)** | `0.62` | `1` | filtro de las fotos de atmósfera |

Todos los colores fijos que encontró el barrido (`tarjetas.css`, `Header.astro`, `Boton.astro`, `Hero.astro`, `TarifaDestacada.astro`, `HeroRuta.astro`, `MapaTramo.astro`, `grilla-cinetica.ts`, `global.css`) pasan a estos tokens. Excepciones permitidas: el isotipo (`Isotipo.astro`, es el logo) y `og.svg` (imagen estática, siempre oscura). Un test lo hace cumplir (§12.2).

### 4.3 Utilidades con semántica invertida

- `text-fondo` sobre amarillo → `text-sobre-vial` (`Senal`, `BarraEmergencias`, botón 140). `text-fondo` sobre acento → `text-sobre-acento` (`Formulario`, botones).
- **Bug vigente:** `src/pages/emergencias.astro` usa `text-fondo` sobre `.tarjeta` navy: texto casi invisible en oscuro. Pasa a `text-texto`.
- Velos sobre fotos (`Hero.astro`, `Consorcio.astro`): siguen usando `from-fondo`; en claro son un velo claro, que es lo correcto. El filtro de `ImagenAtmosfera` y `ParallaxProfundidad` lee `var(--brillo-foto)`.
- El canvas de `grilla-cinetica.ts` lee `--color-plano`, `--color-acento` y `--color-glow` con `getComputedStyle` al montar y en `tema:cambio`.

### 4.4 El hero en claro

- `Hero.astro` deja de escribir los nombres de archivo a mano: recibe `noche="hero-ruta-nocturna"` y `dia="hero-ruta-diurna"` y consulta `imagenAtmosfera()` por cada uno.
- Si existe `src/assets/atmosfera/hero-ruta-diurna.jpg` (mismo encuadre y punto de fuga que la nocturna): se renderizan dos `ParallaxProfundidad`, uno por tema, con `hidden` controlado por `[data-tema]`; la de día lleva `loading="lazy"` (un elemento sin caja no dispara la carga) y comparte `hero-ruta-nocturna.profundidad.png`, que es procedural (`scripts/generar-profundidad.py` no lee la foto). El parallax vuelve a montar la textura en `tema:cambio`.
- Si no existe: en claro se muestra la nocturna con `--brillo-foto: 1` y el velo claro. Se lee como un atardecer. El sitio queda terminado igual.
- Prompt para generar la foto de día: Anexo A.

## 5. Header de dos filas, barra de anuncios y footer

### 5.1 Barra superior (40 px, fija junto con el header)

- **Izquierda: anuncios.** `datos.avisos()` (método nuevo en `FuenteDatos`, solo fuente local) lee `src/content/avisos.json`: `{ id, texto, url?, desde?, hasta?, tono: 'info' | 'vial' }[]`. Se filtran por fecha en el build (el workflow corre a diario, así que las vigencias entran y salen solas). Rotación con fundido cada 6 s; se detiene con `:hover`, foco y `prefers-reduced-motion` (ahí muestra el primero, con botón "siguiente"). Marcado como `<section aria-label="Anuncios">` con `aria-live="off"` (no interrumpe al lector de pantalla) y botones anterior/siguiente con nombre. Si la lista filtrada queda vacía, no se renderiza la sección de anuncios; la barra sigue, con los accesos de la derecha.
- **Derecha (≥ 1024 px):** `TelePASE` (link externo a `contacto.enlaces.telepase`), `Mi cuenta` (link a `contacto.enlaces.oficinaVirtual` si existe; si es `null`, a `/medios-de-pago/#mi-cuenta`), interruptor de tema. En celular la barra muestra solo el anuncio; esos tres van dentro del menú.

### 5.2 Header (72 px)

- Logo sin descriptor (`Logotipo` pierde la prop `conDescriptor`).
- Menú completo desde 1024 px con los siete ítems actuales (Tarifas · El tramo · Servicios · Obras · Novedades · Nosotros ▾ · Contacto). El desplegable "Nosotros" suma `aria-expanded`.
- **Botón 140:** `<a href="tel:140" class="btn-vial" aria-label="Llamar a emergencias, 140">` con "Emergencias" en eyebrow, el número en Archivo 800 (1,25 rem) y el ícono de teléfono. Visible desde 640 px; debajo, la `BarraEmergencias` inferior fija ya existente, también con el 140 grande y el botón de asistencia (§10.2).
- El botón repetido en los accesos rápidos del home queda (redundancia aceptada en la reunión).
- `.btn-vial` se define una sola vez, en `Boton.astro` (hoy está duplicada en `Header.astro`).
- Con la barra superior, `--alto-header` pasa a `7rem` (112 px) en desktop y el `padding-top` del `<main>` y el `top` de `HiloRuta` la siguen.

### 5.3 Footer

- **Columna marca:** isotipo + "COVICEN" (sin descriptor), texto "Concesionaria del Tramo Centro de la Red Federal de Concesiones. RN 9 · RN 19 · RN 34 · Córdoba y Santa Fe."
- **Usuarios / Empresa:** se suman Asistencia en ruta, Trámites y Canales de atención cuando existan las páginas.
- **Contacto:** 140 (`tel:`); slots **ocultos mientras sean `null`**: 0800, correo de atención al usuario, WhatsApp; redes como fila de íconos (Instagram, X, LinkedIn, Facebook, YouTube) desde `contacto.redes`, oculta si no hay ninguna.
- **Datos registrales:** la columna entera se oculta mientras `razonSocial`, `cuit` o `domicilioLegal` sean `null`. Cuando existan: razón social, CUIT, domicilio legal, **domicilio comercial** (campo nuevo), y el **QR de Data Fiscal** (`public/qr-afip.png`, lo carga Juli) enlazando a la constancia.
- **Fila institucional con logos** (exigida por PETG 61.6 para los tres primeros): Vialidad Nacional (`https://www.argentina.gob.ar/transporte/vialidad-nacional`), Secretaría de Transporte (`https://www.argentina.gob.ar/transporte`), Presidencia de la Nación (`https://www.argentina.gob.ar/`), Red Federal de Concesiones (`https://www.argentina.gob.ar/transporte/vialidad-nacional/red-federal-de-concesiones`), TelePASE (`https://www.telepase.com.ar/`) y el 140. Logos oficiales en SVG monocromo si se consiguen (pedido a Covicen/DNV); si no, **lockups tipográficos** en Archivo con el mismo estilo. No se dibujan marcas ajenas a mano. Se mantiene el link de texto al Boletín Oficial. Se agrega el link a los canales de atención al usuario de la DNV cuando Covicen o la DNV indiquen la URL (PETG 61.6).
- **Línea inferior:** "Sociedad en formación" mientras `enFormacion`; "Adjudicación: Res. 1379/2026"; Privacidad; y **"Última actualización: {fecha y hora del build, hora Argentina}"**, real, no la hora de la visita.

## 6. Datos y contrato

### 6.1 Cambios en `src/content/`

- `empresa.json`: se elimina `descriptor`; `concesion.km: 679.03`; `domicilioComercial: null` (nuevo). `tarifaOfertadaSinIva: 1399` queda como dato de la adjudicación (se usa para explicar cómo se fija la tarifa, nunca como precio).
- `contacto.json`: `emergencias.telefono: "140"`; nuevos `lineaGratuita: null` (0800), `atencionUsuario: null` (correo), `enlaces: { telepase: "https://www.telepase.com.ar/", oficinaVirtual: null, atencionDnv: null }` (`atencionDnv`: canales de atención al usuario de la DNV, PETG 61.6, cuando indiquen la URL), `canales: [...]` (§9.2). `redes` puede sumar `facebook` y `youtube`.
- `tramo.json`: `km: 679.03`; rutas con extremos oficiales, `pkInicial`/`pkFinal`, sin notas "a confirmar"; ciudades: se agregan `santo-tome` y `empalme-rn-19` (nodo del empalme; la localidad exacta se verifica al cargar los datos), Rafaela y Santa Fe quedan como referencia con `principal: true` pero fuera de los trazados; trazados: RN 19 `santo-tome → franck → empalme-rn-19 → san-francisco` (el nodo del empalme es donde la RN 34 cierra sobre la RN 19), RN 34 `rosario → totoras → empalme-rn-19`; cabinas con km y vías oficiales, `operativa`, `servicios`, `freeFlow: true` en las tres nuevas; avisos actualizados con la fuente (PETP).
- `tarifario.json`: cuadro de la Res. 248/2026 (§3.3), `origen: 'heredado'`, `resolucion`, `cabinas: ['carcarana','james-craik','franck']`, `categoriaDestacada: 'cat-1'`, cinco tarifas con `montoSinIva` con centavos y `montoManualSinIva` igual al de TelePASE, `descripcion` con el criterio, `avisos` con la leyenda literal del Anexo B.
- Nuevos: `avisos.json`, `estado-ruta.json`, `servicios.json`, `normativa.json`, `tramites.json`, `consejos.json`. `obras/*.json` reemplazado por las obras obligatorias del PETP art. 6 y 7 (estado `planificada`). FAQ: 13 actualizadas + 4 nuevas. Novedades: 4 corregidas + 1 nueva.

### 6.2 Cambios en `src/lib/datos/esquemas.ts`

**Contrato compartido con el backend (`tramo`, `tarifario`): solo campos opcionales y, en `origen`, un valor más en el enum.** Después de tocarlo: `pnpm contrato` y commitear `docs/contrato/*.schema.json` (el test `tests/lib/contrato.test.ts` compara byte a byte).

```ts
// Ruta
pkInicial?: number; pkFinal?: number;
// Ciudad
tipo?: 'ciudad' | 'empalme';        // default 'ciudad'; el empalme RN 34 / RN 19 es un nodo del trazado, no una ciudad
// Cabina
vias?: number;                       // total de vías
operativa?: boolean;                 // true = cobra hoy (verde). Default derivado: situacion === 'existente'
sentido?: 'ambos' | 'ascendente' | 'descendente';
telefono?: string; horarioAtencion?: string;
servicios?: { areaDescanso?: boolean; detencionSegura?: boolean; gruaGratuita?: boolean;
              sanitarios?: boolean; colocacionTelepase?: boolean };
// Tarifa
montoManualSinIva?: number | null;   // pago electrónico o manual; hoy igual a montoSinIva
multiplicador?: number;              // categorías 0-8 del PETG 53.2 (informativo)
// Tarifario
origen: 'oferta' | 'homologada' | 'heredado';   // valor nuevo del enum
resolucion?: string;
cabinas?: string[];                  // slugs a los que aplica; ausente = todas
categoriaDestacada?: string;         // slug de la tarifa del home; ausente = la primera
excepciones?: { cabina: string; categoria: string; montoSinIva: number | null; montoManualSinIva?: number | null }[];
```

Reservado para cuando el sistema lo necesite (modelo de códigos de tarifa de la DNV, `CVSA/nexus/docs/transitos/TABLA_X_codigo_de_tarifa.csv`): `franja?: 'pico' | 'valle' | 'congestion' | 'promocion'` por tarifa. No se implementa ahora.

**Lista para pasarle a la sesión del backend:** los campos de arriba, todos opcionales, con estos nombres en camelCase; el backend puede empezar a mandarlos cuando quiera y mientras tanto sigue validando.

**No exportados (cambios libres):**

```ts
// Empresa: - descriptor; + domicilioComercial: string | null
// Contacto: + lineaGratuita: string | null; + atencionUsuario: email | null;
//           + enlaces: { telepase: url; oficinaVirtual: url | null; atencionDnv: url | null };
//           + canales: Canal[]; redes += facebook?, youtube?
// Canal { id, nombre, tipo: 'telefono'|'web'|'correo'|'whatsapp'|'presencial', valor: string|null,
//         disponibilidad, acuse, respuesta, fuente }
// EstadoRuta: + ejemplo?: boolean; incidentes[] += tipo: 'transito'|'obra'|'incidente'|'clima',
//             sentido?, desde?, hasta?
// Nuevos: Aviso, Servicio { id, nombre, gratuito: boolean, descripcion, alcance?, tiempos?, fuente },
//         Norma { id, titulo, descripcion, url: url | null, descargable: boolean },
//         Tramite { id, nombre, quien, requisitos[], pasos[], plazo?, url?, fuente },
//         Consejo { id, titulo, texto, categoria }
```

`FuenteDatos` suma `avisos()`, `servicios()`, `normativa()`, `tramites()`, `consejos()`; `fuentes/api.ts` no los implementa (regla 4 de la costura: lo que el sistema no tiene no se simula). `index.ts` sigue componiendo `{ ...fuenteLocal, ...fuenteApi }`.

## 7. Mapa interactivo, El tramo y páginas de estación

### 7.1 Mapa (`MapaTramo.astro`, mismo componente en Home y El tramo)

- El `viewBox 0 0 820 520` **no cambia** (las coordenadas viajan por el contrato y el panel del backend las usa para la vista previa). Se agranda por layout: en el home ocupa todo el ancho del panel con la tarjeta de estación al costado en `lg` y abajo en celular; en El tramo, el contenedor completo.
- El `<svg>` pasa de `role="img"` a `role="group"` con `aria-labelledby` al título de la figura. Cada estación es `<a href={ruta('/peajes/<slug>/')} data-estacion={slug} aria-label="Estación {nombre}, {ruta} km {km}, {operativa ? 'operativa' : 'próxima'}">` dentro del SVG, con foco visible. Las ciudades siguen decorativas.
- **Tarjeta de estación** (`TarjetaEstacion.astro`): nombre, ruta y km, estado (Operativa / Próxima, con Free Flow si corresponde), vías, sentido, teléfono y horario si existen, servicios con íconos (área de descanso, detención segura, grúa gratuita, sanitarios, colocación de TelePASE), links a su cuadro tarifario, a su página y al 140. Sin JS se listan todas debajo del mapa; con JS (`mapa.ts`, < 1 KB) se muestra solo la elegida, la baliza elegida lleva `aria-current="true"`, el clic no navega (`preventDefault`) y muestra la tarjeta, y arranca elegida la primera operativa. `:target` funciona como respaldo sin JS.
- **Colores:** operativas con `--color-ok`, próximas con `--color-vial` y trazo discontinuo (`stroke-dasharray`), para no comunicar solo por color. La tarjeta y la leyenda lo dicen en texto.
- **Leyenda:** estación operativa · estación próxima · área de descanso · sector de detención segura · grúa/remolque gratuito · ciudad. Los ítems de servicios se renderizan solo si alguna estación tiene ese servicio.
- **Incidentes sobre el mapa** (solo en El tramo): cada incidente de `estadoRuta` se ubica sobre la polilínea de su ruta interpolando el km entre `pkInicial` y `pkFinal` a lo largo de la longitud del trazo. Marcador por severidad (`info`, `precaucion`, `corte`) con la misma tarjeta. Debajo del mapa: "Última actualización: {estadoRuta.actualizado}".
- Los tests de `ilustraciones.test.ts` se actualizan (seis enlaces con `aria-label`, `role="group"`, leyenda condicional).

### 7.2 Página El tramo

Título "679 kilómetros de centro." Cuatro bloques con navegación interna pegada bajo el header (anclas, sin JS): **Rutas y longitudes** (tabla con PK inicial, PK final, desde, hasta, km, desde `tramo.rutas`), **Estaciones de peaje** (las tarjetas), **Cuadros tarifarios** (la tabla de §8 por estación), **Áreas de descanso y servicios** (derivado de `cabinas[].servicios` y de `servicios.json`). El mapa a pantalla completa arriba, con incidentes.

### 7.3 Páginas de estación (`/peajes/[slug]/`)

Una por cabina (seis): tarjeta completa, cuadro tarifario de esa estación (o "sin habilitar" si no es operativa, con la fecha estimada si existe), medios de pago, el 140 y el botón de asistencia, breadcrumbs, JSON-LD `Place`. Título "Peaje {nombre} — {ruta} km {km} | Covicen". Es lo que la gente va a buscar el 5 de octubre.

## 8. Tarifas

### 8.1 Página `/tarifas/`

- Arriba: `Senal` "Vigente desde el 26 de febrero de 2026" + "Resolución 248/2026 de Vialidad Nacional" (link al BO) + "Rige el mismo cuadro en Carcarañá, James Craik y Franck" + etiqueta de origen "Cuadro heredado de Corredores Viales S.A., que Covicen aplica desde la toma de posesión (PETP art. 3)".
- **Una tabla por estación operativa** (navegación interna Carcarañá · James Craik · Franck). Columnas: Categoría (con `IconoVehiculo`) · Tipo de vehículo · **TelePASE** · **Pago electrónico o manual**. Precio al público en grande (con IVA, como en la cabina) y "sin IVA $1.239,67" en anotación (12 px). `<caption>` con la estación y la vigencia. Las tres próximas: fila "Sin habilitar: cobra cuando Vialidad Nacional la autorice, con el cuadro de Carcarañá".
- Pie de tabla, texto literal (Anexo B): la leyenda de pago electrónico manual y "La tarifa se actualiza por índices oficiales según el contrato de concesión, cada tres meses".
- **Se eliminan:** "Todavía no se cobra", el $1.399 como precio, las filas "a confirmar".
- Bloques debajo: **Descuentos por frecuencia** · **Exenciones** (lista + "con TelePASE habilitado" + links a los trámites de Malvinas `https://www.argentina.gob.ar/servicio/exencion-de-pago-de-peaje-ex-combatientes-de-malvinas` y de discapacidad en argentina.gob.ar, este último tomado del listado oficial de trámites de la DNV al cargar `tramites.json`) · **Tarifa diferencial** (existe para vecinos/frentistas y docentes, solo categoría 1, se renueva cada año; "el monto se informa al hacer el trámite") · **Si pasaste sin pagar** · **Las categorías después de las obras iniciales** (0 a 8 con multiplicador, sin precios, PETG 53.2). Botón **Imprimir**.
- `verificar.ts` sigue exigiendo "Vigencia" en la página.

### 8.2 Home

`TarifaDestacada` toma la tarifa `categoriaDestacada` (o la primera): "$1.500 · Autos · vigente desde el 26/02/2026 · Res. 248/2026", dorso con las tres estaciones, TelePASE y cómo se actualiza. Se elimina el `find('cat-2')` con `throw` y el aviso por índice.

## 9. Contenido que sale del pliego

Todo como datos en `src/content/` leídos por `datos.*()`, cada ítem con `fuente` (artículo). Copy en voseo sobrio.

### 9.1 Servicios al usuario (`/servicios/`)

Dos listas separadas (PETG 54 y 55): **gratuitos** (grúa y remolque con alcance y tiempos publicados; móviles de seguridad vial; 140 las 24 hs los 365 días; TelePASE sin costo en adhesión, primer TAG, colocación, renovación, cancelación y reposición; sanitarios libres y gratuitos donde existan) y **con costo** (mecánica general; remolque más allá del punto gratuito). Slots ocultos: cuántos pasajeros lleva la grúa; ubicación y horario de los sectores de detención segura.

### 9.2 Canales de atención (`/contacto/` reordenada; bloque `Canales.astro` reutilizable en footer y Emergencias)

| Canal | Acuse (TA) | Respuesta (TR) | Disponibilidad |
|---|---|---|---|
| 140 | inmediato | inmediato | 24 hs, 365 días |
| Botón de asistencia en la web | inmediato | inmediato | 24 hs |
| Formulario web / correo | 24 hs | 5 días hábiles | — |
| 0800 | inmediato | 5 días hábiles | mínimo 8 hs en días hábiles, entre 8 y 20 |
| WhatsApp / ChatBot | 24 hs | 5 días hábiles | a los 90 días de la toma de posesión |

Los canales sin valor (`valor: null`) se listan con nombre y plazos y la frase "se habilita con la toma de posesión, el 5 de octubre de 2026". "Los plazos pueden extenderse por igual término, con aviso previo al usuario" (PETG 58.1). Bloque **Cómo hacer un reclamo**: pasos, número de gestión, plazos, y cómo escalar a la DNV.

### 9.3 Medios de pago (`/medios-de-pago/`, desde datos)

Prepago, pospago y contado (PETG 51.1); TelePASE (qué es, gratuidad, dónde se coloca: estaciones con `servicios.colocacionTelepase`, link oficial); Free Flow en las tres estaciones nuevas (desde `tramo`); sección **`#mi-cuenta`**: "En la oficina virtual vas a poder ver tus pasadas, tus facturas, tu deuda, descargar comprobantes y pagar" con el botón activo cuando `contacto.enlaces.oficinaVirtual` exista; **Pasaste sin pagar**: recargos y cómo regularizar (la cuenta bancaria es un slot oculto). Deja de nombrar estaciones a mano.

### 9.4 Quiénes somos (`/quienes-somos/`)

Texto nuevo, original, persuasivo y verificable: quiénes somos (consorcio de tres empresas de Córdoba y Santa Fe: AFEMA S.A., Pablo Federico e Hijos S.A., Guido Mogetta S.A.; adjudicación por Res. 1379/2026 el 24/08/2026; 20 años), qué asumimos (obras obligatorias del PETP art. 6 y 7; mantenimiento; auxilio gratuito; el 140), cómo nos controlan (DNV, indicadores del contrato), misión y visión en dos frases sin humo. Sin el mojón de km. Sobre las empresas, solo los descriptores ya cargados; se amplía cuando llegue el relevamiento de Gastón. **Verificación de originalidad**: antes de publicar, un script compara n-gramas de 6 palabras contra los textos institucionales de los sitios de Corresur, CVSA, Autovía del Mercosur y Caminos del Río Uruguay; cero coincidencias. Se corre una vez al escribir el texto, no en CI (depende de sitios ajenos). Slot oculto para el **organigrama** (`src/assets/institucional/organigrama.{png,svg,pdf}`; aparece cuando el archivo existe).

### 9.5 Transparencia (`/transparencia/`)

Marco legal como hoy. **Normativa descargable** (PETG 61.6) desde `normativa.json`: Res. 1379/2026 (adjudicación), Res. 248/2026 (cuadro tarifario), Ley 27.742, Decreto 97/2025, con links al BO. Los pliegos entran como ítems `descargable: false` con la nota "se publican con la versión definitiva" hasta que Covicen mande los PDF firmados. **Póliza de responsabilidad civil** (PETG 61.6): bloque con aseguradora, número, vigencia y PDF, oculto mientras no haya datos. Datos registrales con el mismo criterio. Licitaciones y canal ético como hoy.

### 9.6 Guía de trámites (`/tramites/`, nueva)

Desde `tramites.json`: tarifa diferencial vecino/frentista y docente (requisitos según CVSA: DNI con domicilio, escritura o contrato, servicio, cédula; solo categoría 1; renovación anual; por Trámites a Distancia), exención por discapacidad, exención para ex combatientes de Malvinas, alta de TelePASE. Cada trámite con quién puede, requisitos, pasos, plazo si existe y link oficial. Formulario (c) de §10.4.

### 9.7 Seguridad vial, Emergencias, Obras, FAQ, Novedades

- `/seguridad-vial/`: consejos desde `consejos.json` + bloque "Qué hacer ante una emergencia en la ruta" (llamá al 140; detenete fuera de la calzada; balizas y chaleco; no cruces la autopista a pie; esperá dentro o detrás del guardarraíl), marcado en el vault para revisión de Seguridad Vial.
- `/emergencias/`: 140 grande, tiempos de grúa, botón de asistencia, canales de emergencia, qué hacer. Corrección del bug de contraste.
- `obras/*.json`: reconstrucción de losas de hormigón RN 9 y RN 19; banquinas pavimentadas RN 9 Rosario–Carcarañá; puente sobre el río Carcarañá RN 34; rehabilitación asfáltica por secciones; señalización, iluminación y seguridad; cobro electrónico y Free Flow. Estado `planificada`, con la fuente.
- FAQ: se actualizan las 13 (cuánto cuesta → $1.500 y la Res. 248/2026; desde cuándo se cobra → desde la toma de posesión rige el cuadro heredado; dónde están → con km; TelePASE; Free Flow; reclamos con plazos) y se agregan cuatro: descuentos por frecuencia, exenciones, pasé sin pagar, tarifa vecinal.
- Novedades: las cuatro existentes se corrigen (679 km; el $1.399 es la tarifa ofertada, no el precio) y se agrega "Qué cuadro tarifario rige desde el 5 de octubre".

## 10. Interactivo

### 10.1 Estado de la traza (`EstadoTraza.astro`)

- Datos: `src/content/estado-ruta.json` con `disponible: true`, `ejemplo: true`, `actualizado` e incidentes de muestra en las tres rutas (uno por tipo). Método existente `datos.estadoRutas()`.
- Render: una fila por ruta (RN 9, RN 19, RN 34) con chip Normal / Precaución / Corte según la peor severidad de sus incidentes; debajo, lista con ícono por tipo (lucide), km, sentido, descripción y hora. Con `ejemplo: true`, `Senal` fría **"Datos de ejemplo: el módulo se activa con la operación"** arriba del bloque. "Última actualización: {actualizado}" abajo.
- Dónde: home (reemplaza el `HuecoCapacidad` de `ObrasYEstado`), `/obras/`, y El tramo (marcadores, §7.1).
- `capacidades.estadoRutasEnVivo` sigue `false`; cuando sea `true`, una isla pide `datos.estadoRutas()` en runtime, como estaba previsto.

### 10.2 Asistencia en ruta (`/asistencia/`, PETG 60.5)

1. **Llamá al 140**: `tel:140` a pantalla completa en celular.
2. **Compartí tu ubicación**: botón que llama a `navigator.geolocation.getCurrentPosition` (solo con permiso; solo HTTPS). Muestra coordenadas, link a Google Maps (`https://maps.google.com/?q=lat,lng`) y botón **Copiar** (`navigator.clipboard`, con estado "Copiado"). Si el usuario niega el permiso o el navegador no lo soporta, el resto funciona igual.
3. **Datos mínimos**: qué pasó (avería / accidente / obstáculo / otro), vehículo (liviano / pesado), personas, teléfono. `Formulario` gana campos `readonly` que el script rellena (ubicación) y `formulario.ts` pasa a recorrer los campos en vez de las etiquetas. Al enviar, compone el mensaje con la ubicación y lo manda por WhatsApp o correo si existen; **hoy no existe ninguno**: el botón dice "Llamá al 140 y dictá tu ubicación" y muestra el texto armado para copiar. Nada se simula.
4. Aviso de privacidad en la página: la ubicación no se guarda en ningún lado; viaja en el mensaje que el usuario decide enviar.

Accesos al botón: `/emergencias/`, `BarraEmergencias` (celular), `TarjetaEstacion`, accesos rápidos del home ("Pedir asistencia"), footer.

### 10.3 Carrusel del hero

Slides = novedades con `destacada: true` (máximo 3, más recientes primero) + el slide fijo actual (qué es Covicen, cuenta regresiva, CTAs). Sin destacadas no se renderiza el carrusel. `carrusel.ts` (~1 KB): cambio cada 8 s, pausa con `:hover`, foco y `prefers-reduced-motion`, flechas y puntos con nombre (`aria-roledescription="carrusel"`, `aria-live="polite"` en el slide activo), `scroll-snap` para el deslizamiento con el dedo. La foto y el parallax quedan fijos detrás; cambian título, texto y botón. Sin popup.

### 10.4 Formularios (PETG 61.5)

Mismo `Formulario.astro`, tres configuraciones:

| Formulario | Página | Campos |
|---|---|---|
| (a) Reclamos, consultas y sugerencias | `/contacto/` | motivo (reclamo / consulta / sugerencia), tema (tarifas, obras, atención, seguridad vial, otro), ruta, km o estación, fecha, patente (opcional), nombre, apellido, DNI (opcional), correo, teléfono, mensaje |
| (b) Consultas de TelePASE | `/contacto/#telepase` | patente, número de TAG (opcional), estación, fecha, tipo (cobro / dispositivo / adhesión / factura), mensaje; más el link a los canales de TelePASE |
| (c) Trámites | `/tramites/#formulario` | trámite (tarifa diferencial vecinal / docente / exención / otro), nombre, apellido, DNI, domicilio, patente, correo, teléfono; nota "la documentación se envía por correo cuando te lo pidamos" |

Cada formulario muestra junto al botón "Acuse en 24 hs · Respuesta en 5 días hábiles". Sin canal (`whatsapp` y correo `null`): deshabilitados con el aviso "Los formularios se habilitan con la toma de posesión, el 5 de octubre de 2026. Mientras, el 140 atiende emergencias las 24 horas". Con `capacidades.ticketingReclamos: true`, el mismo componente hace `POST` al endpoint y muestra el número de gestión.

### 10.5 Presupuesto de JS

Nuevo: tema (~0,6 KB gz), mapa (~1 KB), carrusel (~1 KB), anuncios (~0,5 KB), asistencia (~1 KB). Total nuevo ≈ 4 KB gz. Los límites vigentes (`verificar.ts`: 30 KB gz emitidos; `tests/presupuesto.test.ts`: 12 KB gz de fuente) se mantienen sin cambios.

## 11. Legibilidad, impresión y accesibilidad (PETG 61.7)

- **Enlaces subrayados en reposo**: regla global `a:not(.btn):not(.nav-item):not(.sin-subrayado) { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: .15em }`; en `:hover`/`:focus-visible` la línea pasa a 2 px y a `acento-hover`. `.link-crece` desaparece. Menú, botones y tarjetas-enlace llevan `.sin-subrayado` (permitido: "a menos que sea un menú o botón").
- **Tamaños**: cuerpo 16 px (`1rem`); ningún texto de contenido menor a 14 px (`text-sm`); anotaciones (notas de tabla, pies de tabla, metadatos) exactamente 12 px con la clase `.anotacion`. Se corrigen: texto legal de `Formulario` (→ 14), link a la resolución en `TarifaDestacada` (→ 14), "Deslizá la tabla" (→ 14), `Senal` (→ 12). `text-[0.6rem]` y `text-[0.7rem]` quedan prohibidos por test; `text-xs` solo junto a `.anotacion`.
- **Interlineado y párrafos**: cuerpo 1,6; en `.prose-covicen`, `p + p { margin-block-start: 1.5lh }` con fallback `2.4em` (el pliego copia WCAG 1.4.8: separación entre párrafos 1,5 veces el interlineado). Sin `text-align: justify` (guarda).
- **Impresión**: `src/styles/impresion.css` con `@media print`: fondo blanco, texto negro, se ocultan header, barras, footer de navegación, canvas, carrusel, botones e interruptor; `a[href^="http"]::after { content: " (" attr(href) ")" }`; la tabla de tarifas completa con las tres estaciones; el 140 y los canales; encabezado "Covicen · {URL del sitio} · impreso el {fecha}". Botón **Imprimir** (`window.print()`) en `/tarifas/` y en `/peajes/[slug]/`.
- **Teclado y lectores de pantalla**: `main#contenido:focus-visible` con anillo (hoy `outline-none`); `aria-expanded` en el `summary` de Nosotros; orden de tabulación de mapa, carrusel y barra de anuncios verificado; cada interacción con respuesta visible (copiado, buscando ubicación, abrí WhatsApp).
- **HTML válido**: `html-validate` (devDependency) sobre `dist/**/*.html` dentro de `verificar.ts`, con la configuración recomendada y las reglas de accesibilidad activas.
- **Dominio con "www" y redirección 301**: no vive en el repo. Queda documentado como requisito de la migración a dominio propio (`PUBLIC_SITE_URL=https://www.covicen.com.ar`; GitHub Pages con dominio personalizado redirige el apex al `www` si se configura así; en un VPS, Caddy lo hace con una línea). La URL del sitio va en la cartelería física de las cabinas (PETG 66.3 c): tiene que quedar fija antes de imprimir.
- Contraste ≥ 4,5:1 en ambos temas (§4.2). Alt descriptivo y sin texto en imágenes: ya se cumple y sigue verificado.

## 12. Verificación y entrega

### 12.1 `scripts/verificar.ts` (sobre `dist/`, corre en cada deploy)

Se mantienen los chequeos actuales y se agregan:

1. Contraste de todos los pares de tokens usados, **en los dos temas** (lee ambos bloques de `tokens.css`).
2. "679" presente en `/` y `/el-tramo/`; **"681", "Corredor Vial del Centro" y "a confirmar" ausentes en todo `dist/`** (búsqueda insensible a mayúsculas, excluyendo `og.png`).
3. `href="tel:140"` en toda página (reemplaza la excepción `data-emergencias="a-confirmar"`).
4. "Última actualización" en el footer de toda página.
5. La hoja de impresión (`@media print`) presente en el CSS emitido.
6. Ningún `<a target="_blank">` sin `rel="noopener"`.
7. HTML válido con `html-validate`.
8. Existencia de las seis páginas `/peajes/<slug>/` y de `/asistencia/`, `/tramites/`.

### 12.2 Tests (Vitest, `AstroContainer`, datos reales del repo)

- `tokens`: los dos bloques definen los mismos nombres; ningún color fijo (`#hex`, `rgb(`) en `src/components/**`, `src/styles/**` (salvo `tokens.css`), `src/scripts/**`, salvo la allowlist (`Isotipo.astro`, `og.svg`).
- `legibilidad`: sin `text-[0.6rem]`/`text-[0.7rem]`/`text-[1[01]px]` en `src/`; `text-xs` solo con `.anotacion`; sin `justify` en `text-align`.
- `tema`: el snippet inline fija `data-tema` según `localStorage` y `TEMA_POR_DEFECTO`; `'sistema'` respeta `prefers-color-scheme`.
- `mapa`: seis enlaces con `aria-label`, `role="group"`, colores por estado, leyenda condicional, incidentes interpolados dentro del `viewBox`.
- `tarifas`: cinco filas, dos columnas con el mismo valor, vigencia y resolución en la página, sin "a confirmar" ni "todavía no se cobra"; `categoriaDestacada` respetada; textos de operador pintados como texto (ya existe).
- `avisos`: filtro por `desde`/`hasta`; lista vacía → sin sección de anuncios (la barra queda con los accesos).
- `estado-traza`: chip por peor severidad; cartel de ejemplo; orden por ruta.
- `formulario`: campos `readonly` entran al mensaje; deshabilitado sin canal; plazos visibles.
- `asistencia`: armado del mensaje con y sin ubicación (unit, sin `navigator`).
- `contrato`: exportado igual al commiteado (ya existe); los campos nuevos aparecen en `properties` y no en `required`.
- `esquemas`: los JSON nuevos validan; `origen: 'heredado'` aceptado.
- `presupuesto`: se mantiene.

### 12.3 Revisión en carril separado

Al cerrar cada fase, `rev-bro` (agente del proyecto, `.claude/agents/`, sobre código que no escribió) revisa contra esta spec y el plan, corre `pnpm check`, `pnpm test` y `pnpm verificar`, y devuelve veredicto con evidencia. `sec-bro` revisa §10.2 y §10.4 (geolocalización, formularios, privacidad) antes de cerrar la Fase 5. Después, `superpowers:verification-before-completion` con los outputs pegados.

### 12.4 Fases del plan

| Fase | Contenido | Cierra en verde con |
|---|---|---|
| 0 | Tokens y tema: migración de colores fijos, bloque claro, interruptor, hero con dos fotos, guardas | check · test · verificar (contraste en dos temas) |
| 1 | Marca (sin descriptor, OG regenerada), datos oficiales (679, rutas, estaciones), header de dos filas, barra de anuncios, footer, criterio "esconder", 140 | idem + "681"/"Corredor Vial"/"a confirmar" ausentes |
| 2 | Mapa interactivo, tarjetas, El tramo, `/peajes/[slug]/` | idem |
| 3 | Tarifas (contrato, JSON, tabla por estación, bloques del pliego, home) | idem + `pnpm contrato` |
| 4 | Contenido del pliego (servicios, canales, medios de pago, quiénes somos, transparencia, trámites, seguridad vial, emergencias, obras, FAQ, novedades) | idem + originalidad de Quiénes somos |
| 5 | Interactivo (estado de traza, asistencia, carrusel, formularios) | idem + revisión de `sec-bro` |
| 6 | Legibilidad, impresión, HTML válido, cierre de verificación, docs y vault | idem + revisión final |

Lo que Juli agregue después de ver el video entra en la fase que corresponda sin cambiar el orden.

### 12.5 Entregables

1. Código en `main` (commits por fase, solo si Juli los autoriza en el momento).
2. Esta spec y el plan en `docs/superpowers/`.
3. `docs/guia-de-revision.md` actualizada: qué mirar en cada pantalla, cómo probar el interruptor, el mapa, la asistencia y la impresión.
4. `docs/contrato/*.schema.json` regenerados y la lista de campos nuevos de §6.2 para la sesión del backend.
5. `obsidian/`: `Home.md` (estado), `Decisiones de arquitectura.md` (las de §2), `Costura de datos.md` (métodos y campos nuevos), `Sistema de diseno.md` (tema claro, tokens nuevos), y una nota nueva **"Obligaciones del pliego para la web"** con el checklist de §13.

## 13. Checklist del pliego (PETG art. 61.6 y 61.7)

| Obligación | Estado con esta spec |
|---|---|
| Razón social | slot listo; **depende de Covicen** (inscripción) |
| Domicilio legal y comercial | slot listo; **depende de Covicen** |
| Sectores de detención segura | leyenda y campo listos; **depende de Covicen** (ubicaciones) |
| Estaciones de peaje | cumple (§3.2, §7) |
| Póliza de responsabilidad civil con aseguradora | slot listo; **depende de Covicen** |
| Canales con características y plazos | cumple (§9.2) |
| Normativa aplicable descargable | cumple parcial (§9.5); pliegos **dependen de Covicen** |
| Mapa interactivo con estado (tránsito, obras, incidentes), detención segura, peajes, áreas de descanso y servicios | cumple con datos de ejemplo (§7, §10.1); datos reales **dependen de Operaciones** |
| Fecha y hora de última actualización, diaria | cumple (build diario + `actualizado`) |
| Servicios gratuitos y onerosos | cumple (§9.1); pasajeros de la grúa **depende de Covicen** |
| Links a DNV, Secretaría de Transporte y Presidencia | cumple (§5.3) |
| Links a canales de atención de la DNV | slot listo; URL **depende de la DNV/Covicen** |
| Accesible a personas con discapacidad | cumple (§11) |
| Dominio con "www" + 301 | **depende del dominio** (§11) |
| Responsive, SEO, navegadores vigentes | cumple (ya) |
| Respuesta inmediata a cada interacción | cumple (§11) |
| Contraste 4,5:1; 14 px párrafos / 12 px anotaciones; interlineado 1,5–2; separación de párrafos 1,5× interlineado; sin justificado; enlaces subrayados; alt descriptivo; sin texto-imagen; vista de impresión; subtítulos en videos (no hay videos); teclado; datos de usuarios seguros (no se guardan) | cumple (§4.2, §11) |
| Botón de solicitud de asistencia en traza (art. 60.5) | cumple (§10.2); envío real **depende del canal** |
| Correo `atencionalusuario@covicen.com.ar` (art. 61.5) | slot listo; **depende del dominio** |
| Tres formularios (art. 61.5) | cumple (§10.4); envío real **depende del canal / CRM** |

## 14. Pendientes de Covicen y de Juli

| Pendiente | Quién | Para qué |
|---|---|---|
| Razón social, CUIT, domicilio legal y comercial, constancia de inscripción | Covicen | footer, QR de Data Fiscal, privacidad |
| Número 0800 | Covicen | canales |
| Casilla `atencionalusuario@covicen.com.ar` funcionando (dominio con CUIT y apoderamiento) | Covicen / Juli | canales, formularios |
| Número de WhatsApp | Covicen | formularios, asistencia |
| Redes sociales oficiales | Covicen | footer |
| URL de la oficina virtual de Telepeaje Plus | Telepeaje Plus / Covicen | Mi cuenta |
| Aseguradora, número y vigencia de la póliza de RC (PDF) | Covicen | transparencia |
| Ubicación y horarios de los sectores de detención segura; áreas de descanso reales | Covicen (Seguridad Vial / Germán) | mapa, servicios |
| Cuántos pasajeros lleva la grúa | Covicen | servicios (PETG 54.3) |
| Organigrama (imagen) | Covicen | quiénes somos |
| Relevamiento de ~17 sitios de Gastón | Gastón / Juli | quiénes somos |
| Foto del hero de día (Anexo A) | Juli | tema claro |
| Logos oficiales SVG: DNV, Transporte, Presidencia, Red Federal, TelePASE, 140 | Covicen / DNV / Juli | footer |
| Pliegos definitivos (PETG y PETP firmados) | Covicen | reconfirmar datos, publicar normativa |
| Provincia de la estación San Francisco | Covicen | datos del tramo |
| Monto de la tarifa diferencial | CVSA / DNV vía Covicen | tarifas, trámites |
| Tema por defecto (oscuro / claro / sistema) | Covicen | `TEMA_POR_DEFECTO` |
| Dominio `www.covicen.com.ar` | Covicen / Juli | migración, cartelería |
| URL de los canales de atención al usuario de la DNV | DNV / Covicen | footer, canales |
| Texto "qué hacer ante una emergencia" revisado | Seguridad Vial de Covicen | seguridad vial |
| Puntos adicionales del video de la reunión | Juli | entran al plan en su fase |

## 15. Fuera de alcance

Backoffice y sistemas (otra sesión) · popup de novedades · pagos en línea · CRM y ticketing real (flag preparado) · ChatBot/WhatsApp automatizado · cuenta bancaria para regularizar deuda (slot) · calculadora de tarifa · registro de dominio y VPS · publicación de los pliegos preliminares · horario pico / franjas tarifarias (contrato reservado) · organigrama editable · página por ruta.

## Anexo A — Prompt para la foto del hero de día

Mismo encuadre que `hero-ruta-nocturna.jpg` (punto de fuga en `x = 0,78`, horizonte en `y = 0,595`; 16:9; 2400×1350 o el mismo 1672×941). Si la herramienta permite editar la foto existente, usar el modo edición con este texto; si no, generar con el prompt original de `docs/marca/prompts-imagenes.md` §1 cambiando la luz como sigue. Después: guardar como `src/assets/atmosfera/hero-ruta-diurna.jpg` (≤ 2 MB) y correr `pnpm build`; si el punto de fuga cambió, remedir `HORIZONTE` y `vp` como indica `prompts-imagenes.md`.

> Same photograph, same camera position, same composition and vanishing point, but in full daylight: late-morning sun from the upper left, clear pale-blue sky with a few thin clouds, soft shadows, natural colours. Fresh dark asphalt, crisp white dashed lane lines, a continuous yellow edge line along the median, low concrete median barrier with steel guardrail, flat green-and-ochre Pampas fields on both sides, wire fence, a thin line of distant trees. Two vehicles far in the distance as small sharp shapes, motionless. The upper-left third of the frame stays uncluttered sky for headline text. Photorealistic, single exposure, 35 mm, natural grain, no HDR, no oversaturation.
>
> Strict exclusions: no long exposure, no light trails; no bridge, overpass, ramp or interchange; no signs, text, letters or numbers; no lamp posts; no buildings; no people; no vehicles in the foreground; no logos, no watermarks.

## Anexo B — Textos literales que se publican tal cual

- **Leyenda de pago electrónico manual** (pie de todas las tablas de tarifas; misma redacción que usa el sector, Corresur): *"Pago electrónico manual: modalidad de pago manual electrónico (medios de pago electrónicos en punto de cobro, distintos de TelePASE), en oportunidad de contar con todas las vías automáticas y/o mixtas."*
- **Actualización**: *"La tarifa se actualiza por índices oficiales según el contrato de concesión, cada tres meses."* (PETG 82 d)
- **Prórroga de plazos**: *"Los plazos de respuesta pueden ampliarse por un plazo igual cuando haga falta reunir elementos probatorios, con aviso previo al usuario."* (PETG 58.1)
- **Exentos**: *"Los vehículos exentos deben contar con el dispositivo TelePASE habilitado a ese efecto."* (PETG 52)
- **Datos de ejemplo**: *"Datos de ejemplo: el módulo se activa con la operación."*
- **Formularios sin canal**: *"Los formularios se habilitan con la toma de posesión, el 5 de octubre de 2026. Mientras, el 140 atiende emergencias las 24 horas."*
