/**
 * Medición del embudo con GA4 y Meta Pixel.
 *
 * Los scripts solo se cargan si hay IDs configurados (src/config/analytics.ts)
 * y la persona aceptó el aviso de cookies. `track()` se puede llamar siempre:
 * si no hay consentimiento o no hay IDs, no hace nada.
 *
 * Eventos del embudo:
 *   view_donate      La sección "Pon tu pieza" entra en pantalla
 *   select_piece     Elige pieza o cambia frecuencia            (Meta: CustomizeProduct)
 *   add_info         Pasa al paso de datos                      (Meta: AddToCart)
 *   begin_checkout   Ve el impacto y el botón de confirmar      (Meta: InitiateCheckout)
 *   purchase         Pago aprobado                              (Meta: Donate)
 *   payment_failed   Pago rechazado o con error
 *   share            Comparte (carnet o enlace)
 */
import { analytics, analyticsEnabled } from '../config/analytics';

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string };
  }
}

const CONSENT_KEY = 'supercasa-cookies';
const META_EVENTS: Record<string, string> = {
  select_piece: 'CustomizeProduct',
  add_info: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  purchase: 'Donate',
};

let loaded = false;

function readConsent(): string | null {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

function saveConsent(value: 'yes' | 'no') {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* sin almacenamiento: se vuelve a preguntar en la próxima visita */
  }
}

function loadScripts() {
  if (loaded || !analyticsEnabled) return;
  loaded = true;

  if (analytics.ga4Id) {
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${analytics.ga4Id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', analytics.ga4Id);
  }

  if (analytics.metaPixelId) {
    // Código base oficial del Meta Pixel.
    const n = function (...args: unknown[]) {
      const self = n as unknown as { callMethod?: (...a: unknown[]) => void; queue: unknown[] };
      if (self.callMethod) self.callMethod(...args);
      else self.queue.push(args);
    } as unknown as NonNullable<Window['fbq']> & { push: unknown };
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    window.fbq = n;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    window.fbq('init', analytics.metaPixelId);
    window.fbq('track', 'PageView');
  }
}

export function track(event: string, params: Params = {}) {
  if (!loaded) return;
  window.gtag?.('event', event, params);
  const meta = META_EVENTS[event];
  if (window.fbq) {
    if (meta) window.fbq('track', meta, { value: params.value, currency: params.currency, content_name: params.piece });
    else window.fbq('trackCustom', event, params);
  }
}

/** Aviso de cookies: solo aparece si hay analítica configurada y la persona no ha respondido. */
function initConsent() {
  if (!analyticsEnabled) return;
  const consent = readConsent();
  if (consent === 'yes') return loadScripts();
  if (consent === 'no') return;
  const bar = document.querySelector<HTMLElement>('[data-cookies]');
  if (!bar) return;
  bar.hidden = false;
  bar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-cookies-answer]');
    if (!btn) return;
    const yes = btn.dataset.cookiesAnswer === 'yes';
    saveConsent(yes ? 'yes' : 'no');
    bar.hidden = true;
    if (yes) loadScripts();
  });
}

/** view_donate: una vez, cuando la sección de donación entra en pantalla. */
function initViewDonate() {
  const section = document.querySelector('#donar');
  if (!section || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      track('view_donate');
      io.disconnect();
    }
  }, { threshold: 0.25 });
  io.observe(section);
}

initConsent();
initViewDonate();
