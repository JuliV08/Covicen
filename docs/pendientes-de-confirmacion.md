# Qué falta confirmar, y a quién preguntárselo

**Fecha:** 20 de septiembre de 2026, actualizado el 24/09 y el 25/09 · **Sale de:** la call con el gerente del 20/09
y las correcciones del 24/09 (el 13 y la pregunta del precio del 5 de octubre). El formulario de TelePASE, que se
agregó el 24/09, quedó resuelto el 25/09.

En esa call quedó una regla: **lo que no está confirmado no se publica con salvedades, se esconde**. Este documento
es la otra mitad de esa decisión — la lista de qué hay que ir a preguntar para que vuelva a aparecer.

Cada fila trae la pregunta **redactada para copiar y pegar** en un mail o leerla en una reunión. No hace falta saber
nada de la web para hacerla.

Cuando llegue una respuesta, el que carga el dato abre
`C:\Users\Villex\dev\Covicen\src\lib\publicado.ts`, **cambia un `false` por un `true`**, y la sección vuelve
entera. No hay que tocar nada más.

---

## Resuelto el 25/09 · El formulario de TelePASE volvió

El 24/09 el equipo pidió sacar el formulario de consultas de TelePASE de Contacto «hasta que definamos si va a haber o
no oficina virtual». El 25/09 se definió: la oficina virtual es **Autogestión**, la web de autogestión de Telepeaje
Plus (https://www.telepeajeplus.com/Login), y el formulario **volvió**.

**Que no se vuelva a apagar sin saber esto:** el PETG, art. 61.5, dice que el concesionario «deberá disponer en su
Sitio Web» de tres formularios, y el b) es:

> «Un Formulario Web con el objeto de canalizar consultas especificas del servicio de TelePASE. El CONCESIONARIO
> deberá buscar brindar respuesta en un plazo menor a este tipo de consultas…»

O sea: haya o no oficina virtual, desde la toma de posesión la web tiene que tener ese formulario. El interruptor
(`publicado.formularioTelepase`, en `C:\Users\Villex\dev\Covicen\src\lib\publicado.ts`) sigue existiendo, pero
apagarlo es incumplir el pliego.

---

## 1 · Tarifas — descuentos por frecuencia

**Qué falta:** los porcentajes de descuento y desde qué pasada rigen.

> «¿Se confirman los descuentos por frecuencia del 15 %, 25 % y 35 % a partir de las pasadas 36, 45 y 61 del mes,
> por estación, en ambos sentidos y solo para categoría 1 con TelePASE? ¿Desde qué fecha rigen?»

- **A quién:** el responsable del área de tarifas.
- **Qué vuelve:** la sección «Descuentos por frecuencia» de Tarifas, con las tres tarjetas.
- **Dónde se carga:** `publicado.descuentosPorFrecuencia` → `true`, y los porcentajes en
  `C:\Users\Villex\dev\Covicen\src\pages\tarifas.astro` (constante `descuentos`).
- **Por qué se sacó:** pedido textual del gerente, «que esté certificada la info del porcentaje que te van a descontar».

---

## 2 · Tarifas y trámites — tarifa diferencial para vecinos, frentistas y docentes

**Qué falta:** si el beneficio existe desde el día uno, cuánto es, y dónde se tramita.

> «¿La tarifa diferencial para vecinos, frentistas y docentes rige desde el 5 de octubre? ¿Cuál es el monto o el
> porcentaje? ¿Dónde se tramita: por Trámites a Distancia, en la estación, por la web? ¿Qué documentación piden
> exactamente y cada cuánto hay que renovarlo?»

- **A quién:** el responsable del área. Es el que el gerente marcó como «certificar ese tema primero».
- **Qué vuelve:** la sección «Tarifa diferencial» de Tarifas **y** las dos fichas de la Guía de trámites (vecinos y
  frentistas, y docentes).
- **Dónde se carga:** `publicado.tarifaDiferencial` y `publicado.tramiteVecinosFrentistas` → `true`; el monto y los
  requisitos, en `C:\Users\Villex\dev\Covicen\src\content\tramites.json`.
- **Nota:** son dos interruptores a propósito. El trámite se podría confirmar antes que el monto, o al revés.

---

## 3 · Tarifas y medios de pago — si pasaste sin pagar

**Qué falta:** los recargos y por qué medio se regulariza la deuda.

> «¿Se confirma que quien pasa sin pagar abona la tarifa más una tarifa extra dentro de los 30 días, y la tarifa más
> dos tarifas después de los 30 días, con intereses a la tasa activa del Banco Nación? ¿Por qué medio concreto se
> paga esa deuda: transferencia, link de pago, en la estación? Si es transferencia, ¿a qué cuenta?»

- **A quién:** el responsable del área.
- **Qué vuelve:** la sección «Si pasaste sin pagar» en **dos** páginas: Tarifas y Medios de pago.
- **Dónde se carga:** `publicado.pasasteSinPagar` → `true`; la cuenta bancaria, en
  `C:\Users\Villex\dev\Covicen\src\content\contacto.json` (campo `cuentaRegularizacion`).
- **Ojo:** es un solo interruptor para las dos páginas, a propósito. Si fueran dos, el dato podría quedar escondido
  en una y publicado en la otra.

---

## 4 · Tarifas — exceso de carga

**Qué falta:** confirmar los multiplicadores y si habrá balanzas operativas.

> «¿Se confirma que la tarifa de una pasada con exceso de carga se multiplica por 50 (exceso del 10 % al 30 %) y por
> 100 (exceso de más del 30 %)? ¿Va a haber balanzas de pesaje dinámico operativas desde el inicio de la concesión?»

- **A quién:** el responsable del área.
- **Qué vuelve:** la sección «Exceso de carga» de Tarifas.
- **Dónde se carga:** `publicado.excesoDeCarga` → `true`; los multiplicadores, en `src\pages\tarifas.astro`
  (constante `excesoDeCarga`).

---

## 5 · Tarifas — las categorías que van a regir

**Qué falta:** si se publica ya la estructura de categorías futura.

> «¿Se puede publicar ya el esquema de categorías que va a regir después de las obras iniciales de puesta en valor,
> aunque sea sin precios? ¿O conviene esperar a que Vialidad Nacional homologue el cuadro?»

- **A quién:** el responsable del área.
- **Qué vuelve:** la sección «Las categorías que van a regir» de Tarifas, con su tabla.
- **Dónde se carga:** `publicado.categoriasFuturas` → `true`.

---

## 6 · Obras

**Qué falta:** todo. En la call quedó dicho que «no se sabe nada del tema obras».

> «¿Hay un plan de obras confirmado, con frentes y fechas? ¿Se puede publicar el listado y el estado de avance de
> cada uno? Si todavía no, ¿cuándo conviene volver a preguntar?»

- **A quién:** gerencia.
- **Qué vuelve:** la **página `/obras/` entera** (hoy no existe en el sitio publicado), su lugar en el menú de
  arriba y en el pie, y una novedad que estaba publicada y se bajó.
- **Dónde se carga:** `publicado.obras` → `true`, y mover
  `C:\Users\Villex\dev\Covicen\src\content\novedades-despublicadas\2026-08-27-obras-antes-que-peaje.md`
  a `C:\Users\Villex\dev\Covicen\src\content\novedades\`. El contenido de las seis obras sigue versionado en
  `C:\Users\Villex\dev\Covicen\src\content\obras\`.

---

## 7 · Estaciones nuevas — cómo van a cobrar

**Qué falta:** si Leones, San Francisco y Totoras van a ser Free Flow.

> «¿Está confirmado que Leones, San Francisco y Totoras van a operar con cobro sin barreras (Free Flow)? Hoy la web
> no lo dice en ningún lado: las tres figuran solo como “Próxima”.»

- **A quién:** gerencia.
- **Qué vuelve:** la etiqueta de modalidad en el estado de cada estación y la sección que lo explicaba en Medios de
  pago.
- **Dónde se carga:** el dato ya está en `C:\Users\Villex\dev\Covicen\src\content\tramo.json` (campo `freeFlow`);
  lo que hay que volver a prender es el texto en
  `C:\Users\Villex\dev\Covicen\src\lib\tramo.ts` (función `estadoCabina`).
- **Por qué se sacó:** «no está asegurado que sea de esa manera y no se sabe cómo va a ser».

---

## 8 · Estaciones — qué hay de verdad en cada área de descanso

**Qué falta:** el dato fino, estación por estación. Hoy lo único cargado es grueso («tiene área de descanso», igual
para las tres operativas), que no responde nada.

> «Estación por estación (Carcarañá, James Craik y Franck): ¿qué hay realmente disponible para el que para? ¿Baños?
> ¿Agua? ¿Un sector de detención segura señalizado? ¿Se puede colocar el TelePASE ahí? ¿En qué horarios?»

- **A quién:** Operaciones.
- **Qué vuelve:** la sección «Áreas de descanso y servicios» de El tramo (hoy no se muestra) y las filas
  correspondientes en la ficha de cada estación del mapa.
- **Dónde se carga:** `publicado.serviciosDeAreaDescanso` → `true`, y los servicios en
  `C:\Users\Villex\dev\Covicen\src\content\tramo.json`, en `cabinas[].servicios`
  (`areaDescanso`, `detencionSegura`, `sanitarios`, `colocacionTelepase`, `gruaGratuita`).

---

## 9 · Mapa — ubicaciones exactas

**Qué falta:** dónde está exactamente cada estación y cada área de descanso.

> «¿Tienen el kilómetro exacto, o las coordenadas, de cada estación de peaje y de cada área de descanso? El mapa de
> la web hoy es esquemático y ubica las cosas “más o menos”.»

- **A quién:** Operaciones.
- **Qué vuelve:** precisión del mapa (hoy funciona, pero no está a escala).
- **Dónde se carga:** `C:\Users\Villex\dev\Covicen\src\content\tramo.json`, en `cabinas[].mapa` y `ciudades[]`.

---

## 10 · Estado de la traza en tiempo real

**Qué falta:** el centro de operaciones.

> «¿Cuándo va a haber un centro de operaciones que pueda informar cortes, desvíos y clima por ruta y kilómetro? Hoy
> ese módulo existe en la web pero con datos de ejemplo, y por eso se sacó de la portada.»

- **A quién:** Operaciones.
- **Qué vuelve:** el módulo de estado con datos reales, y la posibilidad de volver a ponerlo en la portada.
- **Dónde se carga:** `C:\Users\Villex\dev\Covicen\src\content\estado-ruta.json` → `ejemplo: false` y los
  incidentes reales.

---

## 11 · TelePASE — qué documentación piden

**Qué falta:** el sitio oficial de TelePASE **no publica** qué documentación piden al adherirse, así que la web de
Covicen no lo dice (no se inventa).

> «¿Qué documentación pide TelePASE para dar de alta un dispositivo? ¿DNI, cédula del vehículo, algo más? Lo
> preguntamos para poder decirlo en la guía de trámites y que la gente vaya con todo.»

- **A quién:** el referente de TelePASE, o el área que gestione la relación.
- **Qué vuelve:** la lista de documentación en la ficha «Alta de TelePASE» de la Guía de trámites.
- **Dónde se carga:** `C:\Users\Villex\dev\Covicen\src\content\tramites.json`, trámite `alta-telepase`, campo
  `requisitos`.

---

## 12 · Dónde se coloca el TelePASE

**Qué falta:** en qué estaciones y con qué horarios se puede colocar el dispositivo.

> «¿En qué estaciones se va a poder colocar el TelePASE, y en qué días y horarios? Lo preguntamos para poder
> decirlo en Medios de pago: hoy la web no lo dice en ningún lado.»

- **A quién:** Operaciones.
- **Qué vuelve:** la tarjeta «Dónde se coloca» de Medios de pago, que hoy no se muestra.
- **Dónde se carga:** `C:\Users\Villex\dev\Covicen\src\content\tramo.json`, en `cabinas[].servicios.colocacionTelepase`.
- **Por qué se sacó:** esta tarjeta decía «en los sectores de detención segura de las estaciones… publicamos las
  ubicaciones cuando Covicen las defina». Eso era un dato sin confirmar más un «próximamente» en prosa, que es
  justo lo que la regla de la casa prohíbe. Venía de antes de esta tanda y se limpió el 20/09.

---

## 13 · Ficha de cada estación — ubicación, teléfono y atención

**Agregado el 24/09/2026**, a pedido del equipo: para completar la ficha de cada estación hace falta que Covicen diga
dónde está cada cosa. Va junto con el 8 (qué hay en cada área de descanso) y el 9 (ubicaciones exactas del mapa):
conviene preguntarlo todo en la misma charla con Operaciones.

> «Estación por estación (Carcarañá, James Craik y Franck, y las nuevas cuando se habiliten): ¿dónde está ubicada el
> área de descanso (en qué kilómetro y de qué lado de la ruta)? ¿Qué número de teléfono de atención tiene cada
> estación? ¿Hay atención al usuario en persona? Si la hay, ¿dónde está y en qué horario atiende?»

- **A quién:** Operaciones.
- **Qué vuelve:** en la ficha de cada estación (el mapa de El tramo y la página `/peajes/<estación>/`), el teléfono
  y el horario de atención.
- **Dónde se carga:** el teléfono y el horario ya tienen su lugar: `telefono` y `horarioAtencion` de cada estación en
  `C:\Users\Villex\dev\Covicen\src\content\tramo.json` (`cabinas[]`), y aparecen solos. **La ubicación del área de
  descanso y la del puesto de atención todavía no tienen campo**: cuando llegue el dato hay que sumarlo al contrato de
  datos (un cambio chico, del lado del código).

---

## Para confirmar aunque esté publicado · el precio del 5 de octubre

**Agregado el 24/09/2026.** No es algo escondido: la web publica que desde la toma de posesión rige el cuadro de la
Resolución 248/2026 ($ 1.500 el auto). Pero al releer el pliego para estas correcciones apareció el **PETG art. 82,
inciso a)** («Tarifas a aplicar a la fecha de Toma de Posesión»): toma las últimas tarifas aplicadas antes de la toma
y dice que **se ajustarán** multiplicando cada una, sin IVA, por el **coeficiente de variación de la tarifa (Cvt)**,
que sale de índices del INDEC. El ajuste es obligatorio; lo que no se sabe es **cuánto da**, porque depende del mes que
se tome como base. Si da distinto de 1, el 5/10 el precio no sería el de hoy. Conviene que el área lo confirme antes.

> «El artículo 82 a) del pliego dice que el cuadro del día de la toma de posesión sale de ajustar las últimas tarifas
> por el coeficiente de variación de la tarifa (Cvt). ¿Cuánto da ese coeficiente para el 5 de octubre? ¿Se sigue
> cobrando el cuadro de la Resolución 248/2026 tal cual ($ 1.500 el auto), o va a salir un cuadro ajustado? Si sale
> uno nuevo, ¿con qué resolución y desde qué fecha?»

- **A quién:** el responsable del área de tarifas.
- **Qué cambia si la respuesta es «sale uno nuevo»:** los montos, la resolución y la vigencia en
  `C:\Users\Villex\dev\Covicen\src\content\tarifario.json` (de ahí salen las tablas y el precio de la descripción para
  buscadores de Tarifas). Y además, porque tienen el precio o «el mismo cuadro» escrito a mano:
  - las preguntas frecuentes `03-cuanto-cuesta-el-peaje.json`, `05-desde-cuando-se-cobra.json` y
    `12-peajes-existentes.json`, en `C:\Users\Villex\dev\Covicen\src\content\faq\`;
  - las novedades «Qué cuadro tarifario rige desde el 5 de octubre» (dice que ese día no cambia el precio) y «Qué
    cambia el 5 de octubre…», en `C:\Users\Villex\dev\Covicen\src\content\novedades\`.

---

## Además: lo que ya venía esperando desde antes

Esta lista **no reemplaza** la que ya existía. Los datos de la empresa y de contacto que faltan desde septiembre
—razón social, CUIT, domicilios, línea 0800, casilla de atención al usuario, WhatsApp, redes, póliza de
responsabilidad civil, organigrama— siguen pendientes (la oficina virtual se cargó el 25/09) y están detallados, con el
archivo y el efecto de cada uno, en:

**`C:\Users\Villex\dev\Covicen\docs\guia-de-revision.md`**, sección «Qué está oculto hasta tener el dato» y
«Cómo cargar lo que falta».

---

## Dos cosas que se arreglaron al ir a la fuente

No son pendientes: son cosas que **estaban mal publicadas** y ya se corrigieron. Van acá porque conviene que el
área las sepa.

1. **La exención de peaje por discapacidad estaba desactualizada.** La web decía que se presenta una solicitud ante
   Vialidad Nacional «según su reglamento vigente». El trámite real es **100 % digital por la app Mi Argentina** y
   exige el **Símbolo Internacional de Acceso vinculado al dominio del vehículo**, que no nombrábamos. Alguien pudo
   haber ido a una oficina al pedo. Corregido con la página oficial de argentina.gob.ar, y ahora la web enlaza
   directo al trámite (antes no tenía enlace).

2. **La exención para ex combatientes de Malvinas también.** Pedíamos certificado de veterano, cédula del vehículo
   y TelePASE habilitado. El trámite real es **una declaración jurada más copia del DNI, por correo a
   atencionalusuario@vialidad.gob.ar**. Nada de eso figuraba. Corregido con la página oficial.
