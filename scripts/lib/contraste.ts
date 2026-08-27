// Ratio de contraste WCAG 2.1 entre dos colores hex (#RRGGBB).
const canal = (v: number): number => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const luminancia = (hex: string): number => {
  const h = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Color hex inválido: ${hex}`);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
};

export const contraste = (a: string, b: string): number => {
  const la = luminancia(a);
  const lb = luminancia(b);
  const [claro, oscuro] = la >= lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (oscuro + 0.05);
};

/** Devuelve { nombre: '#HEX' } para cada `--color-<nombre>: #hex` del CSS. Ignora valores no hex. */
export const leerTokens = (css: string): Record<string, string> => {
  const tokens: Record<string, string> = {};
  for (const m of css.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[m[1]!] = m[2]!.toUpperCase();
  }
  return tokens;
};
