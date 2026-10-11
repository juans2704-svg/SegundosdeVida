/**
 * Medición del embudo de donación.
 * PENDIENTE: poner los IDs reales. Si están vacíos, no se carga nada.
 *
 * - GA4: "G-XXXXXXXXXX" (Google Analytics → Administrar → Flujos de datos).
 * - Meta Pixel: número del píxel (Administrador de eventos de Meta).
 *
 * Los scripts solo se cargan después de que la persona acepta el aviso de cookies.
 */
export const analytics = {
  ga4Id: import.meta.env.PUBLIC_GA4_ID ?? '',
  metaPixelId: import.meta.env.PUBLIC_META_PIXEL_ID ?? '',
};

export const analyticsEnabled = Boolean(analytics.ga4Id || analytics.metaPixelId);
