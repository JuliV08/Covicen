# Prompt maestro — Landing fundacional de Covicen

> Generado el 2026-08-27 con `writing-master-prompts`. Copiar de acá para abajo y pegar en una sesión nueva de Claude Code abierta en `C:\Users\Villex\dev\Covicen`.

---

## Objetivo

Dejar lista y publicable la **landing fundacional de Covicen** —la nueva concesionaria del **Tramo Centro** de la Red Federal de Concesiones, que arranca a operar el **5 de octubre de 2026**— con un diseño premium, moderno y corporativamente serio, que el día del arranque le responda tanto al automovilista que googlea el peaje nuevo como al interlocutor institucional.

## Contexto del proyecto

**Leé primero, no explores a ciegas:**

1. `C:\Users\Villex\dev\Covicen\obsidian\Home.md` y seguí los `[[wikilinks]]`. Ahí está **toda la investigación de negocio ya hecha**: modelo de concesión, adjudicatarios, obligaciones del pliego, arquitectura de información relevada de la referencia, paleta extraída del logo, y el corte de qué entra en v1 y qué no. **No re-investigues lo que ya está anotado.**
2. `C:\Users\Villex\.claude\CLAUDE.md` y `C:\Users\Villex\Obsidian\Global\Preferencias de Juli.md` — convenciones transversales.

**Estado del directorio:** solo hay `Logo Covicen 2.pdf` (vectorizado) y `obsidian/`. **No hay repo: paso 0 es `git init`.**

**Referencia:** https://cvsa.com.ar/ — se usa para la **estructura de la información**, nunca para el diseño. CVSA es estatal, con años de sistemas viejos atrás; su web es el techo funcional, no el piso estético. El diseño hay que revolucionarlo.

**Quién es Covicen (confirmado por el cliente):** la sociedad nueva adjudicataria del **Tramo Centro** de la Red Federal de Concesiones. **681 km** sobre **RN 9, RN 19 y RN 34** — de Pilar (Córdoba) a Rosario, y hacia San Francisco, Rafaela y Santa Fe capital. Provincias: **Córdoba y Santa Fe**. Consorcio: **AFEMA S.A. – Pablo Federico e Hijos S.A. – Guido Mogetta S.A.** Ganó ofertando **$1.399 + IVA, la tarifa más baja de los ocho tramos** — y como en este régimen se adjudica al que ofrece menos, eso es un diferencial de marca legítimo y verificable, no un número suelto.

**⚠️ La sociedad todavía NO está inscripta** (la adjudicación salió el 2026-08-24). Está en formación, así que:

- **No hay CUIT.** El footer no lleva CUIT, domicilio legal ni datos registrales todavía: dejá los slots y que se completen después.
- **El copy se escribe sobre lo verificable hoy** —adjudicación, tramo, plazo, consorcio— sin presuponer una sociedad ya inscripta.
- **Falta la razón social exacta.** "Covicen" puede ser marca, denominación social, o ambas: preguntale a Juli antes de maquetar el logo con un texto legal al lado.

**Lo que sí queda por confirmar:** **la paleta real de marca**, contra el logo, no contra los colores que salieron del PDF.

## Skills a invocar, en orden

1. **`superpowers:brainstorming`** — ANTES de escribir código y antes de entrar en plan mode. Es el arranque obligado de esta sesión. Lo que hay que cerrar conmigo está en "Temario del brainstorming" más abajo.
2. **`find-skills`** — para diseño y animaciones. Ver "Descubrí lo que falte".
3. **Diseño (ya instalados, usalos):** el plugin **`ui-ux-pro-max`** (`design`, `design-system`, `ui-styling`, `brand`) para el sistema visual y los tokens; **`frontend-design`** (oficial de Anthropic) para la construcción del front.
4. **`site-architecture`** — fijar jerarquía de páginas, URLs y navegación antes de maquetar.
5. **`copywriting`** + **`brand-storytelling`** — el copy de una concesionaria es delicado: serio y confiable sin sonar a comunicado del Estado.
6. **`schema-markup`** y **`seo-audit`** — no son opcionales acá, ver Restricciones.
7. **`web-design-guidelines`** (Vercel) y **`page-cro`** — pasada de revisión al final, en lane separada de la de autoría.
8. **`superpowers:systematic-debugging`** — si algo falla, antes de parchear.
9. **`superpowers:verification-before-completion`** — antes de decir que está listo.

## Descubrí lo que falte

El barrido ya está hecho: **el stack de diseño local ya es fuerte; el agujero era motion/scroll.**

**Ya instalado y disponible: `gsap-framer-scroll-animation`** (de `github/awesome-copilot`). Cubre ScrollTrigger completo —pin, scrub, snap, timelines, scroll horizontal, ScrollSmoother, matchMedia, `useGSAP`, Lenis— y Motion/Framer —`useScroll`, `useTransform`, `useSpring`, `whileInView`, variants—, con secciones de accesibilidad y de performance/cleanup en ambas referencias. Tres cosas a tener en cuenta al usarlo:

1. **Documenta `gsap@3.14` y Motion v12; hoy van `gsap@3.15.0` y `motion@13.x`.** Las recetas siguen siendo válidas (la API de ScrollTrigger no rompió), pero **verificá contra la doc oficial antes de fijar versiones en el `package.json`**, sobre todo el salto de major de Motion.
2. **Le falta el scroll-driven nativo de CSS** (`animation-timeline`, `view-timeline`): cero menciones. Para reveals simples y la barra de progreso, **evaluá CSS nativo antes de meter GSAP** — este sitio es mobile-first, se consume en la ruta con mala señal, y ahorrarte el bundle de una librería de animación es una decisión de producto, no de gusto. Reservá GSAP para lo que CSS no da: pinning, scroll horizontal, timelines encadenadas.
3. **El skill se cross-referencia con `premium-frontend-ui`**, que existe en el mismo repo (`github/awesome-copilot@premium-frontend-ui`, 4.3K instalaciones) pero **puede no estar instalado**. Si no está, o lo pedís, o cubrís ese rol con `ui-ux-pro-max` — que ya está y hace lo mismo.

Si te falta alguna otra capacidad, corré **`find-skills`** antes de improvisar. **La instalación la corre Juli**, no vos: el clasificador frena que el agente instale código externo. Pasale la línea exacta para que la ejecute con `! npx skills add <owner/repo@skill> -g -y`, y avisale que hay que **reiniciar la sesión** para que cargue.

## Temario del brainstorming de arquitectura

Stack de base de Juli: **React + Tailwind** en el front, **Django + PostgreSQL en un VPS** para sistemas. Pero v1 no tiene sistema, así que hay tensión real para resolver:

1. **¿Django entra en v1 o después?** El SEO es crítico (el 5/10 la gente googlea el peaje) y un SPA de Vite pelado rankea mal. Opciones sobre la mesa: estático pre-renderizado, SSG/SSR, o Django sirviendo contenido desde el día 1. Esta decisión manda sobre todas las demás.
2. **¿Quién edita el contenido?** Si el cliente tiene que poder cambiar tarifas y novedades sin devs, hace falta un panel, y eso cambia el stack de v1. Es la decisión más cara de revertir.
3. **Costura anti-corrupción.** Definir HOY la forma de los datos (tarifas, novedades, obras, estado de rutas) detrás de un adaptador: hoy lee un JSON del repo, mañana una API de los sistemas viejos, **sin tocar un componente de UI**.
4. **Deploy y dominio.** ¿VPS nuevo o el que ya existe? Nginx + Let's Encrypt + GitHub Actions. Y el dominio es **el riesgo de fecha del proyecto**: NIC.ar exige Clave Fiscal de AFIP (CUIT/CUIL/CDI) para registrar un `.ar`, y **Covicen no tiene CUIT porque no está inscripta**. O sea que el dominio hay que registrarlo a nombre de un tercero —alguna empresa del consorcio, o Juli— y transferirlo cuando salga la inscripción. Al 2026-08-27 `covicen.com.ar` y `covicen.ar` no resuelven DNS, lo que sugiere que están libres, pero eso no es prueba: verificar en NIC.ar. **Con el 5/10 encima, esto se resuelve antes que cualquier línea de código.**
5. **Accesibilidad y legales:** presta un servicio público, así que WCAG 2.1 AA en serio. Si hay formularios, Ley 25.326 de datos personales y política de privacidad.

## Restricciones / Definition of Done

**Restricción dura — v1 NO tiene sistema.** CVSA se alimenta de un backoffice con varios sistemas viejos vía APIs. Para Covicen no existe nada de eso todavía. Todo el contenido va **estático y versionado en el repo**. Lo que dependa de sistemas (estado de rutas en vivo, oficina virtual, ticketing de reclamos, portal de proveedores, canal ético anónimo) **queda afuera de v1 con el hueco reservado en el layout** — está detallado en `obsidian/Arquitectura de informacion de la landing.md`. No inventes integraciones ni mockees APIs que no existen.

Lo demás:

- **SEO desde el primer commit**, no al final: metadatos, Open Graph, `Organization` + `FAQPage` en JSON-LD, sitemap. El sitio tiene que rankear el 5/10.
- **El teléfono de emergencias visible desde cualquier página**, con `tel:`.
- **El tarifario lleva fecha de vigencia visible.** Publicar un precio sin fecha en un servicio regulado es un problema, no un detalle.
- **Diseño propio.** Componentes hechos desde cero con los tokens del proyecto; no extraer de 21st.dev ni Magic MCP.
- **Cero emojis en la UI.** Iconografía con `lucide-react`.
- **Mobile-first.** El automovilista entra desde el teléfono, en la ruta, con mala señal. El peso de la página importa de verdad.
- **Nada de Chrome headless** para screenshots: se cuelga y come la máquina.
- **La validación visual la hace Juli.** Vos cerrás con `tsc --noEmit` y build en verde, y le entregás **la URL exacta y qué mirar en cada pantalla**.
- **No commitear sin pedido explícito.**
- **Español rioplatense** en código, comentarios y comunicación. Cuidado con los irregulares: "anduvo", no "andó".
- **Registrá lo durable** en `obsidian/` del proyecto y actualizá `obsidian/Home.md`. Lo comercial y sensible (contactos, presupuesto, credenciales) **no va al repo**: va a `C:\Users\Villex\Obsidian\Proyectos\Covicen.md`.

## Entregables

1. Repo inicializado con el stack acordado en el brainstorming, corriendo en local.
2. La landing con las secciones de v1 listadas en `obsidian/Arquitectura de informacion de la landing.md`.
3. Sistema de diseño: tokens de marca derivados del logo real, tipografía, escala, y los patrones de animación de scroll.
4. Contenido en archivos versionados, detrás del adaptador acordado en el punto 3 del brainstorming.
5. Guía de revisión para Juli: URL exacta + qué mirar en cada pantalla.
6. `obsidian/Home.md` actualizado con las decisiones tomadas y por qué.

## Checkpoints de verificación

- **Después del brainstorming**, antes de codear: mostrame las decisiones cerradas y esperá el OK.
- **Antes de declarar cualquier cosa lista:** invocá `superpowers:verification-before-completion` y mostrame **evidencia** (output de `tsc --noEmit`, del build, del audit de SEO), no afirmaciones.
- **La pasada de revisión va en lane separada de la de autoría.** No te auto-aprobás el diseño en el mismo contexto en que lo escribiste: usá `web-design-guidelines` y `page-cro` como pasada aparte.
