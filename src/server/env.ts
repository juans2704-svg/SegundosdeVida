/**
 * Variables de entorno del servidor. NUNCA importar este archivo desde código
 * del navegador: contiene secretos (llaves privadas de Wompi, base de datos).
 */
export function env(name: string): string {
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  if (fromProcess !== undefined) return fromProcess;
  const fromVite = (import.meta.env as Record<string, string | undefined>)[name];
  return fromVite ?? '';
}

/** Despliegue de producción (Vercel producción o SUPERCASA_ENV=production). */
export const isProductionDeploy = () => env('VERCEL_ENV') === 'production' || env('SUPERCASA_ENV') === 'production';
