// Botón "Imprimir" (pliego 61.7: vista de impresión). La hoja de estilos de impresión vive en src/styles/impresion.css.
const iniciar = () => document.querySelectorAll<HTMLButtonElement>('[data-imprimir]:not([data-listo])').forEach((b) => { b.dataset.listo = ''; b.addEventListener('click', () => window.print()); });
document.addEventListener('astro:page-load', iniciar);
export {};
