// Pestañas de estación en /tarifas/ (05/10/2026). El HTML trae enlaces a cada cuadro y los tres cuadros a la vista; esto
// lo vuelve un selector con el patrón de pestañas: role tablist/tab/tabpanel, flechas, Inicio y Fin, y un cuadro por
// vez. Un enlace que llega con #slug (por ejemplo «Ver su cuadro tarifario» desde el mapa) abre esa estación.
const suave = (): ScrollBehavior => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
// Lo que queda colgado de window o de un observer se suelta al volver a iniciar (navegación del ClientRouter).
let soltar: (() => void) | null = null;

const iniciar = () => {
  soltar?.();
  soltar = null;
  const raiz = document.querySelector<HTMLElement>('[data-pestanas]');
  const lista = raiz?.querySelector<HTMLElement>('[data-pestanas-lista]');
  if (!raiz || !lista || raiz.dataset.listo !== undefined) return;
  const pestanas = [...lista.querySelectorAll<HTMLAnchorElement>('[data-pestana]')];
  const paneles = new Map(pestanas.map((p) => [p.dataset.pestana!, document.getElementById(p.dataset.pestana!)]));
  if (pestanas.length < 2 || [...paneles.values()].some((p) => !p)) return;
  raiz.dataset.listo = '';
  lista.setAttribute('role', 'tablist');
  lista.setAttribute('aria-label', 'Estaciones');
  for (const p of pestanas) {
    const slug = p.dataset.pestana!;
    const panel = paneles.get(slug)!;
    p.id = `pestana-${slug}`;
    p.setAttribute('role', 'tab');
    p.setAttribute('aria-controls', slug);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', p.id);
  }

  // La marca que se desliza hasta la pestaña elegida: posición y ancho en variables, el resto lo hace el CSS.
  const ubicarMarca = (p: HTMLElement) => {
    lista.style.setProperty('--marca-x', `${p.offsetLeft}px`);
    lista.style.setProperty('--marca-ancho', `${p.offsetWidth}px`);
  };
  const elegir = (slug: string, { foco = false, url = true } = {}) => {
    for (const p of pestanas) {
      const esta = p.dataset.pestana === slug;
      p.setAttribute('aria-selected', String(esta));
      p.tabIndex = esta ? 0 : -1;
      paneles.get(p.dataset.pestana!)!.hidden = !esta;
      if (esta) {
        ubicarMarca(p);
        if (foco) p.focus();
      }
    }
    if (url) history.replaceState(history.state, '', `#${slug}`);
  };

  for (const p of pestanas) {
    p.addEventListener('click', (e) => { e.preventDefault(); elegir(p.dataset.pestana!); });
  }
  lista.addEventListener('keydown', (e) => {
    const i = pestanas.findIndex((p) => p === document.activeElement);
    if (i < 0) return;
    const destino = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: pestanas.length - 1 }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    elegir(pestanas[(destino + pestanas.length) % pestanas.length]!.dataset.pestana!, { foco: true });
  });

  // Al llegar con #slug, esa estación, y el selector a la vista (el navegador había bajado hasta su cuadro con los tres
  // apilados, y al esconder los otros dos el lugar cambió).
  const deLaUrl = decodeURIComponent(location.hash.slice(1));
  if (paneles.has(deLaUrl)) {
    elegir(deLaUrl, { url: false });
    raiz.scrollIntoView({ block: 'start', behavior: 'auto' });
  } else {
    elegir(pestanas[0]!.dataset.pestana!, { url: false });
  }
  // La marca aparece un cuadro después de ubicarse: si no, la transición la haría viajar desde la izquierda.
  requestAnimationFrame(() => { raiz.dataset.marcaLista = ''; });
  // La marca se reubica si cambia el ancho (las pestañas miden distinto en el celular).
  const ro = new ResizeObserver(() => {
    const elegida = pestanas.find((p) => p.getAttribute('aria-selected') === 'true');
    if (elegida) ubicarMarca(elegida);
  });
  ro.observe(lista);
  const alCambiarHash = () => {
    const slug = decodeURIComponent(location.hash.slice(1));
    if (paneles.has(slug)) { elegir(slug, { url: false }); raiz.scrollIntoView({ block: 'start', behavior: suave() }); }
  };
  addEventListener('hashchange', alCambiarHash);
  soltar = () => { ro.disconnect(); removeEventListener('hashchange', alCambiarHash); };
};
document.addEventListener('astro:page-load', iniciar);

export {};
