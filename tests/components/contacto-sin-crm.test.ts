import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it, vi } from 'vitest';
import Contacto from '@/pages/contacto.astro';
import Privacidad from '@/pages/privacidad.astro';

// Desde el 01/10/2026 el formulario de reclamos de /contacto/ es el del CRM (Bitrix24). Con `contacto.formularioCrm`
// en null vuelve el propio, y Privacidad vuelve a decir que el sitio no usa seguimiento. Este archivo prueba esa rama
// con el dato en null (mock: vi.mock se eleva por encima de los imports, así que las páginas ya se cargan así).
vi.mock('@/lib/datos', async (original) => {
  const real = await original<typeof import('@/lib/datos')>();
  return { ...real, datos: { ...real.datos, contacto: async () => ({ ...(await real.datos.contacto()), formularioCrm: null }) } };
});

const render = async (Pagina: unknown, url: string) =>
  (await AstroContainer.create()).renderToString(Pagina as never, { request: new Request(`https://covicen.test${url}`) });

describe('sin el formulario del CRM', () => {
  it('/contacto/ vuelve al formulario propio de reclamos, con el mismo id', async () => {
    const html = await render(Contacto, '/contacto/');
    expect(html).not.toContain('data-b24-form');
    expect(html).not.toContain('formulario-crm');
    expect(html).toMatch(/<form[^>]*id="reclamos"/);
    expect(html).toContain('Reclamo, consulta o sugerencia');
  });
  it('/privacidad/ no habla de Bitrix24 y vuelve a negar el seguimiento', async () => {
    const html = await render(Privacidad, '/privacidad/');
    expect(html).not.toContain('Bitrix24');
    expect(html).not.toContain('Formulario de Contacto');
    expect(html).toContain('no usa cookies de terceros ni herramientas de seguimiento');
  });
});
