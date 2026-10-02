// Cómo se publica cada trámite de src/content/tramites.json mientras un dato suyo espera confirmación.
//
// Reunión con el gerente del 01/10/2026: que TelePASE no le cuesta nada al usuario quedó «a confirmar»
// (publicado.telepaseSinCosto). El trámite «Alta de TelePASE» se sigue publicando —es el trámite—, pero sin las dos
// frases del costo: la segunda oración de «qué es» y el «sin cargo» del último paso. No se reescribe el JSON: el día
// que se confirme, vuelven solas. Si el texto cambia y esto deja de encontrarlas, el candado de scripts/verificar.ts
// (10c) las encuentra en el sitio y frena el build.
import type { Tramite } from '@/lib/datos/esquemas';
import { publicado } from '@/lib/publicado';

export const sinCostoSinConfirmar = (t: Tramite): Tramite =>
  t.id !== 'alta-telepase' || publicado.telepaseSinCosto
    ? t
    : { ...t, queEs: t.queEs?.replace(/\s*La adhesión[^.]*no tienen costo[^.]*\./, ''), pasos: t.pasos.map((p) => p.replace(/,? sin cargo\./, '.')) };
