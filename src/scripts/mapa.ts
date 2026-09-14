// Mapa interactivo: al tocar (o Enter sobre) una estación se muestra solo su tarjeta y la estación queda marcada.
// Sin JS el enlace lleva a la página de la estación y todas las tarjetas quedan visibles: esto es solo mejora.
const montar = (raiz: HTMLElement) => {
  const balizas = [...raiz.querySelectorAll<HTMLAnchorElement>('[data-estacion]')];
  const tarjetas = [...raiz.querySelectorAll<HTMLElement>('[data-tarjeta-estacion]')];
  if (!balizas.length || !tarjetas.length) return;
  const elegir = (slug: string) => {
    tarjetas.forEach((t) => { t.hidden = t.dataset.tarjetaEstacion !== slug; });
    balizas.forEach((b) => { if (b.dataset.estacion === slug) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  };
  balizas.forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); elegir(b.dataset.estacion!); }));
  const inicial = balizas.find((b) => b.dataset.estadoOperativo === 'operativa') ?? balizas[0]!;
  elegir(inicial.dataset.estacion!);
};
const iniciar = () => document.querySelectorAll<HTMLElement>('[data-mapa-interactivo]:not([data-montado])').forEach((r) => { r.dataset.montado = ''; montar(r); });
document.addEventListener('astro:page-load', iniciar);

export {};
