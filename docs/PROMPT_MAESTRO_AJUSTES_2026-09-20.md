# Prompt maestro — Ajustes de la web de Covicen (tanda del 20/09/2026)

> Escrito el 2026-09-20 a partir de la transcripción de la call de Juli con el gerente (~15 min), cruzada contra el
> código del repo. Las cuatro decisiones que quedaban abiertas ya se resolvieron con Juli y están abajo: **no las
> reabras.** Vas a tener también el transcript crudo: usalo para desempatar matices de redacción, no para
> redefinir el alcance.

---

## 1. Objetivo

Dejar la web de Covicen **más corta, más institucional y sin un solo dato que no esté confirmado**, aplicando lo que
pidió el gerente en la call del 20/09/2026.

---

## 2. Contexto del proyecto — leé esto ANTES de tocar código

No explores a ciegas: el proyecto tiene su propio vault y ahí está el estado real.

- **`obsidian/Home.md`** — entrada del vault. Seguí los wikilinks, sobre todo
  [[Arquitectura de informacion de la landing]], [[Costura de datos]], [[Sistema de diseno]],
  [[Obligaciones del pliego para la web]] y [[Como se publica la web]].
- **Tanda anterior, mismo formato y misma gente**: `docs/superpowers/specs/2026-09-13-actualizacion-web-design.md` y
  `docs/superpowers/plans/2026-09-13-actualizacion-web.md`. Ahí está el porqué de casi todo lo que vas a tocar.
- **`docs/guia-de-revision.md`** — lo que mira Juli a mano. Lo vas a tener que actualizar.
- **Referencia de tono que pidió el cliente: Corresur** (`https://www.corresur.com.ar/`). Es referencia de **tono**,
  no de texto: `scripts/originalidad.ts` exige **cero** secuencias de 6 palabras en común.
- **Convenciones de Juli**: `C:\Users\Villex\.claude\CLAUDE.md` (español rioplatense, vault siempre al día).

Reglas del proyecto que ya rigen y que esta tanda refuerza:

- **Esconder, no «a confirmar»**: un dato que falta no se renderiza. `scripts/verificar.ts` rechaza `a confirmar`,
  `corredor vial del centro` y `681` en todo `dist/`.
- Colores **solo** desde `src/styles/tokens.css` (guarda `tests/styles/colores-fijos.test.ts`), contraste 4,5:1 en
  los dos temas, 14 px mínimo (guarda `tests/styles/legibilidad.test.ts`).
- **Sin pruebas visuales en la ejecución.** No abras Chrome para "ver si quedó bien": se verifica con
  `pnpm check && pnpm test && pnpm verificar`, y Juli mira a mano con la guía de revisión.

---

## 3. Decisiones ya cerradas con Juli

| # | Decisión |
|---|---|
| 1 | **Lo que no está confirmado se esconde**, no se publica con salvedades. Y se entrega la lista de qué hay que preguntar y a quién. |
| 2 | **La home queda en**: portada → botones de acceso → El tramo con el mapa interactivo → novedades → cierre de contacto. Nada más. |
| 3 | **Textos**: para el título y el párrafo de la portada presentás 2-3 opciones y Juli elige (`AskUserQuestion` con `preview`). El resto lo reescribís y lo aplicás vos. |
| 4 | **Entrega**: rama nueva `web-ajustes-2026-09-20`, **un commit por tarea**, **sin push**. Producción sigue mostrando «Próximamente». |

---

## 4. Alcance

### 4.1 — Home (`src/components/home/Home.astro`)

Orden final, y nada más que esto:

```
Hero → AccesosRapidos → ElTramo (con el mapa interactivo adentro) → NovedadesRecientes → ContactoCta
```

- **Se van de la home** (siguen viviendo en sus pestañas): `TarifaDestacada`, `ObrasYEstado`, `Servicios`,
  `Consorcio`, `FaqCorto`.
- **`ObrasYEstado` se desarma**: obras se oculta (§4.3) y el estado de la traza no va a la home por ahora
  (los datos de `src/content/estado-ruta.json` son de ejemplo).
- **El mapa interactivo sube a la home**: `src/components/MapaInteractivo.astro`, hoy solo en `/el-tramo`.
  Ojo con el presupuesto de JS (`pnpm verificar`, tope 30 KB gz; hoy van 7,5).
- **Hero** (`src/components/home/Hero.astro`): el `h1` *"Las rutas del centro del país tienen quién responda."* y el
  párrafo de abajo **se reescriben** en clave institucional. Acá es donde parás y le das opciones a Juli.
- **`AccesosRapidos`**: los cuatro botones (tarifas, emergencias, el tramo, medios de pago) **se mantienen** tal
  cual. Solo sacá "Free Flow" del texto de medios de pago (§4.6).
- **Sección El tramo**: el texto *"tres rutas, dos provincias, un corredor"* pasa a algo institucional,
  acompañado por el mapa.

### 4.2 — La barra de arriba se lee mal al hacer scroll

`src/components/Header.astro`, regla `.cabecera`: hoy va de transparente al color de cabecera con
`animation-timeline: scroll(root)` en los primeros 120 px. Sobre la foto del hero, las letras del menú quedan sin
contraste. El gerente sugirió dos caminos: **fondo más oscuro** o **pills que contrasten** detrás de cada ítem.
Elegí uno y **dejalo garantizado por un test**, en la línea de `tests/styles/hero-foto.test.ts` (que ya mide los
píxeles de la foto con `sharp` simulando `object-fit: cover`). El botón del 140 ya está protegido: no lo toques.

### 4.3 — Obras: **ocultar**, no borrar

Es momentáneo: "no se sabe nada del tema obras". El contenido queda en el repo y se vuelve a prender con un
interruptor.

- Interruptor en un solo lugar (seguí el criterio de `src/lib/config.ts`). **`/obras` no debe existir en el
  build**: una página viva sin enlaces igual se indexa.
- Sacar el ítem **Obras** del menú (`Header.astro`, `items`) y del pie (`Footer.astro`, columna "Empresa").
- Barrer las menciones a obras en el resto: `src/pages/quienes-somos.astro:30`
  ("primero las obras, después el peaje pleno"), `src/content/faq/05-desde-cuando-se-cobra.json`,
  `src/content/novedades/2026-08-27-obras-antes-que-peaje.md`,
  `src/content/novedades/2026-08-27-como-se-fija-la-tarifa.md` y `src/content/obras/*.json`.
- La sección 06 de Tarifas ("Después de las obras iniciales") se esconde igual por §4.7.

### 4.4 — Trabajá con nosotros: **eliminar**

Explícito: "directamente sacarlo, no ocultarlo". Se va `src/pages/trabaja-con-nosotros.astro`, el ítem del menú
Nosotros, el enlace del pie y lo que quede colgando (revisá `src/content/faq/13-trabajar-o-proveer.json`).

### 4.5 — Proveedores al menú de arriba

Hoy solo está en el pie. Sumalo al desplegable **Nosotros** de `Header.astro` y al menú de celular.

### 4.6 — Free Flow: sacarlo de la cara al público

"No está asegurado que sea de esa manera y no se sabe cómo va a ser": Leones, San Francisco y Totoras se muestran
como **"Próxima"** a secas. Tocá al menos: `src/lib/tramo.ts:9` (la etiqueta `Próxima · Free Flow`),
`src/content/tramo.json` (los campos `freeFlow` y el texto de la línea 341), `src/pages/medios-de-pago.astro` (la
sección `#free-flow` entera), `src/pages/el-tramo.astro:68`, `src/components/home/AccesosRapidos.astro:14`,
`src/components/home/Servicios.astro:11`, `src/content/faq/08-free-flow.json` y las novedades que lo nombran.
Dejá el campo `freeFlow` en el esquema (`src/lib/datos/esquemas.ts`): se apaga en la UI, no se rompe el contrato.

### 4.7 — Tarifas (`src/pages/tarifas.astro`)

Lo que el gerente pidió mantener tal cual: **el cuadro tarifario por estación** ("hay tarifas, cuadro tarifario, y
que esté para cada estación lo que cuesta, así como está"). Eso sale de la Res. 248/2026 publicada en el Boletín
Oficial: queda.

Lo que **se esconde hasta que el área lo confirme**:

| Sección | Por qué |
|---|---|
| 01 · Descuentos por frecuencia | "que esté certificada la info del porcentaje que te van a descontar" |
| 03 · Tarifa diferencial (vecinos, frentistas, docentes) | "certificar ese tema primero con el responsable del área" |
| 04 · Si pasaste sin pagar | "certificar que va a ser así" |
| 05 · Exceso de carga | mismo pedido, por los recargos |
| 06 · Categorías que van a regir | "categorías que van a regir después", en la lista de certificar |

Lo que queda pero **se acorta**: la sección **02 · Exenciones**. El listado largo de vehículos exentos es lo que
pesa. **Las dos tarjetas con los enlaces a discapacidad y ex combatientes de Malvinas se quedan sí o sí**: el
gerente las marcó dos veces como "está genial, tiene que estar".

**Cómo esconder**: un solo lugar que declare qué está confirmado y qué no (un JSON en `src/content/` o un módulo en
`src/lib/`, como prefieras, pero **uno**), y las secciones se renderizan según eso. Tiene que alcanzar con cambiar
un `false` a `true` para que vuelvan. Renumerá los `indice=` de las secciones que queden.

### 4.8 — El tramo y las estaciones (`src/pages/el-tramo.astro`)

- **Sacar la sección 03 · Cuadros tarifarios**: es reiterativa, eso vive en Tarifas. Renumerar el resto.
- **Sección 01** (`"Tres rutas nacionales bajo una misma concesión."`): el gerente dijo que **está perfecta**. No
  la toques.
- **Sección 02 · Estaciones**: reescribir la bajada sin Free Flow. Carcarañá, James Craik y Franck operativas;
  Leones, San Francisco y Totoras "próximas".
- **Sección 04 · Áreas de descanso y servicios**: tiene que decir qué hay de verdad en cada una (agua, baños,
  etc.) y salir también en la ficha del mapa. **Ese dato no existe todavía** → va a la lista de pendientes (§8.3)
  y por ahora se esconde lo que no esté cargado.
- **Mapa**: las ubicaciones exactas y qué paradas o áreas de descanso tiene cada estación están a determinar.
  Pendiente: no lo inventes.

### 4.9 — Guía de trámites (`src/pages/tramites.astro`)

Hoy lista los trámites. Lo que se pidió es que **guíe de verdad**: por cada trámite, *qué podés hacer, cómo lo
hacés, qué documentación necesitás* — "para que cuando lo inicies, lo inicies completo y no te demore tener que
estar presentando documentación". Reestructurá en fichas con esos campos, **solo** para los trámites con fuente
oficial verificable (discapacidad y ex combatientes de Malvinas en argentina.gob.ar; alta de TelePASE). El de
vecinos y frentistas se esconde hasta que lo confirmen.

### 4.10 — Tono institucional en todo el sitio

Pedido transversal y repetido: *"que suene lo más institucional posible"*, más breve y más conciso. Aplica a
**El tramo, Estaciones, Servicios, Quiénes somos, Políticas, Transparencia y Contacto**. Si dudás del registro,
mirá Corresur. Contacto, reclamos y sugerencias el gerente ya los dio por buenos: retoque mínimo.

### 4.11 — Fuera las citas del pliego

*"Hace mención del pliego; esas cosas que no aparezcan."* Sacá del texto visible las citas tipo `PETG art. 52`,
`PETP art. 3`, `(PETG 61.7)` de **todas las páginas de usuario**: Tarifas, El tramo, Servicios, Medios de pago,
Trámites, FAQ, home, Quiénes somos. **Excepción: `/transparencia` y `src/content/normativa.json`**, donde la
normativa *es* el contenido y citarla es lo institucional.

Agregá la guarda en `scripts/verificar.ts` (lista `PROHIBIDOS`, línea 22), con esa excepción.

---

## 5. Skills y agentes a invocar, en orden

1. **`superpowers:writing-plans`** — son once frentes sobre muchos archivos: escribí el plan en
   `docs/superpowers/plans/2026-09-20-ajustes-web.md` siguiendo el formato del plan de septiembre. **Este prompt
   hace de spec**: no escribas otra. Mostrale el plan a Juli y esperá el OK.
2. **`AskUserQuestion`** — el único checkpoint con Juli durante la ejecución: las 2-3 opciones de título y párrafo
   de la portada, con `preview` para que las compare lado a lado.
3. **`superpowers:test-driven-development`** — el test antes del cambio, al menos para: el contraste del header
   (§4.2), los prohibidos del pliego en `verificar.ts` (§4.11) y el interruptor de lo oculto (§4.3, §4.7).
4. **`ux-bro`** (agente propio del repo, `model=opus`) — la ejecución de los cambios de la landing Astro.
5. **`test-bro`** — completar las guardas si `ux-bro` deja alguna corta.
6. **`superpowers:systematic-debugging`** — si algo se rompe, antes de parchear. Hay historia: leé en
   `obsidian/Home.md` los bugs del hero del 15/09 antes de tocar el parallax o la disolvencia.
7. **`rev-bro`** — la pasada de aprobación, **sobre código que ese agente no escribió**. No te autoaprobés.
8. **`superpowers:verification-before-completion`** — antes de decir "listo".

**Prohibido**: agentes de `oh-my-claudecode:*`. Usá los de `.claude/agents/` con Opus.

---

## 6. Si te falta una capacidad

Usá **`find-skills`** para buscarla e instalarla antes de improvisar. Si la duda es de contenido o de negocio
(qué dice el pliego, qué cobra la Res. 248/2026), la fuente está en el vault y en la spec de septiembre: no
inventes ni salgas a la web sin necesidad.

---

## 7. Restricciones y Definition of Done

### 7.1 — Gates que tienen que estar en verde

| Comando | Qué tiene que dar |
|---|---|
| `pnpm check` | 0 errores |
| `pnpm test` | todo verde (hoy: 489 tests en 51 archivos; van a ser más) |
| `pnpm verificar` | 0 fallos. **El conteo de páginas baja** (se van `/obras` y `/trabaja-con-nosotros`): dejalo dicho en el commit |
| `pnpm verificar:portada` | 1 página, 0 fallos, 0 KB de JS — la portada de «Próximamente» no se puede romper |
| `pnpm build && pnpm originalidad https://www.corresur.com.ar/ https://cvsa.com.ar/` | 0 secuencias de 6 palabras en común |

Más las guardas que ya existen y no se negocian: `colores-fijos`, `legibilidad`, `contraste`, `hero-foto`,
`presupuesto` (JS emitido ≤ 30 KB gz).

### 7.2 — Reglas duras

- **Nada sin confirmar se publica.** Si no tenés fuente, se esconde y va a la lista de pendientes.
- **Ninguna cifra inventada.** Ni un porcentaje, ni un recargo, ni un servicio de un área de descanso.
- **Rama `web-ajustes-2026-09-20`, un commit por tarea, sin push.** Juli decide cuándo se sube.
  Antes de empezar, y después de cualquier corte o compactación: `git status --short --branch` para confirmar dónde
  estás parado. `git add` con rutas explícitas, nunca `-A`.
- **Corrido, sin pausas por tarea** una vez aprobado el plan. La única parada es la elección del texto de la portada.
- **Sin Chrome.** Nada de "abro el navegador para ver si quedó bien".
- **Todo archivo que le nombres a Juli va con la ruta absoluta de Windows** (`C:\Users\Villex\dev\Covicen\docs\...`),
  nunca relativa. Él los abre desde su máquina, fuera de la terminal, y con la relativa no los encuentra. Adentro
  del código, los comentarios, este plan y las notas del vault, las relativas están bien: lo que cambia es el
  mensaje que Juli lee. Si nombrás varios, todos absolutos.
- **Prohibido el trabajo a medias**: nada de `TODO`, `test.skip`, ramas sin implementar. Si algo se traba, se
  reporta como bloqueo, no se disfraza de terminado.

---

## 8. Entregables

1. **El plan** aprobado en `docs/superpowers/plans/2026-09-20-ajustes-web.md`, con las tareas tildadas al cierre.
2. **El código**, en commits chicos y legibles sobre la rama.
3. **`docs/pendientes-de-confirmacion.md`** (nuevo) — el entregable que sale de la decisión de esconder: qué dato
   falta, **qué hay que preguntar exactamente**, a quién (responsable del área o referente), qué sección de la web
   vuelve a aparecer cuando llegue el dato, y dónde se carga. Es lo que Juli le va a llevar al gerente.
4. **`docs/guia-de-revision.md` actualizada** — qué cambió en esta tanda y qué mirar pantalla por pantalla, con las
   páginas que ya no existen sacadas del índice.
5. **El vault al día**: entrada nueva en `obsidian/Home.md` (estado, con verificación y números reales) y las notas
   que toque — [[Arquitectura de informacion de la landing]] (la home cambia de forma),
   [[Obligaciones del pliego para la web]] (qué se dejó de mostrar y por qué) y [[Costura de datos]] (el interruptor
   de lo oculto). Notas atómicas, enlazadas con wikilinks, sin duplicar el código.
6. **El cierre para Juli, en criollo**: qué cambió, qué quedó escondido y por qué, qué falta preguntar, y los
   números de la verificación. Sin tecnicismos, sin vueltas y sin omitir nada importante.

---

## 9. Checkpoints

1. **Después de leer el vault y antes de escribir el plan** — si algo de este prompt choca con lo que encontrás en
   el código, decilo antes de ejecutar. Contradecir con evidencia es lo que se espera; tragar y seguir, no.
2. **Con el plan escrito** — OK de Juli antes de tocar código.
3. **En el texto de la portada** — `AskUserQuestion` con las opciones.
4. **Al cerrar cada frente grande** (home, tarifas, obras, tramo) — corré los gates, no acumules.
5. **Antes de declarar listo** — `superpowers:verification-before-completion` y después `rev-bro`. Mostrá la
   **salida real** de los comandos, no afirmaciones.
