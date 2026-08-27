// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// .env no se carga en la config: hay que leerlo a mano.
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');
const site = env.PUBLIC_SITE_URL || 'http://localhost:4321';
const base = env.PUBLIC_BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
