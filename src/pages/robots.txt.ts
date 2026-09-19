import type { APIRoute } from 'astro';
import { config } from '@/lib/config';

export const GET: APIRoute = () => {
  const cuerpo = config.indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${config.sitio}${config.base}sitemap-index.xml\n`
    : `User-agent: *\nDisallow: /\n`;
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
