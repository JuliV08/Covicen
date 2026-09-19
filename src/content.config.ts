import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { esquemaNovedadFrontmatter } from '@/lib/datos/esquemas';

const novedades = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/novedades' }),
  schema: esquemaNovedadFrontmatter,
});

export const collections = { novedades };
