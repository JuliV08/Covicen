# Cómo se publica la web

Dónde vive `https://www.covicen.com.ar/`, cómo llega el código ahí y por qué el interruptor de lo que se publica está al revés. Medido el **2026-09-19**. Manual operativo: `README.md`, «Cómo se publica hoy» y «El interruptor de lo que se publica».

## El hallazgo

El equipo de infra (AFEMA) deployó la web en **AWS** y avisó que «el código de Julian funciona perfecto en AWS Amplify». Lo que no dijo —y lo que había que averiguar antes de tocar nada— es que **no hay ninguna cañería entre el repo y ese hosting**. Un push a `main` reconstruye GitHub Pages y no toca producción.

Lo publicado es **un build de `main` hecho a mano en la máquina de alguien** y subido a S3.

## Cómo se comprobó, sin acceso a la consola de AWS

Esto es lo reusable: **se puede saber si un hosting está enganchado a un repo mirando el repo y la respuesta HTTP**, sin credenciales del proveedor.

| Señal | Qué se miró | Qué dijo |
|---|---|---|
| Ganchos | `gh api repos/<owner>/<repo>/hooks` | 0. Una conexión OAuth clásica deja uno |
| Claves de deploy | `gh api repos/<owner>/<repo>/keys` | 0 |
| Fecha del push vs. fecha del archivo | `gh api repos/...` + `Last-Modified` de la respuesta | push el 15/09, archivo del 19/09 01:27 UTC: **hubo deploy sin push** |
| Sello de build adentro del HTML | `data-fecha` del `<body>` (lo pone `Base.astro` para la hoja de impresión) | `18/9/2026` = hora **argentina**. Un runner de AWS corre en **UTC** y habría estampado `19/9` |
| El HTML contra el build local | `diff dist/index.html` contra lo descargado | **idénticos salvo esa fecha**, mismos hashes de todos los assets |
| Clones del repo | `gh api repos/.../traffic/clones` | 3 el 18/09: alguien lo clonó a mano |

**La señal más barata y la más concluyente fue el sello de fecha del propio HTML**: un dato de build que el sitio ya emitía para otra cosa (el encabezado de la hoja de impresión) terminó identificando en qué huso horario corrió el build, y con eso, quién lo corrió. Vale la pena que todo build deje un sello así.

La otra pata: `gh api user/installations` **no sirve** con el token del `gh` CLI (403, hace falta un token autorizado por una GitHub App), así que una conexión hecha con la GitHub App de Amplify no deja rastro visible a nivel repo. Por eso la conclusión se apoya en las fechas y no solo en la ausencia de webhooks.

## Por qué el interruptor va al revés

Sabiendo que **quien publica clona y corre `pnpm build` sin configurar nada**, el default tenía que ser el seguro:

- `pnpm build` a secas → **portada de «Próximamente»**.
- `PUBLIC_SITIO_COMPLETO=true` → el sitio entero.

Olvidarse de la variable publica de menos, no de más. El `.env` local y el workflow de Pages la llevan en `true`, así que la revisión de Juli no cambia. La decisión la tomó Juli el 2026-09-19 sobre tres opciones (default normal, default invertido, rama aparte).

**Regla durable**: cuando el que aprieta el botón no es el que escribió el código, el default de un interruptor de publicación se elige por lo que pasa si se lo olvidan, no por lo que es más intuitivo de leer.

Lo mismo para la compuerta: **el modo que se publica es el que tiene que correr en CI**. `pnpm verificar:portada` corre antes que `pnpm verificar` en el workflow; si solo verificáramos el sitio entero, el único build sin gate sería justo el que ve el público. Ver [[Decisiones de arquitectura]].

## Cómo está hecha la poda

Astro decide sus rutas por el filesystem y **no deja quitarlas**: el hook `astro:routes:resolved` parece servir pero recibe una copia del array (`integrations/hooks.js`: `routes: routes.map(...)`), así que es de solo lectura. Por eso se poda el `dist` al final, en `astro:build:done` (`scripts/lib/solo-portada.ts`).

Dos detalles que costaron una vuelta:

1. **El alias `@portada`**. Con un `await import()` condicional adentro de `index.astro`, los dos módulos quedan en el grafo de la página y la portada terminaba cargando el CSS de la home (`Base.css`, `Home.css`). Se resuelve en `astro.config.mjs` con un alias de Vite: entra **un solo archivo** y la portada se lleva solo su hoja.
2. **El barrido de `_astro/` es un cierre transitivo**, no una pasada. El HTML nombra el CSS, y es el **CSS** —no el HTML— el que nombra las fuentes y las fotos. Una sola pasada dejaba la portada sin tipografía.

Resultado: **615 KB** en `dist/`, 20 archivos, una hoja de estilo, **0 KB de JS**.

## Lo que encontró la revisión (y las reglas que deja)

La primera versión de esto pasó `check`, 507 tests y las dos verificaciones en verde, y aun así tenía tres cosas que rompían. Las tres dejan una regla reusable:

1. **El script `verificar:portada` se saltaba medio `pnpm build`.** `pnpm build` es `node scripts/generar-og.ts && astro build`, y el script nuevo corría solo el segundo. Como `public/og.png` está gitignoreado, en local existía de una corrida anterior y en CI no: **habría fallado en el primer push, no antes**.
   → *Un script que reimplementa un comando del `package.json` tiene que reimplementarlo entero, y conviene probarlo con los archivos gitignoreados borrados.*

2. **`.env.example` venía con `PUBLIC_SITIO_COMPLETO=true`** y el README dice «copiá `.env.example` a `.env`». O sea: el que clonaba y seguía el README publicaba las 30 páginas. Era exactamente el olvido que el default invertido venía a evitar, reintroducido por la puerta de al lado. Ahora va comentada.
   → *Un archivo de ejemplo que se copia no puede traer prendido el interruptor peligroso, por más cómodo que sea para desarrollar.*

3. **El contraste de la portada estaba por debajo del pliego y el test seguía en verde.** `hero-foto.test.ts` mide la caja del hero, que es `100dvh - var(--alto-header)`; la portada mide un dvh entero, así que el `object-fit: cover` recorta la foto distinto: el párrafo quedaba en **4,03:1** (pide 4,5) y la fecha, que en el resto del sitio va en el pie sobre fondo sólido, caía sobre la foto a 2,66-3,15:1. Arreglado con un velo propio (`.velo-portada`, tokens por tema) y la fecha en una franja opaca; el test ahora recorre **las dos cajas**, cada una con su velo y su altura, y se probó rompiéndolo (aflojando el velo detecta 4,47:1).
   → *Esta es la cuarta vez que el contraste sobre la foto se escapa. El patrón no es «falta un test»: es que **el test existía y modelaba una sola caja**. Cuando aparece una segunda pantalla con el mismo riesgo, el test se parametriza; copiar el CSS y no copiar la medición es la forma en que esto se cuela.*

También salió de ahí que `Seo.astro` y `robots.txt.ts` tenían **dos definiciones distintas de «indexable»**: el día que se prenda `PUBLIC_INDEXABLE` con la portada arriba, habría salido sin `noindex` y con el robots cerrado. Ahora `config.indexable` ya incluye `sitioCompleto` y es el único lugar donde eso se decide.

**Pendiente preexistente, no de este cambio**: la volanta del hero (12 px, `texto-2`) da **1,80:1** sobre la foto en tema claro. En la portada se esquivó usando color pleno; en el hero sigue. Ver [[Sistema de diseno]].

## Pendientes de infraestructura

1. **Enganchar el deploy a git** (es lo que el equipo iba a mostrar el lunes 2026-09-21). Hasta entonces, cada cambio en producción se le pide a infra.
2. **La cache de CloudFront**: el HTML se sirve con `s-maxage=31536000`, **un año** en el borde. Quien suba a mano tiene que invalidar (`/*`) o el cambio no se ve.
3. **El dominio pelado no redirige al `www`**: responde `200` donde el pliego (PETG 61.7) pide un `301`. Ver [[Obligaciones del pliego para la web]].
4. Cuando se publique en serio: `PUBLIC_SITE_URL`, `PUBLIC_BASE_PATH` y `PUBLIC_INDEXABLE` nunca se setearon en ese build, así que hoy la web tiene `canonical` a `localhost:4321` y `noindex`. El paso a paso está en `README.md`, «Migración al dominio propio» (escrito para Pages: las variables son las mismas, cambia dónde se setean).

## Quién es quién

- `afemasagit` — colaborador con permiso de **escritura** en `JuliV08/Covicen`. Es de **AFEMA S.A.**, una de las tres del consorcio ([[Contexto del negocio (Corredores Viales)]]). Es quien subió el sitio.
