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
  // Spec §10.1: la lista de incidentes lleva "ícono por tipo, km, sentido, descripción y hora".
  it('muestra la hora del incidente cuando el dato trae desde (y el rango cuando trae hasta)', async () => {
    const estado = await fuenteLocalJson.estadoRutas();
    expect(estado.incidentes?.filter((i) => i.desde).length).toBeGreaterThan(0); // la muestra del repo ejercita el caso
    const html = await (await AstroContainer.create()).renderToString(EstadoTraza, { props: { estado, rutas: ['RN 9', 'RN 19', 'RN 34'] } });
    expect(html).toContain('desde las 07:40');
    expect(html).toContain('de 06:00 a 18:00');
  });
  it('un incidente sin desde no inventa hora', async () => {
    const estado = { ...(await fuenteLocalJson.estadoRutas()), incidentes: [{ ruta: 'RN 9' as const, km: 400, tipo: 'obra' as const, severidad: 'precaucion' as const, sentido: 'ambos' as const, descripcion: 'Bacheo' }] };
    const html = await (await AstroContainer.create()).renderToString(EstadoTraza, { props: { estado, rutas: ['RN 9'] } });
    expect(html).toContain('km 400');
    expect(html).not.toContain('desde las');
  });
  it('con datos reales (ejemplo=false) no muestra el cartel', async () => {
    const estado = { ...(await fuenteLocalJson.estadoRutas()), ejemplo: false };
    const html = await (await AstroContainer.create()).renderToString(EstadoTraza, { props: { estado, rutas: ['RN 9'] } });
    expect(html).not.toContain('Datos de ejemplo');
  });
});
