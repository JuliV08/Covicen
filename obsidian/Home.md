# Home — Covicen

Landing fundacional de **Covicen**, la nueva concesionaria del **Tramo Centro** de la Red Federal de Concesiones (681 km sobre RN 9, 19 y 34; Córdoba y Santa Fe). Arranca a operar el **5 de octubre de 2026**. La sociedad todavía está **en formación**: no tiene CUIT.

Este es el vault del proyecto (vive en el repo, viaja con el código). El puntero desde el cerebro global está en `C:\Users\Villex\Obsidian\Proyectos\Covicen.md`.

## Notas
- [[Contexto del negocio (Corredores Viales)]] — modelo de concesión, quién controla, qué servicios son obligatorios, y de ahí qué secciones necesita la web. **Leé esto antes de tocar código.**
- [[Arquitectura de informacion de la landing]] — qué secciones entran en v1 (estáticas) y cuáles quedan esperando sistema.
- [[Decisiones de arquitectura]] — qué se decidió en el brainstorming y por qué, más lo aprendido construyendo.
- [[Costura de datos]] — cómo se leen los datos hoy y cómo se conecta Django mañana sin tocar la UI.
- [[Sistema de diseno]] — concepto "La ruta, de noche", tokens, tipografía, movimiento, assets.

## Documentos del repo
- Spec: `docs/superpowers/specs/2026-08-27-landing-covicen-design.md` · Plan: `docs/superpowers/plans/2026-08-27-landing-covicen.md`
- Guía de revisión para Juli: `docs/guia-de-revision.md` · Prompt maestro original: `docs/PROMPT_MAESTRO.md`
- Manual de marca: `docs/marca/Logo Covicen 2.pdf` · Prompts de imágenes: `docs/marca/prompts-imagenes.md`

## Estado
- **2026-09-01** — **publicada en GitHub Pages**: https://juliv08.github.io/Covicen/ (repo `JuliV08/Covicen`, deploy por Actions en cada push a `main`, demo con `noindex`).
- **2026-08-27 (tarde)** — sesión de construcción: brainstorming → spec → plan → **landing v1 en Astro 7** construida en local, con tests, `astro check` y build en verde. Sin push todavía: Juli crea el repo remoto y habilita Pages (ver `README.md`). Ver [[Decisiones de arquitectura]].
- **2026-08-27 (mañana)** — sesión de contexto. Investigación de negocio hecha y **confirmada por el cliente** (es el Tramo Centro). Prompt maestro escrito.
- **Pendiente urgente**: registrar el dominio. NIC.ar pide CUIT y la sociedad no lo tiene → va a nombre de un tercero y se transfiere después. Ver [[Contexto del negocio (Corredores Viales)]].

## Reglas del proyecto
- **v1 NO tiene sistema.** CVSA se alimenta de un backoffice con sistemas viejos vía APIs; para Covicen no existe nada de eso todavía. Todo contenido va estático/versionado, con la costura preparada para enchufar APIs después.
- Convenciones transversales de Juli: `C:\Users\Villex\.claude\CLAUDE.md` y `C:\Users\Villex\Obsidian\Global\Preferencias de Juli.md`.

> Convención del vault: ver `C:\Users\Villex\Obsidian\Como funciona esto.md`.
