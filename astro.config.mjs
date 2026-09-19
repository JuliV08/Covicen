// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { fileURLToPath } from 'node:url';
import { soloPortada } from './scripts/lib/solo-portada.ts';

// .env no se carga en la config: hay que leerlo a mano.
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');
const site = env.PUBLIC_SITE_URL || 'http://localhost:4321';
const base = env.PUBLIC_BASE_PATH || '/';
// El mismo default invertido que src/lib/config.ts: sin la variable se publica solo la portada de «Próximamente».
// Acá se lee otra vez (y no se importa config) porque la config de Astro corre fuera del grafo del sitio.
const sitioCompleto = env.PUBLIC_SITIO_COMPLETO === 'true';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Sin @astrojs/react en v1: su entrypoint de cliente pesa ~60 KB gz aunque no haya islas.
  // Cuando haga falta una isla interactiva: `pnpm astro add react`.
  integrations: [
    // Con la portada sola el sitemap tiene una sola URL: la portada. Sin el filtro listaría las 29 páginas que la
    // integración de abajo borra del build, y sería un índice de páginas que no existen.
    sitemap({ filter: (pagina) => sitioCompleto || new URL(pagina).pathname === base }),
    // Va DESPUÉS de sitemap: las dos podan en `astro:build:done` y los hooks corren en el orden de esta lista, así
    // que el sitemap ya está escrito (y filtrado) cuando esta borra lo que sobra.
    soloPortada(!sitioCompleto),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // `@portada` es lo que renderiza src/pages/index.astro. Se resuelve ACÁ, en la config, y no con un ternario
      // adentro de la página: un `await import()` condicional deja los dos módulos en el grafo de la página, y la
      // portada de «Próximamente» terminaba cargando el CSS de la home (Base.css, Home.css, datos.css). Con el
      // alias entra un solo archivo y la portada se lleva solo su hoja.
      alias: {
        '@portada': fileURLToPath(new URL(sitioCompleto ? './src/components/home/Home.astro' : './src/layouts/Proximamente.astro', import.meta.url)),
      },
    },
  },
});
