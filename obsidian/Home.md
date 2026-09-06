# Home — Covicen

Landing fundacional de **Covicen**, la nueva concesionaria del **Tramo Centro** de la Red Federal de Concesiones (681 km sobre RN 9, 19 y 34; Córdoba y Santa Fe). Arranca a operar el **5 de octubre de 2026**. La sociedad todavía está **en formación**: no tiene CUIT.

Este es el vault del proyecto (vive en el repo, viaja con el código). El puntero desde el cerebro global está en `C:\Users\Villex\Obsidian\Proyectos\Covicen.md`.

## Notas
- [[Contexto del negocio (Corredores Viales)]] — modelo de concesión, quién controla, qué servicios son obligatorios, y de ahí qué secciones necesita la web. **Leé esto antes de tocar código.**
- [[Arquitectura de informacion de la landing]] — qué secciones entran en v1 (estáticas) y cuáles quedan esperando sistema.
- [[Decisiones de arquitectura]] — qué se decidió en el brainstorming y por qué, más lo aprendido construyendo.
- [[Costura de datos]] — cómo se leen los datos hoy y cómo se conecta Django mañana sin tocar la UI.
- [[Sistema de diseno]] — concepto "La ruta, de noche", tokens, tipografía, movimiento, assets.
- [[Sistema de diseno del panel]] — cómo se ve el backoffice en React: tema "Papel con marco de tinta" (handoff de Juli) con los colores y la letra de Covicen.
- [[Sistemas de Covicen]] — el mapa objetivo de sistemas, el roadmap y el primer sistema (tarifario + catálogo del tramo) con las decisiones cerradas el 2026-09-05.

## Documentos del repo
- Spec: `docs/superpowers/specs/2026-08-27-landing-covicen-design.md` · Plan: `docs/superpowers/plans/2026-08-27-landing-covicen.md`
- Guía de revisión para Juli: `docs/guia-de-revision.md` · Prompt maestro original: `docs/PROMPT_MAESTRO.md`
- Prompt maestro para el mapa de CVSA y el primer sistema: `docs/PROMPT_MAESTRO_CVSA.md` (2026-09-05)
- Manual de marca: `docs/marca/Logo Covicen 2.pdf` · Prompts de imágenes: `docs/marca/prompts-imagenes.md`

## Estado
- **2026-09-06 (ejecución)** — plan en marcha en el repo privado `covicen-sistemas`: backend con catálogo, tarifario, APIs y demo (125 tests); la landing ya lee tramo y tarifario de la API cuando `FUENTE_DATOS=api` (ver [[Costura de datos]]); Pages se reconstruye por `repository_dispatch` y a diario. Falta el panel React y la producción.
- **2026-09-06** — **spec y plan del primer sistema escritos**: `docs/superpowers/specs/2026-09-05-tarifario-design.md` (con la revisión de seguridad incorporada, 23 hallazgos) y `docs/superpowers/plans/2026-09-05-tarifario.md` (25 tareas en cinco fases). Decisión reafirmada por Juli: **panel entero en React** (sin admin de Django), tema [[Sistema de diseno del panel]]. Agentes propios del proyecto en `.claude/agents/` (sec, bk, ux, test, rev, ops). Pendiente: OK de Juli para ejecutar.
- **2026-09-05 (tarde)** — mapa funcional de los 20 sistemas de CVSA terminado (vive en el vault privado). Brainstorming cerrado: **primer sistema = tarifario + catálogo del tramo**, un solo proyecto Django modular con Unfold, repo privado aparte, la landing se reconstruye sola al publicar. Ver [[Sistemas de Covicen]]. Siguiente: spec + plan.
- **2026-09-05** — llegó la carpeta `CVSA/` (20 repos del GitLab de Corredores Viales, gitignorada: tiene credenciales reales). Prompt maestro escrito para la próxima sesión: mapa funcional de esos sistemas + brainstorming del primer sistema de Covicen (React + Django + Postgres en VPS) conectado a la landing. El análisis de CVSA va al vault privado, no a este.
- **2026-09-01** — **publicada en GitHub Pages**: https://juliv08.github.io/Covicen/ (repo `JuliV08/Covicen`, deploy por Actions en cada push a `main`, demo con `noindex`).
- **2026-08-27 (tarde)** — sesión de construcción: brainstorming → spec → plan → **landing v1 en Astro 7** construida en local, con tests, `astro check` y build en verde. Sin push todavía: Juli crea el repo remoto y habilita Pages (ver `README.md`). Ver [[Decisiones de arquitectura]].
- **2026-08-27 (mañana)** — sesión de contexto. Investigación de negocio hecha y **confirmada por el cliente** (es el Tramo Centro). Prompt maestro escrito.
- **Pendiente urgente**: registrar el dominio. NIC.ar pide CUIT y la sociedad no lo tiene → va a nombre de un tercero y se transfiere después. Ver [[Contexto del negocio (Corredores Viales)]].

## Reglas del proyecto
- **v1 NO tiene sistema.** Todo contenido va estático/versionado, con la costura preparada para enchufar APIs después. **Desde el 2026-09-05 el primer sistema está decidido y en diseño** ([[Sistemas de Covicen]]): tarifario y catálogo del tramo pasan a leerse de la API cuando exista el servidor; el resto sigue en el repo.
- Convenciones transversales de Juli: `C:\Users\Villex\.claude\CLAUDE.md` y `C:\Users\Villex\Obsidian\Global\Preferencias de Juli.md`.

> Convención del vault: ver `C:\Users\Villex\Obsidian\Como funciona esto.md`.
