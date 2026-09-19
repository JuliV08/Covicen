# Sistema de diseño del panel (backoffice)

Cómo se ve el panel del operador de Covicen (React). Deriva del tema **"Papel con marco de tinta"** que Juli definió para el backoffice de V-Shop y documentó como handoff reutilizable (artifact: https://claude.ai/code/artifact/0cf30b3f-7064-400d-b269-ec004f9c19d4). Ese documento es la fuente de los tokens, las reglas y el método; acá solo va lo que cambia para Covicen. Ver [[Sistemas de Covicen]] · [[Sistema de diseno]] (la landing).

## Las tres ideas (del handoff, tal cual)
1. **Sobre claro, premium es papel, no vidrio.** Superficies opacas, separación por tono y hairline. Sin gradientes de fondo, sin glass, sin sombras de color.
2. **Sidebar y barra superior son el marco, y el marco es de tinta**: usan los tokens del modo oscuro sin duplicarlos (`.light .marco-tinta`). El marco no cambia entre modos; solo cambia el papel.
3. **La marca vive en lo interactivo** (ítem activo, foco, ícono de módulo, botón primario), no en la atmósfera.

Método: **los valores se calculan, no se eligen a ojo**. Cada par texto/superficie se verifica contra WCAG AA y el cálculo queda como test que rompe el build.

## Lo que cambia para Covicen
| Pieza | V-Shop | Covicen |
|---|---|---|
| Marca principal (`--primary`) | cian | **Celeste del isotipo `#68BCE1`** sobre el marco (oscuro); **azul `#2C688F`** sobre papel (contraste 6:1 sobre blanco). Señala *dónde estás*. |
| Marca secundaria (`--accent`) | violeta | **Amarillo vial `#F0C419`**, con moderación: filo del botón primario e íconos de módulo del tarifario. Los chips de estado usan los semánticos, no el vial. |
| Tinta (`--ink`, botón primario) | navy `222 30% 12%` | Igual: la tinta señala *qué hacer*. |
| Marco | tinta al 7 % (`0 0% 7%`) | **Navy casi negro de la landing** (`#0B1526` ≈ `216 55% 10%`): se lee como negro y es marca. Escalera 4/7/9/12 % trasladada al mismo matiz. |
| Papel | `220 14% 96%` neutro | Igual. |
| Semánticos (success, warning, info, destructive) | tríos calculados | Iguales (son semánticos, no marca). |
| Tipografía | DM Sans | **Archivo** variable, la de la marca. Escala `.h-page` / `.h-section` / `.t-body` igual. |
| Íconos | lucide | Igual. Cero emojis. |
| Filo del botón primario | cian → violeta | celeste → vial. |
| Vidrio, radiales, gradiente de marca en fondos | no en claro | No, en ningún modo: la landing tampoco los usa. |

**Valores finales tras el cálculo de contraste (2026-09-06):** el marco es navy sobre 216° con escalera 6/9/11/14 % (un navy al 4 % ya es negro); `--info-subtle` del marco pasó a `214 55% 18%` (el chip azul desaparecía sobre navy; `--info` encima queda en 4,61:1); el vial como letra sobre papel pasó a `44 95% 27%` (hover `22%`): a 30 % daba 4,22:1, a 27 % el peor par es 5,01:1. El guard `contrasteTokens.test.ts` recalcula 44 pares por modo en cada corrida.

Modo oscuro completo del panel: fuera de v1 (el marco ya es oscuro; el papel oscuro se agrega redefiniendo la capa `:root`).

## Lo que se copia de V-Shop sin cambios
- La estructura de tokens (`H S% L%` sin `hsl()`, tríos `--X` / `--X-foreground` / `--X-subtle`) y el bloque `.dark, .light .marco-tinta` + `.light, .light .marco-tinta .papel`.
- Las primitivas `Button` (variantes por lo que hacen, nunca por color), `Select` (nunca `<select>` nativo), `EmptyState`, `PageHeader`, `Breadcrumbs`, diálogos; el shell `Sidebar` + `Header`.
- **Los guards** en `__tests__/`: contraste por cálculo, colores cableados, botones cableados, select nativo, íconos SVG y alfa, jerga inline, animaciones inexistentes. Rompen el build.
- Las reglas de íconos (un set, trazo 1,75 en grandes, nunca alfa, compuestos no van chicos) y las trampas de la sección 7 del handoff.

No se arma un paquete compartido entre repos: para una persona es ceremonia. Se copia y se re-tokeniza; se extrae cuando haya un tercer proyecto.

## El inicio del panel no es un tablero de ventas
Inicio = estado del tarifario: cuadro vigente (y desde cuándo), cuadro programado (y desde cuándo), últimas publicaciones y si la web se reconstruyó, cabinas operativas, accesos rápidos. Sin métricas de adorno.
