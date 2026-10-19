# Logos institucionales del pie

Los usa la fila de sitios institucionales de `src/components/Footer.astro`, a través de `src/lib/institucional.ts`.
El nombre del archivo es el `id` del sitio en esa lista. Si un archivo falta, el pie muestra el nombre en texto.
(En esta carpeta va también, cuando exista, `organigrama.png`, que usa Quiénes somos: `src/lib/atmosfera.ts` lo busca
por ese nombre exacto, así que no se mezcla con los logos.)

Se muestran como **máscara** (`mask-image`) pintada con el color del texto del pie: cada archivo tiene que ser de **un
solo color, sin partes blancas ni transparencias** (una máscara toma la forma, no el color; lo blanco saldría tapado).
Así el mismo archivo sale blanco en el tema oscuro y azul marino en el claro, y el navegador lo baja una sola vez para
todas las páginas.

## De dónde sale cada uno (descargados el 25/09/2026)

| Archivo | Fuente |
|---|---|
| `presidencia.svg` | *Manual de identidad visual Vialidad Nacional*, octubre de 2024, publicado en InfoLEG como anexo de la resolución de la DNV (IF-2025-05535446-APN-ALTA#DNV): https://servicios.infoleg.gob.ar/infolegInternet/anexos/405000-409999/408485/res70.pdf — encabezado de las páginas (pág. 9). |
| `transporte.svg` | El mismo manual, pág. 19 («convivencias»): Secretaría de Transporte · Ministerio de Economía. |
| `vialidad-nacional.svg` | El mismo manual, pág. 9: versión vertical en positivo. |
| `telepase.png` | Sitio oficial de TelePASE: https://www.telepase.com.ar/assets/img/logo.png (blanco con transparencia). |

Los tres SVG se sacaron del PDF en vectores (PyMuPDF, con el texto convertido a trazos), recortados al ras y
optimizados con svgo. Se les sacó el sello de firma de la página del PDF («IF-2025-… · Página 9 de 22»), que venía
como glifos fuera del recorte: no se veía, pero pesaba un 20 % (lo guarda `tests/lib/institucional.test.ts`). El PNG
de TelePASE es el oficial, solo recortado al ras.

**Uso de estos logos:** el manual de Vialidad regula lo que emite el propio Estado y no dice nada de terceros, y el
pliego (PETG 61.6) pide los enlaces, no los logos. Otras concesionarias de la red los muestran así; el OK formal de
Vialidad está pedido en `docs/pendientes-de-confirmacion.md`. Por el mismo manual, no se les cambia el color: solo
azul, negro o blanco (en el sitio, el color del texto de cada tema).

**No hay logo de la Red Federal de Concesiones**: no figura en su página de argentina.gob.ar, ni en los pliegos, ni en
el manual de Vialidad (todos la nombran solo en texto). Por eso va como enlace en el texto del pie. Si Vialidad
Nacional entrega uno, se agrega acá como `red-federal.svg` y se suma a la lista de `src/lib/institucional.ts`.

**Data Fiscal** no va acá: el QR lo genera ARCA con el CUIT de la sociedad y se carga en `public/qr-afip.png`.
