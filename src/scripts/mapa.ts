// Mapa interactivo: al tocar (o Enter sobre) una estación se muestra solo su tarjeta y la estación queda marcada.
// Sin JS el enlace lleva a la página de la estación y todas las tarjetas quedan visibles: esto es solo mejora.
//
// Fase C (05/10/2026): además, el auto viaja hasta la estación elegida por el camino más corto de la red (lib/red.ts,
// sin dependencias: lib/tramo.ts traería el esquema de datos al navegador). La ficha cambia en el acto, sin esperar al
// auto. Si la estación queda para atrás, el auto hace una U; nunca va marcha atrás. Frena antes del peaje para no tapar
// el punto de estado, y al llegar el halo late una vez. Con «reducir movimiento» aparece en la estación, sin viajar.
import { caminoEntre, continuarDesde, duracionViaje, ESTACIONADO, posicionEn, puntosDe, recorrido, suave, type Muestra, type Red } from '@/lib/red';

const reducirMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// La posición que dejó el componente en el atributo: translate(x y) rotate(a).
const leerPosicion = (auto: SVGGElement): Muestra | null => {
  const m = /translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)/.exec(auto.getAttribute('transform') ?? '');
  return m ? { x: Number(m[1]), y: Number(m[2]), angulo: Number(m[3]), d: 0 } : null;
};

const montar = (raiz: HTMLElement) => {
  const balizas = [...raiz.querySelectorAll<SVGAElement>('[data-estacion]')];
  const tarjetas = [...raiz.querySelectorAll<HTMLElement>('[data-tarjeta-estacion]')];
  if (!balizas.length || !tarjetas.length) return;
  const elegir = (slug: string) => {
    tarjetas.forEach((t) => { t.hidden = t.dataset.tarjetaEstacion !== slug; });
    balizas.forEach((b) => { if (b.dataset.estacion === slug) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
  };

  const svg = raiz.querySelector<SVGSVGElement>('svg[data-red]');
  const auto = raiz.querySelector<SVGGElement>('[data-auto]');
  // Las rutas se dibujan una vez, cuando el mapa entra en pantalla (el CSS las esconde mientras data-dibujo sea
  // «espera»). Con «reducir movimiento» no se toca nada: quedan dibujadas.
  if (svg && !reducirMovimiento() && 'IntersectionObserver' in window) {
    svg.dataset.dibujo = 'espera';
    const observador = new IntersectionObserver((entradas) => {
      if (!entradas.some((e) => e.isIntersecting)) return;
      svg.dataset.dibujo = 'listo';
      observador.disconnect();
    }, { threshold: 0.25 });
    observador.observe(svg);
  }
  const red: Red | null = svg?.dataset.red ? JSON.parse(svg.dataset.red) : null;
  let estacion = auto?.dataset.estacionAuto ?? '';
  let posicion = auto ? leerPosicion(auto) : null;
  // El viaje en curso: por dónde va (camino y muestras) y cuánto lleva recorrido.
  let viaje: { camino: string[]; muestras: Muestra[]; recorrido: number } | null = null;
  let cuadro = 0;

  const ubicar = (m: Muestra) => {
    auto?.setAttribute('transform', `translate(${m.x.toFixed(2)} ${m.y.toFixed(2)}) rotate(${m.angulo.toFixed(1)})`);
    posicion = m;
  };
  const latir = (slug: string) => {
    const b = balizas.find((x) => x.dataset.estacion === slug);
    if (!b || reducirMovimiento()) return;
    b.classList.remove('llegada');
    void b.getBoundingClientRect(); // reinicia la animación si ya estaba puesta
    b.classList.add('llegada');
    b.addEventListener('animationend', () => b.classList.remove('llegada'), { once: true });
  };

  const viajar = (destino: string) => {
    if (!red || !auto || !posicion) return;
    let camino: string[];
    if (viaje) {
      camino = continuarDesde(red, viaje.camino, viaje.muestras, viaje.recorrido, destino).camino;
    } else {
      if (destino === estacion) return;
      camino = caminoEntre(red, estacion, destino);
    }
    cancelAnimationFrame(cuadro);
    viaje = null;
    if (!camino.length) return;
    // Desde donde está el auto (estacionado antes del peaje, o en medio de un tramo) y por los nodos del camino.
    const muestras = recorrido([{ x: posicion.x, y: posicion.y }, ...puntosDe(red, camino)], { rumbo: posicion.angulo });
    const fin = Math.max(0, muestras[muestras.length - 1]!.d - ESTACIONADO);
    if (reducirMovimiento()) {
      ubicar(posicionEn(muestras, fin));
      estacion = destino;
      return;
    }
    const duracion = duracionViaje(fin);
    const arranque = performance.now();
    const actual = { camino, muestras, recorrido: 0 };
    viaje = actual;
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - arranque) / duracion);
      actual.recorrido = suave(t) * fin;
      ubicar(posicionEn(muestras, actual.recorrido));
      if (t < 1) {
        cuadro = requestAnimationFrame(paso);
        return;
      }
      viaje = null;
      estacion = destino;
      latir(destino);
    };
    cuadro = requestAnimationFrame(paso);
  };

  balizas.forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    elegir(b.dataset.estacion!);
    viajar(b.dataset.estacion!);
  }));
  const inicial = balizas.find((b) => b.dataset.estacion === estacion) ?? balizas.find((b) => b.dataset.estadoOperativo === 'operativa') ?? balizas[0]!;
  elegir(inicial.dataset.estacion!);
};
const iniciar = () => document.querySelectorAll<HTMLElement>('[data-mapa-interactivo]:not([data-montado])').forEach((r) => { r.dataset.montado = ''; montar(r); });
document.addEventListener('astro:page-load', iniciar);

export {};
