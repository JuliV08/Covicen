# Costura de datos

Cómo el front lee contenido hoy (JSON/Markdown del repo) sin que mañana duela conectar los sistemas. Criterio textual de Juli: *"que no duela en el futuro conectar todo con los futuros sistemas"*. Ver [[Decisiones de arquitectura]] · [[Home]].

## Estructura

```
src/content/                      JSON/MD versionados. SOLO los lee fuentes/local-*.ts
src/content.config.ts             colección `novedades` (Markdown) con el schema del contrato
src/lib/datos/
  esquemas.ts                     Zod + tipos: EL CONTRATO (Empresa, Contacto, Tramo, Cabina, Tarifario, Obra, Novedad, Pregunta, EstadoRuta;
                                  desde sept. 2026 también avisos, canales, servicios, normativa, trámites y consejos)
  fuente.ts                       interface FuenteDatos (todos los métodos async)
  fuentes/local-json.ts           v1: JSON importado + import.meta.glob, validado con Zod
  fuentes/local-novedades.ts      v1: astro:content (se importa diferido)
  fuentes/api.ts                  Django: tramo() y tarifario() contra la API pública (fetch + safeParse). El resto sigue local.
  capacidades.ts                  flags de lo que depende de sistemas
  index.ts                        export const datos = FUENTE_DATOS === 'api' ? fuenteApi : fuenteLocal
```

Dirección única de dependencia: `content/ → lib/datos/ → componentes/páginas`. Un componente que importe de `content/` es un bug.

## Las cinco reglas

1. **Un solo contrato.** El mismo schema Zod valida el JSON de hoy y la respuesta de la API de mañana. Si Django devuelve otra cosa, rompe en build.
2. **La UI formatea, los datos no.** Nada de `"$1.399"` en JSON: `lib/formato.ts` (es-AR).
3. **Interfaz async desde el día 1**, aunque hoy se resuelva en build.
4. **`fuentes/api.ts` no mockea.** Lo que el sistema no tiene todavía no se simula: viene del repo. (Hasta el 2026-09-06 lanzaba `FuenteApi: no implementado`.)
5. **Formularios reales sin backend**: link `wa.me` con mensaje estructurado. `ticketingReclamos` es **a futuro**: cuando exista el CRM hay que **implementar el POST en `Formulario.astro`**. Ojo: hoy el componente **no lee ese flag**; prenderlo solo esconde los dos `HuecoCapacidad` de "Seguimiento de reclamos" (`/contacto/` y `/servicios/`) y los formularios quedan igual.

## Capacidades (huecos reservados)

`capacidades.ts`: `estadoRutasEnVivo`, `oficinaVirtual`, `ticketingReclamos`, `portalProveedores`, `canalEticoAnonimo` — todas `false`. El componente `HuecoCapacidad` renderiza el hueco ("Próximamente" + alternativa real) cuando el flag está apagado y el `<slot />` cuando está prendido.

## Cómo está conectado el sistema (desde el 2026-09-06)

`fuentes/api.ts` implementa **solo** `tramo()` y `tarifario()` contra la API pública del sistema (`/api/v1/tramo/`, `/api/v1/tarifario/`), con `fetch` + `esquema.safeParse`: si el servidor no responde, devuelve otra forma o no hay cuadro vigente (404), **el build falla** y no se publica basura. `index.ts` compone `{ ...fuenteLocal, ...fuenteApi }` cuando `FUENTE_DATOS=api`: la API para lo que el sistema tiene, el repo para el resto (empresa, contacto, obras, novedades, FAQ, estado de rutas). La regla 4 sigue: lo que no existe no se simula.

- `API_URL` (variable de build, no pública) es obligatoria con `FUENTE_DATOS=api`; `config.apiUrl` la expone sin barra final.
- El contrato lo siguen mandando los esquemas Zod: `pnpm contrato` exporta `docs/contrato/{tramo,tarifario}.schema.json` y el backend valida cada respuesta contra esos archivos en su suite. Dos campos nuevos, opcionales: `montoConIva` y `freeFlow`.
- Los textos que carga un operador (`avisos`, `vigencia.descripcion`, `nota`, `fuente.nombre`) se pintan como texto; hay un test que inyecta HTML y comprueba que no se convierte en elementos.
- Workflow de Pages: `repository_dispatch` (`datos-publicados`, lo dispara el sistema al publicar) y un cron diario a las 03:00 (los cuadros programados entran solos). `FUENTE_DATOS` pasa a `api` cuando existe la variable de repositorio `API_URL`; hasta que haya VPS, sigue en `local`.
- Demo local: `FUENTE_DATOS=api API_URL=http://localhost:8000 pnpm build` contra el Docker del sistema (verificado el 2026-09-06: 21 páginas, `verificar` OK).
- Fixtures reales de la API en `tests/fixtures/api/`, validados por Zod en `tests/lib/fuente-api.test.ts`.

## Cómo se conectó (histórico: el plan original)

1. Implementar cada método de `fuentes/api.ts` con `fetch` + `esquemaX.parse(...)` (el contrato manda; si el sistema viejo devuelve otra forma, el mapeo va en `api.ts`, no en la UI).
2. `FUENTE_DATOS=api` en el entorno del build (o SSR con adapter si hace falta runtime).
3. Encender flags en `capacidades.ts`. Los componentes no se tocan.
4. Para "estado de rutas en vivo": una isla que consuma `datos.estadoRutas()` en runtime; el contrato ya es async.

## Datos hoy ocultos (null en `src/content/`)

Criterio desde sept. 2026: **esconder, no "a confirmar"**. Un dato `null` no se renderiza (ni el rótulo, ni un guion, ni un "próximamente"), y `scripts/verificar.ts` falla si `dist/` dice "a confirmar", "Corredor Vial del Centro" o "681". Los slots existen en la UI y aparecen solos al editar el JSON (o cuando lo mande el backend). Estado al cierre de la actualización (2026-09-14):

| Dato | Dónde (`src/content/`) | Qué aparece cuando exista |
|---|---|---|
| `razonSocial`, `cuit`, `domicilioLegal` (los tres juntos), `domicilioComercial`, `constanciaUrl` | `empresa.json` | Columna "Datos registrales" del footer y bloque en Transparencia; el responsable en Privacidad. Con `cuit` y `public/qr-afip.png`, el QR de Data Fiscal enlazando a la constancia. `enFormacion: false` saca "Sociedad en formación" y el párrafo de Quiénes somos. |
| `polizaRc { aseguradora, numero, vigenciaHasta, url? }` | `empresa.json` | Ficha de la póliza en Transparencia (hoy dice que se publica con la toma de posesión). |
| `lineaGratuita` (0800), `atencionUsuario` (correo), `whatsapp.numero`, `email.*` | `contacto.json` | Filas del footer; los formularios pasan de deshabilitados a "Enviar por WhatsApp" / "Enviar por correo"; Emergencias suma "También por WhatsApp"; el hueco del canal ético usa `email.etica`. |
| `canales[].valor` de `correo`, `linea-0800`, `whatsapp` | `contacto.json` | El enlace en la tabla de canales, en vez de "Se habilita con la toma de posesión, el 5 de octubre de 2026". |
| `redes { instagram, facebook, linkedin, youtube, x }` | `contacto.json` | Fila de redes en el footer (por nombre hasta tener los logos oficiales). |
| `enlaces.oficinaVirtual`, `enlaces.atencionDnv` | `contacto.json` | Aparece "Mi cuenta" (barra superior, menú y la sección de Medios de pago) y abre la oficina virtual; **sin la URL no se muestra nada** de Mi cuenta desde el 24/09/2026 (antes la prometía «con la toma de posesión», y no se sabe si va a existir). Enlace a la atención al usuario de la DNV en la línea inferior del footer. |
| `cuentaRegularizacion` | `contacto.json` | Cómo pagar la deuda en "Pasaste sin pagar" (Medios de pago). |
| `cabinas[].telefono`, `horarioAtencion`, `vias`, `sentido`, `servicios.*` (`detencionSegura`, `sanitarios`, `colocacionTelepase` en ninguna todavía) | `tramo.json` | Filas de la tarjeta de estación; la leyenda del mapa y "Dónde se coloca" el TelePASE listan solo lo que alguna estación tiene. |
| `ejemplo: true` | `estado-ruta.json` | Mientras sea `true`, cartel "Datos de ejemplo" en el estado de la traza; con `false` (datos del centro de operaciones) desaparece. |
| Imágenes | `public/qr-afip.png`, `src/assets/institucional/organigrama.png`, `src/assets/institucional/<id>.svg` (logos monocromos de la fila institucional), `src/assets/atmosfera/consorcio-diurna.jpg` (opcional) | QR, sección Organigrama en Quiénes somos, logos en vez de los lockups tipográficos, y la versión de día del panel del Consorcio para que deje de ser zona oscura fija. La foto de día del hero **ya está cargada** (2026-09-15). |

Ya no hay valores "a confirmar" en tarifas: el cuadro heredado de la Res. 248/2026 tiene las cinco categorías con precio. La tabla completa "campo → archivo → efecto", para quien cargue los datos, está en `docs/guia-de-revision.md` ("Cómo cargar lo que falta").

## Campos nuevos del contrato (2026-09-13)

Agregados en la actualización de la web de septiembre de 2026 (spec `docs/superpowers/specs/2026-09-13-actualizacion-web-design.md` §6.2). **Todos opcionales**: el backend puede mandarlos cuando quiera; si faltan, la web deriva o esconde. `pnpm contrato` regenera `docs/contrato/*.schema.json`.

- **tramo.rutas[]**: `pkInicial`, `pkFinal` (progresivas del PETP art. 1; sirven para ubicar un km sobre el trazo del mapa).
- **tramo.ciudades[]**: `tipo: 'ciudad' | 'empalme'` (default `ciudad`; el empalme RN 34 / RN 19 es un nodo del trazado, no una ciudad).
- **tramo.cabinas[]**: `operativa` (si falta se deriva de `situacion === 'existente'`, helper `cabinaOperativa`), `vias`, `sentido`, `telefono`, `horarioAtencion`, `servicios { areaDescanso, detencionSegura, gruaGratuita, sanitarios, colocacionTelepase }`.
- **tarifario**: `origen` suma el valor `heredado` (cuadro de la saliente, Res. 248/2026), `resolucion`, `cabinas[]` (slugs donde rige), `categoriaDestacada`, `excepciones[] { cabina, categoria, montoSinIva, montoManualSinIva }`.
- **tarifario.tarifas[]**: `montoManualSinIva` (hoy igual al TelePASE), `multiplicador` (PETG 53.2, informativo).
- Solo del repo (sin contrato con el backend todavía): `contacto` ampliado (`emergencias.telefono` obligatorio = 140, `lineaGratuita`, `atencionUsuario`, `enlaces { telepase, oficinaVirtual, atencionDnv }`, `canales[]` con acuse y respuesta del PETG 58), `empresa` sin `descriptor` y con `domicilioComercial` + `constanciaUrl`, y `avisos.json` (cinta de avisos desde el 15/09/2026, antes barra superior; con `desde`/`hasta`; futuro: se editan desde el backoffice junto a las novedades, sin tocar el componente).

Criterio (ver "Datos hoy ocultos", arriba): **esconder, no "a confirmar"**. Un dato `null` no se renderiza y `scripts/verificar.ts` falla si el HTML, los JSON o el XML de `dist/` dicen "a confirmar", "Corredor Vial del Centro" o "681" (no mira js/css/svg: ahí `681` haría match en hashes de assets, y ningún texto de usuario vive en esos archivos).

## Lo que deriva `src/lib/tramo.ts` (2026-09-13)

El mapa y las tarjetas no leen el JSON crudo: pasan por `src/lib/tramo.ts`.

- `estadoCabina(c)`: verde "Operativa" si `cabinaOperativa(c)` (campo `operativa`, o `situacion === 'existente'` si falta); si no, amarillo "Próxima" ("· Free Flow" cuando `freeFlow`).
- `serviciosDeCabina(c)` / `leyendaServicios(tramo)`: solo los servicios que existen; la leyenda del mapa lista únicamente los que alguna estación tiene.
- `puntoEnRuta(tramo, ruta, km)`: interpola el km sobre la polilínea del trazado. **Los trazados van en el sentido de las progresivas** (`pkInicial` en el primer nodo, `pkFinal` en el último): RN 9 de Rosario (297) a Córdoba (660,16), RN 19 de Santo Tomé (0) a San Francisco (127,19), RN 34 de Rosario (0) al empalme con la RN 19 (188,68). Es esquemático: el dibujo no está a escala, así que un km cae "más o menos" donde corresponde. Lo usa el estado de la traza para ubicar incidentes.
- `viewBox 820×520` del mapa son coordenadas del contrato (el backoffice las usa para la vista previa): no se cambian.

## Lo que deriva `src/lib/tarifas.ts` (2026-09-13)

- `tarifasParaCabina(tarifario, slug)`: las filas generales con las `excepciones` de esa cabina aplicadas (mismo modelo que el backend). `montoManualSinIva` ausente = igual a TelePASE (Res. 248/2026: un solo precio); `null` = sin valor publicado (guion + texto solo para lectores).
- `publico(sinIva, conIvaSistema, alicuota)`: el "con IVA" que manda el sistema si viene; si no, `conIva()` redondeado al peso. Es el número grande de la tabla; el sin IVA va como anotación.
- `tarifaDestacada(t)`: la de `categoriaDestacada` o la primera (home). `cabinasDelCuadro(t, cabinas)`: las listadas en `tarifario.cabinas` o todas las operativas.
- `iconoDeTarifa(f)`: `icono` explícito, o el mapa legado por categoría (`cat-1` → moto… del esquema anterior, por si la API manda tarifarios viejos), o `auto`.
- Datos: `src/content/tarifario.json` es el cuadro heredado de la **Resolución 248/2026** (DNV, vigente desde el 26/02/2026), cinco categorías, sin IVA del anexo oficial (1.239,67 → $1.500 con IVA). `origen: 'heredado'`. La tarifa ofertada ($1.399 + IVA) queda en `empresa.concesion.tarifaOfertadaSinIva` como dato histórico, no como precio.

## Métodos nuevos de `FuenteDatos` (2026-09-13, Fases 1 y 4)

Solo fuente local (`src/lib/datos/fuentes/local-json.ts`); `api.ts` no los simula. Todos validan con Zod al leer el JSON.

| Método | Archivo | Qué es |
|---|---|---|
| `avisos()` | `src/content/avisos.json` | Barra superior; filtrados por `desde`/`hasta` con la fecha de Argentina del build. |
| `servicios()` | `src/content/servicios.json` | Servicios gratuitos y con costo (PETG 54, 55, 57, 59), con `alcance`, `tiempos` y `fuente`. |
| `normativa()` | `src/content/normativa.json` | Normas aplicables con `url` y `descargable`; los pliegos van con `descargable: false` hasta tener la versión firmada. |
| `tramites()` | `src/content/tramites.json` | Trámites del usuario (PETG 61.5 c): quién, requisitos, pasos, plazo, url, fuente. |
| `consejos()` | `src/content/consejos.json` | Seguridad vial (`conducir`) y pasos ante una emergencia (`emergencia`); los usan Seguridad vial y Emergencias. |

Slots nuevos que se esconden hasta tener el dato: `empresa.polizaRc` (Transparencia), `contacto.cuentaRegularizacion` (Medios de pago), `empresa.domicilioComercial`, `contacto.lineaGratuita`, `contacto.atencionUsuario`, `contacto.enlaces.oficinaVirtual` y `atencionDnv`. Imagen opcional `src/assets/institucional/organigrama.png` (Quiénes somos). `pnpm originalidad <urls>` compara Quiénes somos contra otras concesionarias (secuencias de 6 palabras), a mano, no en CI.

## Estado de la traza (2026-09-13, Fase 5)

`src/content/estado-ruta.json` alimenta `datos.estadoRutas()` con **datos de ejemplo** (`ejemplo: true`): el componente `EstadoTraza` lo dice con un cartel inequívoco y el mapa de El tramo ubica los incidentes por km. Cuando exista el centro de operaciones, la misma forma (`disponible`, `ejemplo: false`, `actualizado` ISO con zona, `incidentes[] { ruta, km, tipo, severidad, sentido, descripcion, desde?, hasta? }`) la manda el sistema y una isla la pide en runtime (capacidad `estadoRutasEnVivo`). `src/lib/estado.ts` reduce a una fila por ruta con el peor nivel (normal / precaución / corte).


## El interruptor de lo no confirmado (2026-09-20)

`src/lib/publicado.ts`: **el único lugar del sitio donde se decide si una sección se publica**. Un objeto
congelado de booleanos, uno por sección, con su comentario de por qué está apagada.

**No es lo mismo que `capacidades.ts`**, y la diferencia importa:

| | `capacidades.ts` | `publicado.ts` |
|---|---|---|
| Qué dice | «el sistema todavía no existe» | «el dato existe pero nadie lo certificó» |
| Qué muestra | un hueco con una alternativa real («Próximamente» + a dónde ir mientras tanto) | **nada**: ni el rótulo, ni un guion, ni un «próximamente» |
| Ejemplos | portal de proveedores, canal ético anónimo (la oficina virtual y el ticketing de reclamos dejaron de mostrarse el 24/09/2026: el cliente no quiere «Próximamente» de sistemas que no se sabe si van a existir) | descuentos por frecuencia, tarifa diferencial, recargos, obras, formulario de TelePASE |

**Reglas que lo sostienen, y que tienen test:**

1. **Son literales y nada más.** Ni `import.meta.env`, ni imports, ni ternarios, ni `if`. `tests/lib/publicado.test.ts`
   lee el archivo y falla si aparece cualquiera de esas cosas. El motivo no es purismo: el que carga el dato no es
   programador, y el día que este archivo deje de leerse de un vistazo deja de servir para lo que fue hecho.
2. **Un dato, un interruptor.** «Pasaste sin pagar» aparece en Tarifas y en Medios de pago: lo gobierna el mismo
   booleano. Con dos, el dato se escondería en una página y se publicaría en la otra, que es peor que no esconderlo.
3. **Esconder no es borrar.** El contenido de lo escondido sigue versionado (las seis obras, los dos trámites de
   tarifa diferencial, las constantes de las secciones de Tarifas), y hay tests que exigen que siga ahí: si alguien
   lo borra «para limpiar», prender el `true` dejaría una sección vacía y nadie se enteraría.
4. **La contracara es obligatoria.** Cada `false` tiene su fila en `docs/pendientes-de-confirmacion.md`, con la
   pregunta redactada, a quién va, qué vuelve y dónde se carga. Esconder sin esa lista es perder el dato.

Los números de sección («01», «02») **ya no existen** desde el 24/09/2026: el cliente los marcó dos veces y se sacaron
de todo el sitio, con `src/lib/indices.ts`, que los corría solos. Esconder una sección ya no deja nada que renumerar.

**Cómo se esconde una página entera**, que es distinto de esconder una sección: ver
[[Arquitectura de informacion de la landing]]. Astro no deja quitar una ruta fija desde un hook, pero una ruta
rest con `getStaticPaths` devolviendo `[]` no genera nada, ni siquiera la entrada del sitemap.

**Trampa encontrada al despublicar una novedad**: el guion bajo saca un archivo del *routing* de Astro, pero
**no** de una colección de contenido. `content.config.ts` carga las novedades con `glob({ pattern: '**/*.md',
base: './src/content/novedades' })`, así que un `_borradores/README.md` entró igual a la colección y `astro
check` lo rechazó por no cumplir el schema. La única forma de sacar algo de una colección es sacarlo de la
carpeta base: quedó en `src/content/novedades-despublicadas/`.

### Esconder por página no es esconder (lección del 20/09/2026)

Las cinco secciones de Tarifas se escondieron bien. **Y las preguntas frecuentes siguieron publicando los mismos
números**: los porcentajes de descuento, los recargos por pasar sin pagar y la tarifa vecinal, palabra por
palabra, y además al JSON-LD, o sea a Google. Lo encontró la revisión, no los tests. La causa es tonta y cara:
**cada página se escondió por su lado y nadie miró el conjunto**.

> Un dato escondido en una página y publicado en otra es **peor** que no esconderlo: da la sensación de que se
> ocultó algo, y el que lo encuentra deja de creerle al resto del sitio.

El arreglo que importa no fue tapar las tres preguntas: fue el **chequeo 10c de `scripts/verificar.ts`**, que ata
`publicado.ts` con el `dist` entero. Antes no había NADA mecánico entre el interruptor y lo que se emite, y por
eso el error sobrevivió a 544 tests. Apenas se prendió, el candado encontró solo **cuatro fugas más** que ni el
autor ni el revisor habían listado a ojo, incluidas **dos meta descriptions** que seguían ofreciendo en los
resultados de Google cosas que el sitio ya no publicaba.

**Tres reglas que deja, y que valen para cualquier interruptor de visibilidad:**

1. **El candado va sobre lo que se publica, no sobre el código.** Un filtro en una página cubre esa página; un
   barrido del `dist` cubre las que todavía no existen.
2. **Un barrido sobre HTML crudo no ve las frases partidas por una etiqueta.** «50 veces» y «la tarifa vigente»
   salen en dos `<dd>` distintos: el patrón `/veces la tarifa/` era un patrón muerto y parecía cobertura. Hay que
   correrlo también sobre el texto visible normalizado.
3. **Un filtro opt-in se olvida.** `preguntasPublicables` empezó llamándose desde la página; terminó llamándose
   desde `Faq.astro`, que es el único render de preguntas del sitio. El piso no puede depender de que alguien se
   acuerde.

Y una cuarta, que no es de código: **la coherencia también se escapa por página**. La FAQ decía que la tarifa
ofertada llega «cuando Vialidad homologue el cuadro» y cuatro novedades publicadas decían «cuando terminen las
obras iniciales». Las dos son defendibles; las dos juntas, no. Se unificó en la condición del contrato
(transitabilidad óptima verificada por Vialidad), que es un hecho con fuente y no un cronograma.
