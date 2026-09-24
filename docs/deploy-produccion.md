# Cómo se publica la web

**Al día al 21 de septiembre de 2026.** Reemplaza a `deploy-produccion-2026-09-20.md`, que describía el trámite
manual a S3 y **ya no aplica**.

---

## En una frase

Se publica con **AWS Amplify**: un servicio que mira una rama de GitHub y, cada vez que algo llega ahí, compila y
sube solo. No hay que copiar archivos ni invalidar caches a mano.

```
commit a la rama  →  Amplify compila  →  corre la compuerta  →  publica
```

Si la compuerta falla, **no publica nada** y la versión anterior sigue en el aire.

---

## El mapa: qué rama sale a dónde

| Rama | Qué publica | URL | Protegida |
|---|---|---|---|
| `main` | La portada de «Próximamente» | `covicen.com.ar` y `www.covicen.com.ar` | No (es pública a propósito) |
| `dev` | El sitio entero, para revisar | a definir con Gustavo | Sí, con usuario y contraseña |

**El flujo de trabajo:** se trabaja en `dev`, se mira en su URL, y cuando la versión está para salir se hace un
pull request de `dev` a `main`. Al aprobarlo, Amplify publica en producción.

---

## Las variables de entorno: lo único que hay que cargar a mano

Se cargan **en la consola de Amplify, por rama**. Son lo que decide qué publica cada una.

### Rama `main` (producción)

| Variable | Valor |
|---|---|
| `PUBLIC_SITE_URL` | `https://www.covicen.com.ar` |
| `PUBLIC_BASE_PATH` | `/` |
| `PUBLIC_INDEXABLE` | `false` |
| `FUENTE_DATOS` | `local` |

**`PUBLIC_SITIO_COMPLETO` NO se carga en `main`.** Ausente, la rama publica la portada de «Próximamente», que es
lo que se decidió. El día que haya que publicar el sitio entero, se agrega con valor `true`. Es un solo cambio en
la consola, sin tocar código.

> **Por qué el interruptor va al revés:** el default es «publicar de menos». Si alguien crea una rama nueva y se
> olvida de configurarla, publica un cartel, no las 27 páginas. Olvidarse falla hacia el lado seguro.

### Rama `dev` (revisión)

Las mismas cuatro, con `PUBLIC_SITE_URL` apuntando a la URL de dev, **más**:

| Variable | Valor |
|---|---|
| `PUBLIC_SITIO_COMPLETO` | `true` |

Y en la consola de Amplify, para esa rama: **activar la protección con usuario y contraseña** (*Access control* →
*Manage access*). Sin eso, la URL de dev es pública y cualquiera puede ver una versión sin aprobar.

### El error que ya pasó una vez

El build que estuvo publicado desde el 18/09 se compiló **sin `PUBLIC_SITE_URL`**, y quedó con todas las etiquetas
`canonical` apuntando a `http://localhost:4321`. Por eso Google nunca lo indexó.

Desde el 21/09 eso **ya no puede volver a pasar en silencio**: `scripts/verificar.ts` falla si un build hospedado
sale con el canonical en localhost. En la máquina de uno sigue siendo válido, porque ahí localhost es correcto.

---

## Primera vez en la consola de AWS: cargar las variables

Escrito para alguien que nunca entró a AWS. Son cinco minutos y no hay forma de romper nada: cargar variables no
dispara ningún cambio por sí solo.

### 1. Entrar

Se entra con el enlace y el usuario que da el equipo de infraestructura. Suele ser una URL del estilo
`https://<numero-de-cuenta>.signin.aws.amazon.com/console`, o un acceso de SSO. Si pide un *IAM user name*, ese es
el usuario; no es el mail.

### 2. Elegir la región — **acá es donde todos se pierden la primera vez**

Arriba a la derecha, al lado del nombre de usuario, hay un selector de región. Tiene que decir
**São Paulo** (`sa-east-1`).

> **Si la región está mal, Amplify aparece vacío** y parece que no hay nada. No es que no tengas permisos: estás
> mirando otra parte del mundo.

### 3. Abrir Amplify

En la barra de arriba hay un buscador. Escribir **Amplify** y entrar al servicio. Va a aparecer una lista con la
aplicación del sitio.

### 4. Buscar las variables de entorno

Entrar a la aplicación. En el menú de la izquierda, buscar **Environment variables**. Según la versión de la
consola puede estar suelto, bajo **Hosting**, o bajo **App settings**. Es el mismo lugar.

### 5. Cargar las cuatro

Botón **Manage variables** y después **Add variable**, una por una. Ojo con los espacios al copiar y pegar.

| Variable | Valor |
|---|---|
| `PUBLIC_SITE_URL` | `https://www.covicen.com.ar` |
| `PUBLIC_BASE_PATH` | `/` |
| `PUBLIC_INDEXABLE` | `false` |
| `FUENTE_DATOS` | `local` |

Si hay una columna de **Branch** o dice *Applies to*, dejarlas en **All branches** por ahora.

### 6. La quinta que NO va

**`PUBLIC_SITIO_COMPLETO` no se carga.** Su ausencia es lo que hace que salga la portada de «Próximamente». Es el
interruptor al revés: se agrega, con valor `true`, recién el día que haya que publicar el sitio entero.

### 7. Guardar

Botón **Save**. **No pasa nada visible, y está bien**: las variables se aplican en el build siguiente, no
retroactivamente. El sitio publicado no cambia hasta que haya un deploy nuevo.

### Qué no tocar

Nada más. En particular: ni *Custom domains*, ni *Rewrites and redirects*, ni *Build settings* (esa última la
maneja el `amplify.yml` del repositorio, y editarla a mano en la consola la desincroniza).

## La compuerta

`amplify.yml`, en la raíz del repositorio, define qué corre antes de publicar:

```
pnpm check              →  0 errores de tipos
pnpm test               →  los 550 tests
pnpm verificar:portada  →  la portada de «Próximamente»
pnpm verificar          →  el sitio entero: links, contraste, HTML válido, presupuesto de JS…
```

**Esto existe porque Amplify no corre los GitHub Actions.** Tiene su propio pipeline. Sin `amplify.yml`, un merge a
`main` publicaría aunque los tests estuvieran en rojo, y la compuerta del proyecto quedaría decorativa justo en el
camino que llega al público.

Al estar adentro del build que publica, **no se puede saltear**: es la misma máquina.

El GitHub Action (`.github/workflows/pages.yml`) sigue existiendo y corre lo mismo. Son dos redes, no una repetida:
el Action avisa **antes** de mergear, y Amplify frena **en el momento de publicar**.

---

## Cuando algo falla

1. En la consola de Amplify, *Hosting* → la rama → el deployment que falló → **ver el log**.
2. El log dice exactamente qué comando falló. Si es `pnpm test` o `pnpm verificar`, **el problema está en el código,
   no en la infraestructura**: se arregla en el repo y se vuelve a pushear.
3. **Producción no se rompe**: si el build falla, Amplify no publica y queda la versión anterior.

---

## Lo que falta configurar (checklist)

- [ ] Que llegue la invitación al repositorio de la organización (al 21/09 todavía no llegó).
- [ ] Llevar la historia del repositorio actual al de la organización (ver `docs/mudanza-de-repositorio.md`).
- [ ] Crear la rama `dev`.
- [ ] Engancharla en Amplify (*Hosting* → *Add branch*).
- [ ] Definir la URL de dev con Gustavo y que la den de alta en Route 53.
- [ ] Cargar las variables de las dos ramas.
- [ ] Activar la contraseña en la rama `dev`.
- [ ] Comprobar que el primer build de `dev` pasa la compuerta.

---

## Dos cosas de infraestructura que siguen pendientes

1. **El dominio pelado (`covicen.com.ar`) no redirige al `www`**: responde 200 en lugar del 301 que exige el
   contrato de concesión. Se configura en Amplify, en *Custom domains*.
2. **La protección de rama en GitHub.** Mientras el repositorio sea **público**, exigir que el CI pase antes de
   mergear a `main` es gratis. Si pasa a privado, hace falta el plan Team de GitHub (unos 4 dólares por usuario por
   mes). Sin eso, cualquiera con acceso puede mergear a `main` sin que nadie apruebe, y la única red que queda es la
   compuerta de `amplify.yml`.
