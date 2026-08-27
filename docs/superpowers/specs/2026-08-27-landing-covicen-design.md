# Landing fundacional de Covicen — diseño (spec)

- **Fecha:** 2026-08-27
- **Estado:** aprobado en brainstorming con Juli; pendiente de revisión del documento escrito.
- **Contexto de negocio:** `obsidian/Home.md` → [[Contexto del negocio (Corredores Viales)]] y [[Arquitectura de informacion de la landing]]. Este spec no repite eso; lo referencia.

## 1. Qué se construye y para qué

La landing fundacional de **Covicen**, concesionaria del **Tramo Centro** de la Red Federal de Concesiones (681 km sobre RN 9, RN 19 y RN 34; Córdoba y Santa Fe), que arranca a operar el **5 de octubre de 2026**.

**Reencuadre acordado en el brainstorming:** la v1 **no se publica todavía bajo dominio propio**. Es el **producto terminado que se muestra al equipo y al cliente para vender el proyecto**, hosteado en GitHub Pages. "Terminado" significa: funcional al 100%, con SEO, accesibilidad y contenido reales; no una maqueta. El día que exista dominio, se flipea un switch y se sirve igual desde un VPS.

Dos audiencias mandan sobre el diseño, en este orden:

1. **El automovilista** que el 5/10 cruza una cabina nueva y googlea desde el teléfono, en la ruta, con mala señal. Quiere en 5 segundos: cuánto, dónde, cómo pago, a quién llamo.
2. **El interlocutor institucional** (Vialidad Nacional, prensa, proveedores, el consorcio mismo) que necesita ver seriedad, transparencia y respaldo.

## 2. Decisiones cerradas

| Tema | Decisión | Por qué |
|---|---|---|
| ¿Django en v1? | **No.** Django entra cuando existan sistemas, como API que alimenta el build (o como SSR sobre el mismo contrato). | v1 no tiene sistema que administrar; meter un backend en el camino crítico solo suma riesgo de fecha. |
| ¿Quién edita contenido? | **Solo devs vía repo** (Juli). Archivos versionados + deploy automático. | Es la decisión más cara de revertir y la más barata de mantener. La costura de datos deja listo el enchufe para un panel después. |
| Generador | **Astro 7 (static) + islas React + Tailwind 4.** | HTML completo en el primer byte (SEO día 1), cero JS por defecto (peso en la ruta), content collections con schema Zod = adaptador de fábrica. |
| Hosting v1 | **GitHub Pages desde GitHub Actions.** Sin dominio ni VPS por ahora. | La v1 es para mostrar y vender; migrar estático a un VPS después es copiar archivos. |
| Dominio | **No se registra todavía.** Cuando toque: `covicen.com.ar` (el manual de marca ya lo asume). `covicen.com` está tomado desde 2020 por un tercero (Amazon Registrar, vence 2026-11-16). NIC.ar exige CUIT y la sociedad no lo tiene → a nombre de un tercero y transferir. | Riesgo de fecha documentado; fuera del alcance de esta v1. |
| Marca | **Manual "Covicen Marca 9b1" es la marca aprobada.** Paleta y tipografía Archivo tal cual. | Confirmado por Juli. |
| Logotipo | **"COVICEN" + descriptor "CORREDOR VIAL DEL CENTRO", sin "SA".** | La sociedad no está inscripta; el tipo societario podría cambiar. El descriptor es marca, no dato registral. |
| Formularios | **Sin backend. Componen un link `wa.me` con mensaje estructurado**; mail como alternativa secundaria. Emergencias es `tel:`. | WhatsApp es el canal que usa el automovilista; en emergencia se llama. Cero cuentas de terceros en v1. |
| Animación | **Sistema de movimiento completo (§6): CSS scroll-driven + vanilla mínimo con fallback. GSAP no entra en v1.** | Juli pide calidad premium "hasta los detalles más mínimos", con seriedad. Todo lo planeado (reveals, scrub, sticky, dibujo de ruta, contadores, transiciones de página) se hace con CSS + <2 KB de JS; cada KB cuenta en la ruta. |
| Calidad visual | **Diferenciarse por completo de las webs de autopistas existentes.** Assets propios hechos a mano (SVG), animaciones, transiciones y hovers en todo lo interactivo. Serio y profesional, no "show de luces". | Pedido explícito de Juli. Es criterio de aceptación, no gusto. |
| Tema | **Navy oscuro y tech como base (dark-first).** Tokens semánticos desde el día 1; el modo claro es un archivo de tokens más, fuera de v1. | Pedido de Juli: "arrancar con un sitio navy oscuro y tech, que de última podemos ponerle un modo claro". Se audita AA sobre el tema oscuro. |
| Concepto creativo | **"La ruta, de noche."** Ver §6. Sin límites de creatividad, con dos líneas rojas: navegación intuitiva y directa, y nada de sobre-animación. | Pedido de Juli: salir de lo ordinario manteniendo el profesionalismo. |
| Copy | **Voseo, registro sobrio.** Solo afirmaciones verificables hoy. | Serio y confiable sin sonar a comunicado del Estado. |

## 3. Stack e infraestructura

### Dependencias (versiones verificadas en npm el 2026-08-27)

- `astro` 7.2.x, `@astrojs/react` 6.x, `@astrojs/sitemap` 3.x
- `tailwindcss` 4.3.x vía `@tailwindcss/vite` (tokens en `@theme`)
- ~~`react` / `react-dom`~~ **No se instalan en v1** (decisión tomada en la construcción: `@astrojs/react` emite ~60 KB gz de runtime aunque no haya islas, el doble del presupuesto). Cuando haga falta una isla: `pnpm astro add react`.
- `lucide-react` 1.34.x — **única** librería de íconos. Astro renderiza componentes React a HTML estático sin hidratar, así que sirve en `.astro` y en islas.
- `@fontsource-variable/archivo` 5.x — Archivo self-hosted, subset latin. Sin requests a Google Fonts.
- `zod` (viene con Astro para los schemas).
- Gestor: `pnpm`. Node 25 (ejecuta `.ts` directo para los scripts de verificación).

### Configuración

- `output: 'static'`, `build.format: 'directory'`, `trailingSlash: 'always'` → URLs `/tarifas/`, consistentes con lo que GitHub Pages sirve.
- `site` y `base` desde entorno: `PUBLIC_SITE_URL`, `PUBLIC_BASE_PATH`. Hoy `https://<cuenta>.github.io/covicen/`; con dominio, `https://covicen.com.ar` y base `/`. Todos los links internos pasan por un helper `ruta('/tarifas/')` que antepone `base`; **ningún componente escribe `/` a mano**.
- `PUBLIC_INDEXABLE` (`false` en la demo): controla `<meta name="robots">` y `robots.txt`. Sitemap y JSON-LD se generan siempre, para poder auditarlos.
- `FUENTE_DATOS=local` (ver §4).
- `.env.example` documenta las cuatro variables. El workflow de Pages las fija como `env` del job.

### Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` | servidor local |
| `pnpm build` | build estático a `dist/` |
| `pnpm check` | `astro check` (typecheck de `.ts` y templates `.astro`) |
| `pnpm verificar` | build + `scripts/verificar.ts` sobre `dist/` (ver §11) |

### Deploy

`.github/workflows/pages.yml`: en push a `main` → `pnpm install` → `pnpm check` → `pnpm build` → `actions/upload-pages-artifact` → `actions/deploy-pages`. Si `check` falla, no se publica.

### Repo

- `git init -b main` hecho. **No se commitea sin pedido explícito de Juli.**
- `.gitignore`: `node_modules`, `dist`, `.astro`, `.env`, `.omc/` (estado operativo de OMC; se mantiene la excepción `.omc/skills/**` si aparece).
- `Logo Covicen 2.pdf` se mueve a `docs/marca/` junto con los SVG extraídos. `PROMPT_MAESTRO.md` se mueve a `docs/`.

## 4. La costura de datos

Criterio de Juli, textual: *"que no duela en el futuro conectar todo con los futuros sistemas"*. Es el requisito de diseño de esta sección.

### Estructura

```
src/
  content/                      archivos versionados. SOLO los lee fuentes/local.ts
    empresa.json
    contacto.json
    tramo.json                  rutas, ciudades, cabinas
    tarifario.json
    obras/*.json
    faq/*.json
    novedades/*.md              frontmatter validado
  content.config.ts             colecciones Astro (content layer) con los schemas de lib/datos/esquemas.ts
  lib/datos/
    esquemas.ts                 Zod + tipos TS exportados. EL CONTRATO.
    fuente.ts                   interface FuenteDatos
    fuentes/local.ts            v1: lee las colecciones
    fuentes/api.ts              stub tipado: cada método lanza Error('FuenteApi: no implementado'). No es mock.
    capacidades.ts              flags de lo que depende de sistemas
    index.ts                    export const datos: FuenteDatos = elegirFuente(import.meta.env.FUENTE_DATOS)
  components/                   importan SOLO de lib/datos. Nunca de content/.
```

### El contrato (`esquemas.ts`)

Formas de dominio, no de pantalla. Fechas ISO (`YYYY-MM-DD`), montos `number` en ARS sin IVA, ids = slugs estables.

```ts
Empresa     { marca: 'Covicen', descriptor, razonSocial: string|null, cuit: string|null,
              domicilioLegal: string|null, enFormacion: boolean,
              consorcio: { nombre: string }[],
              concesion: { tramo: 'Centro', km: 681, rutas: string[], provincias: string[],
                           plazoAnios: 20, inicioOperacion: '2026-10-05',
                           adjudicacion: { fecha, resolucion, url },
                           tarifaOfertadaSinIva: 1399 } }
Contacto    { emergencias: { telefono: string|null, etiqueta: string },
              whatsapp: { numero: string|null },     // formato E.164 sin '+', para wa.me
              email: { general: string|null, rrhh: string|null, proveedores: string|null, etica: string|null },
              redes: { instagram?: string, x?: string, linkedin?: string } }
Ruta        { nombre: 'RN 9'|'RN 19'|'RN 34', desde, hasta, km: number|null }
Ciudad      { slug, nombre, provincia, mapa: { x: number, y: number } }   // coords del SVG propio
Cabina      { slug, nombre, ruta, km: number|null, localidad, provincia,
              estado: 'confirmada'|'a-confirmar', fuente?: { nombre, url } }
Tramo       { km: 681, rutas: Ruta[], provincias: string[], ciudades: Ciudad[], cabinas: Cabina[] }
Tarifa      { categoria: string, nombre, descripcion, montoSinIva: number|null, nota?: string }
Tarifario   { vigenciaDesde: string, moneda: 'ARS', alicuotaIva: number,
              origen: 'oferta'|'homologada', tarifas: Tarifa[],
              fuente: { nombre, url }, avisos: string[] }
Obra        { slug, titulo, ruta, tramo?: string, tipo, estado: 'planificada'|'en-ejecucion'|'terminada',
              avance: number|null, inicio?: string, finEstimado?: string, descripcion }
Novedad     { slug, titulo, fecha, resumen, etiquetas: string[], destacada: boolean, cuerpo (render) }
Pregunta    { slug, pregunta, respuesta, tema, orden }
EstadoRuta  { disponible: boolean, actualizado?: string, incidentes?: Incidente[] }
```

### La interfaz (`fuente.ts`)

```ts
export interface FuenteDatos {
  empresa(): Promise<Empresa>
  contacto(): Promise<Contacto>
  tramo(): Promise<Tramo>
  tarifario(): Promise<Tarifario>
  obras(): Promise<Obra[]>
  novedades(): Promise<Novedad[]>
  novedad(slug: string): Promise<Novedad | null>
  faq(): Promise<Pregunta[]>
  estadoRutas(): Promise<EstadoRuta>
}
```

Async desde el día 1 aunque hoy todo se resuelva en build: el mismo contrato lo consume una isla en runtime cuando exista API.

### Capacidades (`capacidades.ts`)

```ts
export const capacidades = {
  estadoRutasEnVivo: false,
  oficinaVirtual: false,
  ticketingReclamos: false,
  portalProveedores: false,
  canalEticoAnonimo: false,
} as const
```

Cada hueco reservado del layout lee su flag y renderiza (a) el hueco con mensaje sobrio y (b) la alternativa real de hoy (WhatsApp, mail). Encender = flag `true` + implementar el método en `fuentes/api.ts`. **El componente no se toca.**

### Reglas

1. **Un solo contrato.** El mismo schema valida el JSON del repo hoy y la respuesta de Django mañana (`esquemaTarifario.parse(await fetch(...))`). Si el sistema devuelve otra cosa, rompe en build.
2. **La UI formatea, los datos no.** Nada de `"$1.399"` en JSON; eso lo hace `lib/formato.ts` (moneda es-AR, fechas largas).
3. **Dirección única de dependencia.** `content/ → lib/datos/ → components/`. Un import de `content/` desde un componente es un bug.
4. **`fuentes/api.ts` no mockea.** Lanza. Cuando llegue Django, se implementa contra el contrato.
5. **Formularios reales sin backend.** Cada formulario compone `https://wa.me/<numero>?text=<mensaje>` con asunto y campos; mail secundario. Con `ticketingReclamos: true` el mismo componente hace POST.

## 5. Arquitectura de información

### Jerarquía y URLs

```
Home (/)
├── Tarifas (/tarifas/)
├── El tramo (/el-tramo/)
├── Servicios (/servicios/)
│   ├── Emergencias (/emergencias/)
│   └── Medios de pago (/medios-de-pago/)
├── Seguridad vial (/seguridad-vial/)
├── Obras (/obras/)
├── Novedades (/novedades/)
│   └── (/novedades/[slug]/)
├── Nosotros
│   ├── Quiénes somos (/quienes-somos/)
│   ├── Políticas (/politicas/)            calidad · seguridad vial · anticorrupción, una página con anclas
│   ├── Transparencia (/transparencia/)
│   └── Trabajá con nosotros (/trabaja-con-nosotros/)
├── Preguntas frecuentes (/preguntas-frecuentes/)
├── Contacto (/contacto/)
├── Proveedores (/proveedores/)            hueco: "próximamente" + canal real
└── Privacidad (/privacidad/)
```

Reservado (no en v1): `/peajes/[slug]/`, una página por cabina cuando estén confirmadas. El schema `Cabina` ya lo contempla.

### Navegación

- **Header:** logo (a Home) · Tarifas · El tramo · Servicios · Obras · Novedades · Nosotros ▾ (Quiénes somos, Políticas, Transparencia, Trabajá con nosotros) · Contacto · **CTA Emergencias** (amarillo vial, `tel:`).
- **Mobile:** drawer con Popover API. El teléfono de emergencias queda **siempre visible** en una barra compacta fija, independiente del menú. Si el número aún es `null`, la barra muestra "Emergencias — número a confirmar" con el mismo estilo (el slot existe y se ve).
- **Footer, 4 columnas:** Usuarios (Tarifas, Medios de pago, Emergencias, Seguridad vial, FAQ) · Empresa (Quiénes somos, Obras, Novedades, Políticas, Transparencia, Trabajá con nosotros) · Contacto (WhatsApp, mail, Proveedores, redes como slots) · Legal (slots para razón social, CUIT, domicilio; Privacidad). Línea inferior: sitios de interés (Vialidad Nacional, Red Federal de Concesiones, Boletín Oficial, TelePASE) y "Sociedad en formación".
- **Breadcrumbs** en toda página interior, con `BreadcrumbList`.
- **Enlazado interno:** Tarifas ↔ Medios de pago ↔ El tramo ↔ FAQ; Obras ↔ Novedades; Emergencias desde todas las páginas; Seguridad vial → Emergencias.

### Home, en orden

1. Hero: qué es Covicen, el tramo, el 5 de octubre. CTA primario Tarifas, secundario El tramo.
2. Accesos rápidos: Tarifas · Emergencias · El tramo · Medios de pago.
3. Tarifa destacada con **fecha de vigencia** y origen.
4. El tramo en mapa SVG.
5. Obras + **hueco de estado de rutas** (`estadoRutasEnVivo`).
6. Servicios al usuario.
7. Novedades (3 últimas).
8. El consorcio (confianza) + "la tarifa más baja de los ocho tramos".
9. FAQ corto (4-5) con link a la página completa.
10. Contacto.

## 6. Sistema de diseño

### Concepto rector: "La ruta, de noche"

El sitio es el corredor visto de noche. Fondo navy profundo (asfalto y cielo), y **la ruta como hilo luminoso celeste** que recorre y une todas las páginas: en el hero se dibuja sola, en el margen acompaña el scroll como línea de progreso, en el mapa es el trazo de RN 9/19/34 con las **cabinas como balizas** que se encienden, y en los divisores es la marca vial discontinua. Lo práctico —tarifas, obras, emergencias— habla en **señalética**: amarillo vial, Archivo 800, mayúsculas. Los números grandes (681 km, 20 años, $1.399) se tratan como **mojones**: tabulares, enormes, con unidad chica. Es infraestructura real, de noche, bien iluminada. Nada de esto es decoración: el hilo orienta, la señalética jerarquiza, los mojones dan escala.

**Registro "tech":** grilla de plano (blueprint) tenue en los fondos, esquineros finos en cards y paneles (como un dibujo técnico), numerales tabulares con `font-variant-numeric: tabular-nums`, índices de sección tipo `01 / 09`, bordes de 1px con blanco al 8-12%, y **luz** usada con criterio: un glow celeste suave solo en el hilo de ruta y en las balizas, nunca en botones ni texto. Sin glassmorphism genérico, sin partículas, sin cursor custom, sin scroll-jacking. **Cero emojis en la UI.**

**Dos líneas rojas (Juli):** navegación intuitiva y directa —el automovilista encuentra la tarifa en un clic aunque el sitio sea espectacular— y nada de sobre-animación: cada movimiento orienta, jerarquiza o confirma, o no existe.

### Tokens (un solo archivo: `src/styles/tokens.css`, `@theme` de Tailwind)

Dos capas: **tokens de marca** (los 7 del manual, fijos) y **tokens semánticos** (los que usan los componentes). Los componentes solo usan semánticos; el tema claro futuro redefine la capa semántica y nada más.

Marca (del manual): `marca-900 #1E4870` · `marca-700 #2C688F` · `marca-500 #4A92BA` · `marca-300 #68BCE1` · `gris-texto #5A6472` · `gris-fondo #EEF1F4` · `vial #F0C419`.

Semánticos, tema oscuro (v1). Los navys profundos se derivan del matiz de `marca-900` en OKLCH bajando luminosidad, para que la escala sea de la misma familia y no un gris genérico:

| Token | Valor | Uso |
|---|---|---|
| `fondo` | `#0B1526` | fondo de página |
| `fondo-2` | `#10203A` | secciones alternadas, header al scrollear |
| `superficie` | `#16304E` | cards, paneles, filas hover |
| `superficie-2` | `#1E4870` (`marca-900`) | superficies elevadas, dropdown, badges fríos |
| `borde` | `rgba(255,255,255,.10)` | bordes de 1px; `.18` en hover |
| `texto` | `#E8EEF5` | cuerpo (≈14:1 sobre `fondo`) |
| `texto-2` | `#A9C4D8` | secundario, metadatos (≈8:1) |
| `texto-3` | `#8593A0` | terciario, placeholders (≈5.8:1 sobre `fondo`, ≈5.2:1 sobre `fondo-2`; no sobre `superficie`) |
| `acento` | `#68BCE1` (`marca-300`) | links, hilo de ruta, balizas, foco (≈9:1) |
| `acento-hover` | `#8FCDE8` | hover de links |
| `vial` | `#F0C419` | señalética: CTA emergencias, avisos de obra/estado, marcas viales. Sobre navy funciona como fondo (texto `#0B1526`, ≈11:1) **y** como texto (≈10:1) |
| `error` | `#FF8A80` | único rojo; validación de formularios (≈7:1) |
| `glow` | `rgba(104,188,225,.35)` | solo hilo de ruta y balizas |

Tema claro (fuera de v1): mismo nombre de tokens, valores del manual (`gris-fondo`, `gris-texto`, `marca-900` en títulos). Se activa con `[data-tema="claro"]`. No se implementa ni se audita ahora.

### Tipografía

**Archivo** (variable, self-hosted):
- h1/h2: ExtraBold 800, tracking -0.02em, escala fluida `clamp()`.
- Eyebrows y etiquetas: Medium 500, mayúsculas, tracking 0.15em (el estilo del descriptor del manual).
- Cuerpo: Regular 400, ≥ 16px, interlineado 1.6.

### Motivo gráfico

La ruta del isotipo. La **línea discontinua de asfalto** como divisor de secciones y como barra de progreso de lectura; la curva de la "C" recorta el hero. Isotipo extraído del PDF a **SVG** (degradado + una tinta + negativo + marca de agua), en `src/assets/marca/`. Favicon SVG + PNG 32/180/512 desde el mismo vector.

### Layout

Mobile-first. Grilla de 4px, contenedor máx. 80rem, ritmo vertical generoso, **composición asimétrica** (títulos a la izquierda con mucho aire, datos y assets a la derecha; en mobile se apila). Hero a pantalla completa con el título en escala grande (h1 hasta 6rem en desktop) y la ilustración de ruta dibujándose. Header translúcido (`fondo-2` al 80% + `backdrop-filter`) con borde inferior de 1px, que aparece al scrollear. Mapa del tramo en **SVG estático** propio (RN 9/19/34 entre Pilar, Córdoba, San Francisco, Rafaela, Santa Fe, Rosario): sin Leaflet ni tiles, funciona sin señal.

Un elemento vivo y con sentido en el hero: **cuenta regresiva al 5 de octubre** (días/horas/minutos, numerales tabulares, JS vanilla mínimo), que después de la fecha pasa sola a "En operación desde el 5 de octubre de 2026". Sale de `empresa.concesion.inicioOperacion`, no de una constante.

### Criterio de calidad (pedido de Juli)

La landing tiene que **diferenciarse por completo, en calidad, de las webs de autopistas y concesionarias existentes**. Eso se traduce en tres obligaciones concretas: assets visuales propios (no stock, no clipart, no íconos genéricos donde la marca pueda hablar), un sistema de movimiento deliberado, y estados de interacción cuidados en **todo** elemento interactivo. Serio y profesional: ninguna animación existe para lucirse; cada una orienta, jerarquiza o confirma. Impactante de la primera a la última vista.

### Assets propios (SVG, hechos a mano con los tokens)

| Asset | Dónde | Cómo |
|---|---|---|
| Isotipo + lockups (degradado, una tinta, negativo, marca de agua) | header, footer, favicon, OG | extraídos del PDF vectorial |
| **Mapa ilustrado del tramo** | Home, El tramo | SVG propio: RN 9/19/34 como trazos, ciudades como nodos, cabinas como marcadores; dibujable por `stroke-dashoffset` |
| **Familia de íconos de categorías de vehículo** (moto, auto, auto con remolque, camioneta, camión 2 ejes, camión 3+ ejes, ómnibus) | Tarifario, FAQ | línea 1.5px, esquinas 2px, mismo grid que lucide para convivir |
| **Ilustración de hero**: curvas de asfalto con el degradado de marca y marcas viales | Home | geometría abstracta, no escena; se anima al entrar |
| Patrón de marcas viales (línea discontinua, chevrones de curva) | divisores, fondos de sección, barra de progreso | `<pattern>` SVG + CSS |
| Badges estilo señalética (amarillo vial, tipografía Archivo 800) | Obras, avisos de estado, tarifa "vigente desde" | componente `Señal` |
| Imagen OG 1200×630 | `<Seo>` | SVG con tokens → PNG en build |

### Sistema de movimiento

Reglas: **CSS primero; JS vanilla solo como fallback o pegamento (< 2 KB gz en total)**. GSAP y Motion no se instalan en v1 (quedan documentados en el skill `gsap-framer-scroll-animation` para pinning complejo o scroll horizontal, que no hay). Tokens de movimiento en `tokens.css`: duraciones (`120ms` micro, `240ms` UI, `600ms` entrada, `900ms` narrativa), easings (`ease-out-quart` para entradas, `ease-in-out-cubic` para scrub) y un solo `stagger` (`60ms`). `@media (prefers-reduced-motion: reduce)` apaga todo lo no esencial y deja los cambios de estado instantáneos.

| Patrón | Dónde | Técnica | Fallback |
|---|---|---|---|
| **Coreografía de entrada del hero**: eyebrow → título por líneas → CTAs → ilustración dibujándose | Home | `@keyframes` con `animation-delay` escalonado; la ilustración con `stroke-dashoffset` | nada (siempre soportado) |
| **Reveal de sección con stagger** | todas las páginas | `animation-timeline: view()` + `animation-range`; hijos con `--i` para el stagger | `IntersectionObserver` que agrega `.visible` (≈600 B) |
| **Dibujo de la ruta con scrub** | mapa del tramo | `stroke-dashoffset` atado a `animation-timeline: view()` | la ruta aparece dibujada |
| **Sección sticky narrativa**: el mapa fijo mientras pasan 3 paneles (681 km · 3 rutas · 2 provincias) | El tramo | `position: sticky` + `view-timeline` en los paneles | paneles apilados normales |
| **Contadores** (681, 20 años, $1.399) | Home, Quiénes somos | `@property --n` + `counter-reset` animado con `view()` | número estático |
| **Hilo de ruta en el margen** (progreso de scroll con una "luz" que avanza) | todas las páginas en desktop; en mobile, barra fina bajo el header | `animation-timeline: scroll(root)` sobre `stroke-dashoffset` / `scaleX` | oculto |
| **Balizas que se encienden** (cabinas del mapa, en secuencia) | Home, El tramo | `@keyframes` con stagger, disparado por `view()` | encendidas |
| **Cuenta regresiva al 5/10** | hero | JS vanilla (≈400 B), actualiza cada minuto | texto estático "Desde el 5 de octubre de 2026" |
| **Transiciones de página** (fade + desplazamiento 8px, header persistente) | navegación | Astro `<ClientRouter />` (View Transitions API) | carga normal |
| **Parallax leve** en fondos de hero y divisores | Home | `animation-timeline: scroll()` | estático |

### Micro-interacciones (obligatorias en todo elemento interactivo)

| Elemento | Hover | Focus | Activo / abierto |
|---|---|---|---|
| Link de texto | subrayado que crece desde la izquierda (`background-size`), color `acento-hover` | anillo 2px `acento` offset 2px | — |
| Botón primario (`acento` sobre navy) | elevación 1px + sombra suave + ícono se desplaza 2px | anillo | presionado: elevación 0 |
| Botón secundario (borde) | borde `.18` + fondo `superficie` | anillo | — |
| CTA Emergencias (`vial`) | sombra amarilla difusa + ícono de teléfono oscila una vez | anillo `vial` offset 2px | — |
| Card (servicio, novedad, obra) | borde `.18`, esquineros se extienden 4px, `translateY(-2px)`, la flecha del card avanza | anillo en el card entero | — |
| Ítem de nav | indicador inferior `acento` que se desliza entre ítems | anillo | página actual: indicador fijo + `aria-current` |
| Dropdown Nosotros | abre con fade + 4px de desplazamiento sobre `superficie-2` | navegable por teclado, cierra con Esc | — |
| Fila de tabla (tarifas) | fondo `superficie`, ícono de categoría se tiñe `acento` | — | — |
| FAQ (`<details>`) | fondo `superficie` | anillo | chevron rota 180°, cuerpo se despliega con `interpolate-size: allow-keywords` (fallback: grid 0fr→1fr) |
| Input de formulario | borde `.18` | borde `acento` + anillo | error: borde y mensaje en `error` (único uso de rojo) |
| Marcador de cabina / baliza (mapa) | crece 1.2×, glow más intenso, tooltip con nombre | tooltip | — |
| Hilo de ruta (margen) | — | — | avanza con el scroll; la "luz" marca la posición de lectura |

Cada componente nuevo declara sus tres estados en su propio archivo; **un componente sin hover/focus definidos no se considera terminado**.

### Presupuesto (medido en el build)

- JS total enviado al cliente ≤ 30 KB gz (ClientRouter incluido); animación ≤ 2 KB.
- Fuente Archivo variable, subset latin, `font-display: swap`, preload del woff2.
- Ningún asset above-the-fold > 100 KB. SVGs optimizados (svgo) en build.
- Sin dependencias de terceros en runtime salvo Astro.

## 7. Contenido y copy

### Principios

- Voseo, registro sobrio: "Consultá la tarifa", "Llamá a emergencias". Nunca "Consulte".
- **Solo afirmaciones verificables hoy:** Resolución 1379/2026 (adjudicación 2026-08-24), 681 km, RN 9/19/34, consorcio AFEMA S.A. – Pablo Federico e Hijos S.A. – Guido Mogetta S.A., tarifa ofertada $1.399 + IVA (la más baja de los ocho tramos), plazo 20 años, inicio 2026-10-05.
- "Sociedad en formación" dicho sin vueltas en Quiénes somos y en el footer.
- Las reglas del pliego que mandan: no se cobra tarifa plena hasta "transitabilidad óptima" (Obras), y Vialidad Nacional supervisa con indicadores (Transparencia).
- El copy de muestra del manual de marca ("900 km", "RN 36") **no es fuente**: es placeholder anterior a la adjudicación.

### Tarifario

- Vigencia visible arriba de la tabla + etiqueta de origen: *"Tarifa ofertada en la adjudicación (Res. 1379/2026). Sujeta a homologación y a actualización por índices oficiales."*
- La tabla muestra la estructura de categorías de vehículo con el valor base confirmado (categoría auto: $1.399 + IVA). **Las categorías sin valor oficial van con guion y nota "a confirmar", nunca con un número inventado.** Juli decide si de cara a la venta prefiere ocultar las filas sin valor; el schema soporta ambas.

### Huecos de contenido marcados `a confirmar` (Juli / cliente)

1. Número de emergencias.
2. Número de WhatsApp.
3. Mails (general, RRHH, proveedores, ética).
4. Ubicación exacta de las cabinas (se investiga en la fase de contenido contra fuentes públicas; lo no verificado queda `estado: 'a-confirmar'` y no se dibuja en el mapa).
5. Valores por categoría de vehículo.
6. Razón social, CUIT, domicilio legal (cuando exista la inscripción).
7. Redes sociales.

### Novedades fundacionales (Markdown)

1. "Covicen fue adjudicataria del Tramo Centro" (la adjudicación, con fuente).
2. "Qué cambia el 5 de octubre" (para el automovilista).
3. "Cómo se fija la tarifa y por qué la nuestra es la más baja".
4. "Obras antes que peaje: qué es la transitabilidad óptima".

## 8. SEO y datos estructurados

- Componente `<Seo>` en el layout: `<title>` con patrón `Página | Covicen` (Home: `Covicen — Corredor Vial del Centro`), `description` única por página, `canonical` absoluta, Open Graph + Twitter Card con imagen estática 1200×630 generada en build desde un SVG con los tokens, `lang="es-AR"`, `theme-color`.
- **JSON-LD:** `Organization` + `WebSite` en todas las páginas (sin CUIT; `areaServed`: Córdoba, Santa Fe; `contactPoint` solo si hay número); `FAQPage` en `/preguntas-frecuentes/`; `BreadcrumbList` en interiores; `Article` en cada novedad. Generado desde `lib/datos`, no a mano en cada página.
- `@astrojs/sitemap` + `robots.txt` generado, ambos respetando `PUBLIC_INDEXABLE`.
- Un `h1` por página. Encabezados jerárquicos. Imágenes con `alt`. Sin texto en imágenes.

## 9. Legales y accesibilidad

- `/privacidad/`: Ley 25.326, qué datos se reciben (los que el usuario manda por WhatsApp/mail), que WhatsApp es un servicio de Meta, derechos de acceso/rectificación, contacto. Sin cookies de terceros en v1 → sin banner.
- Footer: slots registrales vacíos con etiqueta discreta; leyenda "Sociedad en formación".
- **WCAG 2.1 AA:** landmarks (`header`, `nav`, `main`, `footer`), skip link, foco visible en todo interactivo, contraste ≥ 4.5:1 verificado por script para cada par de tokens usado, tablas con `<th scope>` y `<caption>`, `tel:` y `wa.me` con `aria-label` descriptivo, targets ≥ 44×44px, nada comunicado solo por color, `prefers-reduced-motion` respetado, formularios con `label` asociado y errores en texto.

## 10. Formularios y canales

| Formulario | Página | Canal v1 | Cuando haya sistema |
|---|---|---|---|
| Consulta general | /contacto/ | `wa.me` + mail | igual |
| Reclamo | /contacto/ | `wa.me` con plantilla (ruta, km, fecha, patente opcional) | POST a ticketing (`ticketingReclamos`) |
| Trabajá con nosotros | /trabaja-con-nosotros/ | `wa.me` + mail RRHH | igual |
| Proveedores | /proveedores/ | mail proveedores | portal (`portalProveedores`) |
| Canal ético | /politicas/#anticorrupcion | mail ética (no anónimo, dicho explícitamente) | anónimo real (`canalEticoAnonimo`) |
| Emergencias | barra fija + /emergencias/ | `tel:` (+ botón WhatsApp secundario) | igual |

El componente `Formulario` compone el mensaje en cliente con JS mínimo (vanilla, sin React): arma el `text=` codificado y abre `wa.me`. Sin JS, el botón es un link `wa.me` sin texto precargado: sigue funcionando.

## 11. Verificación y entrega

### Evidencia automática (sin Chrome headless)

- `pnpm check` en verde.
- `pnpm build` en verde.
- `scripts/verificar.ts` sobre `dist/`:
  1. Links internos: ninguno a 404 (recorre todos los `href` relativos y verifica que el archivo exista).
  2. Cada página: un `<title>`, una `description`, un `canonical`, un `h1`, `lang="es-AR"`.
  3. Cada bloque JSON-LD parsea y tiene `@context`/`@type`; `Organization` en todas; `FAQPage` en FAQ.
  4. `tel:` de emergencias presente en **toda** página (o el slot "a confirmar" si el número es `null`).
  5. `/tarifas/` contiene la vigencia formateada.
  6. Contraste AA de cada par de tokens declarado como usado.
  7. `noindex` presente si `PUBLIC_INDEXABLE=false`, ausente si `true`.

### Revisión en lane separada

Un subagente distinto del que escribió el código corre `web-design-guidelines` y `page-cro` sobre el fuente y el HTML construido, y devuelve hallazgos. Se atienden. Recién ahí, `superpowers:verification-before-completion` con outputs pegados.

### Entregables

1. Repo en `main` con el stack, corriendo en local y con workflow de Pages listo (Juli crea el repo remoto y habilita Pages; `gh` está logueado como JuliV08).
2. Las páginas de §5 con el contenido de §7.
3. `src/styles/tokens.css`, tipografía, SVG de marca, patrones de scroll.
4. Contenido en `src/content/` detrás de `lib/datos`.
5. `docs/guia-de-revision.md`: URL local y de Pages + qué mirar en cada pantalla.
6. `obsidian/Home.md` y notas actualizadas (decisiones y por qué; corrección: el PDF tiene 8 páginas y es un manual de marca; paleta oficial). Lo comercial en `C:\Users\Villex\Obsidian\Proyectos\Covicen.md`.

## 12. Fuera de alcance v1 (con hueco reservado)

Estado de rutas en vivo · oficina virtual / pagá tu factura · ticketing de reclamos · portal de proveedores y licitaciones · canal ético anónimo · calculadora de tarifa / buscador de peajes · `/peajes/[slug]/` · **modo claro** (tokens preparados, sin implementar ni auditar) · GSAP · panel de edición para el cliente · dominio y VPS.

## 13. Riesgos y pendientes de Juli

| Pendiente | Quién | Cuándo |
|---|---|---|
| Crear repo remoto `covicen` (o org `covicen-ar` para URL raíz) y habilitar Pages con source "GitHub Actions" | Juli | antes del primer deploy |
| Número de emergencias y WhatsApp | cliente | antes de publicar con dominio |
| Valores por categoría de vehículo | cliente / pliego | antes de publicar con dominio |
| Registro de `covicen.com.ar` a nombre de un tercero | cliente / Juli | cuanto antes; NIC.ar exige CUIT |
| Razón social, CUIT, domicilio | cliente | cuando salga la inscripción |
| Instalar skills faltantes si aparecen (`! npx skills add …`) | Juli | a demanda |
