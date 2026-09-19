import type { APIRoute } from 'astro';
import { config } from '@/lib/config';

export const GET: APIRoute = () => {
  // `config.indexable` ya contempla la portada: con «Próximamente» publicado es false aunque PUBLIC_INDEXABLE
  // diga true, así que acá alcanza con un solo flag y el robots y el `noindex` de Seo.astro no pueden divergir.
  const cuerpo = config.indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${config.sitio}${config.base}sitemap-index.xml\n`
    : `User-agent: *\nDisallow: /\n`;
  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
