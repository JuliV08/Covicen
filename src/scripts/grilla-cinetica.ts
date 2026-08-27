// Grilla cinética: nodos cada 55 px unidos por líneas; se deforman hacia el puntero (radio 260, fuerza 24)
// y las ondas de cada clic los empujan. Colores de la landing (acento celeste sobre navy).
const CELDA = 55, RADIO = 260, FUERZA = 24, PUNTOS = 28, SUAVE = 0.35; // SUAVE 0.35: sigue al puntero sin retraso perceptible (la referencia usaba 0.08 y quedaba atrás)
const BASE = { r: 255, g: 255, b: 255, a: 0.11 };
const ACTIVA = { r: 104, g: 188, b: 225, a: 0.9 };
const GLOW = '104,188,225';
type Onda = { x: number; y: number; radio: number; opacidad: number; nacida: number };
type Color = { r: number; g: number; b: number; a: number };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mezcla = (a: Color, b: Color, t: number) => `rgba(${Math.round(lerp(a.r, b.r, t))},${Math.round(lerp(a.g, b.g, t))},${Math.round(lerp(a.b, b.b, t))},${lerp(a.a, b.a, t).toFixed(3)})`;
const suavizar = (t: number) => t * t * (3 - 2 * t);

const montar = (canvas: HTMLCanvasElement, interactivo: boolean) => {
  const seccion = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!seccion || !ctx) return;
  let w = 0, h = 0;
  const puntero = { x: -9999, y: -9999 };
  const objetivo = { x: -9999, y: -9999 };
  const ondas: Onda[] = [];
  let visible = false, animando = false, ultimoQuieto = 0;

  const medir = () => {
    w = seccion.clientWidth; h = seccion.clientHeight;
    canvas.width = w; canvas.height = h; // DPR 1 a propósito: es un fondo, y así el costo es mínimo
    dibujar(performance.now());
  };

  const desplazar = (x: number, y: number, c: number, f: number, cols: number, filas: number, t: number) => {
    const bordeC = Math.min(c / 1.5, (cols - 1 - c) / 1.5, 1);
    const bordeF = Math.min(f / 1.5, (filas - 1 - f) / 1.5, 1);
    const borde = bordeC * bordeC * bordeF * bordeF;
    const dx = x - puntero.x, dy = y - puntero.y;
    const dist = Math.hypot(dx, dy);
    const proximidad = Math.max(0, 1 - dist / RADIO) * borde;
    let ox = 0, oy = 0;
    for (const o of ondas) {
      const ux = x - o.x, uy = y - o.y;
      const d = Math.hypot(ux, uy) - o.radio;
      if (Math.abs(d) < 55) {
        const fuerza = (1 - Math.abs(d) / 55) * o.opacidad * 18 * borde;
        const ang = Math.atan2(uy, ux);
        const signo = d < 0 ? 1 : -1;
        ox += Math.cos(ang) * fuerza * signo; oy += Math.sin(ang) * fuerza * signo;
      }
    }
    if (dist < RADIO && dist > 0 && borde > 0) {
      const p = dist / RADIO;
      const s = (p < 0.01 ? 0 : (1 - p) * (1 - p) * Math.min(1, dist / 60)) * FUERZA * borde;
      const ang = Math.atan2(dy, dx);
      return { x: x - Math.cos(ang) * s + ox, y: y - Math.sin(ang) * s + oy, proximidad };
    }
    void t;
    return { x: x + ox, y: y + oy, proximidad };
  };

  const dibujar = (t: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    for (let x = PUNTOS / 2; x < w; x += PUNTOS) for (let y = PUNTOS / 2; y < h; y += PUNTOS) { ctx.beginPath(); ctx.arc(x, y, 0.7, 0, Math.PI * 2); ctx.fill(); }
    for (let i = ondas.length - 1; i >= 0; i--) {
      const o = ondas[i]!;
      const edad = (t - o.nacida) / 1000;
      o.radio = Math.max(0, edad * 400); o.opacidad = Math.max(0, 1 - edad * 1.2);
      if (o.opacidad <= 0) ondas.splice(i, 1);
    }
    const cols = Math.max(2, Math.ceil(w / CELDA)) + 1, filas = Math.max(2, Math.ceil(h / CELDA)) + 1;
    const pasoX = w / (cols - 1), pasoY = h / (filas - 1);
    const nodos: { x: number; y: number; proximidad: number }[][] = [];
    for (let f = 0; f < filas; f++) { nodos[f] = []; for (let c = 0; c < cols; c++) nodos[f]![c] = desplazar(c * pasoX, f * pasoY, c, f, cols, filas, t); }
    const segmento = (a: { x: number; y: number; proximidad: number }, b: { x: number; y: number; proximidad: number }) => {
      const s = suavizar((a.proximidad + b.proximidad) / 2);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = mezcla(BASE, ACTIVA, s); ctx.lineWidth = lerp(0.8, 1.5, s); ctx.stroke();
    };
    for (let f = 0; f < filas; f++) for (let c = 0; c < cols - 1; c++) segmento(nodos[f]![c]!, nodos[f]![c + 1]!);
    for (let c = 0; c < cols; c++) for (let f = 0; f < filas - 1; f++) segmento(nodos[f]![c]!, nodos[f + 1]![c]!);
    for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) {
      const n = nodos[f]![c]!;
      const s = suavizar(n.proximidad);
      const r = lerp(1.8, 3.2, s);
      if (s > 0.3) {
        const R = r + lerp(0, 6, (s - 0.3) / 0.7);
        const g = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, R);
        g.addColorStop(0, `rgba(${GLOW},${(s * 0.3).toFixed(3)})`); g.addColorStop(1, `rgba(${GLOW},0)`);
        ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = mezcla({ r: 255, g: 255, b: 255, a: 0.2 }, { ...ACTIVA, a: 1 }, s); ctx.fill();
    }
    for (const o of ondas) { ctx.beginPath(); ctx.arc(o.x, o.y, o.radio, 0, Math.PI * 2); ctx.strokeStyle = `rgba(${GLOW},${(o.opacidad * 0.28).toFixed(3)})`; ctx.lineWidth = 1.5; ctx.stroke(); }
  };

  const cuadro = (t: number) => {
    animando = true;
    puntero.x = lerp(puntero.x, objetivo.x, SUAVE); puntero.y = lerp(puntero.y, objetivo.y, SUAVE);
    dibujar(t);
    const quieto = Math.abs(puntero.x - objetivo.x) < 0.5 && Math.abs(puntero.y - objetivo.y) < 0.5 && ondas.length === 0;
    if (!visible || (quieto && t - ultimoQuieto > 300)) { animando = false; return; }
    if (!quieto) ultimoQuieto = t;
    requestAnimationFrame(cuadro);
  };
  const despertar = () => { if (visible && !animando) requestAnimationFrame(cuadro); };

  new ResizeObserver(medir).observe(seccion);
  new IntersectionObserver(([en]) => { visible = !!en?.isIntersecting; despertar(); }, { rootMargin: '10% 0px' }).observe(seccion);
  if (!interactivo) return;
  seccion.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); objetivo.x = e.clientX - r.left; objetivo.y = e.clientY - r.top; despertar(); }, { passive: true });
  seccion.addEventListener('pointerleave', () => { objetivo.x = -9999; objetivo.y = -9999; despertar(); });
  seccion.addEventListener('click', (e) => { const r = canvas.getBoundingClientRect(); ondas.push({ x: e.clientX - r.left, y: e.clientY - r.top, radio: 0, opacidad: 1, nacida: performance.now() }); despertar(); });
};

const iniciar = () => {
  const interactivo = matchMedia('(hover: hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll<HTMLCanvasElement>('canvas[data-grilla]:not([data-montada])').forEach((c) => { c.dataset.montada = ''; montar(c, interactivo); });
};
document.addEventListener('astro:page-load', iniciar);

export {};
