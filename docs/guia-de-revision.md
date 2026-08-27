# Guía de revisión — landing Covicen

**URL local:** `pnpm dev` → http://localhost:4321/ (con `.env` copiado de `.env.example` y `PUBLIC_BASE_PATH=/`; sin `.env` también anda, con base `/`).
**URL de Pages:** `https://<cuenta>.github.io/covicen/` después del primer push a `main` con Pages habilitado (Settings → Pages → Source: GitHub Actions; con cuenta Free el repo tiene que ser público).

Probá en el teléfono también (misma red: `pnpm dev --host` y la IP que imprime). Chrome/Edge/Safari tienen scroll-driven animations; **Firefox estable no** (junio 2026): ahí las animaciones de scroll usan el fallback (reveal por IntersectionObserver, hilo de ruta oculto, mojones fijos) y tiene que verse igual de terminado.

## Home `/`
- Hero: la ruta se dibuja sola al cargar (~1 s); eyebrow, título, texto, botones y cuenta regresiva entran escalonados con un desenfoque leve. La cuenta regresiva cambia a "Inicio de operación en N d · HH h · MM min" y se actualiza cada minuto.
- Al scrollear: el header gana fondo translúcido y borde; en desktop, el hilo luminoso del margen izquierdo baja con el scroll; en mobile, la barra fina bajo el header crece. El fondo del hero tiene parallax leve.
- Accesos rápidos (se superponen al final del hero): cuatro cards; la de Emergencias es amarilla; hover eleva, extiende los esquineros y agrega sombra.
- Tarifa: `$ 1.399` grande, `$ 1.693` con IVA, etiqueta "Tarifa ofertada", vigencia en texto, tope de licitación y link al Boletín Oficial.
- Mapa: las tres rutas se dibujan con el scroll (glow celeste + marcas amarillas); las seis balizas amarillas se encienden en secuencia; hover/foco en una baliza agranda el halo y muestra el nombre.
- Mojones (681 km, 3 rutas, 6 peajes): en Chrome cuentan de 0 al valor al entrar en pantalla; en Firefox aparecen fijos.
- Obras: cuatro cards + el hueco "Estado de rutas — Próximamente" (sticky en desktop) con botón a Emergencias.
- Servicios (fondo con grilla de plano), Novedades (3 últimas), Consorcio (2 mojones + lista), FAQ corto (5 preguntas con `<details>`, chevron rota, apertura animada), CTA de contacto.
- Barra de emergencias fija abajo en mobile (< 640 px) con "número a confirmar"; en ≥ 640 px el CTA amarillo está en el header.

## Tarifas `/tarifas/`
- Tabla: 6 categorías con ícono propio; solo Autos tiene valor; el resto "— a confirmar". Vigencia arriba, tres avisos y fuente abajo. Hover de fila tiñe el ícono.
- Tres botones secundarios al pie (cómo pagar, dónde están los peajes, desde cuándo se cobra).

## El tramo `/el-tramo/`
- Desktop: mapa fijo (sticky) mientras pasan cuatro paneles con mojones (681 km, 3 rutas, 2 provincias, 6 peajes). Mobile: apilado.
- Estaciones: seis cards con señal "Nueva"/"Existente", localidad y fuente; avisos abajo.

## Servicios, Emergencias, Medios de pago, Seguridad vial
- Servicios: hub con las tres cards + dos huecos (oficina virtual, seguimiento de reclamos).
- Emergencias: bloque amarillo con el número (o "a confirmar") y cuatro pasos numerados; botón a seguridad vial.
- Medios de pago: tres cards (TelePASE, efectivo, Free Flow) + botón externo a TelePASE + hueco "Pagá tu factura".
- Seguridad vial: ocho consejos numerados en grilla.

## Obras, Quiénes somos, Políticas, Transparencia
- Obras: línea de tiempo vertical con puntos; señal de estado; hueco de estado de rutas al final. (Si existe `src/assets/atmosfera/obras-nocturnas.jpg`, aparece una foto 21:9 arriba.)
- Quiénes somos: tres mojones, tres cards del consorcio, ficha de la concesión con link al BO y lista de compromisos.
- Políticas: navegación por anclas; tres artículos; en Anticorrupción, hueco "Canal ético anónimo" con alternativa por correo (hoy "a confirmar").
- Transparencia: cuatro fuentes oficiales con link; datos registrales "en formación".

## Novedades `/novedades/` y detalle
- Listado de 4 con fecha y etiquetas; detalle con fecha, resumen, cuerpo Markdown (`.prose-covicen`), botón volver. Transición de página suave (fade + 8 px) al navegar; el header no parpadea.

## Preguntas frecuentes, Contacto, Trabajá con nosotros, Proveedores
- FAQ agrupada por tema con anclas; `FAQPage` en JSON-LD.
- Contacto: tres canales (emergencias, WhatsApp, correo — hoy "a confirmar"), hueco de seguimiento y formulario con validación en español. Con número cargado, "Enviar por WhatsApp" abre `wa.me` con el mensaje armado; hoy muestra "canal a confirmar".
- Trabajá con nosotros y Proveedores: formulario con selects (zona/área o rubro) + mensaje; hueco de portal de proveedores.

## Pie y navegación
- Footer: 4 columnas, datos registrales "a confirmar", "Sociedad en formación", link a Privacidad y sitios de interés.
- Menú mobile: se desliza desde la derecha con fondo oscurecido; cierra con la X o Esc. Dropdown "Nosotros" en desktop: abre con clic o teclado (Tab/Enter), cierra con Esc o clic afuera.
- Foco visible en todo (Tab por la página): anillo celeste; amarillo en el CTA de emergencias.
- `prefers-reduced-motion`: todo estático, sin transiciones.
- 404: `/lo-que-sea/` muestra la página de error con los tres accesos.

## Qué NO está (por diseño, v1)
Estado de rutas en vivo, oficina virtual, ticketing, portal de proveedores, canal ético anónimo, modo claro, dominio, número de emergencias/WhatsApp/mails, valores de categorías salvo auto, CUIT/razón social, imágenes fotográficas (opcionales: `docs/marca/prompts-imagenes.md`).

## Cómo cargar lo que falta (sin tocar componentes)
- Teléfono, WhatsApp, mails, redes → `src/content/contacto.json`.
- Valores por categoría, vigencia, origen "homologada" → `src/content/tarifario.json`.
- Razón social, CUIT, domicilio, `enFormacion: false` → `src/content/empresa.json`.
- Nueva novedad → un `.md` en `src/content/novedades/` con el frontmatter de los existentes.
- Avance de obra → `avance` (0-100) y `estado` en `src/content/obras/*.json`.
- Encender un sistema → flag en `src/lib/datos/capacidades.ts` + implementar en `src/lib/datos/fuentes/api.ts`.
