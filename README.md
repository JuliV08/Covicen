# Covicen — landing fundacional

Sitio estático (Astro 7) de Covicen, concesionaria del Tramo Centro de la Red Federal de Concesiones.

## Comandos
- `pnpm dev` — servidor local en http://localhost:4321
- `pnpm check` — typecheck (astro check)
- `pnpm test` — tests (vitest)
- `pnpm build` — genera `dist/` (antes regenera `public/og.png`)
- `pnpm verificar` — build + chequeos de links, SEO, JSON-LD, accesibilidad y presupuesto sobre `dist/`

## Contenido
Todo el contenido vive en `src/content/` (JSON y Markdown). Los componentes lo consumen a través de `src/lib/datos`. Ver `docs/superpowers/specs/2026-08-27-landing-covicen-design.md` §4.

## Entorno
Copiá `.env.example` a `.env`. Variables: `PUBLIC_SITE_URL`, `PUBLIC_BASE_PATH`, `PUBLIC_INDEXABLE`, `FUENTE_DATOS`.

## Deploy (GitHub Pages)
1. Crear el repo remoto: `gh repo create covicen --private --source=. --remote=origin` (o público, si Juli quiere).
2. En GitHub → Settings → Pages → Source: **GitHub Actions**.
3. Push a `main`. El workflow corre check + test + verificar y publica. URL: `https://<cuenta>.github.io/covicen/`.
4. Con dominio propio: cambiar las tres variables `PUBLIC_*` del workflow y agregar `public/CNAME`.
