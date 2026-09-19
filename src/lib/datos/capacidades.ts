/** Lo que depende de sistemas que hoy no existen. Encender = true + implementar en fuentes/api.ts. */
export const capacidades = {
  estadoRutasEnVivo: false,
  oficinaVirtual: false,
  ticketingReclamos: false,
  portalProveedores: false,
  canalEticoAnonimo: false,
} as const;
export type Capacidad = keyof typeof capacidades;
