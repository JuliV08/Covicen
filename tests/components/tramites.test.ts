import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import Tramites from '@/pages/tramites.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { publicado } from '@/lib/publicado';

// Call del 20/09/2026: la guía tenía que dejar de ser un listado y pasar a guiar. Pedido textual: «qué podés hacer,
// cómo lo hacés, qué documentación necesitás, para que cuando lo inicies, lo inicies completo y no te demore tener
// que estar presentando documentación». Y solo los trámites con fuente oficial verificable.
const render = async () => (await AstroContainer.create()).renderToString(Tramites, { request: new Request('https://covicen.test/tramites/') });

describe('/tramites/', () => {
  it('cada trámite publicado dice qué es, qué necesitás y cómo se hace', async () => {
    const { document } = parseHTML(await render());
    const fichas = [...document.querySelectorAll('article[id]')];
    expect(fichas.length, 'no hay ninguna ficha de trámite').toBeGreaterThan(0);
    for (const ficha of fichas) {
      const id = ficha.getAttribute('id');
      const texto = ficha.textContent ?? '';
      expect(texto.includes('Quién puede hacerlo'), `${id}: falta quién puede`).toBe(true);
      expect(texto.includes('Qué necesitás'), `${id}: falta la documentación`).toBe(true);
      expect(texto.includes('Cómo se hace'), `${id}: faltan los pasos`).toBe(true);
      // El "qué es" es opcional en el contrato, pero ningún trámite publicado puede salir sin él.
      const queEs = ficha.querySelector('p.text-lg');
      expect(queEs?.textContent?.trim().length ?? 0, `${id}: falta el "qué es"`).toBeGreaterThan(20);
    }
  });

  // La documentación va ANTES de los pasos: es el orden en que la necesita quien va a hacer el trámite, y es
  // literalmente lo que pidió el gerente. Si alguien reordena las columnas, esto lo agarra.
  it('la documentación se lee antes que los pasos', async () => {
    const html = await render();
    expect(html.indexOf('Qué necesitás')).toBeLessThan(html.indexOf('Cómo se hace'));
  });

  it('solo se publican los trámites con fuente oficial verificable', async () => {
    const { document } = parseHTML(await render());
    const ids = [...document.querySelectorAll('article[id]')].map((a) => a.getAttribute('id'));
    expect(ids).toEqual(['exencion-discapacidad', 'exencion-malvinas', 'alta-telepase']);
    expect(publicado.tramiteVecinosFrentistas, 'se prendió el interruptor: este test mide el otro estado').toBe(false);
  });

  // Los dos que se esconden NO se borran del JSON: son lo que vuelve cuando el área confirme el beneficio.
  it('los trámites escondidos siguen versionados', async () => {
    const ids = (await fuenteLocalJson.tramites()).map((t) => t.id);
    expect(ids).toContain('tarifa-diferencial-vecinal');
    expect(ids).toContain('tarifa-diferencial-docente');
  });

  // Los tres publicados enlazan a su sitio oficial, y el select del formulario se arma con la lista filtrada: si no,
  // ofrecería iniciar un trámite que la página no explica.
  it('cada trámite enlaza su sitio oficial y el formulario no ofrece los escondidos', async () => {
    const { document } = parseHTML(await render());
    for (const ficha of document.querySelectorAll('article[id]')) {
      expect(ficha.querySelector('a[target="_blank"]'), `${ficha.getAttribute('id')}: sin enlace oficial`).not.toBeNull();
    }
    const opciones = [...document.querySelectorAll('#formulario-tramites select option')].map((o) => o.textContent);
    expect(opciones.some((o) => o?.includes('diferencial')), 'el formulario ofrece un trámite que no está publicado').toBe(false);
  });
});
