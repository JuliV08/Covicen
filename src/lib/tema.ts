/** Tema visual del sitio. El cliente elige el default cambiando TEMA_POR_DEFECTO ('sistema' sigue la preferencia del aparato).
 *  Único lugar del código con colores fijos fuera de tokens.css: el theme-color es el fondo de cada tema. */
export type Tema = 'oscuro' | 'claro';
export type PreferenciaTema = Tema | 'sistema';

export const TEMA_POR_DEFECTO: PreferenciaTema = 'oscuro';
export const CLAVE_TEMA = 'covicen:tema';
export const COLOR_TEMA: Record<Tema, string> = { oscuro: '#0B1526', claro: '#EEF1F4' };

export const esTema = (v: unknown): v is Tema => v === 'oscuro' || v === 'claro';

/** Lo guardado si es válido; si no, el default; 'sistema' se resuelve con prefers-color-scheme. */
export const resolverTema = (guardado: string | null, porDefecto: PreferenciaTema, prefiereClaro: boolean): Tema => {
  if (esTema(guardado)) return guardado;
  if (porDefecto === 'sistema') return prefiereClaro ? 'claro' : 'oscuro';
  return porDefecto;
};

export const otroTema = (t: Tema): Tema => (t === 'oscuro' ? 'claro' : 'oscuro');

/** Tema que se renderiza en el HTML estático (el que ve un cliente sin JS o antes del snippet). */
export const temaInicial = (porDefecto: PreferenciaTema = TEMA_POR_DEFECTO): Tema => (porDefecto === 'claro' ? 'claro' : 'oscuro');
