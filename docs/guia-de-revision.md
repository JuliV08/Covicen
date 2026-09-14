# Guía de revisión — web de Covicen (actualización de septiembre de 2026)

Todo lo de la rama `web-actualizacion-2026-09` (Fases 0 a 6 del plan `docs/superpowers/plans/2026-09-13-actualizacion-web.md`) se hizo **sin pruebas visuales**: esta guía es la lista de lo que hay que mirar a mano, pantalla por pantalla, más lo que quedó oculto a propósito y cómo cargarlo.

**Cómo levantarlo:** `pnpm dev` → http://localhost:4321/ (con `.env` copiado de `.env.example` y `PUBLIC_BASE_PATH=/`; sin `.env` también anda). Para verlo en el celular, `pnpm dev --host` y la IP que imprime. **Ojo con Asistencia:** el celular solo entrega la ubicación en sitios con HTTPS (o `localhost`), así que por `http://IP` el botón "Obtener mi ubicación" no va a funcionar; probalo en la compu (localhost vale) o en la URL de Pages después del deploy.
**URL de Pages:** https://juliv08.github.io/Covicen/ (se publica al pushear a `main`; el push lo decidís vos).

**Lo que ya verificó la máquina** (no hace falta mirarlo): `astro check` sin errores; 373 tests; `pnpm verificar` sobre las 30 páginas: links internos, un solo `<h1>`, `description`, `canonical`, JSON-LD, `tel:140` en toda página, textos prohibidos ausentes ("a confirmar", "Corredor Vial del Centro", "681"), 679 km en la home y en El tramo, "Última actualización" en el pie, `noindex` según entorno, `alt` en toda imagen, sin emojis, HTML válido (html-validate), `target=_blank` con `noopener`, contraste 4,5:1 de todos los pares en los dos temas, hoja de impresión emitida, JS 5,4 KB gz (tope 30). Lo que sigue es lo que un script no puede juzgar: cómo se ve y cómo se siente.

**Navegadores:** lo atado a scroll-driven animations (dibujo del mapa al scrollear, parallax del hero, fondo del header) anda en Chrome, Edge y Safari; en Firefox estable aparece ya dibujado o fijo. Con "Reducir movimiento" activado en el sistema, todo queda estático: el carrusel y los anuncios no rotan solos (sí con los botones).

---

## Todas las páginas

**Barra superior (40 px, siempre visible junto al header)**
- A la izquierda, los anuncios de `src/content/avisos.json` (hoy tres: el de la toma de posesión, que **vence el 5 de octubre** y desaparece solo en el build de ese día; emergencias 140; tarifas). Rotan cada 6 s con fundido; se frenan con el mouse encima o con el foco; los botones anterior/siguiente funcionan siempre. Cada anuncio es un link a su página.
- Los botones anterior/siguiente miden **32 px** (la barra de 40 px no da para los 44 px recomendados). Decisión a tu criterio: ver al final.
- A la derecha, solo desde 1024 px de ancho: **TelePASE** (abre telepase.com.ar en otra pestaña), **Mi cuenta** (hoy lleva a Medios de pago › Mi cuenta; cuando exista la URL de la oficina virtual, la abre en otra pestaña) y el **sol/luna**. En el celular esos tres están adentro del menú (el interruptor arriba, al lado de la palabra "Menú").

**Header (72 px)**
- Logo **sin descriptor** (ya no dice "Corredor Vial del Centro" en ningún lado: ni en el header, ni en el título, ni en la imagen para redes).
- Menú: Tarifas · El tramo · Servicios · Obras · Novedades · **Nosotros** (desplegable: abre con clic o Enter, cierra con Esc o clic afuera, el chevron gira) · Contacto. La página actual queda subrayada en celeste.
- El **140 grande** amarillo con "Emergencias" arriba, desde 640 px de ancho. Debajo de 640 px desaparece del header y aparece la **barra fija de abajo** con el 140 y, a la derecha, el botón de asistencia (ícono de mira) que lleva a `/asistencia/`.
- Al scrollear, el header gana fondo translúcido y borde.

**Interruptor de tema**
- Nace oculto y **aparece con JavaScript**: sin JS no puede funcionar, así que no se muestra un botón muerto. Si lo ves sin JS habilitado, es un bug.
- Tocarlo cambia todo el sitio de una: el ícono pasa de sol (en oscuro) a luna (en claro); en el celular cambia el color de la barra del navegador (`theme-color`: navy `#0B1526` en oscuro, gris `#EEF1F4` en claro).
- **Recargar en claro:** no tiene que haber un destello oscuro antes de pintar (el tema se aplica en el `<head>`, antes del primer frame). Navegar entre páginas en claro: se mantiene (queda en `localStorage`, clave `covicen:tema`). En modo privado dura la visita.
- Qué mirar en **tema claro**: el amarillo vial como texto pasa a ocre (`#6E5A00`), no es un error; las tarjetas con halo sobre gris claro; las tablas; los chips verdes "Operativa"/"Gratis" (verde `#1B6B35`); los links celestes se leen (acento `#2C688F`); el **hero usa la misma foto nocturna sin oscurecer** (brillo 100 %) hasta que exista la de día (`src/assets/atmosfera/hero-ruta-diurna.jpg`, la generás vos con el prompt del Anexo A de la spec). Con esa foto en su lugar, el hero cambia de foto con el tema.
- El tema con el que arranca quien nunca eligió es `TEMA_POR_DEFECTO` en `src/lib/tema.ts` (hoy `'oscuro'`; puede ser `'claro'` o `'sistema'`). Lo decide Covicen.

**Footer**
- Columna marca: isotipo + COVICEN, texto "Concesionaria del Tramo Centro… RN 9 · RN 19 · RN 34 · Córdoba y Santa Fe". La fila de redes **no aparece** (no hay cuentas cargadas).
- Usuarios (Tarifas, Medios de pago, Emergencias, Asistencia en ruta, Guía de trámites, Seguridad vial, Preguntas frecuentes) y Empresa (Quiénes somos, Obras, Novedades, Políticas, Transparencia, Trabajá con nosotros). Los links del footer no van subrayados hasta el hover (son menú).
- Contacto: "Emergencias 140" (llama), Formulario de contacto, Proveedores. **Ocultos** hasta tener el dato: 0800, correo de atención al usuario, WhatsApp.
- **Datos registrales: no aparecen** (razón social, CUIT y domicilio son `null`). Cuando existan los tres, aparece la columna y, si además está `public/qr-afip.png`, el QR de Data Fiscal enlazando a la constancia.
- **Fila institucional**: Vialidad Nacional · Secretaría de Transporte · Presidencia de la Nación · Red Federal de Concesiones · TelePASE, hoy como rótulos de texto (cuando tengas los SVG oficiales monocromos en `src/assets/institucional/<id>.svg` se reemplazan solos), más el botón amarillo 140. Todos abren en otra pestaña.
- Línea inferior: "Sociedad en formación · Adjudicación: Resolución 1379/2026 del Ministerio de Economía. Privacidad · Boletín Oficial" y **"Última actualización: <fecha y hora>"**. Es la fecha y hora **del build**, en hora argentina, no la de la visita: en local es el momento en que corriste `pnpm dev`/`build`; en Pages, el último deploy (el workflow reconstruye a diario a las 03:00, así que nunca tiene más de un día).

**Legibilidad (pliego 61.7), en cualquier página**
- Los links dentro del texto van **subrayados** (1 px; en hover 2 px). Menú, botones, tarjetas-enlace, navs de anclas y footer no (el pliego lo permite).
- Ningún texto menor de 14 px, salvo las **anotaciones** de 12 px: "sin IVA" bajo los precios, "Fuente: PETG art. …", "Publicado el…", las etiquetas de las novedades, los chips ("Cuadro vigente", "Gratis", "Operativa"). Nada justificado.
- Teclado: apretá Tab al entrar → aparece "Saltar al contenido" (amarillo) → Enter → un **anillo celeste hacia adentro** marca el contenido. Seguí con Tab por menú, 140, anuncios, mapa (cada estación), carrusel, formularios: siempre se ve dónde estás.
- **Imprimir** (Ctrl+P en cualquier página): papel blanco, tinta negra, sin header ni barras ni footer de navegación ni botones ni fondos animados; arriba el encabezado **"Covicen · <sitio> · impreso el <fecha de hoy>"**; los enlaces externos muestran su URL entre paréntesis; las migas quedan. El detalle en Tarifas, abajo.
- Al navegar entre páginas hay un fundido suave; el header no parpadea y el tema no cambia.
- 404: `/lo-que-sea/` muestra la página de error con los accesos.

---

## Home `/`

- **Hero con carrusel**: tres diapositivas. La fija de Covicen (eyebrow, título, "679,03 km sobre RN 9, RN 19, RN 34", botones Ver tarifas / Conocer el tramo, cuenta regresiva al 5 de octubre) y las dos novedades marcadas como destacadas (la adjudicación y "Qué cambia el 5 de octubre"), cada una con su fecha, título grande, resumen y "Leer más". Pasa cada **8 s**, se frena con el mouse encima o con el foco; flechas y puntos (44 px) siempre disponibles; el punto activo se marca. Sin novedades destacadas no habría carrusel: quedaría el hero de siempre. **No hay popup** de bienvenida a propósito.
- Foto nocturna con parallax 2.5D en desktop (movete con el mouse); en el celular la foto con un zoom lento.
- **Accesos rápidos**: Tarifas, Emergencias 140 (tarjeta amarilla; es un enlace `tel:` con la frase completa), El tramo, Medios de pago.
- **Tarifa (01)**: una tarjeta que gira. Frente: ícono de auto, chip verde "Cuadro vigente", "Categoría 1 · Autos · por paso", **$ 1.500 con IVA** grande y "$ 1.239,67 sin IVA". Dorso (mouse encima o un toque): rige en Carcarañá, James Craik y Franck igual con TelePASE que en la vía; vigente desde el 26 de febrero de 2026; Resolución 248/2026; botón al tarifario completo; link a la resolución en el Boletín Oficial. Debajo, "Publicado el … Se actualiza por índices oficiales según el contrato." **Ya no dice "tarifa ofertada" ni $1.399**: la ofertada quedó como dato histórico en Quiénes somos, no como precio.
- **El tramo (02)**: panel con el **mapa** a la izquierda y una tarjeta de estación a la derecha. Tres rutas celestes; estaciones **verdes** (Carcarañá, James Craik, Franck: cobran hoy) y **amarillas con anillo discontinuo** (Leones, San Francisco, Totoras: próximas). **Tocá Franck**: la tarjeta cambia (chip "Operativa", "RN 19 · km 19,95", "Franck, Santa Fe", vías 6, "Cobra en ambos sentidos", servicios Área de descanso y Grúa gratuita, links a su cuadro tarifario, ficha completa, asistencia y 140). Arranca en Carcarañá. La estación elegida queda con un anillo. Con Tab se recorren las seis y Enter las elige. Sin JS quedan las seis tarjetas listadas y cada estación enlaza a su página.
- **En el celular, los nombres de las estaciones sobre el mapa solo se ven al tocar una** (el nombre está en la tarjeta que aparece debajo): con seis etiquetas en 360 px se pisaban. Decisión a tu criterio: ver al final.
- Leyenda: rutas, estación operativa, estación próxima, ciudad, y solo los servicios que alguna estación tiene (área de descanso, grúa gratuita). En la home el mapa **no** muestra incidentes (sí en El tramo).
- Mojones: **679 km · 3 rutas · 3 estaciones operativas de 6**; cuentan al entrar en pantalla.
- **Obras y estado (03)**: izquierda, las **seis obras del pliego** (todas "Planificada"); derecha, pegado al scrollear, el **Estado de la traza**: cartel **"Datos de ejemplo: el módulo se activa con la operación"**, una fila por ruta con su chip: RN 9 Precaución (2 avisos), RN 19 Precaución (1 aviso), RN 34 **Corte** (1 aviso), cada aviso con km, sentido y texto; abajo "Última actualización: 13 de septiembre de 2026…". **Todo eso es inventado a modo de muestra** (`src/content/estado-ruta.json`, `ejemplo: true`): que nadie lo lea como real. Cuando exista el centro de operaciones, el sistema manda la misma forma con `ejemplo: false` y el cartel desaparece.
- Servicios; Novedades (las 3 últimas); **Consorcio (06)**: el panel usa de fondo la foto `consorcio.jpg` **oscurecida al 62 % en oscuro** (antes estaba al 50 %; se aclaró para que la foto se vea): mirá que los mojones "20 años · 3 empresas" y los nombres de las tres empresas se lean bien encima. En claro la foto va al 100 %. Decisión a tu criterio: ver al final.
- FAQ corto (cinco preguntas en acordeón, con botón a todas) y el CTA de contacto.

## Tarifas `/tarifas/`

- Cabecera: ícono de auto, "Categoría 1 · …", **$ 1.500 al público, con IVA**, "$ 1.239,67 sin IVA · igual con TelePASE que con pago en la vía". Chips "Cuadro vigente" (verde) y "Desde el 26 de febrero de 2026". "Resolución 248/2026 de la Dirección Nacional de Vialidad. Ver en el Boletín Oficial." "Rige el mismo cuadro en Carcarañá, James Craik, Franck." Botón **Imprimir el cuadro**.
- **Imprimir**: tocá el botón (o Ctrl+P). En la vista previa: papel blanco, sin header ni barras, el encabezado "Covicen · <sitio> · impreso el <hoy>", las **tres tablas completas** (sin scroll horizontal, con todas las filas), los enlaces externos con la URL entre paréntesis, sin botones. Cerrá sin imprimir.
- Nav de anclas con las tres estaciones y **tres tablas iguales**, una por estación: Categoría (con ícono) · Tipo de vehículo · **TelePASE** · **Pago electrónico o manual**. Las dos columnas tienen **el mismo valor** hoy: la Res. 248/2026 fija un solo precio (la diferencia llega cuando las vías sean 100 % automáticas). Cinco categorías: $ 1.500 · $ 3.000 · $ 4.500 · $ 6.000 · $ 7.500 con IVA; el sin IVA en chico debajo de cada precio. La fila se tiñe al pasar el mouse. En el celular: "Deslizá la tabla hacia el costado…" y scroll horizontal. Debajo de cada tabla, los avisos y "Publicado el … Fuente: Resolución 248/2026…" (link al BO).
- "**Estaciones sin habilitar**": Leones, San Francisco, Totoras cobran cuando Vialidad las habilite, con el cuadro de Carcarañá; hasta entonces no se paga.
- **Descuentos por frecuencia (01)**: 15 % · 25 % · 35 % a partir de la pasada 36 · 45 · 61 del mes (PETG 53.3).
- **Exenciones (02)**: los ocho ítems con el texto literal del Anexo B (incluido "según el reglamento de Vialidad Nacional" en discapacidad y Malvinas); tarjetas con link al trámite de Malvinas (argentina.gob.ar) y a la guía de trámites.
- **Tarifa diferencial (03)**: vecinos, frentistas y docentes, solo categoría 1; **sin monto** (no lo tenemos: "se informa al hacer el trámite").
- **Si pasaste sin pagar (04)**: dentro de 30 días, la tarifa más una; después, la tarifa más dos con intereses (PETG 51.1.4); el medio para pagar se publica en Medios de pago cuando exista.
- **Después de las obras iniciales (05)**: la tabla de categorías futuras del PETG 53.2 (0 a 8 y Especial, con el múltiplo de la tarifa básica), sin precios. Las categorías **7 "Más de 6 ejes" (×7) y 8 "Más de 8 ejes" (×9) se solapan**: así lo escribe el pliego y se publica literal, con la cita. Decisión a tu criterio: ver al final.
- Tres botones al pie: Cómo pagar · Dónde están los peajes · Preguntas frecuentes.

## El tramo `/el-tramo/`

- Título "679 kilómetros de centro." y, debajo, la **sub-navegación pegada** bajo el header (Rutas y longitudes · Estaciones de peaje · Cuadros tarifarios · Áreas de descanso y servicios); en el celular se desliza de costado.
- **Mapa** igual al de la home, más los **cuatro incidentes de ejemplo** ubicados por km sobre el trazo (triángulos: amarillo obra en RN 9 km 352, celeste tránsito en RN 9 km 588, amarillo niebla en RN 19 km 61, **rojo corte** en RN 34 km 118); pasando el mouse se lee el texto; la leyenda suma "Incidente informado"; debajo "Estado de la traza actualizado el …". La posición es aproximada: el mapa es esquemático, no está a escala.
- **Rutas y longitudes (01)**: tabla Ruta · Desde · Hasta · **Progresivas** · Longitud: RN 9 km 297 a 660,16 (363,16 km); RN 19 km 0 a 127,19 (127,19 km); RN 34 km 0 a 188,68 (188,68 km); total **679,03 km** "según el pliego". Mojones: 679 km · 2 provincias · 6 peajes (3 operativos y 3 próximos).
- **Estaciones de peaje (02)**: seis tarjetas con ruta · km (Carcarañá RN 9 km 340, James Craik RN 9 km 588, Franck RN 19 km 19,95, Leones RN 9 km 454, San Francisco RN 19 km 120, Totoras RN 34 km 60), nombre (link a su página), localidad y chip verde/amarillo. Debajo, los avisos del tramo (fuente PETP, estaciones nuevas con Free Flow, San Vicente deja de operar).
- **Cuadros tarifarios (03)**: las tres tablas en versión compacta (sin avisos ni fuente) y botón a Tarifas.
- **Áreas de descanso y servicios (04)**: solo las estaciones con servicios cargados (las tres operativas: área de descanso, grúa gratuita); link a Servicios.

## Páginas de estación `/peajes/<slug>/`

- **`/peajes/carcarana/`** (operativa): título "Peaje Carcarañá", eyebrow "RN 9 · km 340", intro "Carcarañá, Santa Fe. Operativa."; a la izquierda la tarjeta completa (10 vías, ambos sentidos, servicios, "Pedir asistencia", 140); a la derecha **su tabla de tarifas y el botón Imprimir**; abajo "Cómo pagar" y "Emergencias 140" (amarillo). Migas: Inicio › El tramo › Peaje Carcarañá. El título de la pestaña lleva la ubicación ("Peaje Carcarañá — RN 9 km 340 | Covicen").
- **`/peajes/totoras/`** (próxima): chip amarillo "Próxima · Free Flow"; en vez de la tabla, el texto "Esta estación todavía no cobra: la habilita Vialidad Nacional cuando esté construida. Va a operar con Free Flow… con el mismo cuadro tarifario que Carcarañá"; sin botón Imprimir; la tarjeta dice "Cobra cuando Vialidad Nacional la habilite".
- Las seis: `carcarana`, `james-craik`, `franck`, `leones`, `san-francisco`, `totoras`.

## Servicios `/servicios/`

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
- **Contanos qué pasó**: como no hay canal cargado (WhatsApp y correo son `null`), arriba dice "**Llamá al 140 y dictá tu ubicación.** El envío por mensaje se habilita con la toma de posesión…", el formulario aparece **deshabilitado** con el aviso "Los formularios se habilitan con la toma de posesión, el 5 de octubre de 2026…" y el botón "Enviar" gris. Con el WhatsApp cargado, el botón pasa a "Pedir asistencia por WhatsApp" y abre `wa.me` con el mensaje armado (qué pasó, vehículo, personas, ubicación, referencia, teléfono).

## Medios de pago `/medios-de-pago/`

- Tres modalidades del pliego con fuente: Prepago con TelePASE · Pospago con TelePASE · Contado en la vía (Carcarañá, James Craik, Franck).
- **TelePASE (01)**: "Gratis, y en todas las estaciones" (adhesión, dispositivo, colocación, renovación sin costo, PETG 50.5); "Cómo adherirte" con botón a TelePASE; "Dónde se coloca" con texto genérico hasta que Covicen defina los sectores (`servicios.colocacionTelepase` por estación).
- **Free Flow (02)**: Leones, San Francisco, Totoras: pórticos sin barreras; cobran cuando Vialidad las habilite.
- **Mi cuenta (03)**: chip "Se habilita con la toma de posesión" + "El acceso se publica acá y en la barra superior…". Con `contacto.enlaces.oficinaVirtual` cargado pasa a ser el botón "Entrar a Mi cuenta".
- **Pasaste sin pagar (04)**: las dos tarjetas de recargo y "El medio para pagar la deuda se publica acá cuando esté habilitado" (la cuenta bancaria es `null`).

## Guía de trámites `/tramites/`

- Nav de anclas y **cinco trámites**: tarifa diferencial para vecinos y frentistas; para docentes; exención por discapacidad; exención para ex combatientes de Malvinas; alta de TelePASE. Cada uno con "Quién puede", Requisitos, Pasos, plazo, "Sitio oficial del trámite" cuando hay URL (Malvinas, TelePASE) y "Fuente: …" en 12 px. "Todos son gratuitos."
- **Iniciá tu trámite**: formulario con select de trámite, deshabilitado con el aviso hasta tener canal.

## Contacto `/contacto/`

- Izquierda: tarjeta amarilla con el 140; **tabla de canales compacta** (Canal · Acuse · Respuesta); hueco "Seguimiento de reclamos en línea". Derecha: **formulario de reclamos, consultas y sugerencias** (motivo, tema, ruta y km o estación, fecha, patente, nombre, apellido, DNI, correo, teléfono, mensaje), hoy deshabilitado con el aviso; con canal, "Enviar por WhatsApp" o "Enviar por correo" y los plazos "Acuse en 24 horas · Respuesta en 5 días hábiles" al lado del botón.
- **TelePASE (01)**: texto con link al sitio de TelePASE y un **segundo formulario** (tipo de consulta, patente, TAG, estación, fecha, correo, qué pasó). Las respuestas a TelePASE tienen prioridad (PETG 61.5 b).
- **Cómo hacer un reclamo (02)**: cuatro pasos con plazos (número de gestión en 24 h; respuesta en 5 días hábiles; prórroga una sola vez; escalar a Vialidad Nacional).
- La validación en español del formulario (campos obligatorios, correo válido) se ve solo cuando esté habilitado.

## Quiénes somos `/quienes-somos/`

- Texto **original** (se chequeó con `pnpm originalidad` contra otras concesionarias): "Nacimos de tres empresas… ganaron ofreciendo el peaje más bajo de los 8 tramos…"; párrafo "La sociedad está en formación. Cuando se complete la inscripción, publicamos acá y en el pie de página la razón social, el CUIT y los domicilios." **Ya no dice "+10 prorrogables"**: era un dato de prensa sin artículo del pliego que lo respalde. Decisión: ver al final.
- Mojones 20 años · 6 peajes. **Ocho compromisos** exigibles (conservar los 679 km, losas de hormigón, banquinas Rosario–Carcarañá, puente sobre el Carcarañá, rehabilitación asfáltica, auxilio gratis 30/60 min, 140 con personas, cobrar solo lo habilitado), todos con base en el pliego.
- Quién nos controla: ficha (régimen, tramo, plazo, adjudicación con link al BO, control) y misión/visión.
- El consorcio: foto 21:9 (`consorcio.jpg`) y tres tarjetas. **Organigrama**: la sección aparece solo si existe `src/assets/institucional/organigrama.png`.

## Transparencia `/transparencia/`

- **Normativa aplicable**: cinco tarjetas. Res. 1379/2026, Res. 248/2026, Ley 27.742 y Decreto 97/2025 con "Ver o descargar" al Boletín Oficial; "Pliegos de la concesión" dice "Sin versión definitiva publicada todavía" (hasta tener los firmados).
- **Póliza de responsabilidad civil (01)**: "Se publica con la toma de posesión, el 5 de octubre de 2026" (con `empresa.polizaRc` cargado aparece la ficha: aseguradora, número, vigencia, documento).
- **Datos registrales (02)**: "La sociedad está en formación…" hasta tener razón social, CUIT y domicilio.

## Obras `/obras/`

- Foto `obras-nocturnas.jpg` 21:9 arriba; línea de tiempo con las **seis obras del pliego**, todas "Planificada": puesta en valor inicial, losas de hormigón, banquinas Rosario–Carcarañá, puente sobre el Carcarañá, rehabilitación asfáltica, estaciones nuevas con Free Flow; cada una con tipo · ruta, descripción y "Fuente: PETP art. …". Sin barra de avance (el avance es `null`; con un número aparece la barra amarilla).
- Al final, el **Estado de la traza** (el mismo de ejemplo de la home, con el cartel).

## Seguridad vial `/seguridad-vial/`

- **Ocho hábitos** numerados en dos columnas (distancia, velocidad, luces bajas, niebla, animales sueltos, cansancio, sobrepaso, cinturón y sillas) y "**Ante una emergencia**": los cinco pasos en fila. Botones "Llamar al 140" (amarillo) y "Emergencias y auxilio". El texto lo tiene que revisar Seguridad Vial de Covicen (pendiente de ellos).

## Preguntas frecuentes `/preguntas-frecuentes/`

- Nav por seis temas (General, Tarifas, Peajes, Pago, Servicios, Empresa); **17 preguntas** con acordeón (`<details>`, chevron que gira); `FAQPage` en JSON-LD (verificado por script).

## Novedades `/novedades/` y detalle

- Listado de **cinco** con fecha y etiquetas (12 px, anotación); las dos destacadas son las del carrusel. La más nueva (13/9) explica qué cuadro tarifario rige desde el 5 de octubre.
- Detalle: prosa con **más aire entre párrafos** (1,5 veces el interlineado, como pide el pliego), links subrayados, botón volver.

## Políticas, Privacidad, Trabajá con nosotros, Proveedores

- **Políticas**: tres artículos por anclas; en Anticorrupción, hueco "Canal ético anónimo" cuya alternativa hoy es el formulario de contacto (el correo de ética es `null`).
- **Privacidad**: responsable "Covicen, sociedad en formación"; sin cuentas, cookies de terceros ni seguimiento; los datos viajan por el canal que elige el usuario.
- **Trabajá con nosotros** ("679 km necesitan gente.") y **Proveedores** (hueco "Portal de proveedores y licitaciones"): formularios deshabilitados con el aviso hasta tener canal.

---

## Qué está oculto hasta tener el dato

Nada de esto dice "a confirmar" ni "próximamente" en el sitio: directamente no se renderiza, y `pnpm verificar` falla si alguna página dijera "a confirmar".

- Razón social, CUIT, domicilio legal y comercial, constancia de inscripción y QR de Data Fiscal (footer, Transparencia, Privacidad).
- Número 0800, correo de atención al usuario, WhatsApp (footer, canales, formularios habilitados, "También por WhatsApp" en Emergencias).
- Redes sociales (footer).
- URL de la oficina virtual (Mi cuenta en barra superior, menú y Medios de pago) y de la atención al usuario de la DNV (footer).
- Cuenta para regularizar deuda (Medios de pago).
- Póliza de responsabilidad civil (Transparencia).
- Teléfono, horario de atención, sectores de detención segura, sanitarios y colocación de TelePASE por estación (tarjetas y leyenda del mapa).
- Organigrama (Quiénes somos), logos institucionales en SVG (footer), foto del hero de día (tema claro).
- Monto de la tarifa diferencial (Tarifas, Trámites): se dice que se informa al tramitar.

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
| `cabinas[].telefono`, `horarioAtencion` | `src/content/tramo.json` | Filas en la tarjeta de la estación. |
| `cabinas[].servicios { detencionSegura, sanitarios, colocacionTelepase, areaDescanso, gruaGratuita }` | `src/content/tramo.json` | Chips en la tarjeta, leyenda del mapa, "Dónde se coloca" el TelePASE. |
| `cabinas[].operativa: true` | `src/content/tramo.json` | La estación pasa a verde, con tabla de tarifas y botón Imprimir en su página. |
| Un aviso `{ id, texto, url?, tono, desde?, hasta? }` | `src/content/avisos.json` | Entra a la barra superior en el build; sale solo al vencer `hasta`. |
| `ejemplo: false` (cuando sean reales) | `src/content/estado-ruta.json` | Desaparece el cartel "Datos de ejemplo". |
| `src/assets/institucional/organigrama.png` | imagen | Sección Organigrama en Quiénes somos. |
| `src/assets/institucional/<id>.svg` (`vialidad-nacional`, `transporte`, `presidencia`, `red-federal`, `telepase`), monocromos | imagen | Reemplazan los rótulos de texto de la fila institucional. |
| `src/assets/atmosfera/hero-ruta-diurna.jpg` (mismo encuadre que la nocturna) | imagen | Foto de día en el hero cuando el tema es claro. |
| `TEMA_POR_DEFECTO` | `src/lib/tema.ts` | Tema con el que arranca quien nunca eligió: `'oscuro'`, `'claro'` o `'sistema'`. |
| Nueva novedad (`destacada: true` para el carrusel, máximo 3) | `src/content/novedades/*.md` | Listado, home y carrusel. |
| `avance` (0–100), `estado`, `inicio`, `finEstimado` | `src/content/obras/*.json` | Barra y fechas en Obras. |
| Valores del cuadro | `src/content/tarifario.json` (o la API con `FUENTE_DATOS=api`) | Todas las tablas y la home. |

Después de cualquier carga: `pnpm check && pnpm test && pnpm verificar`.

## Migración a dominio propio (pliego 61.7)

El paso a paso completo está en `README.md` ("Migración al dominio propio"). En corto: dominio personalizado `www.covicen.com.ar` en GitHub Pages (Settings → Pages) con el `www` en CNAME a `juliv08.github.io` y el apex con registros A/AAAA a GitHub, para que `covicen.com.ar` redirija con 301 al `www`; en el workflow, `PUBLIC_SITE_URL=https://www.covicen.com.ar`, `PUBLIC_BASE_PATH=/`, `PUBLIC_INDEXABLE=true`. **La URL va en la cartelería de las cabinas: no cambiarla después.**

## Qué NO está (por diseño)

Backoffice y sistemas (repo aparte), estado de rutas en vivo (datos de ejemplo hasta que exista el centro de operaciones), oficina virtual, seguimiento de reclamos, portal de proveedores, canal ético anónimo, popup de novedades, pagos en línea, calculadora de tarifa, chatbot, página por ruta, franjas horarias.

## Decisiones tomadas en la ejecución que quedan a tu criterio

- **Brillo de las fotos de fondo en oscuro: 62 %** (antes 50 %). Afecta la foto del hero y la del panel de Consorcio (la de Obras tiene su propio 80 %). Si el texto encima te parece justo de contraste, se baja en `--brillo-foto` de `src/styles/tokens.css`.
- **Foto de día del hero**: no existe todavía; la generás vos (Anexo A de la spec) y va en `src/assets/atmosfera/hero-ruta-diurna.jpg` con el mismo encuadre que la nocturna (comparten el mapa de profundidad). Hasta entonces, en claro se ve la nocturna al 100 %.
- **Interruptor de tema oculto sin JS**: sin JavaScript no puede cambiar nada, así que no se muestra. La alternativa (mostrarlo siempre) dejaría un botón que no hace nada.
- **Controles anterior/siguiente de la barra de anuncios: 32 px** (la barra mide 40 px). Los del carrusel del hero sí miden 44 px.
- **Nombres de las estaciones sobre el mapa en el celular**: solo al tocar una (o al enfocarla); desde 768 px se ven siempre. El nombre está en la tarjeta que aparece debajo.
- **Estado de la traza e incidentes del mapa son datos de ejemplo** con cartel. Si preferís que no se vea nada hasta tener datos reales, es `disponible: false` en `estado-ruta.json` (aparece el hueco "Próximamente").
- **Categorías futuras 7 y 8 de la tabla de Tarifas se solapan** ("Más de 6 ejes" ×7 y "Más de 8 ejes" ×9): así lo escribe el PETG 53.2 y se publica literal con la cita, antes que corregir al pliego por nuestra cuenta.
- **Se quitó "+10 prorrogables"** de Quiénes somos: era un dato de prensa sin artículo del pliego. El campo `prorrogaAnios` sigue en `empresa.json` por si aparece la fuente.
- **`Senal` (los chips) usa 12 px** como única excepción justificada a la regla de 14 px: un chip es una anotación por definición.
- **La tarjeta de estación escribe el 140 literal** (no lo lee de `contacto.json`): lo fija el pliego (PETG 59) y `verificar.ts` exige `tel:140` en toda página.
- **`verificar.ts` no busca los textos prohibidos en js/css/svg**: en esos archivos "681" haría match en hashes de assets, y ningún texto de usuario vive ahí. Sí los busca en el HTML crudo (meta, alt, JSON-LD incluidos), en los JSON y en el sitemap.
- **Fila del tarifario sin valor** (si algún día una categoría no tiene precio): muestra un guion con texto para lectores de pantalla, no "a confirmar".
