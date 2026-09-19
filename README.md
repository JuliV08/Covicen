# Covicen — web

Sitio estático (Astro 7 + Tailwind 4) de Covicen, concesionaria del Tramo Centro de la Red Federal de Concesiones. Todo el contenido es del repo; cuando exista el servidor, tramo y tarifario se leen de la API del sistema sin tocar la interfaz.

## Comandos
- `pnpm dev` — servidor local en http://localhost:4321 (`pnpm dev --host` para verlo desde el celular en la misma red).
- `pnpm check` — tipos y plantillas (`astro check`).
- `pnpm test` — tests (Vitest, con la Container API de Astro y los datos reales del repo).
- `pnpm build` — genera `dist/` (antes regenera `public/og.png`).
- `pnpm verificar:portada` — lo mismo que `pnpm verificar` pero en modo portada: build con `PUBLIC_SITIO_COMPLETO=false` y chequeos sobre lo que queda. **Es el modo que hoy se publica en producción**, así que corre en CI antes que el otro.
- `pnpm verificar` — build y chequeos sobre `dist/`: links internos, metadatos, JSON-LD, `tel:140` en toda página, textos prohibidos ("a confirmar", "Corredor Vial del Centro", "681"), 679 km, "Última actualización", `noindex` según entorno, `alt` en imágenes, HTML válido (html-validate), `target=_blank` con `noopener`, contraste 4,5:1 de todos los pares en los dos temas, hoja de impresión emitida, presupuesto de JS (30 KB gz) y de la OG.
- `pnpm contrato` — exporta `docs/contrato/{tramo,tarifario}.schema.json` desde los esquemas Zod (el backend valida sus respuestas contra estos archivos).
- `pnpm originalidad <urls>` — compara Quiénes somos contra otros sitios (secuencias de 6 palabras). A mano, no en CI.

Verificación completa antes de cualquier commit: `pnpm check && pnpm test && pnpm verificar:portada && pnpm verificar`. Es lo mismo que corre el workflow, en ese orden (el último build es el que queda en `dist/`).

## Contenido
Vive en `src/content/` (JSON y Markdown) y los componentes lo consumen solo a través de `src/lib/datos`. Criterio: **esconder, no "a confirmar"**: un dato en `null` no se renderiza; el slot aparece solo cuando se carga. Qué está oculto hoy y qué archivo tocar para que aparezca: `docs/guia-de-revision.md` ("Cómo cargar lo que falta"). Contrato y costura con el backend: `obsidian/Costura de datos.md`.

## Entorno
Copiá `.env.example` a `.env`. Sin `.env` también anda, con base `/` y sin indexar. **Descomentá `PUBLIC_SITIO_COMPLETO=true` en tu `.env`** para ver el sitio entero en local: viene comentada para que copiar el ejemplo en una máquina que publica no saque las 30 páginas al aire sin querer.

| Variable | Qué es | Local | Pages hoy | Con dominio propio |
|---|---|---|---|---|
| `PUBLIC_SITE_URL` | Origen del sitio, sin base ni barra final. Va en `canonical`, OG, sitemap, JSON-LD y en el encabezado de la hoja de impresión. | `http://localhost:4321` | `https://juliv08.github.io` | `https://www.covicen.com.ar` |
| `PUBLIC_BASE_PATH` | Ruta base con barras. En Pages de un repo es `/<repo>/`. | `/` | `/Covicen/` | `/` |
| `PUBLIC_INDEXABLE` | `false` = demo: `noindex` y `robots.txt` cerrado. `true` = indexable (solo con dominio). | `false` | `false` | `true` |
| `PUBLIC_SITIO_COMPLETO` | **Qué se publica.** Sin la variable: solo la portada de «Próximamente». `true`: el sitio entero (30 páginas generadas). Ver «El interruptor de lo que se publica». | `true` (en tu `.env`) | `true` | `true` cuando salga al público |
| `FUENTE_DATOS` | `local` (todo del repo) o `api` (tramo y tarifario del sistema; el resto sigue en el repo). | `local` | `local`; pasa a `api` solo cuando existe la variable de repositorio `API_URL` | según el sistema |
| `API_URL` | Origen de la API del sistema, sin barra final. Obligatoria con `FUENTE_DATOS=api`. | — | variable de repositorio | `https://api.covicen.com.ar` (cuando exista) |

`src/lib/tema.ts` → `TEMA_POR_DEFECTO` (`'oscuro' | 'claro' | 'sistema'`) es el tema con el que arranca quien nunca eligió; lo decide Covicen. El interruptor guarda la elección en `localStorage['covicen:tema']`.

## El interruptor de lo que se publica (`PUBLIC_SITIO_COMPLETO`)

Mientras no haya una primera versión para mostrar al público, **producción muestra solo una portada de «Próximamente»**: marca, qué es Covicen y el **140** de emergencias, con la foto y los colores del sitio. Es `src/layouts/Proximamente.astro`.

La variable **va al revés que las demás, a propósito**:

| Build | Qué sale |
|---|---|
| `pnpm build` a secas | **la portada sola** |
| `PUBLIC_SITIO_COMPLETO=true` | el sitio entero (30 páginas) |

El motivo está en la sección de abajo: hoy el sitio lo sube **una persona que clona el repo y corre `pnpm build`** sin configurar nada. Con el default al revés, ese build a ciegas publica la portada; olvidarse de la variable falla hacia el lado seguro, y publicar el sitio real hay que pedirlo explícitamente. Tu `.env` y el workflow de Pages la llevan en `true`, así que en local y en Pages seguís viendo todo.

Cómo funciona: `src/pages/index.astro` importa `@portada`, un alias que `astro.config.mjs` resuelve en build a la home o a la portada. Con la portada, la integración `soloPortada` (`scripts/lib/solo-portada.ts`) poda del build las otras 29 páginas y los archivos de `_astro/` que solo ellas usaban, el `404.html` pasa a ser una copia de la portada, el sitemap queda con una sola URL y el `robots.txt` va cerrado **aunque `PUBLIC_INDEXABLE` diga `true`**. `pnpm verificar:portada` comprueba todo eso sobre el `dist/` de verdad, y corre en CI: si la poda fallara en silencio se publicaría el sitio entero creyendo que no.

**Para volver al sitio completo** hay una sola cosa que hacer: `PUBLIC_SITIO_COMPLETO=true` donde se buildee. No hay nada borrado ni comentado.

## Cómo se publica hoy (AWS, y NO desde git)

Lo que está en `https://www.covicen.com.ar/` **no sale de este repo automáticamente**. Medido el 2026-09-19:

- El sitio lo sirve **AWS (S3 detrás de CloudFront)**, no GitHub Pages. El `www` y el dominio pelado apuntan los dos ahí.
- **No hay ninguna cañería entre el repo y ese hosting**: cero webhooks y cero claves de deploy en `JuliV08/Covicen`. Un push a `main` reconstruye GitHub Pages y **no toca producción**.
- Lo publicado es un build de `main` hecho **a mano**: el último push fue el 15/09 y el archivo subido es del 18/09 a las 22:27; el sello de fecha del propio HTML dice `18/9/2026`, hora argentina (un runner de AWS, que corre en UTC, habría estampado `19/9`). El HTML publicado es idéntico byte a byte a un `dist/index.html` local salvo esa fecha.
- Se buildeo **sin las variables de entorno**, así que quedó con `canonical` apuntando a `http://localhost:4321` y `noindex` en todas las páginas (por eso Google no lo indexa).

**Consecuencias prácticas mientras esto siga así:**

1. Para que un cambio llegue a producción hay que **pedirle a quien tiene la consola de AWS que baje `main` y vuelva a subir**. Con el interruptor de arriba, ese build a ciegas ya sale «Próximamente» sin que tenga que configurar nada.
2. Después de subir hay que **invalidar la cache de CloudFront** (`/*`). El HTML se sirve con `s-maxage=31536000`: **un año** en el borde. Si el deploy lo hace Amplify, invalida solo; si se copia a S3 a mano, no.
3. **El dominio pelado no redirige al `www`**: responde `200` en vez del `301` que pide el pliego (PETG 61.7). Queda para cuando se tome la infraestructura.

Cuando el deploy pase a estar enganchado a git, actualizar esta sección y decidir dónde vive `PUBLIC_SITIO_COMPLETO=true`.

## Deploy (GitHub Pages)
Repo `JuliV08/Covicen`, público; Settings → Pages → Source: **GitHub Actions**. El workflow `.github/workflows/pages.yml` corre `check + test + verificar` y publica en `https://juliv08.github.io/Covicen/` en cada push a `main`, a diario a las 03:00 de Argentina (para que entren los avisos y cuadros programados por fecha) y cuando el sistema avisa por `repository_dispatch` (`datos-publicados`). Mientras no haya dominio se publica con `noindex`.

## Migración al dominio propio (`www.covicen.com.ar`)
El pliego (PETG 61.7) pide el sitio bajo un dominio con `www` y redirección 301 desde el dominio sin `www`. Nada de esto vive en el repo salvo las tres variables. La URL final va impresa en la cartelería de las cabinas (PETG 66.3 c): **fijarla antes de imprimir y no cambiarla después.**

1. **Registrar el dominio** en NIC.ar (`covicen.com.ar`). Pide CUIT: mientras la sociedad esté en formación va a nombre de un tercero y después se transfiere.
2. **DNS**, en el proveedor del dominio:
   - `www` → registro **CNAME** a `juliv08.github.io` (la cuenta de GitHub que publica; si cambia la cuenta, cambia el destino).
   - Apex (`covicen.com.ar`) → registros **A** a `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (y **AAAA** a `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`). Con el apex apuntando a GitHub y el `www` configurado como dominio personalizado, GitHub Pages responde el apex con un **301 al `www`**: es la redirección que pide el pliego.
3. **GitHub** → Settings → Pages → Custom domain: `www.covicen.com.ar`. Esperar el chequeo de DNS y tildar **Enforce HTTPS** (el certificado lo emite GitHub solo). Con deploy por Actions el dominio queda guardado en la configuración del repo; si querés dejarlo también versionado, `public/CNAME` con una sola línea: `www.covicen.com.ar`.
4. **Workflow** `.github/workflows/pages.yml`, bloque `env` del job `build`:
   ```yaml
   PUBLIC_SITE_URL: https://www.covicen.com.ar
   PUBLIC_BASE_PATH: /
   PUBLIC_INDEXABLE: "true"
   ```
   Con `PUBLIC_INDEXABLE=true`, `verificar` exige que el `canonical` sea absoluto y no apunte a `localhost`, y que no quede ningún `noindex`: si algo falta, el deploy no pasa.
5. **Push a `main`** y comprobar: `https://covicen.com.ar/` responde 301 a `https://www.covicen.com.ar/`; `https://www.covicen.com.ar/robots.txt` permite indexar y apunta al sitemap; el pie de cualquier página dice la fecha del build.
6. Si algún día el sitio se sirve desde un VPS en vez de Pages, la redirección la hace el servidor (en Caddy: `covicen.com.ar { redir https://www.covicen.com.ar{uri} permanent }`); las tres variables son las mismas.

Casilla `atencionalusuario@covicen.com.ar` (PETG 61.5): se publica en `src/content/contacto.json` (`atencionUsuario` y el canal `correo`) solo cuando la casilla funcione; hasta entonces el sitio no la nombra.

## Documentación
- Guía de revisión para Juli (qué mirar en cada pantalla, cómo probar el tema, el mapa, la ubicación y la impresión, qué está oculto y cómo cargarlo): `docs/guia-de-revision.md`.
- Spec y plan de la actualización de septiembre de 2026: `docs/superpowers/specs/2026-09-13-actualizacion-web-design.md` y `docs/superpowers/plans/2026-09-13-actualizacion-web.md`. Los de la landing original (agosto de 2026) están en las mismas carpetas.
- Vault del proyecto (Obsidian, viaja con el repo): `obsidian/Home.md`.
- Manual de marca: `docs/marca/`.
