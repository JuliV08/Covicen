# QR del folleto de TelePASE

Generado el 14/10/2026. Lleva a:

```
https://www.covicen.com.ar/telepase/?utm_source=folleto&utm_medium=qr
```

Esa página de la web cuenta la visita en Google Analytics y en menos de dos segundos pasa a la adhesión de
TelePASE en Telepeaje Plus (`https://www.telepeajeplus.com/Adhierase`). La marca del final (`utm_source=folleto`,
`utm_medium=qr`) es la que hace que Analytics separe lo que llega por el folleto de cualquier otra visita.

## Archivos

| Archivo | Para qué |
|---|---|
| `qr-telepase.svg` | El de imprenta: es vector, se agranda sin perder calidad. |
| `qr-telepase.png` | Imagen de 2400 × 2400 px, para quien no pueda usar el vector. |

Negro sobre blanco, versión 6 (41 × 41 módulos), corrección de errores Q: sigue leyéndose con una mancha, un doblez
o algo apoyado encima. Se leyó con un lector automático a tamaño completo y achicado a 2 cm y a 1,5 cm a 300 dpi; las
tres veces dio la dirección exacta.

## Al imprimirlo

- **No imprimir hasta que `/telepase/` esté en producción** y alguien lo haya escaneado con su celular.
- Tamaño mínimo: **2 cm de lado**. Más grande es mejor; en un folleto de mano, 2,5 a 3 cm.
- **El borde blanco es parte del QR**: no recortarlo ni apoyar texto o dibujos encima.
- Negro sobre fondo claro. Invertido (claro sobre oscuro) muchos celulares no lo leen.
- Debajo se puede poner la dirección para tipear: **covicen.com.ar/telepase**. Esa también lleva a la adhesión, pero
  sus visitas no cuentan como «folleto».

## Si cambia algo

- **Si Telepeaje Plus cambia la dirección de la adhesión**, no hay que reimprimir: se cambia `adhesionTelepase` en
  `src/content/contacto.json` y los folletos ya repartidos siguen funcionando.
- **Para otro folleto que se quiera contar aparte**, se genera otro QR con otra marca, por ejemplo
  `?utm_source=folleto-estaciones&utm_medium=qr`. La página es la misma.
