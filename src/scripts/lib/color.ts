// Colores para canvas, leídos de los tokens del tema activo. Es el ÚNICO módulo que arma cadenas rgb (ver tests/styles/colores-fijos.test.ts).
export type Rgb = { r: number; g: number; b: number };
export type Color = Rgb & { a: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** #RRGGBB (con o sin #, con espacios) → {r,g,b}. Cualquier otra cosa cae a gris medio: un token mal leído no rompe el canvas. */
export const hexARgb = (hex: string): Rgb => {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return { r: 128, g: 128, b: 128 };
  const n = parseInt(m[1]!, 16);
  return { r: n >> 16, g: (n >> 8) & 255, b: n & 255 };
};

/** Valor actual de un token `--color-*` del <html> (cambia con data-tema). Solo para tokens hex. */
export const colorDeToken = (nombre: string): Rgb => hexARgb(getComputedStyle(document.documentElement).getPropertyValue(nombre));

export const conAlfa = ({ r, g, b }: Rgb, a: number): string => `rgba(${r},${g},${b},${a.toFixed(3)})`;

export const mezcla = (a: Color, b: Color, t: number): string =>
  conAlfa({ r: Math.round(lerp(a.r, b.r, t)), g: Math.round(lerp(a.g, b.g, t)), b: Math.round(lerp(a.b, b.b, t)) }, lerp(a.a, b.a, t));
