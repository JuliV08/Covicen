# Mudanza al repositorio de la organización

**Fecha:** 21 de septiembre de 2026. **Estado:** pendiente, esperando la invitación.

---

## Qué pasó

El equipo de infraestructura conectó AWS Amplify al sitio. Para poder hacerlo necesitaban permisos de
administrador sobre un repositorio, y el acceso que tenían acá era de colaborador. La solución rápida fue **clonar
este repositorio** y subir la copia a una organización nueva de GitHub (`covicen`), como `covicen/website`.

Amplify quedó enganchado a **esa copia**, no a este repositorio.

## Por qué hay que hacer algo

La copia es del **viernes 18 de septiembre**. Desde entonces este repositorio sumó **25 commits**: toda la tanda de
ajustes que salió de la call con el gerente, los tests nuevos y tres documentos.

Mientras las cosas sigan así, **nada de eso llega a producción**, por más que se trabaje. Amplify mira la copia
vieja.

## La decisión tomada

El repositorio de la organización es la fuente de verdad de acá en adelante, **pero arranca de la historia de este
repositorio, no de la copia**. Así no se pierde nada.

Se queda **público** por ahora: con eso, exigir que el CI pase antes de mergear a `main` no cuesta nada. Cuando se
sumen los repositorios de los sistemas se vuelve a mirar.

---

## Los pasos, cuando llegue la invitación

Todo esto corre desde `C:\Users\Villex\dev\Covicen`.

### 1. Comprobar que las dos historias encajan

Como la copia salió de un clon, los commits hasta el 18/09 deberían ser los mismos y la subida tendría que entrar
sin conflicto.

```
git remote add organizacion https://github.com/covicen/website.git
git fetch organizacion
git log --oneline organizacion/main -1
```

Ese último comando tiene que mostrar un commit que también esté en la historia de acá. Para confirmarlo:

```
git merge-base --is-ancestor organizacion/main main && echo "ENCAJA: se puede subir de una" || echo "OJO: divergieron"
```

- **Si dice ENCAJA**, seguir con el paso 2.
- **Si dice OJO**, frenar. Quiere decir que alguien tocó la copia después de clonarla y hay que mirar qué cambió
  antes de pisar nada.

### 2. Subir la historia completa

```
git push organizacion main
```

Con eso el repositorio de la organización queda con los 25 commits y Amplify va a disparar un build solo.

### 3. Crear la rama de desarrollo

```
git switch -c dev
git push -u organizacion dev
```

### 4. Lo que sigue en la consola de AWS

Engancharla en Amplify, cargarle las variables y ponerle la contraseña. Todo eso está en
`C:\Users\Villex\dev\Covicen\docs\deploy-produccion.md`.

### 5. Reapuntar el remoto de siempre

Para que `git push` a secas vaya a la organización y no al repositorio viejo:

```
git remote rename origin github-personal
git remote rename organizacion origin
```

---

## Qué pasa con `JuliV08/Covicen`

No se borra. Queda como respaldo y como lo que alimenta la demo de GitHub Pages, que sirve para revisar sin tocar
producción.

Lo que **sí** conviene hacer, para que nadie se confunda de repositorio más adelante: ponerle en la descripción que
la fuente de verdad pasó a ser `covicen/website`.

---

## Lo que hay que pedir

1. **La invitación al repositorio**, que al 21/09 no llegó. Conviene confirmar a qué cuenta de GitHub la mandaron:
   la de acá es `JuliV08`.
2. **La URL de la rama de desarrollo**, a definir con Gustavo, porque hay que darla de alta en Route 53.
3. **El acceso a Amplify** en la cuenta de producción, limitado a Amplify, que es lo que quedó acordado.
