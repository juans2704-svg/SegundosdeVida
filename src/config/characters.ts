/**
 * Artes oficiales de los Super Calvitos (public/img).
 * PENDIENTE: pedir a la fundación los archivos en mayor resolución (ideal ≥ 800px
 * y con fondo transparente) para reemplazar estas versiones.
 */
export const characters = {
  calvito: {
    src: '/img/calvito.webp',
    width: 283,
    height: 284,
    alt: 'Calvito, un Super Calvito con antifaz verde y capa naranja, saluda con la mano.',
  },
  calvita: {
    src: '/img/calvita.webp',
    width: 299,
    height: 390,
    alt: 'Calvita, una Super Calvita con antifaz azul, saluda feliz con los brazos arriba desde su silla de ruedas.',
  },
  padrino: {
    src: '/img/plan-padrino.webp',
    width: 299,
    height: 262,
    alt: 'Calvito, sobre los hombros de su padrino, hace la señal de victoria.',
  },
} as const;

export type CharacterId = keyof typeof characters;

export const logo = { src: '/img/logo-fsv.png', width: 188, height: 39, alt: 'Fundación Segundos de Vida' };
export const houseRender = {
  src: '/img/supercasa-render.webp',
  width: 671,
  height: 400,
  alt: 'Dibujo de la SUPERCASA terminada: edificio de ladrillo con jardín en la azotea, ventanas iluminadas y el letrero La Super Casa.',
};
