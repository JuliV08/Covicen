# Costura de datos

Cómo el front lee contenido hoy (JSON/Markdown del repo) sin que mañana duela conectar los sistemas. Criterio textual de Juli: *"que no duela en el futuro conectar todo con los futuros sistemas"*. Ver [[Decisiones de arquitectura]] · [[Home]].

## Estructura

```
src/content/                      JSON/MD versionados. SOLO los lee fuentes/local-*.ts
src/content.config.ts             colección `novedades` (Markdown) con el schema del contrato
src/lib/datos/
  esquemas.ts                     Zod + tipos: EL CONTRATO (Empresa, Contacto, Tramo, Cabina, Tarifario, Obra, Novedad, Pregunta, EstadoRuta)
  fuente.ts                       interface FuenteDatos (todos los métodos async)
  fuentes/local-json.ts           v1: JSON importado + import.meta.glob, validado con Zod
  fuentes/local-novedades.ts      v1: astro:content (se importa diferido)
  fuentes/api.ts                  Django: tramo() y tarifario() contra la API pública (fetch + safeParse). El resto sigue local.
  capacidades.ts                  flags de lo que depende de sistemas
  index.ts                        export const datos = FUENTE_DATOS === 'api' ? fuenteApi : fuenteLocal
```

Dirección única de dependencia: `content/ → lib/datos/ → componentes/páginas`. Un componente que importe de `content/` es un bug.

## Las cinco reglas

1. **Un solo contrato.** El mismo schema Zod valida el JSON de hoy y la respuesta de la API de mañana. Si Django devuelve otra cosa, rompe en build.
2. **La UI formatea, los datos no.** Nada de `"$1.399"` en JSON: `lib/formato.ts` (es-AR).
3. **Interfaz async desde el día 1**, aunque hoy se resuelva en build.
4. **`fuentes/api.ts` no mockea.** Lo que el sistema no tiene todavía no se simula: viene del repo. (Hasta el 2026-09-06 lanzaba `FuenteApi: no implementado`.)
5. **Formularios reales sin backend**: link `wa.me` con mensaje estructurado; con `ticketingReclamos: true` el mismo componente hará POST.

## Capacidades (huecos reservados)

`capacidades.ts`: `estadoRutasEnVivo`, `oficinaVirtual`, `ticketingReclamos`, `portalProveedores`, `canalEticoAnonimo` — todas `false`. El componente `HuecoCapacidad` renderiza el hueco ("Próximamente" + alternativa real) cuando el flag está apagado y el `<slot />` cuando está prendido.

## Cómo está conectado el sistema (desde el 2026-09-06)

`fuentes/api.ts` implementa **solo** `tramo()` y `tarifario()` contra la API pública del sistema (`/api/v1/tramo/`, `/api/v1/tarifario/`), con `fetch` + `esquema.safeParse`: si el servidor no responde, devuelve otra forma o no hay cuadro vigente (404), **el build falla** y no se publica basura. `index.ts` compone `{ ...fuenteLocal, ...fuenteApi }` cuando `FUENTE_DATOS=api`: la API para lo que el sistema tiene, el repo para el resto (empresa, contacto, obras, novedades, FAQ, estado de rutas). La regla 4 sigue: lo que no existe no se simula.

- `API_URL` (variable de build, no pública) es obligatoria con `FUENTE_DATOS=api`; `config.apiUrl` la expone sin barra final.
- El contrato lo siguen mandando los esquemas Zod: `pnpm contrato` exporta `docs/contrato/{tramo,tarifario}.schema.json` y el backend valida cada respuesta contra esos archivos en su suite. Dos campos nuevos, opcionales: `montoConIva` y `freeFlow`.
- Los textos que carga un operador (`avisos`, `vigencia.descripcion`, `nota`, `fuente.nombre`) se pintan como texto; hay un test que inyecta HTML y comprueba que no se convierte en elementos.
- Workflow de Pages: `repository_dispatch` (`datos-publicados`, lo dispara el sistema al publicar) y un cron diario a las 03:00 (los cuadros programados entran solos). `FUENTE_DATOS` pasa a `api` cuando existe la variable de repositorio `API_URL`; hasta que haya VPS, sigue en `local`.
- Demo local: `FUENTE_DATOS=api API_URL=http://localhost:8000 pnpm build` contra el Docker del sistema (verificado el 2026-09-06: 21 páginas, `verificar` OK).
- Fixtures reales de la API en `tests/fixtures/api/`, validados por Zod en `tests/lib/fuente-api.test.ts`.

## Cómo se conectó (histórico: el plan original)

1. Implementar cada método de `fuentes/api.ts` con `fetch` + `esquemaX.parse(...)` (el contrato manda; si el sistema viejo devuelve otra forma, el mapeo va en `api.ts`, no en la UI).
2. `FUENTE_DATOS=api` en el entorno del build (o SSR con adapter si hace falta runtime).
3. Encender flags en `capacidades.ts`. Los componentes no se tocan.
4. Para "estado de rutas en vivo": una isla que consuma `datos.estadoRutas()` en runtime; el contrato ya es async.

## Datos hoy marcados "a confirmar" (null en `src/content/`)

Teléfono de emergencias, WhatsApp, mails, valores por categoría (salvo auto: 1399), razón social/CUIT/domicilio, redes. Los slots existen en la UI y se llenan editando el JSON.
