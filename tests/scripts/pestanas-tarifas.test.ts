import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';

// pestanas-tarifas.ts es un script de navegador: se prueba con un DOM de linkedom, como la cinta. El HTML de la página
// trae enlaces y los tres cuadros a la vista; el script lo vuelve pestañas (05/10/2026).
const marcado = `<div data-pestanas>
  <nav aria-label="Estaciones"><div class="pestanas" data-pestanas-lista><span class="pestanas-marca"></span>
    <a href="#carcarana" data-pestana="carcarana">Carcarañá</a><a href="#james-craik" data-pestana="james-craik">James Craik</a><a href="#franck" data-pestana="franck">Franck</a>
  </div></nav>
  <div><div id="carcarana">C</div><div id="james-craik">J</div><div id="franck">F</div></div>
</div>`;

const montar = async (hash = '') => {
  const { document, window } = parseHTML(`<!doctype html><html><body>${marcado}</body></html>`);
  let activo: Element | null = null;
  Object.defineProperty(document, 'activeElement', { get: () => activo, configurable: true });
  window.HTMLElement.prototype.focus = function () { activo = this; };
  window.HTMLElement.prototype.scrollIntoView = () => {};
  const history = { state: null, replaceState: vi.fn() };
  vi.stubGlobal('document', document);
  vi.stubGlobal('window', window);
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('requestAnimationFrame', (f: () => void) => f());
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('location', { hash });
  vi.stubGlobal('history', history);
  vi.stubGlobal('addEventListener', () => {});
  vi.stubGlobal('removeEventListener', () => {});
  vi.resetModules();
  await import('@/scripts/pestanas-tarifas');
  document.dispatchEvent(new window.Event('astro:page-load'));
  const $ = (s: string) => document.querySelector(s)! as HTMLElement;
  const tab = (slug: string) => $(`[data-pestana="${slug}"]`);
  const visibles = () => ['carcarana', 'james-craik', 'franck'].filter((s) => !$(`#${s}`).hasAttribute('hidden'));
  const tecla = (key: string) => {
    const e = new window.Event('keydown', { bubbles: true });
    Object.assign(e, { key });
    $('[data-pestanas-lista]').dispatchEvent(e);
  };
  return { $, tab, visibles, tecla, history };
};

describe('pestañas de estación en /tarifas/', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('arma el patrón de pestañas y arranca en la primera, con un solo cuadro a la vista', async () => {
    const { $, tab, visibles } = await montar();
    expect($('[data-pestanas-lista]').getAttribute('role')).toBe('tablist');
    expect(tab('franck').getAttribute('role')).toBe('tab');
    expect(tab('franck').getAttribute('aria-controls')).toBe('franck');
    expect($('#franck').getAttribute('role')).toBe('tabpanel');
    expect($('#franck').getAttribute('aria-labelledby')).toBe('pestana-franck');
    expect(tab('carcarana').getAttribute('aria-selected')).toBe('true');
    expect(tab('franck').getAttribute('aria-selected')).toBe('false');
    expect(tab('carcarana').getAttribute('tabindex')).toBe('0');
    expect(tab('franck').getAttribute('tabindex')).toBe('-1');
    expect(visibles()).toEqual(['carcarana']);
  });

  it('el clic elige la estación y deja la dirección con su #', async () => {
    const { tab, visibles, history } = await montar();
    tab('james-craik').dispatchEvent(new (tab('james-craik').ownerDocument.defaultView!.Event)('click', { cancelable: true }));
    expect(visibles()).toEqual(['james-craik']);
    expect(tab('james-craik').getAttribute('aria-selected')).toBe('true');
    expect(history.replaceState).toHaveBeenLastCalledWith(null, '', '#james-craik');
  });

  it('las flechas recorren las pestañas (y dan la vuelta); Inicio y Fin van a los extremos', async () => {
    const { tab, visibles, tecla } = await montar();
    tab('carcarana').focus();
    tecla('ArrowRight');
    expect(visibles()).toEqual(['james-craik']);
    tecla('End');
    expect(visibles()).toEqual(['franck']);
    tecla('ArrowRight');
    expect(visibles()).toEqual(['carcarana']);
    tecla('ArrowLeft');
    expect(visibles()).toEqual(['franck']);
    tecla('Home');
    expect(visibles()).toEqual(['carcarana']);
  });

  // «Ver su cuadro tarifario» desde el mapa llega con /tarifas/#franck.
  it('al llegar con #slug abre esa estación', async () => {
    const { visibles, tab } = await montar('#franck');
    expect(visibles()).toEqual(['franck']);
    expect(tab('franck').getAttribute('tabindex')).toBe('0');
  });
});
