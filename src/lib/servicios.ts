// Qué servicios de src/content/servicios.json se publican. Mismo criterio que lib/faq.ts: el filtro vive acá y no en
// la página, así vale para cualquiera que liste servicios, y el candado de verdad es scripts/verificar.ts (10c).
//
// Reunión con el gerente del 01/10/2026: «TelePASE sin costo» y «Sanitarios públicos» quedan «a confirmar».
import type { Servicio } from '@/lib/datos/esquemas';
import { publicado } from '@/lib/publicado';

const ESPERA_CONFIRMACION: Record<string, boolean> = {
  'telepase-gratuito': !publicado.telepaseSinCosto,
  sanitarios: !publicado.sanitariosPublicos,
};

export const serviciosPublicables = (servicios: Servicio[]): Servicio[] => servicios.filter((s) => !ESPERA_CONFIRMACION[s.id]);
