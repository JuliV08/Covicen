# Decisiones de arquitectura

Cerradas en el brainstorming del **2026-08-27** con Juli. Fuente completa: `docs/superpowers/specs/2026-08-27-landing-covicen-design.md` (§2). Ver [[Home]] · [[Costura de datos]] · [[Sistema de diseno]].

| Tema | Decisión | Por qué |
|---|---|---|
| ¿Django en v1? | **No.** Entra cuando existan sistemas, como API que alimenta el build (o SSR sobre el mismo contrato). | v1 no tiene sistema; un backend en el camino crítico solo suma riesgo de fecha. |
| ¿Quién edita contenido? | **Solo devs vía repo** (JSON/Markdown en `src/content/`). | La decisión más cara de revertir y la más barata de mantener. La costura deja listo el enchufe para un panel. |
| Generador | **Astro 7 estático + Tailwind 4**; **sin React en v1** (se agrega con `pnpm astro add react` cuando haga falta una isla). | HTML completo desde el primer byte (SEO), cero JS por defecto (peso en la ruta), content collections con Zod. `@astrojs/react` emitía ~60 KB gz de runtime sin ninguna isla: fuera. |
| Hosting v1 | **GitHub Pages desde Actions.** Sin dominio ni VPS. | La v1 es el producto terminado que se muestra para vender; migrar estático a VPS es copiar archivos. |
| Dominio | No se registra todavía. `covicen.com` está tomado desde 2020 por un tercero; `.com.ar`/`.ar` sin NS. NIC.ar exige CUIT → a nombre de un tercero y transferir. | Riesgo de fecha documentado, fuera del alcance de v1. |
| Marca | El PDF es el **manual "Covicen Marca 9b1"** (8 páginas): paleta y Archivo tal cual. Logotipo **sin "SA"** hasta la inscripción. | Confirmado por Juli. El descriptor "Corredor Vial del Centro" es marca, no dato registral. |
| Formularios | Sin backend: arman un link `wa.me` con el mensaje; mail secundario. Emergencias es `tel:`. | WhatsApp es el canal real del automovilista; en emergencia se llama. |
| Tema | **Dark-first, navy tech**, tokens semánticos; modo claro preparado por tokens, fuera de v1. | Pedido de Juli. Concepto rector: "La ruta, de noche". |
| Animación | CSS scroll-driven + `IntersectionObserver` como fallback; **sin GSAP**. | Firefox estable no tiene scroll-driven (jun-2026); cada KB cuenta en la ruta. |
| Verificación | Sin navegador: `astro check`, Vitest (Container API), `scripts/verificar.ts` sobre `dist/`. La validación visual la hace Juli. | Regla de Juli: nada de Chrome headless. |

## Cosas que aprendimos construyendo (durables)

- **pnpm no expone dependencias transitivas**: si `astro.config.mjs` importa de `vite` (`loadEnv`), `vite` va declarado como devDependency. Lo mismo con **`sharp`**: Astro 6+ no lo trae y `astro:assets` lo exige para procesar imágenes (`MissingSharp` en build).
- **Fotos + vector alineados**: si la foto y el SVG comparten relación de aspecto y recorte centrado (`object-fit: cover` ≡ `preserveAspectRatio="xMidYMid slice"`), las coordenadas del viewBox mapean proporcionalmente a la foto en cualquier viewport. Así las luces del hero siguen los carriles de la foto real.
- **Los scripts de `src/scripts/*.ts` terminan con `export {}`**: sin `import`/`export`, TypeScript los trata como scripts globales y las `const` chocan entre archivos.
- **`import.meta.env` con acceso estático**: desde Astro 6 los valores se inlinean; un acceso dinámico por clave queda `undefined`.
- **Zod 4 en Astro 6+**: `z.url()`, `z.email()`, `z.iso.datetime()`; las versiones `.string().url()` están deprecadas.
- **`Intl` separa `$` del número con U+00A0/U+202F**: en tests, normalizar con escapes (`/[  ]/g`), nunca con el carácter literal (las herramientas lo normalizan al escribir).
- **Container API de Astro funciona en Vitest** con `getViteConfig`, incluso para el layout completo, mientras `datos` no importe `astro:content` de forma estática (por eso `novedades()` usa `import()` diferido).
- **El isotipo del manual se extrae vectorial** del PDF (clipPath de PyMuPDF → `get_svg_image`): el degradado del PDF está rasterizado, pero la geometría de la "C" con la ruta y las marcas es un solo path evenodd.
