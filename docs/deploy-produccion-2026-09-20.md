# Cómo subir esta versión a producción

**Para:** quien tenga la consola de AWS (equipo de infraestructura).
**De:** Covicen · **Fecha:** 20 de septiembre de 2026.

---

## Lo que hay que hacer, en una línea

Reemplazar el contenido del bucket de S3 de `www.covicen.com.ar` por el del archivo adjunto, y después **invalidar
la cache de CloudFront**. Ese último paso no es opcional: sin él, el cambio no se ve.

---

## Por qué hace falta que lo hagan ustedes

No hay ninguna conexión entre el repositorio de git y el hosting: ni webhooks, ni claves de deploy, ni credenciales
en el proyecto (verificado el 19/09 y otra vez el 20/09). Un push a `main` **no toca producción**. La única forma de
publicar es subir los archivos a mano.

---

## Opción 1 — subir el archivo ya armado (la más simple)

**`C:\Users\Villex\dev\Covicen\covicen-produccion-2026-09-20.zip`** (1,83 MB, 57 archivos)

Está buildeado con la configuración de producción correcta y ya verificado: 27 páginas, 0 fallos. Adentro, en la
raíz del zip, está `index.html` y el resto.

1. Vaciar el bucket de S3 del sitio.
2. Descomprimir el zip y subir **el contenido** (no la carpeta), respetando la estructura de subcarpetas.
3. Invalidar la cache de CloudFront (ver más abajo). **Sin esto no se ve el cambio.**

## Opción 2 — buildear ustedes desde el repositorio

Si prefieren generarlo en su máquina, es `JuliV08/Covicen`, rama `main`, commit `4468497`.

Requiere Node 22.12 o superior y pnpm 10.

```
pnpm install
pnpm verificar
```

**Antes de buildear hay que crear un archivo `.env` en la raíz del proyecto con exactamente esto:**

```
PUBLIC_SITE_URL=https://www.covicen.com.ar
PUBLIC_BASE_PATH=/
PUBLIC_INDEXABLE=false
PUBLIC_SITIO_COMPLETO=true
FUENTE_DATOS=local
```

**Las cuatro primeras líneas importan y ninguna se puede olvidar:**

| Variable | Si falta, pasa esto |
|---|---|
| `PUBLIC_SITIO_COMPLETO=true` | Se publica **una sola página** que dice «Próximamente», en vez del sitio. Es el default a propósito: pensado para que un build a ciegas falle del lado seguro. |
| `PUBLIC_SITE_URL` | Las etiquetas `canonical` de todas las páginas salen apuntando a `http://localhost:4321`. **Es lo que pasó en el build del 18/09 que está publicado hoy.** |
| `PUBLIC_BASE_PATH=/` | Todos los enlaces internos salen con el prefijo `/covicen/` y el sitio queda roto. |
| `PUBLIC_INDEXABLE=false` | Decisión tomada: el sitio sale **sin indexar** por ahora. Dejarlo en `false`. |

El resultado queda en la carpeta `dist/`. Se sube **el contenido de `dist/`**, no la carpeta.

`pnpm verificar` tiene que terminar diciendo `OK: 27 páginas verificadas, 0 fallos`. Si dice otra cosa, no subir y
avisar.

---

## El paso que se olvida: invalidar CloudFront

El HTML se sirve con `s-maxage=31536000`, o sea **un año** de cache en el borde. Si suben los archivos y no
invalidan, el público sigue viendo la versión vieja.

- Invalidación: `/*`
- Si el deploy lo hace Amplify, invalida solo. **Si se copia a S3 a mano, no**, y hay que hacerlo aparte.

---

## Cómo comprobar que salió bien

Después de invalidar, abrir `https://www.covicen.com.ar/` y verificar:

1. El menú de arriba dice: **Tarifas · El tramo · Servicios · Novedades · Nosotros · Contacto**. Si todavía dice
   «Obras», la cache no se invalidó.
2. Buscar «Free Flow» en la página (Ctrl+F): **no tiene que aparecer**.
3. Ver el código fuente y buscar `data-fecha=`: tiene que decir la fecha del día en que lo buildearon, no `18/9/2026`.
4. El título grande de la portada tiene que decir **«679 kilómetros de rutas nacionales, bajo una misma
   responsabilidad»**.

---

## Dos cosas que quedan pendientes de infraestructura

No son de esta entrega, pero conviene tenerlas anotadas:

1. **El dominio pelado (`covicen.com.ar`) no redirige al `www`**: responde 200 en lugar del 301 que exige el pliego
   (PETG art. 61.7). Hace falta configurarlo.
2. **Mientras no haya una conexión entre git y el hosting**, cada cambio va a necesitar este mismo procedimiento
   manual. Si en algún momento se engancha el deploy a git, hay que decidir dónde vive la variable
   `PUBLIC_SITIO_COMPLETO=true`, porque hoy vive en la máquina de quien buildea.
