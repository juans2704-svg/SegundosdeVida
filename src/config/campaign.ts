/**
 * Configuración central de la campaña LA SUPERCASA.
 *
 * Fase 1: estos valores se editan a mano y se publica de nuevo.
 * Fase 2: `progress` y `wall` vendrán de Supabase (ver src/lib/progress.ts).
 *
 * Todo lo marcado con PENDIENTE es un dato provisional que la fundación
 * debe confirmar antes del lanzamiento.
 */

export type StageId = 'gris' | 'cubierta' | 'fachada' | 'instalaciones' | 'blanca' | 'hogar';

export interface Stage {
  id: StageId;
  icon: string;
  name: string;
  /** % de recaudo desde el cual la casa muestra esta etapa. */
  threshold: number;
  /** % del presupuesto asignado (PENDIENTE: desglose real de la fundación). */
  budgetPct: number;
  description: string;
}

export interface Piece {
  id: string;
  icon: string;
  /** Monto en COP. `null` = monto libre. */
  amount: number | null;
  label: string;
  /** Cómo se nombra la pieza dentro de una frase: "Acabas de poner ___ en mi casa". */
  phrase: string;
  impact: string[];
  recommended?: boolean;
  /** Pieza recomendada cuando se elige el Plan Padrino mensual. */
  recommendedMonthly?: boolean;
  /** `false` = no se ofrece como aporte mensual. */
  monthly?: boolean;
}

export const campaign = {
  goal: 250_000_000,
  /** PENDIENTE: monto recaudado real. La campaña arranca en $0. */
  raised: 0,
  /** PENDIENTE: número de héroes que ya pusieron su pieza. */
  heroes: 0,
  updatedAt: '2026-10-09',
  /** La barra nunca se ve vacía (brief §7.2). */
  minVisualPct: 3,
  /** Fecha límite de la campaña (hora de Bogotá). */
  deadline: '2026-11-30T23:59:59-05:00',
  /**
   * Por debajo de este monto no se muestra "$X recaudado" (evita lanzar mostrando $0):
   * se muestra la próxima meta y los héroes. 2 % de la meta = $5.000.000.
   */
  showRaisedFrom: 5_000_000,
  /**
   * Donación igualada ("cada pieza vale doble"). Se activa poniendo `active: true`
   * con el nombre de la empresa que iguala y hasta cuándo.
   */
  matching: { active: false, sponsor: '', until: '', cap: 0 },
  address: 'Cr. 28 Bis #51-33, sector Galerías, Bogotá',
  capacity: 15,
};

export const stages: Stage[] = [
  {
    id: 'gris',
    icon: '🧱',
    name: 'Obra gris',
    threshold: 0,
    budgetPct: 15,
    description: 'Terminar la estructura pendiente: muros, escaleras y placas.',
  },
  {
    id: 'cubierta',
    icon: '🌿',
    name: 'Cubierta y azotea',
    threshold: 32,
    budgetPct: 17,
    description: 'Impermeabilizar la cubierta y sembrar el jardín de la azotea.',
  },
  {
    id: 'fachada',
    icon: '🎨',
    name: 'Fachada',
    threshold: 47,
    budgetPct: 15,
    description: 'Pañete, pintura de fachada y ventanas instaladas.',
  },
  {
    id: 'instalaciones',
    icon: '💡',
    name: 'Instalaciones',
    threshold: 62,
    budgetPct: 15,
    description: 'Redes eléctricas, agua, gas e iluminación de toda la casa.',
  },
  {
    id: 'blanca',
    icon: '🛁',
    name: 'Obra blanca',
    threshold: 78,
    budgetPct: 28,
    description: 'Pisos, baños, cocina, puertas y acabados de cada habitación.',
  },
  {
    id: 'hogar',
    icon: '🌻',
    name: 'Hogar listo',
    threshold: 95,
    budgetPct: 10,
    description: 'Dotación: camas, cocina equipada, sala de juegos y bienvenida.',
  },
];

/** El orden es el de la pantalla: la recomendada primero y la más pequeña al final. */
export const pieces: Piece[] = [
  {
    id: 'ventana',
    icon: '🪟',
    amount: 100_000,
    label: 'La ventana de un cuarto',
    phrase: 'la ventana de un cuarto',
    recommended: true,
    impact: [
      'Una ventana con marco y vidrio para el cuarto de un niño',
      'Luz y aire fresco cada mañana',
      'El cielo de Bogotá visto desde la cama',
    ],
  },
  {
    id: 'bano',
    icon: '🚿',
    amount: 250_000,
    label: 'Un baño completo',
    phrase: 'un baño completo',
    impact: [
      'Ducha, sanitario y lavamanos listos para una familia',
      'Un baño calientico después de un día de tratamiento',
    ],
  },
  {
    id: 'habitacion',
    icon: '🛏️',
    amount: 1_000_000,
    label: 'Una habitación equipada',
    phrase: 'una habitación equipada',
    monthly: false,
    impact: [
      'Cama para el niño y para su mamá o cuidador',
      'Un lugar seguro para descansar juntos',
      'Una familia más con un lugar seguro donde dormir',
    ],
  },
  {
    id: 'pintura',
    icon: '🎨',
    amount: 50_000,
    label: 'Pintura de una pared',
    phrase: 'la pintura de una pared',
    recommendedMonthly: true,
    impact: [
      'Una pared gris se vuelve alegre y llena de color',
      'Un cuarto que se siente hogar y no obra',
    ],
  },
  {
    id: 'material',
    icon: '🍲',
    amount: 20_000,
    label: 'Material de instalación',
    phrase: 'material de instalación',
    impact: [
      'Tubos y cables que llevan agua y luz a la cocina',
      'Un paso más para que una mamá le cocine a su valiente',
    ],
  },
  {
    id: 'libre',
    icon: '✏️',
    amount: null,
    label: 'Lo que tu corazón diga',
    phrase: 'una pieza llena de amor',
    impact: [
      'Tu aporte va directo a la etapa que estamos construyendo',
      'Cada peso se publica en la sección de transparencia',
    ],
  },
];

export const foundation = {
  name: 'Fundación Segundos de Vida',
  shortName: 'Segundos de Vida',
  website: 'https://segundosdevida.com',
  // PENDIENTE: datos legales y de contacto reales.
  nit: 'PENDIENTE',
  registry: 'PENDIENTE (registro ESAL / Cámara de Comercio)',
  email: 'PENDIENTE@segundosdevida.com',
  treasuryEmail: 'PENDIENTE@segundosdevida.com',
  phone: 'PENDIENTE',
  /** PENDIENTE: WhatsApp de la campaña, solo números con indicativo (ej. '573001234567'). */
  whatsapp: '',
  /** La fundación emite certificado de donación a personas naturales y jurídicas. */
  issuesCertificates: true,
  social: {
    instagram: 'https://instagram.com/', // PENDIENTE
    facebook: 'https://facebook.com/', // PENDIENTE
    tiktok: 'https://tiktok.com/', // PENDIENTE
    whatsapp: 'https://wa.me/', // PENDIENTE
  },
};

/**
 * Muro de héroes (solo con consentimiento). Fase 2: viene de la BD.
 */
export const wall: { name: string; piece: string }[] = [];
