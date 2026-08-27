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
      FUENTE_DATOS: 'local',
    },
  },
});
