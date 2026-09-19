// Impresión (pliego 61.7). Dos cosas: el botón "Imprimir" ([data-imprimir], en Tarifas y en la página de cada estación) y
// la fecha del encabezado de la hoja: el <body> trae la del build como fallback sin JS; acá se pisa con la del momento de
// imprimir (Ctrl+P también dispara beforeprint). La hoja de estilos es src/styles/impresion.css.
const iniciar = () => document.querySelectorAll<HTMLButtonElement>('[data-imprimir]:not([data-listo])').forEach((b) => { b.dataset.listo = ''; b.addEventListener('click', () => window.print()); });
document.addEventListener('astro:page-load', iniciar);
window.addEventListener('beforeprint', () => { document.body.dataset.fecha = new Date().toLocaleDateString('es-AR'); });
export {};
