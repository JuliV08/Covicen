# Sistemas de Covicen

Mapa objetivo de los sistemas de Covicen y el primer sistema decidido. Cerrado en el brainstorming del **2026-09-05** con Juli. Ver [[Home]] · [[Costura de datos]] · [[Decisiones de arquitectura]] · [[Arquitectura de informacion de la landing]].

> El análisis de los sistemas de referencia de Corredores Viales (CVSA) vive en el vault privado de Juli, no acá. Este documento solo contiene lo que es de Covicen.

## Estado (2026-09-06, noche): sistema 1 construido, demo local

El tarifario + catálogo del tramo está construido de punta a punta en el repo privado `JuliV08/covicen-sistemas` (commits locales por tarea, sin push todavía). Qué hay:

- **Backend** (Django 5.2 + DRF + Postgres 17): módulos `cuentas` (usuario propio por email, tres grupos: Carga, Publicación, Administración; bloqueo por intentos; contraseña temporal que hay que cambiar), `tramo` (concesión, rutas, ciudades con trazado, cabinas), `tarifario` (categorías, cuadros con vigencia y estado, tarifas con IVA calculado; dos cuadros publicados no pueden solaparse, lo garantiza la base), `publicacion` (registro de cada publicación y aviso a GitHub para que la landing se reconstruya). API pública `/api/v1/` de solo lectura con caché y ETag; API del panel `/api/panel/` con sesión por cookie y CSRF. 137 tests, con el contrato de la landing validado contra los JSON Schema exportados de los esquemas Zod.
- **Panel** (React + Vite + Tailwind, tema "Papel con marco de tinta", ver [[Sistema de diseno del panel]]): ingreso, inicio (cuadro vigente, próximo, pendientes, cabinas, últimas publicaciones), cuadros (lista, detalle con grilla, encabezado, historial, acciones por estado y diálogo de publicar que dice qué cuadro cierra y desde cuándo rige), catálogo (rutas con la concesión, ciudades con el recorrido, cabinas con vista previa sobre el mapa), categorías, publicaciones (con reintento del aviso) y usuarios (alta con contraseña temporal mostrada una sola vez). Alrededor de 300 tests con la API simulada y siete guardas de diseño (sin colores literales, un solo botón, un solo select, sin emojis, íconos del set).
- **Infra**: Docker Compose local (un comando) y de producción (Caddy con HTTPS automático, backups diarios cifrados, Postgres sin puertos al host), imagen del panel sobre Caddy con CSP estricta, workflows de CI y deploy por SSH a GHCR. Como no hay minutos de GitHub Actions, la compuerta hoy es local (`lefthook` antes de cada push corre lo mismo que CI); el runner propio en el VPS viene con el VPS.
- **Seguridad**: dos pasadas (una sobre la spec, otra sobre el código) por un agente de seguridad que no escribió el código; sin hallazgos altos; los medios se arreglaron el mismo día y lo que depende de infraestructura ajena quedó con fecha en `docs/runbooks/pendientes-seguridad.md` del repo privado.
- **Landing**: `fuentes/api.ts` implementado para tramo y tarifario; build verificado contra el sistema local (ver [[Costura de datos]]).

**Cierre (2026-09-07).** Revisión final de todo el repo por un revisor que no escribió el código: "apto con arreglos antes", los arreglos aplicados el mismo día (fecha de Córdoba en la API pública, rango de vigencias solapado como 409, página "no encontrada", Administración borra rutas y ciudades, link de la fuente solo si es http, la web muestra el "con IVA" que manda el sistema). Tercera pasada de seguridad sobre CI y contenedores aplicada. Prueba de punta a punta con Playwright escrita (corre cuando exista el runner). Queda: que Juli pushee los dos repos (el CI del backend baja el contrato del repo público), la demo en su máquina, y lo que depende de Covicen: VPS, dominio, cuadro homologado, cabinas confirmadas, usuarios reales, bucket de backups. Desvíos a la spec anotados al final de la spec.

## Qué se convierte en qué

Lo que una concesionaria hace por dentro se puede agrupar en cuatro capas. CVSA lo resolvió con veinte repos (trece aplicaciones chicas en Laravel clonadas del mismo esqueleto, un servidor de identidad aparte, dos sistemas nuevos en Django + React y una plataforma de datos). Covicen nace con **un solo proyecto Django modular**, una identidad, un deploy, y cada capacidad como un módulo.

| Capacidad (lo que CVSA tiene repartido) | En Covicen | Cuándo |
|---|---|---|
| Identidad, roles, auditoría de accesos | Módulo `cuentas`: usuarios, grupos y permisos nativos de Django, historial de cambios | Sistema 1 |
| Catálogo del tramo (rutas, cabinas, km, coordenadas) | Módulo `tramo`: una sola fuente de verdad para la web y para todo lo que venga | Sistema 1 |
| Tarifario (en CVSA: SQL a mano en la base de cabinas + fotos en la web) | Módulo `tarifario`: cuadros con vigencia, borrador → publicado, IVA calculado, API pública | **Sistema 1** |
| Publicación hacia la web (en CVSA: commit + deploy) | Circuito borrador/publicado que avisa a GitHub y la landing se reconstruye sola | Sistema 1 |
| Adjuntos (pliegos, resoluciones) | Módulo de archivos con validación real y sin ejecución en el servidor | Nace en el 1 (resolución del cuadro), crece en el 2 |
| Licitaciones y portal de proveedores | Módulo `licitaciones`: estados reales, cierre automático por fecha, adjuntos, API | Sistema 2 |
| Obras y estado de rutas | Módulo `obras` sobre el catálogo (ruta y km) + estado en vivo por isla | Sistema 3 |
| Trámites, reclamos, canal ético, exenciones | Motor de trámites (formularios, estados, áreas, portal ciudadano, adjuntos, chat) | Sistema 4 |
| Operación de peaje (tránsitos, cierres fiscales, AFIP, balanzas) | Depende del proveedor de cabinas. El catálogo ya va a existir | Cuando haya cabinas |
| Intranet, soporte interno, aceptación de políticas | Sobre lo mismo (motor de trámites + documentos) | Cuando haya nómina |
| Capacitación (campus) | Se contrata, no se construye | Nunca |
| Firmas de mail | Es una página, no un sistema | Si alguien lo pide |

## Roadmap

Los sistemas se planifican como **continuos**, no como trimestres: el esfuerzo de construcción es de sesiones, no de meses. Lo que fija las fechas de salida son los insumos del cliente (cuadro homologado, servidor, pliegos, definición de trámites). Regla que no se negocia: **cada sistema sale con tests y con una revisión hecha por alguien que no escribió el código antes de arrancar el siguiente.**

| # | Sistema | Construcción | Lo que fija la fecha |
|---|---|---|---|
| 1 | Tarifario + catálogo del tramo | 2 a 3 sesiones | Cuadro homologado por Vialidad; VPS de Covicen |
| 2 | Licitaciones y proveedores | 1 a 2 sesiones | Pliegos reales |
| 3 | Obras y estado de rutas | 2 sesiones | Datos de obras del contrato |
| 4 | Trámites y reclamos | 4 a 6 sesiones | Qué trámites existen y quién los atiende |
| 5 | Intranet chica | 1 a 2 sesiones | Que haya empleados |
| 6 | Operación de peaje | Depende del proveedor | Cabinas operando |

## Primer sistema: tarifario + catálogo del tramo

**Por qué este y no otro.** Es lo que el automovilista busca el 5/10 (cuánto y dónde), ya tiene lugar y contrato en la landing, es obligatorio el día 1, cambia por índices oficiales, es el dominio más chico, y el catálogo que trae debajo es transversal. No depende de cabinas ni de ningún sistema externo. Licitaciones va segundo porque una sociedad sin CUIT no licita el 5/10. Trámites es el más valioso a mediano plazo pero cinco veces más grande. La mesa de ayuda de CVSA es soporte interno de IT, no aplica.

**Las cinco mejoras respecto de la referencia** (todo lo demás fuera de v1):
1. **Vigencias que no se pisan, garantizado por la base de datos.** Dos cuadros nunca rigen el mismo día.
2. **Publicar con un botón, con quién y cuándo.** Borrador → revisión → publicado; historial completo; la web se actualiza sola en minutos.
3. **Cuadro programado a futuro.** Se carga hoy el que rige desde el mes que viene; la web muestra el vigente y avisa el próximo.
4. **IVA calculado, no tipeado.** Se carga sin IVA; el sistema calcula el final con redondeo definido y publica los dos.
5. **API pública de solo lectura con la fuente citada.** El cuadro vigente por cabina y categoría, con la resolución que lo respalda.

Fuera de v1: franjas horarias, precio por sentido, tarifas diferenciales (vecinos, docentes: eso es trámites), varios idiomas, doble firma de aprobación.

Spec: `docs/superpowers/specs/2026-09-05-tarifario-design.md` · Plan: `docs/superpowers/plans/2026-09-05-tarifario.md`.

## Decisiones cerradas (2026-09-05) y por qué

| Tema | Decisión | Por qué |
|---|---|---|
| Identidad | **Un solo proyecto Django, una identidad.** Usuarios, grupos y permisos nativos; modelo de usuario propio desde el día 1. Puerta abierta a un login único externo si algún día hay diez sistemas. | Un servidor de identidad aparte para un equipo de una persona es fricción sin retorno. La referencia lo tiene y duplica la app de usuarios entre proyectos. |
| Panel del operador | **Backoffice entero en React** (Vite + React + TanStack Query, la misma base que el backoffice de V-Shop, con los tokens de Covicen). Django queda como backend: modelos, API, permisos, publicación. **Sin admin de Django.** Estructura visual: tema "Papel con marco de tinta" de Juli adaptado a la marca, ver [[Sistema de diseno del panel]]. | Reafirmado por Juli tras la contra del tech lead (que proponía Unfold para salir antes): consistencia con todos sus proyectos y margen de calendario. Costo asumido: dos o tres sesiones más que con el admin. |
| Cómo consume la landing | **Se reconstruye sola cuando el operador publica.** La landing sigue estática; al publicar, el sistema avisa a GitHub y el build lee la API. Si el VPS se cae, la web sigue arriba con lo último publicado. Más un rebuild diario programado para los cuadros a futuro. | Cero costo extra, SEO intacto, sin JS de más en la ruta. Las islas en vivo quedan para lo que de verdad es en vivo (estado de rutas). |
| Dueño del contrato | **Los esquemas Zod del front.** Django cumple el contrato; su suite de tests valida la salida contra el JSON Schema exportado de esos esquemas. | Regla 1 de [[Costura de datos]]: un solo contrato; si Django devuelve otra cosa, rompe en build y no se publica basura. |
| Repo del backend | **Repo privado aparte bajo la cuenta de Juli** (`covicen-sistemas`). La landing sigue pública. | La lección de la referencia: en los repos terminan apareciendo claves. Una organización Covicen se arma cuando exista la sociedad. |
| VPS | **Lo contrata Covicen.** Hasta entonces, **todo funcional en la máquina de Juli** con un solo comando. El paquete es el mismo en local y en el servidor. | Decisión de Juli. Objeción asentada: si la inscripción se demora, se demora la puesta en producción, no el desarrollo. |
| Infra | Docker Compose (Django + Postgres + Caddy), HTTPS automático, backups diarios, deploy desde GitHub Actions con llave SSH, un entorno productivo y el local como preproducción. | Lo mínimo que se mantiene solo. Caddy en vez de Nginx + certbot: mismo resultado con una quinta parte de la configuración. |
| CI como compuerta | **Nada llega a producción sin CI en verde**: tests, chequeo de migraciones, validación del contrato contra los esquemas del front, lint. La revisión final la hace alguien que no escribió el código. | Palabras de Juli: "estamos para no cometer los mismos errores que ellos". La referencia no tiene tests en 12 de 13 sistemas y despliega con `git checkout` en el server. |
| Postura de seguridad | API pública **solo lectura**, sin login, con límite de pedidos. Panel detrás de login con bloqueo por intentos. Ningún upload anónimo. Adjuntos con nombre generado por el servidor, tipo verificado de verdad, servidos sin ejecución. Sin endpoints operativos por HTTP. Secretos fuera del repo. | Traducción directa del incidente de seguridad de la referencia. |
| Horizonte | A largo plazo todo montado en el VPS, cada app en su subdominio (landing, panel, API). | Pedido de Juli. Compatible: los mismos archivos estáticos los sirve el VPS el día que haya dominio. |

## Objeciones asentadas
- **Sobre el panel en React (y no el admin de Django):** el tech lead recomendó Unfold para salir antes; Juli reafirmó React por consistencia entre sus proyectos. Decisión de Juli, asentada, con el costo estimado a la vista.
- **Sobre "solo devs editan contenido" (decisión de v1 de la landing):** el tarifario la rompe a propósito. Si Vialidad homologa el cuadro, alguien de Covicen tiene que cargarlo sin llamar a un dev. Es la razón de ser del primer sistema.
- **Sobre el VPS contratado por Covicen:** riesgo de fecha si la inscripción se demora. Aceptado por Juli con la condición de demo local completa.
- **Sobre los tiempos:** Juli objetó estimaciones largas; tenía razón en que eran fechas de calendario y no esfuerzo. Se corrigió a sesiones de construcción; las fechas las fijan los insumos del cliente.
