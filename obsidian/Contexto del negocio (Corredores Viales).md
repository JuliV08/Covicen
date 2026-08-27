# Contexto del negocio (Corredores Viales)

Investigado el **2026-08-27** para arrancar la landing. Ver [[Home]] · [[Arquitectura de informacion de la landing]].

## El modelo: concesión de obra pública por peaje

- **Corredores Viales S.A. (CVSA)** es la empresa **estatal** creada en 2017 (51% Economía/Transporte, 49% Vialidad Nacional) para operar rutas que antes estaban concesionadas a privados. La **Ley 27.742 (Bases)** la declaró "sujeta a privatización" y el **Decreto 97/2025** autorizó su privatización total.
- En su lugar se armó la **Red Federal de Concesiones (RFC)**: **+9.000 km** de rutas nacionales en **16 corredores** que concentran cerca del **80% del tránsito** del país, con **inversión 100% privada y sin subsidios del Estado**.
- Régimen: **concesión de obra pública por peaje**, plazo **20 años**. Incluye construcción, explotación, administración, reparación, ampliación, conservación y mantenimiento, más servicios al usuario y actividades complementarias que generen ingresos extra.
- **Se adjudica al que ofrece la MENOR tarifa de peaje.** La tarifa se actualiza por índices oficiales.

### Dos reglas del pliego que mandan sobre la comunicación

1. **No se puede cobrar la tarifa ofertada hasta alcanzar "condiciones de transitabilidad óptima".** O sea: hay un período de obras ANTES del cobro pleno. La web tiene que poder contar obras y avance, no solo tarifas.
2. **Vialidad Nacional supervisa con indicadores objetivos de desempeño y niveles de servicio.** La concesionaria está bajo la lupa: transparencia y rendición de cuentas no son adorno.

Tecnología obligada, de incorporación progresiva: **TelePASE** y **Free Flow** (peaje sin barrera).

## Las etapas de la RFC

| Etapa | Alcance | Tramos |
|---|---|---|
| I | 741,71 km (ex Corredor Vial 18) | RN 12, RN 14, Puente Rosario–Victoria (BA, ER, SF, Corrientes) |
| II-A | ~1.800 km | Pampa (RN 5), Sur Atlántico / Acceso Sur (Ezeiza-Cañuelas, Riccheri, Jorge Newbery, RN 3, 205, 226) |
| II-B | +2.500 km | Mediterráneo (RN 7, 35), Puntano (RN 8, 36, 193, A-005), Portuario Sur (RN 9, 188), Portuario Norte (RN 9, 33, A-008) |
| **III** | **+3.900 km, 8 tramos, 11 provincias** | Centro, Centro-Norte, Mesopotámico, Noroeste, Litoral, Noreste, Chaco-Santa Fe, Cuyo |

**Etapa III adjudicada el 2026-08-24** por **Resolución 1379/2026** del Ministerio de Economía (Boletín Oficial). Con eso el Gobierno completó el traspaso de los 9.000 km.

### Adjudicatarios Etapa III (tarifa ofertada, sin IVA)

| Tramo | Adjudicatario | Tarifa |
|---|---|---|
| **Centro** | AFEMA S.A. – Pablo Federico e Hijos S.A. – Guido Mogetta S.A. | **$1.399** (la más baja) |
| Centro-Norte | José Cartellone Construcciones Civiles S.A. | $2.175 |
| Mesopotámico | IEB Construcciones S.A. – Trading MRG S.A.U. | $3.564,99 |
| Noroeste | Autovía Construcciones y Servicios S.A. – Vapeu S.R.L. – Guigivan S.R.L. | $2.285 |
| Litoral | JCR S.A. – Néstor Julio Guerechet S.A. | $2.876,04 |
| Noreste | Carlos E. Enríquez S.A. – Hormi S.A. | $2.950 |
| Chaco-Santa Fe | José Eleuterio Pitón S.A. – Rovial S.A. – Obring S.A. | $3.520 |
| Cuyo | Laugero Construcciones S.A. – Green S.A. – Corporación del Sur S.A. | $3.090,25 |

## Quién es Covicen — CONFIRMADO (2026-08-27, por el cliente)

**Covicen es la sociedad nueva adjudicataria del Tramo Centro.** La hipótesis del nombre (**CO**rredor **VI**al **CEN**tro) se confirmó. Palabras del cliente: *"es para la nueva empresa (aun no inscripta porque salió el lunes la adjudicación) ganadora del nuevo tramo centro de la Red Federal de Concesiones"*.

**Tramo Centro:** **681 km** sobre **RN 9, RN 19 y RN 34**. Une Pilar (Córdoba) con Rosario y se extiende hacia San Francisco, Rafaela y la ciudad de Santa Fe. Provincias: **Córdoba y Santa Fe**. Consorcio adjudicatario: **AFEMA S.A. – Pablo Federico e Hijos S.A. – Guido Mogetta S.A.** Tarifa ofertada: **$1.399 + IVA — la más baja de los ocho tramos.**

Ese último dato es material de marca, no un número suelto: en un régimen donde **se gana ofreciendo la tarifa más barata**, Covicen ganó siendo la más barata de las ocho. Es un diferencial legítimo y verificable para comunicar.

### ⚠️ La sociedad todavía NO está inscripta

La adjudicación salió el lunes 2026-08-24 y la sociedad está **en formación**. Consecuencias reales:

- **Sin CUIT todavía.** El pie de página no puede llevar CUIT, domicilio legal inscripto ni datos registrales hasta que existan. Dejar los slots y completarlos después.
- **El dominio es EL riesgo de fecha.** NIC.ar exige identificarse con Clave Fiscal de AFIP (CUIT/CUIL/CDI) para registrar un `.ar`. **Una sociedad sin CUIT no puede registrar su propio dominio.** Hay que registrarlo a nombre de un tercero (alguna empresa del consorcio, o Juli) y transferirlo cuando salga la inscripción. Con el 5/10 encima, esto va primero.
- **Cuidado con el copy.** Mientras esté en formación, redactar sobre lo que sí es cierto y verificable hoy: la adjudicación, el tramo, el plazo, el consorcio. No presuponer una sociedad ya inscripta.
- **Falta la razón social exacta.** "Covicen" puede ser marca, denominación social, o ambas. Preguntar antes de maquetar el logo con un texto legal al lado.

## Arquitectura de información de cvsa.com.ar (referencia relevada)

**Menú:** Nosotros (Quiénes somos · Organigrama · Tramos viales · Servicios · Consejos viales) · Novedades · Contacto (Preguntas frecuentes · Canales de comunicación · Consultas y reclamos · Peaje: exención ex combatientes · Portal de Proveedores) · Licitaciones · Transparencia · Canal Ético · Guía de Trámites.

**Home, en orden:** banner de deuda → tarifario → consultas y reclamos → novedades → licitaciones → transparencia → Política de Calidad → Política de Seguridad Vial → Política Anticorrupción → Nuestros Corredores → novedades destacadas → Servicios Gratuitos (móviles de seguridad vial) → tarifas → **Emergencias 24hs**.

**CTAs:** "Pagá tu factura" · **140** (emergencias) · Consultas/Reclamos · Ver corredores · Ver tarifas.

**Servicios al usuario:** TelePASE (externo) · Oficina Virtual (pago de facturas) · Emergencias 140 24h · móviles de seguridad vial y auxilio mecánico **gratuitos** · consejos de seguridad vial · Guía de Trámites · Portal de Proveedores.

**Footer:** Nosotros · Usuarios · Servicios · Licitaciones · Ética y transparencia · Portales · Sitios de interés. Links a Intranet, portal de capacitaciones, Secretaría de Transporte, argentina.gob.ar, Vialidad Nacional, Casa Rosada. Instagram y Twitter.

> Ojo: **CVSA es estatal y tiene 8 años de sistemas atrás.** Su IA es el techo, no el piso. Covicen día 1 es otra cosa (ver [[Arquitectura de informacion de la landing]]).

## Paleta extraída del logo

`Logo Covicen 2.pdf` está **vectorizado** (sin texto extraíble), A4, 3 páginas. Los colores que aparecen son claramente una escala de marca dominada por **azules profundos / petróleo**:

- Oscuros: `#17293C` `#16354F` `#1D3D5C` `#1E4870` · Medios: `#2C688F` `#4A92BA` `#4E9BC4` · Claros: `#68BCE1` `#8FC4E0` `#A9C4D8` `#BCD7E8`
- Grises fríos: `#4A5A68` `#7B8794` `#8B96A2` `#93A0AC` `#9AA5B0` `#AAB4BE` `#C9D2D8`
- Acentos sueltos (¿estados? ¿íconos?): verde `#2F8F4E`, naranja `#CF5322`, violeta `#7A3F9D`

**Confirmar contra el logo real antes de fijar tokens.** Los acentos pueden ser incidentales del PDF y no marca.

## Fuentes

- [Red Federal de Concesiones — argentina.gob.ar](https://www.argentina.gob.ar/transporte/vialidad-nacional/red-federal-de-concesiones)
- [Resolución 1379/2026 — Boletín Oficial](https://www.boletinoficial.gob.ar/detalleAviso/primera/346271/20260824)
- [Adjudicación Etapa III — argentina.gob.ar](https://www.argentina.gob.ar/noticias/el-gobierno-nacional-adjudico-los-tramos-que-conforman-la-etapa-iii-de-la-red-federal-de)
- [Infobae — ocho tramos a operadores privados por 20 años](https://www.infobae.com/economia/2026/08/24/el-gobierno-adjudico-ocho-tramos-de-rutas-nacionales-a-operadores-privados-por-20-anos/)
- [Ámbito — ocho corredores de casi 4.000 km](https://www.ambito.com/economia/el-gobierno-adjudico-ocho-corredores-viales-casi-4000-kms-y-avanza-la-concesion-rutas-nacionales-20-anos-n6313995)
- [El Litoral — nuevos peajes en Santa Fe (Tramo Centro)](https://www.ellitoral.com/politica/peajes-santafe-rutanacional11-vialidadnacional-tramocentro-llambicampbell-rutanacional34-totoras-chacosantafe-resolucion1379-franck-vera-rutanacional9_0_g0HSrixqTt.html)
- [cvsa.com.ar](https://cvsa.com.ar/) — sitio de referencia relevado
