// Botón "Imprimir" (pliego 61.7: vista de impresión). Los estilos de impresión son el bloque @media print de src/styles/global.css.
const iniciar = () => document.querySelectorAll<HTMLButtonElement>('[data-imprimir]:not([data-listo])').forEach((b) => { b.dataset.listo = ''; b.addEventListener('click', () => window.print()); });
document.addEventListener('astro:page-load', iniciar);
export {};
