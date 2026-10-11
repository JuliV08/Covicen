# Novedades despublicadas

Lo que vive acá está en el repo pero no en el sitio. No es un borrador a medio escribir: es contenido que estuvo
publicado y se bajó por una decisión, y vuelve entero cuando la decisión cambie.

**Por qué una carpeta hermana y no `novedades/_algo/`:** el guion bajo saca un archivo del *routing* de Astro, pero
NO de una colección de contenido. `src/content.config.ts` carga las novedades con `glob({ pattern: '**/*.md', base:
'./src/content/novedades' })`, así que cualquier `.md` adentro de esa carpeta —con guion bajo o sin él— entra a la
colección y tiene que cumplir el schema. Lo comprobó `astro check` al primer intento. La única forma de sacarlo de
la colección es sacarlo de la carpeta base.

| Archivo | Por qué salió | Qué la devuelve |
|---|---|---|
| `2026-08-27-obras-antes-que-peaje.md` | Call del 20/09/2026: «no se sabe nada del tema obras». La nota enlaza dos veces a `/obras/`, que dejó de generarse. | Prender `obras` en `src/lib/publicado.ts` y mover el archivo a `src/content/novedades/`. |
| `2026-08-27-como-se-fija-la-tarifa.md` | Pedido de Juli del 05/10/2026: despublicar la nota por completo. Explica cómo se fija la tarifa; se le sacó además toda referencia a «la tarifa más baja». | Mover el archivo a `src/content/novedades/`. |
| `2026-09-13-que-cuadro-tarifario-rige.md` | 10/10/2026, con el cuadro que rige desde el 11/10: Juli pidió sacar la referencia a la Resolución 248/2026, y esta nota entera es esa referencia (qué cuadro regía desde la toma de posesión, $1.500 el auto, con el enlace al Boletín). Quedó como estaba publicada. | Es historia de un cuadro que ya no rige: no vuelve tal cual. Si se quiere contar la historia de las tarifas, sirve de base. |

El pedido de confirmación que hay que hacer para devolverla está en `docs/pendientes-de-confirmacion.md`.
