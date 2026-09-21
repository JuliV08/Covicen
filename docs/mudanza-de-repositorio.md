# Mudanza al repositorio de la organización

**Fecha:** 21 de septiembre de 2026. **Estado:** rama `dev` subida. Lo que sigue depende del acceso a AWS.

---

## Lo que se creía y lo que hay

En la reunión quedó dicho que el equipo de infraestructura había **clonado** este repositorio a la organización.
Con el acceso ya otorgado se pudo mirar de verdad, y no es eso.

| Se dijo | Lo que hay, verificado el 21/09 |
|---|---|
| «Cloné tu repositorio» | `covicen/website` tiene **2 commits**: `Initial commit` y `upload webiste`. No hay historia: es una subida de archivos. |
| «Es el código del viernes 18» | El código subido es del **15 de septiembre**, no del 18. |
| «Tu repositorio es privado» | El de acá es **público**. El de la organización es el **privado**. |
| Juli puede empezar a trabajar ahí | El primer acceso otorgado fue **solo de lectura**. Se corrigió el mismo día: hoy es admin. |

**Faltan 29 commits** de este repositorio en el de la organización.

## Por qué producción muestra lo que muestra

El código que Amplify está publicando **no tiene el interruptor de «Próximamente»**: es anterior a que existiera.
No es un problema de configuración de AWS — es que ahí está el sitio de mediados de septiembre, con Obras, Free
Flow, Trabajá con nosotros y las citas del pliego.

Por eso no alcanza con cargar variables en Amplify: hay que llevar el código.

---

## Lo que ya se hizo

- **Permiso de escritura: otorgado.** Admin sobre `covicen/website`, confirmado el 21/09.
- **Rama `dev` subida**, con la historia completa y el `amplify.yml`. **No publicó nada**: Amplify todavía no mira
  esa rama. El código real ya está en la organización.

## Los bloqueos que quedan, y quién los destraba

| # | Bloqueo | Quién |
|---|---|---|
| 1 | **El acceso a Amplify de Juli sigue pendiente.** Sin eso no se puede enganchar la rama `dev`, ni cargarle las variables, ni ponerle la contraseña. **Tres de las cinco tareas asignadas a Juli dependen de esta.** | Martín |
| 2 | **Las variables de Amplify no están cargadas.** Hasta que estén, tocar `main` no sirve: el build falla (ver abajo). | Martín o Gustavo, hasta que Juli tenga acceso |
| 3 | El repositorio quedó **privado**. Se había decidido público, entre otras cosas porque en privado la compuerta obligatoria del CI pasa a ser paga. | Martín / Gustavo |
| 4 | La URL del ambiente de desarrollo y su entrada de DNS. | Gustavo |

### Por qué no se puede tocar `main` todavía

Simulado el 21/09 corriendo el build de Amplify tal como quedaría hoy, sin variables cargadas:

```
Verificando 1 páginas (base /, indexable false, PORTADA SOLA)…
1 fallo(s):
- index.html: canonical apunta a localhost en un build hospedado (falta PUBLIC_SITE_URL)
```

O sea: **el build falla y no publica**. Falla del lado seguro —producción queda como está, no se rompe nada— pero
no avanza. Es la guarda que se agregó justamente para que no se repita el build del 18/09, que salió con todas las
etiquetas `canonical` apuntando a `localhost` y por eso Google nunca lo indexó.

Se destraba cargando `PUBLIC_SITE_URL` y `PUBLIC_BASE_PATH` en la rama `main` de Amplify. Un minuto de consola.

---

## Una tarea de la lista que no hay que hacer

En el reparto de tareas figura, para Juli: *«Generar versión light (próximamente covicen) en branch main»*.

**No hay nada que generar.** Esa versión ya existe en el código desde el 19/09, y sale sola: la rama `main` publica
la portada de «Próximamente» **con solo no cargarle** la variable `PUBLIC_SITIO_COMPLETO`. El interruptor está al
revés a propósito, para que el olvido falle hacia el lado seguro.

Lo que sí hay que hacer es cargarle a `main` las otras variables (`PUBLIC_SITE_URL`, `PUBLIC_BASE_PATH`), sin las
cuales el build ni siquiera arranca.

## La decisión que falta, y que no es técnica

Hay dos cosas dichas que no coinciden:

- **En la reunión**, Martín transmitió el pedido de Fernando: que producción muestre el «coming soon» y que el
  sitio se trabaje en la rama de desarrollo.
- **El 20/09**, la decisión fue que producción muestre el sitio nuevo completo, sin indexar.

Las dos son defendibles y **hay que elegir una antes de tocar `main`**, porque cualquier cosa que llegue a esa
rama se publica sola.

| Si se elige | Qué se carga en Amplify, rama `main` |
|---|---|
| «Próximamente» | Las variables de siempre, **sin** `PUBLIC_SITIO_COMPLETO`. Publica el cartel. |
| El sitio completo | Las mismas **más** `PUBLIC_SITIO_COMPLETO=true`. |

Es un renglón en la consola. Se puede cambiar cuando se quiera, sin tocar código.

---

## El orden en que hay que hacerlo

Pensado para que **nada llegue a producción por accidente**: primero se lleva el código a una rama que Amplify no
mira, se prueba ahí, y recién al final se toca `main`.

### 1. Permiso de escritura ✅

Otorgado el 21/09: admin sobre el repositorio. Hacía falta admin y no solo `write`, porque las historias no encajan
y hay que reemplazar `main`, no agregar encima.

### 2. Subir la rama de desarrollo primero ✅

Hecho el 21/09. `dev` todavía no está enganchada a Amplify, así que **esto no publica nada**. Sirve para llevar el código a la
organización sin ningún riesgo.

```
git switch -c dev
git push -u organizacion dev
```

### 3. Configurar Amplify

Enganchar la rama `dev`, cargarle las variables, ponerle la contraseña y definir su URL con Gustavo. Todo está en
`C:\Users\Villex\dev\Covicen\docs\deploy-produccion.md`.

### 4. Comprobar que el build de `dev` pasa la compuerta

Es el primer build con `amplify.yml`. Si algo del entorno no cuadra —la versión de Node es la sospechosa
número uno— se ve acá, en una rama con contraseña, y no en producción.

### 5. Recién ahora, reemplazar `main`

```
git push --force organizacion main
```

**Se usa `--force` a propósito.** No hay ancestro común, así que no hay forma de «agregar»: hay que reemplazar. Lo
que se descarta son los 2 commits de la subida, que son una foto vieja del mismo código y no contienen nada que no
esté acá.

### 6. Reapuntar el remoto de siempre

```
git remote rename origin github-personal
git remote rename organizacion origin
```

---

## Qué pasa con `JuliV08/Covicen`

No se borra. Queda como respaldo y alimenta la demo de GitHub Pages, que sirve para revisar sin tocar producción.
Conviene ponerle en la descripción que la fuente de verdad pasó a ser `covicen/website`, para que nadie se
confunda de repositorio más adelante.

---

## Para pasarle a Martín

> Martín, cuando puedas, tres cosas para poder arrancar:
>
> **1.** Gracias por el admin. Ya subí la rama `dev` con el código al día y el `amplify.yml`. No publicó nada,
> porque Amplify todavía no mira esa rama.
>
> **2.** Lo que está subido ahí no es un clon: son dos commits (`Initial commit` y `upload webiste`) con el código
> del 15 de septiembre, sin historia. De mi lado hay 29 commits posteriores, así que las historias no tienen
> ancestro común y voy a tener que reemplazar `main` con un force-push en vez de agregar encima. Te aviso para que
> no te sorprenda ver la historia cambiada de golpe.
>
> **3.** Lo que me falta para seguir es el acceso a Amplify: sin eso no puedo enganchar `dev`, ni cargarle las
> variables, ni ponerle la contraseña. Son tres de las cinco tareas que me tocan. Si te resulta más rápido
> hacerlo vos, con cargar `PUBLIC_SITE_URL` y `PUBLIC_BASE_PATH` en las dos ramas ya me destrabás.
>
> **4.** El repositorio quedó privado. ¿Lo podemos dejar público? Es una web institucional estática, no tiene
> claves ni datos de nadie adentro, y en privado la protección de rama —que el CI tenga que pasar antes de
> mergear a `main`— deja de ser gratis y pasa a necesitar el plan Team.
>
> Al margen: agregué un `amplify.yml` al repositorio con los tests adentro del build. Amplify no corre los GitHub
> Actions, así que sin eso un merge a `main` publicaría aunque los tests estén en rojo.
>
> Y dos aclaraciones sobre producción:
>
> - Lo que se ve hoy no es un problema de configuración. El código que está ahí es anterior al interruptor de
>   «Próximamente», o sea que ni siquiera puede publicar el cartel. Se arregla llevando el código.
> - La tarea «generar versión light» no tiene trabajo: el cartel sale solo si a `main` **no** se le carga
>   `PUBLIC_SITIO_COMPLETO`. Lo que sí hace falta es cargarle `PUBLIC_SITE_URL` y `PUBLIC_BASE_PATH`, porque
>   sin eso el build falla (lo probé: el canonical queda apuntando a localhost y la compuerta lo frena).
