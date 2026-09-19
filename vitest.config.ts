/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: true,
    env: {
      PUBLIC_SITE_URL: 'https://covicen.test',
      PUBLIC_BASE_PATH: '/',
      PUBLIC_INDEXABLE: 'false',
      // Fijada a propósito: sin esto el resultado depende de si la máquina tiene un .env con la variable en true
      // (CI no lo tiene, la máquina de Juli sí), y los tests darían distinto en cada lado.
      PUBLIC_SITIO_COMPLETO: 'false',
      FUENTE_DATOS: 'local',
    },
  },
});
