import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import QuienesSomos from '@/pages/quienes-somos.astro';

// 06/10/2026: la verificación de Google Search Console de «https://www.covicen.com.ar/». Google la vuelve a buscar cada
// tanto; si alguien la saca del <head>, la propiedad deja de estar verificada y se pierde el acceso a los informes.
describe('verificación de Google Search Console', () => {
  it('va en el <head> de las páginas', async () => {
    const html = await (await AstroContainer.create()).renderToString(QuienesSomos, { request: new Request('https://covicen.test/quienes-somos/') });
    const head = html.split('</head>')[0] ?? '';
    expect(head).toContain('<meta name="google-site-verification" content="Owc6oPDUvOU5deDKUUflAAT-OyxtQZJW9xMt2mlmxfw">');
  });
});
