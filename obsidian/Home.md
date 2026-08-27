# Home — Covicen

Landing fundacional de **Covicen**, la nueva concesionaria del **Tramo Centro** de la Red Federal de Concesiones (681 km sobre RN 9, 19 y 34; Córdoba y Santa Fe). Arranca a operar el **5 de octubre de 2026**. La sociedad todavía está **en formación**: no tiene CUIT.

Este es el vault del proyecto (vive en el repo, viaja con el código). El puntero desde el cerebro global está en `C:\Users\Villex\Obsidian\Proyectos\Covicen.md`.

## Notas
- [[Contexto del negocio (Corredores Viales)]] — modelo de concesión, quién controla, qué servicios son obligatorios, y de ahí qué secciones necesita la web. **Leé esto antes de tocar código.**
- [[Arquitectura de informacion de la landing]] — qué secciones entran en v1 (estáticas) y cuáles quedan esperando sistema.

## Estado
- **2026-08-27** — sesión de contexto. Investigación de negocio hecha y **confirmada por el cliente** (es el Tramo Centro). Prompt maestro escrito en `PROMPT_MAESTRO.md`. Todavía no hay repo (`git init` pendiente), ni stack elegido, ni código.
- **Pendiente urgente**: registrar el dominio. NIC.ar pide CUIT y la sociedad no lo tiene → va a nombre de un tercero y se transfiere después. Ver [[Contexto del negocio (Corredores Viales)]].

## Reglas del proyecto
- **v1 NO tiene sistema.** CVSA se alimenta de un backoffice con sistemas viejos vía APIs; para Covicen no existe nada de eso todavía. Todo contenido va estático/versionado, con la costura preparada para enchufar APIs después.
- Convenciones transversales de Juli: `C:\Users\Villex\.claude\CLAUDE.md` y `C:\Users\Villex\Obsidian\Global\Preferencias de Juli.md`.

> Convención del vault: ver `C:\Users\Villex\Obsidian\Como funciona esto.md`.
