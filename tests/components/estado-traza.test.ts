import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import EstadoTraza from '@/components/EstadoTraza.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('EstadoTraza', () => {
  it('con los datos de ejemplo del repo: tres rutas, cartel de ejemplo, última actualización', async () => {
    const estado = await fuenteLocalJson.estadoRutas();
    const html = await (await AstroContainer.create()).renderToString(EstadoTraza, { props: { estado, rutas: ['RN 9', 'RN 19', 'RN 34'] } });
    expect(html.match(/data-ruta="/g)?.length).toBe(3);
    expect(html).toContain('Datos de ejemplo');
    expect(html).toContain('Última actualización');
    expect(html).toContain('data-nivel="precaucion"');
  });
  it('con datos reales (ejemplo=false) no muestra el cartel', async () => {
    const estado = { ...(await fuenteLocalJson.estadoRutas()), ejemplo: false };
    const html = await (await AstroContainer.create()).renderToString(EstadoTraza, { props: { estado, rutas: ['RN 9'] } });
    expect(html).not.toContain('Datos de ejemplo');
  });
});
