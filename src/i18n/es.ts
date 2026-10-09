/**
 * Textos de la landing en español.
 *
 * Reglas de tono (brief §4.2):
 * - Nunca usar la palabra restringida. Se dice "en tratamiento", "mi enfermedad",
 *   "los valientes que luchan". `npm run check:copy` lo verifica en cada build.
 * - Nunca "donar dinero": se dice "poner una pieza", "ser héroe", "construir".
 * - Los números viven en la barra de progreso, no en el copy emocional.
 *
 * Para la versión en inglés: crear `en.ts` con la misma forma (tipo `Copy`).
 */

const es = {
  meta: {
    title: 'La SUPERCASA · Ponte la Capa con los Super Calvitos',
    description:
      'Los Super Calvitos están construyendo su casa en Bogotá. Pon una pieza y vuélvete héroe oficial de la Fundación Segundos de Vida.',
  },

  nav: {
    cta: '🦸 Ponte la capa',
    skip: 'Saltar al contenido',
  },

  hero: {
    badge: '🦸 MISIÓN SUPERCASA · BOGOTÁ',
    title: 'La casa que los Super Calvitos están construyendo contigo',
    speech:
      '¡Hola! Soy <strong>Calvito</strong>. Lucho contra mi enfermedad con mi antifaz y mi capa de estrella 🦸 ¿Te cuento un secreto? Estamos construyendo <strong>mi casa</strong>, la SUPERCASA. Un lugar donde mis amigos y yo podremos quedarnos con nuestras mamás mientras dura el tratamiento. Pero nos falta algo muy importante: <strong>tú</strong>. ¿Me ayudas a terminarla?',
    ctaPrimary: '🦸 Claro que sí, Calvito',
    ctaSecondary: '💛 ¿Quiénes son los Super Calvitos?',
    nowBuilding: 'Ahora construimos:',
    houseAlt:
      'Ilustración de la SUPERCASA. Su apariencia cambia a medida que avanza la recaudación.',
  },

  progress: {
    raised: 'recaudado',
    goal: 'Meta',
    heroes: (n: number) => (n === 1 ? '1 héroe ya puso su pieza' : `${n} héroes ya pusieron su pieza`),
    firstHero: '¡Sé el primer héroe en poner una pieza!',
    done: 'lista',
  },

  story: {
    speech:
      'Hola… soy <strong>Calvita</strong> 💛 Para mi tratamiento vine a Bogotá desde muy lejos. Algunas noches, mi mamá y yo no sabíamos dónde dormir. Y yo solo quería algo tan simple… <strong>que mi mamá me cocinara un sancocho y me acariciara mi cabecita</strong>. ¿Tú crees que eso es pedir mucho?',
    title: 'Un hogar seguro en el corazón de Bogotá',
    body: 'La SUPERCASA es el hogar que la Fundación Segundos de Vida construye en Galerías, un barrio seguro, central y muy bonito de Bogotá. Allí vivirán 15 niños y niñas en tratamiento junto con sus familias, mientras dura el camino.',
    features: [
      { icon: '🍲', title: 'Cocina', text: 'Para que cada mamá cocine el plato favorito de su valiente.' },
      { icon: '🛏️', title: 'Habitaciones', text: 'Para que niño y cuidador descansen juntos y seguros.' },
      { icon: '🧸', title: 'Sala de juegos', text: 'Porque ser valiente también es seguir siendo niño.' },
      { icon: '🌻', title: 'Jardín en la azotea', text: 'Para tomar sol y mirar el cielo de Bogotá.' },
    ],
    banner:
      'Los Super Calvitos son los valientes que luchan cada día. Tú puedes ser su héroe: no con capa, con amor.',
    cta: 'Quiero ser su héroe 💛',
  },

  works: {
    eyebrow: 'La obra, hoy',
    title: 'La estructura ya está de pie',
    body: 'Lo que falta es lo que la convierte en hogar: fachada, instalaciones, cocina, habitaciones y el jardín de la azotea.',
    before: 'Hoy',
    after: 'Así quedará',
    beforeNote: 'Foto real de la obra (pendiente)',
    afterNote: 'Dibujo de la casa terminada',
    sliderLabel: 'Desliza para comparar la obra de hoy con la casa terminada',
    stagesTitle: 'Las etapas de la SUPERCASA',
    whereTitle: '¿Por qué en Galerías?',
    where: [
      { icon: '🛡️', title: 'Seguro', text: 'Un barrio tranquilo para los niños y sus cuidadores.' },
      { icon: '📍', title: 'Central', text: 'En el centro de la ciudad, fácil de llegar desde cualquier lugar.' },
      { icon: '🚌', title: 'Transporte masivo', text: 'Estaciones cerca para ir a cada cita sin largos trayectos.' },
      { icon: '🌳', title: 'Un sector bonito', text: 'Calles amables, parques y comercio para sentirse en casa.' },
    ],
  },

  donate: {
    eyebrow: 'Pon tu pieza',
    speech:
      '¡Eres oficialmente de los nuestros! 🎉 La estructura ya está de pie, pero por dentro está gris y fría. <strong>¿Tú pones una pieza de mi casa?</strong> Elige la que más te guste… yo te recomiendo la ventana de mi cuarto, ¡quiero ver el cielo! 👇',
    region: {
      legend: '¿Desde dónde nos acompañas?',
      co: '🇨🇴 Desde Colombia',
      intl: '🌎 Desde otro país',
    },
    steps: ['Tu pieza', 'Tus datos', 'Confirma'],
    recommended: 'Calvito la recomienda',
    approx: 'aprox.',
    customLabel: '¿Cuánto quieres aportar?',
    customEmpty: 'Escríbele a Calvito cuánto quieres aportar 💛',
    customMin: (min: string) => `El aporte mínimo es de ${min} 💛`,
    next: 'Ver mi pieza en la casa →',
    back: '← elegir otra pieza',
    frequency: {
      legend: '¿Cómo quieres ayudar?',
      once: '🎁 Donación única',
      monthly: '💛 Plan Padrino mensual',
      monthlyHelp: 'Cada mes pones una pieza más.',
    },
    fields: {
      name: 'Tu nombre o apodo de héroe',
      namePlaceholder: 'Ej: Laura, o "La tía de Calvito"',
      nameHelp: 'Aparecerá en tu carnet. Si lo dejas vacío serás "Héroe anónimo".',
      email: 'Tu correo',
      emailHelp: 'Para enviarte tu comprobante y contarte cómo va tu pieza.',
      emailError: 'Revisa tu correo, parece que le falta algo 💛',
      phone: 'Tu WhatsApp (opcional)',
      consent:
        'Autorizo a la Fundación Segundos de Vida a tratar mis datos según su <a href="/politica-de-datos" target="_blank" rel="noopener">política de tratamiento de datos</a> (Ley 1581 de 2012).',
      consentError: 'Necesitamos tu autorización para registrar tu aporte.',
      wall: 'Quiero que mi nombre aparezca en el muro de héroes.',
    },
    toConfirm: 'Ver el impacto de mi pieza →',
    confirm: {
      speech:
        '¡WOW! Mira todo lo que va a pasar por tu aporte… Cuando la luz entre por esa ventana, pensaré en ti. <strong>¿Confirmas con amor?</strong>',
      summary: 'Tu pieza',
      monthlySuffix: 'cada mes',
      payWith: 'Pagarás de forma segura con',
      cta: '✅ Confirmar con amor',
      back: '← cambiar mis datos',
      secure: '🔒 Tus datos de pago nunca pasan por nuestros servidores.',
    },
    pending:
      'Tu aporte está en camino 💛 Te avisaremos por email o WhatsApp cuando se confirme. Calvito ya está emocionado.',
    declined:
      'Uy, algo pasó con el pago 😅 Calvita te espera con los brazos abiertos. ¿Intentamos otra vez?',
    networkError:
      'Se nos cayó la conexión, como los bloques de Calvito 😅 Recarga e inténtalo de nuevo.',
    approved: '¡Lo lograste, héroe! 🦸 Tu carnet te está esperando aquí abajo 👇',
    cancelled: 'Tranquilo, tu pieza sigue guardada. Cuando quieras, confirmamos con amor 💛',
    retry: 'Intentar otra vez',
    restart: 'Poner otra pieza',
  },

  demo: {
    title: 'Modo demostración',
    body: (provider: string) =>
      `Aquí se abrirá el checkout seguro de ${provider}. No se hará ningún cobro. Elige qué resultado quieres simular:`,
    approved: '✅ Pago aprobado',
    pending: '⏳ Pago pendiente (efectivo)',
    declined: '❌ Pago rechazado',
    error: '📡 Error de red',
    cancel: 'Cerrar',
    panelTitle: 'Vista previa del avance',
    panelHelp: 'Mueve el control para ver cómo cambia la casa en cada etapa.',
  },

  thanks: {
    speech: (piece: string) =>
      `¡GRACIAS, héroe! 🦸 Acabas de poner <strong>${piece}</strong> en mi casa. Voy a contarle a TODOS mis amigos lo que hiciste. <strong>Guarda tu carnet</strong> y presume que eres oficialmente uno de los nuestros. Pssst… necesitamos más héroes en el equipo. ¿Me ayudas a reclutarlos?`,
    title: 'Tu Carnet de Héroe',
    download: '⬇️ Descargar carnet',
    share: '📲 Compartir carnet',
    whatsapp: 'WhatsApp',
    x: 'X',
    facebook: 'Facebook',
    instagram: 'Copiar texto para Instagram',
    copied: '¡Texto copiado! Pégalo en tu historia junto a tu carnet 💛',
    carnetAlt: (name: string, piece: string) => `Carnet de héroe de ${name}: puso ${piece} en la SUPERCASA.`,
    anonymous: 'Héroe anónimo',
    officialLine: 'Héroe oficial de los Super Calvitos — Segundos de Vida',
  },

  share: {
    whatsapp: (piece: string, link: string) =>
      `Acabo de poner ${piece} en la casa de Calvito, un niño valiente que está esperando su hogar 🏠 La SUPERCASA de Segundos de Vida necesita héroes como tú. ¿Me ayudas? 💛 → ${link}`,
    x: (piece: string, link: string) =>
      `No doné dinero. Puse ${piece} en la casa de un Super Calvito 🦸 Únete → ${link} #PonteLaCapa #SuperCasa`,
    instagram: (link: string) =>
      `Oficialmente HÉROE de los Super Calvitos 🦸✨ Esta es la pieza que puse en la SUPERCASA. Ahora te toca a ti 👉 ${link} #SegundosDeVida`,
  },

  stageMessages: {
    cubierta: '🌿 ¡La azotea ya tiene jardín! Desde ahí veremos el cielo de Bogotá.',
    fachada: '🎨 ¡La fachada tiene color! Nuestra casa ya se ve alegre desde la calle.',
    instalaciones: '💡 ¡Las luces se encendieron! Ventana a ventana, la casa se siente viva.',
    blanca: '🛁 ¡La cocina y los baños están listos! Una mamá ya podría cocinarle a su hijo aquí.',
    hogar: '🌻 ¡HOGAR LISTO! 15 familias encontrarán refugio, calor y abrazos. Gracias, héroe.',
  } as Record<string, string>,

  transparency: {
    eyebrow: 'Transparencia',
    title: '¿En qué se usa cada peso?',
    body: 'Publicamos cómo se reparte la meta entre las etapas de la obra. Cada mes la fundación firma y publica un informe de avance.',
    stage: 'Etapa',
    share: '% de la meta',
    amount: 'Monto',
    heroesTitle: 'Muro de héroes',
    heroesEmpty: 'El muro está esperando su primer nombre. ¿Será el tuyo?',
    foundationTitle: 'La fundación',
    nit: 'NIT',
    registry: 'Registro',
    contact: 'Contacto',
    website: 'Conoce más en',
    placeholderNote: 'Datos pendientes de confirmar por la fundación.',
  },

  footer: {
    legal: 'Fundación Segundos de Vida · Entidad sin ánimo de lucro',
    privacy: 'Política de tratamiento de datos',
    terms: 'Términos de donación',
    rights:
      'Puedes conocer, actualizar, rectificar y suprimir tus datos personales escribiendo a',
    treasury: 'Tesorería',
    follow: 'Síguenos',
  },
};

export type Copy = typeof es;
export default es;
