// `pnpm verificar` en modo portada: build + chequeos con PUBLIC_SITIO_COMPLETO=false.
//
// Existe para que el modo que HOY se publica en producción tenga la misma compuerta que el sitio entero. Es un
// script y no `PUBLIC_SITIO_COMPLETO=false pnpm verificar` porque esa forma de pasar variables no existe en
// PowerShell, que es donde trabaja Juli. La variable se pasa por el entorno del proceso hijo, que en `loadEnv` de
// Vite le gana a lo que diga el archivo .env: sirve igual con un .env que tenga la variable en true.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const env = { ...process.env, PUBLIC_SITIO_COMPLETO: 'false' };
// Sin `shell: true`: con shell, Node avisa (DEP0190) que los argumentos se concatenan sin escapar, y además en
// Windows habría que saber si el binario es `pnpm` o `pnpm.cmd`. Los dos pasos son JS, así que los corre el mismo
// Node que está ejecutando este script, por la ruta del paquete y no por el shim de node_modules/.bin.
const pasos = [
  // Los mismos dos pasos que `pnpm build`, en orden. El primero NO se puede saltear: genera public/og.png y
  // public/apple-touch-icon.png, que están gitignoreados, así que en un clone limpio (CI) no existen todavía.
  ['scripts/generar-og.ts'],
  [createRequire(import.meta.url).resolve('astro/package.json').replace(/package\.json$/, 'bin/astro.mjs'), 'build'],
  ['scripts/verificar.ts'],
];

for (const args of pasos) {
  const r = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
