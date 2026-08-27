# Arquitectura de información de la landing

Qué secciones necesita Covicen el día 1, derivado de [[Contexto del negocio (Corredores Viales)]]. Ver [[Home]].

## El trabajo real del sitio el 5 de octubre

El 5/10 aparecen cabinas de peaje nuevas. El automovilista que las cruza va a googlear **"quién cobra este peaje" / "tarifa peaje ruta 9"**. La landing tiene que ganarle a esa búsqueda y responder en 5 segundos: **cuánto, dónde, por qué, cómo pago, a quién le reclamo.**

Eso reordena todo: no es un folleto institucional con un formulario de contacto abajo. Es una **página de servicio público con respaldo institucional**. La credibilidad corporativa es el marco; la utilidad es el contenido.

Consecuencia directa: **el SEO no es opcional y no es "para después"**. Tiene que rankear el día del arranque, lo que empuja fuerte hacia render en servidor o pre-render, y contra un SPA de Vite pelado.

## Audiencias

1. **Automovilista** — tarifas, dónde están los peajes, medios de pago, emergencias, auxilio, seguridad vial, obras.
2. **Institucional / Estado** — quiénes somos, el consorcio, el tramo, el contrato, políticas, transparencia.
3. **Terceros** — proveedores, licitaciones, prensa, RRHH.

## v1 — entra, y es 100% estático

Contenido versionado en el repo (MDX/JSON), sin backend:

| Sección | Nota |
|---|---|
| Home | Hero + accesos rápidos: tarifas, emergencias, el tramo |
| El tramo | Mapa, rutas, km, provincias, dónde están las cabinas |
| Quiénes somos | El consorcio, la concesión, plazo de 20 años, qué asumimos |
| Tarifario | Tabla estática **con fecha de vigencia visible** + categorías de vehículo |
| Medios de pago / TelePASE | Explicativo + link externo |
| **Emergencias** | Teléfono con `tel:`, visible desde cualquier página |
| Servicios al usuario | Auxilio mecánico, móviles de seguridad vial |
| Consejos de seguridad vial | Contenido propio, buen material para SEO |
| Obras y avance | Clave: no se cobra tarifa plena hasta "transitabilidad óptima" |
| Políticas | Calidad, Seguridad Vial, Anticorrupción |
| Transparencia | Marco legal + links a Boletín Oficial y Vialidad Nacional |
| Novedades | 3-5 posts fundacionales en MDX |
| Trabajá con nosotros | `mailto:` o form que despacha mail |
| Contacto + FAQ | FAQ con schema `FAQPage` |

## v1 — NO entra (depende de sistemas que no existen)

CVSA se alimenta de un backoffice con varios sistemas viejos. Covicen no tiene nada de eso. Estas quedan afuera, **pero el diseño deja el hueco listo**:

| Sección | Qué hacemos en v1 |
|---|---|
| Estado de rutas en tiempo real | Fuera. Slot reservado en el layout |
| Oficina virtual / pagá tu factura | Fuera, o link externo si aparece |
| Reclamos con ticketing | Form que manda mail, sin backend de tickets |
| Portal de proveedores / licitaciones | Listado estático o "próximamente" |
| Canal ético | Mail dedicado (el anónimo real necesita backend + política de retención) |
| Calculadora de tarifa / buscador de peajes | v2 |

## La decisión que hay que tomar bien de entrada

**Costura anti-corrupción.** Definir HOY la forma de los datos (tarifas, novedades, estado de rutas, obras) detrás de un adaptador, de modo que hoy lea un JSON del repo y mañana una API de los sistemas viejos, **sin tocar un componente de UI**. Si esto no se define ahora, el día que aparezcan los sistemas hay que reescribir medio front.

Y la más cara de revertir: **¿el cliente edita novedades y tarifas sin devs?** Si la respuesta es sí, hace falta algún panel, y eso cambia el stack de v1. Va al brainstorming.
