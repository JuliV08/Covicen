// Pinta en el navegador el estado de la traza que llega en vivo (spec del sistema 3, §8.6): la lista por ruta, lo
// programado y los marcadores del mapa. El armazón lo emite el build (EstadoTraza.astro y MapaTramo.astro); acá solo se
// llenan los huecos.
//
// El texto lo escribe Obras y la web no tiene CSP: todo dato entra como texto (createElement + textContent), nunca como
// HTML. tests/lib/estado-dom.test.ts lo prueba con un <img onerror> y prohíbe en estos archivos las vías de HTML crudo.
import type { EstadoRuta, Incidente, NombreRuta, Programado } from '@/lib/datos/esquemas';
import { estadoPorRuta, FORMA, kmDeAviso, metaDeAviso, SEVERIDAD, type FilaEstado } from '@/lib/estado';
import { fechaHoraLarga, fechaLarga } from '@/lib/formato';
import { puntoEnGeometria, type GeometriaKm } from '@/lib/geometria-km';

const SVG = 'http://www.w3.org/2000/svg';
const CHIP: Record<FilaEstado['nivel'], string> = { corte: 'bg-error', precaucion: 'bg-vial', normal: 'bg-ok' };
type Iconos = (tipo: Incidente['tipo']) => Element | null;

const vaciar = (el: Element): void => {
  el.textContent = '';
};
const mostrar = (el: Element | null, si: boolean): void => {
  if (!el) return;
  if (si) el.removeAttribute('hidden');
  else el.setAttribute('hidden', '');
};
const elemento = (doc: Document, tag: string, clase: string, texto?: string): HTMLElement => {
  const el = doc.createElement(tag);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
};

/** Los íconos de cada tipo llegan del build como <template data-icono="tipo">: no se copian los dibujos de lucide acá. */
const iconosDe = (seccion: Element): Iconos => {
  const plantillas = new Map(
    [...seccion.querySelectorAll<HTMLTemplateElement>('template[data-icono]')].map((t) => [t.dataset.icono, t]),
  );
  return (tipo) => {
    const svg = plantillas.get(tipo)?.content.firstElementChild;
    return svg ? (svg.cloneNode(true) as Element) : null;
  };
};

/** Un aviso: el título (o la línea de km, sentido y hora) en negrita, después lo demás y el desvío en su línea. */
const itemAviso = (doc: Document, i: Incidente, iconos: Iconos, antes?: string): HTMLElement => {
  const li = elemento(doc, 'li', 'flex gap-3 text-sm');
  const icono = iconos(i.tipo);
  if (icono) li.append(icono);
  const cuerpo = elemento(doc, 'div', '');
  const meta = [antes, metaDeAviso(i)].filter(Boolean).join(' · ');
  const principal = i.titulo ?? meta;
  if (principal) cuerpo.append(elemento(doc, 'p', 'font-semibold text-texto', principal));
  if (i.titulo && meta) cuerpo.append(elemento(doc, 'p', 'text-texto-2', meta));
  cuerpo.append(elemento(doc, 'p', 'text-texto-2', i.descripcion));
  if (i.desvio) {
    const desvio = elemento(doc, 'p', 'text-texto');
    desvio.append(elemento(doc, 'span', 'font-semibold', 'Desvío:'), doc.createTextNode(` ${i.desvio}`));
    cuerpo.append(desvio);
  }
  li.append(cuerpo);
  return li;
};

/** Reemplaza la lista por una fila por ruta, con su chip, la cuenta de avisos y los avisos debajo. */
export function pintarLista(lista: HTMLElement, filas: FilaEstado[], iconos: Iconos): void {
  const doc = lista.ownerDocument;
  vaciar(lista);
  for (const f of filas) {
    const li = elemento(doc, 'li', 'py-4');
    li.dataset.ruta = f.ruta;
    li.dataset.nivel = f.nivel;
    const cabeza = elemento(doc, 'div', 'flex items-center gap-3');
    const chip = elemento(doc, 'span', `chip h-3 w-3 shrink-0 rounded-full ${CHIP[f.nivel]}`);
    chip.setAttribute('aria-hidden', 'true');
    const n = f.incidentes.length;
    cabeza.append(
      chip,
      elemento(doc, 'span', 'font-extrabold text-texto', f.ruta),
      elemento(doc, 'span', 'text-sm text-texto-2', n > 0 ? `${f.etiqueta} · ${n} ${n === 1 ? 'aviso' : 'avisos'}` : f.etiqueta),
    );
    li.append(cabeza);
    if (n > 0) {
      const avisos = elemento(doc, 'ul', 'mt-3 flex flex-col gap-3 pl-6');
      for (const i of f.incidentes) avisos.append(itemAviso(doc, i, iconos));
      li.append(avisos);
    }
    lista.append(li);
  }
}

/** Reemplaza la lista de lo programado de los próximos 7 días: cada jornada con su ruta y su fecha delante. */
export function pintarProgramados(lista: HTMLElement, programados: Programado[], iconos: Iconos): void {
  const doc = lista.ownerDocument;
  vaciar(lista);
  for (const p of programados) lista.append(itemAviso(doc, p, iconos, `${p.ruta} · ${fechaLarga(p.fecha)}`));
}

/** Vacía la capa y pone un marcador por aviso ubicable: en su km, o en el punto medio si es un tramo. La severidad va en
 *  la forma y en el <title>, no solo en el color. Un aviso sin km, o de una ruta sin geometría, no va al mapa. */
export function pintarMarcadores(capa: SVGGElement, incidentes: Incidente[], geo: GeometriaKm): void {
  const doc = capa.ownerDocument;
  vaciar(capa);
  for (const i of incidentes) {
    if (i.km === null) continue;
    const km = i.kmHasta != null ? (i.km + i.kmHasta) / 2 : i.km;
    const p = puntoEnGeometria(geo, i.ruta, km);
    if (!p) continue;
    const g = doc.createElementNS(SVG, 'g');
    g.setAttribute('class', 'incidente');
    g.setAttribute('role', 'img');
    g.setAttribute('data-severidad', i.severidad);
    g.setAttribute('transform', `translate(${p.x} ${p.y})`);
    const titulo = doc.createElementNS(SVG, 'title');
    titulo.textContent = `${SEVERIDAD[i.severidad]} — ${i.ruta} ${kmDeAviso(i)}: ${i.descripcion}`;
    const forma = doc.createElementNS(SVG, 'path');
    forma.setAttribute('d', FORMA[i.severidad]);
    forma.setAttribute('class', 'incidente-forma');
    forma.setAttribute('stroke', 'var(--color-fondo)');
    forma.setAttribute('stroke-width', '1.5');
    forma.setAttribute('stroke-linejoin', 'round');
    const punto = doc.createElementNS(SVG, 'circle');
    punto.setAttribute('cy', '1');
    punto.setAttribute('r', '1.4');
    punto.setAttribute('fill', 'var(--color-fondo)');
    g.append(titulo, forma, punto);
    capa.append(g);
  }
}

const rutasDe = (seccion: HTMLElement): NombreRuta[] => {
  try {
    const r: unknown = JSON.parse(seccion.dataset.rutas ?? '[]');
    return Array.isArray(r) ? (r.filter((x) => typeof x === 'string') as NombreRuta[]) : [];
  } catch {
    return [];
  }
};

/** Todo lo que se hace con una respuesta. Sin datos (`null` o `disponible: false`), el mensaje con el 140 y nada más:
 *  nunca «Sin avisos», que diría que la ruta está libre sin saberlo. */
export function aplicarEstado(seccion: HTMLElement, capa: SVGGElement | null, estado: EstadoRuta | null, geo: GeometriaKm): void {
  const lista = seccion.querySelector<HTMLElement>('[data-estado-lista]');
  if (!lista) return;
  const error = seccion.querySelector('[data-estado-error]');
  const programados = seccion.querySelector('[data-estado-programados]');
  const listaProgramados = seccion.querySelector<HTMLElement>('[data-estado-programados-lista]');
  const actualizado = seccion.querySelector('[data-estado-actualizado]');

  if (!estado || !estado.disponible) {
    vaciar(lista);
    if (listaProgramados) vaciar(listaProgramados);
    if (capa) vaciar(capa);
    mostrar(programados, false);
    mostrar(actualizado, false);
    mostrar(error, true);
    return;
  }

  const iconos = iconosDe(seccion);
  mostrar(error, false);
  pintarLista(lista, estadoPorRuta(estado, rutasDe(seccion)), iconos);
  const proximos = estado.programados ?? [];
  if (listaProgramados) pintarProgramados(listaProgramados, proximos, iconos);
  mostrar(programados, proximos.length > 0);
  if (capa) pintarMarcadores(capa, estado.incidentes ?? [], geo);
  if (actualizado) {
    actualizado.textContent = estado.actualizado ? `Última actualización: ${fechaHoraLarga(new Date(estado.actualizado))}` : '';
    mostrar(actualizado, Boolean(estado.actualizado));
  }
}
