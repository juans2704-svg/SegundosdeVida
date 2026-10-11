/**
 * Artes oficiales de los Super Calvitos (public/img).
 * PENDIENTE: pedir a la fundación los archivos en mayor resolución (ideal ≥ 800px
 * y con fondo transparente) para reemplazar estas versiones.
 */
export const characters = {
  /** Recortes sin fondo (se muestran sin marco). */
  constructor: {
    src: '/img/calvitos/constructor.webp',
    width: 764,
    height: 900,
    cutout: true,
    alt: 'Calvito con casco amarillo, chaleco de constructor y martillo, saluda con la mano.',
  },
  policia: {
    src: '/img/calvitos/policia.webp',
    width: 655,
    height: 900,
    cutout: true,
    alt: 'Calvito vestido de policía, con capa roja y placa, saluda con la mano.',
  },
  doctor: {
    src: '/img/calvitos/doctor.webp',
    width: 839,
    height: 900,
    cutout: true,
    alt: 'Calvito vestido de doctor, con bata blanca y estetoscopio.',
  },
  bombero: {
    src: '/img/calvitos/bombero.webp',
    width: 781,
    height: 900,
    cutout: true,
    alt: 'Calvito vestido de bombero, con casco rojo y manguera.',
  },
  empresaria: {
    src: '/img/calvitos/empresaria.webp',
    width: 572,
    height: 900,
    cutout: true,
    alt: 'Calvita con antifaz rojo, vestido ejecutivo y carpeta, sonríe con la mano en la cintura.',
  },
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
