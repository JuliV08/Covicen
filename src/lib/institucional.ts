// Sitios institucionales del pie (PETG 61.6 exige DNV, Secretaría de Transporte y Presidencia). Si existe
// src/assets/institucional/<id>.svg (logo oficial, monocromo, currentColor) se usa inline; si no, un lockup tipográfico.
export const enlacesInstitucionales = [
  { id: 'vialidad-nacional', nombre: 'Vialidad Nacional', url: 'https://www.argentina.gob.ar/transporte/vialidad-nacional' },
  { id: 'transporte', nombre: 'Secretaría de Transporte', url: 'https://www.argentina.gob.ar/transporte' },
  { id: 'presidencia', nombre: 'Presidencia de la Nación', url: 'https://www.argentina.gob.ar/' },
  { id: 'red-federal', nombre: 'Red Federal de Concesiones', url: 'https://www.argentina.gob.ar/transporte/vialidad-nacional/red-federal-de-concesiones' },
  { id: 'telepase', nombre: 'TelePASE', url: 'https://www.telepase.com.ar/' },
] as const;

const logos = import.meta.glob<string>('/src/assets/institucional/*.svg', { eager: true, query: '?raw', import: 'default' });

export const logoInstitucional = (id: string): string | undefined =>
  Object.entries(logos).find(([ruta]) => ruta.endsWith(`/${id}.svg`))?.[1];
