# Prompts de imágenes atmosféricas — Covicen

Las imágenes son opcionales: el sitio se ve terminado sin ellas. Cuando existan, se guardan en
`src/assets/atmosfera/<nombre>.jpg` (o `.png` / `.webp`) y el build las optimiza a AVIF en tres anchos. Peso objetivo del original: ≤ 2 MB, lado mayor 2400 px. El componente `ImagenAtmosfera` las oscurece (`brightness(0.55)`) y desatura un poco para que el texto siempre gane.

Reglas comunes (pegar al final de cada prompt):

> No text, no logos, no watermarks, no people's faces, no readable license plates. Photorealistic, editorial documentary style, shot on a full-frame camera, 35mm lens, long exposure where noted. Color palette anchored in deep navy (#0B1526, #16304E), cool cyan highlights (#68BCE1) and a single warm accent of road-marking yellow (#F0C419). Low overall brightness: the image will sit under UI text, so keep the upper-left quadrant dark and uncluttered. No HDR look, no oversaturation, subtle film grain acceptable.

## 1. `hero-ruta-nocturna` — 16:9, 2400×1350

> Iteración 2 (2026-08-27) — **es la que está en uso** (`src/assets/atmosfera/hero-ruta-nocturna.jpg`, 1672×941, JPG q90). La primera versión trajo light trails, un puente con rampas sin sentido y un cartel con texto inventado: los tres quedan prohibidos abajo. Ojo: el parallax 2.5D del hero usa un mapa de profundidad procedural (`scripts/generar-profundidad.py`, con `HORIZONTE = 0.595`) y el punto de fuga `vp={[0.78, 0.595]}` en `Hero.astro`; si se regenera la foto, hay que remedir ambos.

Night photograph of a straight, divided four-lane highway (two lanes per direction, low concrete median barrier with a steel guardrail) crossing the flat Argentine Pampas, seen from about three metres above the pavement on the right shoulder, receding in one-point perspective to a low horizon. Fresh dark asphalt; crisp white dashed lane lines; a continuous yellow edge line along the median; small reflective road studs catching the light. The road is lit only by moonlight and a faint cyan glow on the horizon; no street lamps. Two vehicles far in the distance as small, sharp points of light (white headlights on the left carriageway, red tail lights on the right), motionless. Flat dark fields on both sides, a wire fence, a thin line of distant trees; clear sky with a few stars, deep navy fading to black at the top. Composition: the road enters from the bottom-right corner and vanishes at the upper-centre-right; the upper-left third of the frame is empty dark sky for headline text.

Strict exclusions: no long exposure, no light trails or motion streaks of any kind; no bridge, overpass, ramp or interchange; no signs, no text, no letters, no numbers; no lamp posts; no buildings; no people; no vehicles in the foreground. Photorealistic, single exposure, tripod, 35 mm, natural grain, no HDR.

## 2. `obras-nocturnas` — 21:9, 2520×1080

Night road-works scene on a highway shoulder: a compact asphalt paver and a roller under portable LED work lights, yellow-and-black barrier boards and orange cones in the foreground receding into darkness, wet asphalt reflecting cyan light. Workers only as distant silhouettes in high-visibility vests, no faces. Wide cinematic crop, horizon low, sky deep navy. Mood: work in progress, controlled, safe.

## 3. `consorcio` — 4:3, 2000×1500 (opcional, Quiénes somos)

Dusk photograph of a concrete bridge deck over a rural highway under construction, formwork and rebar in the foreground, a single tower crane against a navy-blue evening sky with the last cyan light on the horizon. No text or signage. Mood: serious engineering, long-term.

## 4. Portadas de novedades — 3:2, 1800×1200 (opcional, una por post)

- `novedad-adjudicacion`: Close-up of an official document on a dark desk, out of focus, with a fountain pen; only cool light from a window. No readable text.
- `novedad-5-de-octubre`: A toll gantry (free-flow, no barriers) over a highway at blue hour, cameras and antennas visible, one lane lit by cyan light, yellow lane markings sharp in the foreground.

## Cómo enchufarlas

1. Guardar el archivo con el nombre exacto en `src/assets/atmosfera/`.
2. `pnpm build`: Astro genera los AVIF. Nada más que hacer: `Hero` y `Obras` ya tienen el slot.
3. Si una imagen no convence, borrarla: el layout vuelve al fondo vectorial sin tocar código.
