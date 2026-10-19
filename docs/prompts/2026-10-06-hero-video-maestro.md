# Prompt maestro — hero en video (día y noche), solo escritorio

> Para pegar en una sesión nueva de Claude Code sobre el repo de Covicen. Escrito el 06/10/2026.

---

**Objetivo:** que el hero de la home, en escritorio, sea un video cinematográfico y premium con una versión de día y otra de noche, y que el botón de tema pase de una a otra con una transición suave, sin que se note el corte. Lo vamos a hacer en dos fases con una pausa en el medio: primero los prompts para Google Flow (yo genero los videos) y después la programación.

**Contexto del proyecto** (leé esto antes de explorar a ciegas):
- `obsidian/Home.md` y los wikilinks que necesites, sobre todo [[Sistema de diseno]] y las entradas del hero (la del 15/09/2026 explica el parallax, el velo y un bug de puntero que no hay que repetir).
- El hero hoy: `src/components/home/Hero.astro`, `src/components/ilustraciones/ParallaxProfundidad.astro`, `src/scripts/parallax-2d.ts`, `src/lib/atmosfera.ts`, el cambio de tema en `src/scripts/tema.ts` y el velo de la disolvencia (`.velo-tema` en `src/styles/global.css`).
- Las dos fotos actuales, mismo encuadre: `src/assets/atmosfera/hero-ruta-diurna.jpg` y `hero-ruta-nocturna.jpg`. Miralas: es la identidad que hay que llevar a video (autopista con guardarraíl en el cantero central, pampa plana, alambrados, hileras de árboles en el horizonte, punto de fuga a la derecha).
- El texto del hero va a la izquierda (etiqueta, título en ~3 renglones, un párrafo y dos botones), con el velo `velo-hero` encima de la foto. El contraste lo mide `tests/components/hero-foto.test.ts`.
- `docs/guia-de-revision.md` (cómo reviso yo) y los agentes del equipo en `.claude/agents/`.

**Skills / subagents a invocar, en orden:**

*Fase 1 — idea y prompts para Flow:*
1. `superpowers:brainstorming`. Clasificalo y decímelo. Después, preguntas de a una para acordar conmigo el concepto. Lo que NO quiero: un video genérico de autos pasando por la ruta, de día y de noche; eso lo saco de YouTube. Tiene que ser impactante, cinematográfico y caro, pero sobrio: nada de show de luces. Traeme 2 o 3 conceptos con su porqué y tu recomendación.
2. Antes de escribir los prompts, averiguá con `WebSearch`/`WebFetch` qué ofrece **hoy** Google Flow (modelo Veo vigente, duración de los clips, resolución, si se puede fijar el primer y el último cuadro, generación desde imagen, edición de imágenes, marca de agua según el plan). No lo des por sabido: cambia seguido. Decime qué confirmaste y de qué fuente.
3. `prompt-engineer` para escribir los prompts. Usá `find-skills` para buscar un skill de prompts de video, Veo o Flow, y si aparece uno, usalo.

*Fase 2 — cuando te pase los videos:*
4. `superpowers:writing-plans` para el plan. Después, `superpowers:executing-plans` o `superpowers:subagent-driven-development`: lo elijo yo cuando me presentes el plan.
5. `ffmpeg` para preparar los videos:
   - sacarles el audio;
   - exportarlos para la web;
   - controlar que la costura del loop no se note, comparando el primer y el último cuadro;
   - sacar los cuadros que hagan falta para medir el contraste y para la imagen de espera.
6. `superpowers:test-driven-development` para toda la lógica: cuándo se carga el video, la sincronía entre los dos, el cambio de tema y qué pasa con movimiento reducido. Hay un patrón para probar scripts de navegador con linkedom en `tests/scripts/marquesina.test.ts`.
7. `ux-bro` solo para tareas mecánicas y bien acotadas. Lo que requiere criterio de diseño o de movimiento lo hacés vos.
8. `superpowers:systematic-debugging` ante cualquier falla, antes de parchear.
9. `rev-bro` para la revisión final, sobre código que no escribió.

Nunca uses agentes `oh-my-claudecode:*`.

**Descubrí lo que falte:** si necesitás una capacidad que no tenés (por ejemplo, para medir contraste sobre cuadros de video), buscala con `find-skills` antes de improvisar.

**Lo que tienen que cumplir los prompts de Flow** (verificalo contra lo que confirmes en el paso 2):
- **Mismo encuadre de día y de noche.** Es lo que hace posible una transición sin corte. Mi idea, que vos tenés que validar:
  1. generar primero una imagen clave de día;
  2. sacar la de noche **editando esa misma imagen**;
  3. animar cada una desde su imagen.

  Si se puede fijar el primer y el último cuadro, usá la misma imagen en los dos y el loop queda perfecto.
- **Cámara.** Fija, o con un movimiento lento idéntico en los dos videos, que se pueda repetir en loop. Nada que salte al volver a empezar.
- **Composición para la web.** La mitad izquierda tranquila y sin detalle fuerte, porque ahí va el texto. El punto de fuga a la derecha, como en la foto actual. Formato 16:9.
- **Argentina real.** Autopista de la pampa húmeda, como la RN 9 entre Rosario y Córdoba. Sin carteles ni texto legible (la IA los deforma), sin logos, patentes ni marcas reconocibles, y sin personas en primer plano.
- **Formato.** La duración y resolución más alta que permita Flow. El audio no hace falta, va sin sonido.
- **Idioma.** Los prompts van en inglés, que es lo que mejor entiende el modelo. Las explicaciones para mí, en castellano.

**Restricciones / Definition of Done:**
- **Dónde trabajar.** En un worktree propio. Antes de crearlo, preguntame de qué rama partir: hay una rama de trabajo con cambios sin publicar. Nunca toques la carpeta principal ni la rama de otra sesión.
- **Solo escritorio.** El celular queda exactamente como está: la foto con su movimiento lento. En el celular no se descarga el video. Tampoco se carga con «ahorro de datos» ni con movimiento reducido: en esos casos va la imagen quieta.
- **Rendimiento.**
  - Lo primero que se pinta sigue siendo una imagen; el video llega después y no mueve nada de lugar.
  - Se pausa cuando sale de pantalla o la pestaña queda en segundo plano.
  - Pesos de los videos acordados conmigo antes de exportar.
  - El JS total no puede pasar de 30 KB gz, que es un control de `pnpm verificar`.
- **La transición.**
  - Los dos videos van sincronizados, así que el cambio de tema es una disolvencia de una escena a la misma escena en otra hora.
  - Integrala con el cambio de tema que ya existe (`tema.ts` y el velo) y decidí con argumentos qué hacer con el velo.
  - Si te parece que vale la pena un clip de transición extra (atardecer o amanecer), proponémelo en la fase 1, con lo que cuesta.
- **Contraste.** El texto tiene que seguir dando 4,5:1 sobre **todos** los cuadros del video, en los dos temas, no solo sobre la imagen de espera. Medilo.
- **Controles.** `pnpm check`, `pnpm test` y `pnpm verificar` en verde. No corras `pnpm verificar:portada` mientras haya un servidor sirviendo `dist`.
- **Para que yo lo mire.** `pnpm dev` no sobrevive en la sesión: armá con `pnpm build` y serví `dist` en local.
- **Commits.** Uno por tarea, con `git add` de rutas explícitas. Nada a Pages ni a producción sin mi OK.
- **Vara visual.** Premium y caro, profesional y llamativo, pero sobrio. Si algo no queda a la altura, se mejora o no va.
- **Cómo hablarme.** En criollo, sin tecnicismos. Todo archivo que me nombres, con la ruta completa de Windows.

**Entregables / formato de salida:**
- *Fase 1:*
  - Un documento en el repo, en `docs/`, con:
    - el concepto elegido y por qué;
    - el prompt de la imagen clave de día y la edición para la de noche;
    - los prompts de los dos videos (y el del clip de transición, si lo acordamos);
    - la configuración exacta que tengo que elegir en Flow;
    - una lista de qué revisar en cada video antes de elegirlo: costura del loop, horizonte idéntico entre día y noche, deformaciones y texto basura.
  - Copiá los prompts también en el chat, en bloques listos para pegar.
  - Una nota en `obsidian/` enlazada desde `Home.md`.
- *Fase 2:* el hero en video funcionando en escritorio, con:
  - los videos exportados en el repo;
  - los tests;
  - la sección de qué mirar en `docs/guia-de-revision.md`;
  - la nota de Obsidian actualizada con lo aprendido.

**Checkpoints de verificación:**
- **Al terminar la fase 1, frená.** Esperá a que yo genere los videos en Flow y te diga dónde los dejé. No empieces a programar sin los videos.
- **Plan.** Antes de ejecutar el plan de la fase 2, presentámelo y esperá mi OK.
- **Antes de decir que algo está listo,** invocá `superpowers:verification-before-completion` y mostrame la evidencia: salida de los tests y de `verificar`, y capturas del hero de día, de noche y en el medio de la transición. No afirmaciones.
