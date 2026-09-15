# Obligaciones del pliego para la web

Lo que el **PETG art. 61.6 y 61.7** (Pliego de Especificaciones Técnicas Generales, Red Federal de Concesiones, Etapa III) exige al sitio de la concesionaria, y cómo lo cumple la web de Covicen después de la actualización de septiembre de 2026 (spec `docs/superpowers/specs/2026-09-13-actualizacion-web-design.md`, §13). Ver [[Home]] · [[Costura de datos]] · [[Decisiones de arquitectura]].

Criterio general: **esconder, no "a confirmar"**. Lo que depende de un dato que Covicen todavía no tiene se implementa como slot que aparece solo cuando el dato existe; `scripts/verificar.ts` falla si el sitio dice "a confirmar".

**Estado al cierre (2026-09-14, Fases 0 a 6 ejecutadas):** todo lo que dependía del código está hecho y verificado (`astro check`, 373 tests, `verificar` sobre 30 páginas con html-validate y contraste en los dos temas). Lo que en la tabla dice "Covicen", "DNV" o "dominio" espera un dato y aparece solo al cargarlo: la lista de qué es `null` hoy y dónde se vería está en [[Costura de datos]] ("Datos hoy ocultos"), y la tabla campo → archivo → efecto para quien lo cargue, en `docs/guia-de-revision.md`.

| Obligación (61.6 / 61.7) | Cómo se cumple | Depende de |
|---|---|---|
| Razón social, CUIT | Slot en footer y Transparencia (`empresa.razonSocial`, `cuit`); QR de Data Fiscal en `public/qr-afip.png` + `constanciaUrl` | Covicen (inscripción) |
| Domicilio legal y comercial | Slots `domicilioLegal`, `domicilioComercial` | Covicen |
| Sectores de detención segura | `cabina.servicios.detencionSegura`; la leyenda del mapa solo lo lista cuando alguna estación lo tiene | Covicen (ubicaciones) |
| Estaciones de peaje | `/el-tramo/` (mapa interactivo) y `/peajes/<slug>/` × 6, con km, vías, estado, servicios | cumple |
| Póliza de RC con aseguradora | Slot `empresa.polizaRc` en Transparencia | Covicen |
| Canales con características y plazos | `contacto.canales` (PETG 58): tabla `Canales.astro` en Servicios y Emergencias, con acuse (24 h) y respuesta (5 días hábiles); los no habilitados dicen desde cuándo | cumple; 0800, correo y WhatsApp: Covicen |
| Normativa aplicable descargable | `normativa.json` en Transparencia: Res. 1379/2026, Res. 248/2026, Ley 27.742, Decreto 97/2025; pliegos `descargable: false` | pliegos firmados: Covicen |
| Mapa interactivo con estado, peajes, servicios | `MapaInteractivo` (estaciones enfocables, verde/amarillo por estado, tarjeta al tocar, leyenda de servicios) + `EstadoTraza` con `estado-ruta.json`: hoy **datos de ejemplo** (`ejemplo: true`) con cartel inequívoco, incidentes ubicados por km en el mapa de El tramo; el módulo en vivo es la capacidad `estadoRutasEnVivo` | datos reales: Operaciones |
| Fecha y hora de última actualización, diaria | Footer: `fechaHoraLarga(new Date())` en hora argentina; el workflow reconstruye a diario | cumple |
| Servicios gratuitos y onerosos | `servicios.json` en `/servicios/`: grúa 30/60 min (PETG 54), 140 (59), TelePASE gratis (50.5), sanitarios (57); mecánica y remolque extendido con costo (55) | cumple |
| Links a DNV, Transporte y Presidencia | Fila institucional del footer (`src/lib/institucional.ts`), con hueco para logos oficiales en `src/assets/institucional/` | cumple |
| Links a canales de atención de la DNV | Slot `contacto.enlaces.atencionDnv` | DNV / Covicen |
| Accesible; contraste 4,5:1; 14 px párrafos / 12 px anotaciones; interlineado 1,5–2 y separación de párrafos 1,5×; enlaces subrayados; sin justificado; alt descriptivo; teclado; vista de impresión | Contraste de todos los pares verificado en los dos temas (`scripts/lib/pares.ts`, `verificar.ts`); enlaces subrayados por regla global, 14 px mínimo, 12 px solo con `.anotacion`, `p + p` a 1,5 interlineados, sin `text-align: justify`, con guarda (`tests/styles/legibilidad.test.ts`); `alt` exigido por `verificar.ts`; foco visible al saltar al contenido y `aria-expanded` en Nosotros; hoja de impresión completa (`src/styles/impresion.css`) con botón Imprimir en Tarifas y en cada estación, encabezado con sitio y fecha, URL de los enlaces externos; HTML válido por html-validate en cada página. Ver [[Sistema de diseno]] | cumple |
| Dominio con www + 301 | No vive en el repo. Pasos en `README.md` → "Migración al dominio propio": `www.covicen.com.ar` como dominio personalizado de Pages, A/AAAA del apex a GitHub para el 301, `PUBLIC_SITE_URL` / `PUBLIC_BASE_PATH=/` / `PUBLIC_INDEXABLE=true`. La URL va en la cartelería de las cabinas (PETG 66.3 c): fijarla antes de imprimir | dominio (no registrado): Juli / Covicen |
| Botón de asistencia en traza (60.5) | `/asistencia/`: 140 grande, botón que pide la ubicación del celular con permiso, la muestra, la copia y la mete en el campo de solo lectura del formulario; también en la barra inferior del celular y en cada tarjeta de estación. **No simula envío**: sin canal, arma el texto para copiarlo o dictarlo al 140; nada se guarda | envío real: canal (WhatsApp / CRM) |
| Correo atencionalusuario@covicen.com.ar (61.5) | Slot `contacto.atencionUsuario`; no se publica hasta que la casilla funcione (decisión de Juli) | dominio |
| Tres formularios (61.5) | `Formulario.astro`: reclamos/consultas/sugerencias y consultas de TelePASE en Contacto (con prioridad, 61.5 b), trámites en la Guía de trámites, más asistencia, trabajá con nosotros y proveedores; plazos del pliego junto al botón; **deshabilitados con aviso honesto** mientras no haya canal (WhatsApp o correo), sin inventar destino | envío real: canal / CRM |
| Responsive, SEO, navegadores vigentes | Ya se cumplía: estático, canonical, description, JSON-LD, sitemap; `verificar.ts` lo controla en cada build | cumple |
| Respuesta inmediata a cada interacción | Cada acción tiene respuesta visible: estado del pedido de ubicación (`aria-live`), "Ubicación copiada", foco y `aria-current` en el mapa, cinta de avisos con tres frenos (puntero, foco y boton) | cumple |
| Datos de los usuarios seguros | El sitio no guarda nada: no hay cuentas, cookies de terceros ni seguimiento; la ubicación solo vive en la página; los formularios viajan por el canal que elige el usuario (Privacidad lo dice) | cumple |
| Subtítulos en videos | No hay videos | no aplica |
| Emergencias 140 (59) | `tel:140` en toda página (header, barra inferior, footer, tarjetas); `verificar.ts` lo exige | cumple |
| Tarifas con vigencia y resolución | `/tarifas/`: cuadro heredado Res. 248/2026 por estación, leyenda del Anexo B, descuentos (53.3), exenciones (52), diferencial, sin pagar (51.1.4), categorías futuras (53.2) | cumple |
