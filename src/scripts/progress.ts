/**
 * Estado del recaudo en el navegador: barra, chips, casa y mensajes de etapa.
 * Fase 2: `refresh()` consultará Supabase (Realtime) en vez del archivo de configuración.
 */
import { campaign, stages } from '../config/campaign';
import { getInitialProgress, percentOf, visualPercent, houseLevel, currentStage, type Progress } from '../lib/progress';
import { formatCOP } from '../lib/format';
import { payments } from '../config/payments';
import { houseFrames, frameFor, frameSrc, frameSrcset } from '../config/house';
import t from '../i18n/es';

let state: Progress = getInitialProgress();
let shownLevel = houseLevel(percentOf(state));

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);

function animateNumber(el: HTMLElement, from: number, to: number) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || from === to) {
    el.textContent = formatCOP(to);
    return;
  }
  const start = performance.now();
  const dur = 1200;
  const tick = (now: number) => {
    const k = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = formatCOP(Math.round(from + (to - from) * eased));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Cambia la ilustración de la casa a la fase que corresponde. Devuelve si la casa avanzó. */
let frameToken = 0;
function setHouse(pct: number): boolean {
  const box = $('[data-house-frames]');
  if (!box) return false;
  const { frame, step, missing } = frameFor(pct);
  const note = box.querySelector<HTMLElement>('[data-frame-missing]');
  if (note) {
    note.hidden = !missing;
    note.querySelector('[data-frame-step]')!.textContent = String(step);
  }
  preload(Math.min(100, step + 5));
  const current = Number(box.dataset.frame);
  if (frame === current) return false;
  box.dataset.frame = String(frame);

  const token = ++frameToken;
  const img = new Image();
  img.className = 'frames__img is-entering';
  img.alt = box.querySelector('img')?.alt ?? '';
  img.width = houseFrames.width;
  img.height = houseFrames.height;
  img.sizes = box.dataset.sizes ?? '100vw';
  img.srcset = frameSrcset(frame);
  img.src = frameSrc(frame);
  img.decode().catch(() => {}).then(() => {
    if (token !== frameToken) return;
    const old = [...box.querySelectorAll<HTMLImageElement>('.frames__img')];
    box.insertBefore(img, note ?? null);
    requestAnimationFrame(() => img.classList.remove('is-entering'));
    setTimeout(() => old.forEach((o) => o.remove()), 1300);
  });
  return frame > current;
}

const preloaded = new Set<number>();
function preload(pct: number) {
  const { frame } = frameFor(pct);
  if (preloaded.has(frame)) return;
  preloaded.add(frame);
  const img = new Image();
  img.sizes = $('[data-house-frames]')?.dataset.sizes ?? '100vw';
  img.srcset = frameSrcset(frame);
}

function pulseHouse() {
  const box = $('[data-house-frames]');
  if (!box) return;
  box.classList.remove('is-building');
  void box.getBoundingClientRect();
  box.classList.add('is-building');
}

let toastTimer = 0;
export function toast(message: string) {
  const el = $('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.classList.remove('is-on');
    setTimeout(() => (el.hidden = true), 400);
  }, 6000);
}

export function render(next: Progress, { announce = true } = {}) {
  const prev = state;
  state = next;
  const pct = percentOf(next);

  const fill = $('[data-progress-fill]');
  if (fill) fill.style.width = `${visualPercent(pct)}%`;
  const pctEl = $('[data-progress-pct]');
  if (pctEl) pctEl.textContent = `${pct < 1 && pct > 0 ? pct.toFixed(1) : Math.round(pct)}%`;
  $('[data-progress-bar]')?.setAttribute('aria-valuenow', String(Math.round(pct)));

  const raised = $('[data-progress-raised]');
  if (raised) animateNumber(raised, prev.raised, next.raised);

  const heroes = $('[data-heroes]');
  if (heroes) heroes.textContent = next.heroes > 0 ? t.progress.heroes(next.heroes) : t.progress.firstHero;
  const heroesCount = $('[data-heroes-count]');
  if (heroesCount) heroesCount.textContent = String(next.heroes);

  const now = currentStage(pct);
  const nowEl = $('[data-now-building]');
  if (nowEl) nowEl.textContent = `${now.icon} ${now.name}`;
  stages.forEach((s, i) => {
    const chip = $(`[data-stage-chip="${s.id}"]`);
    if (!chip) return;
    const done = i === 0 || pct >= s.threshold;
    chip.className = `chip chip--${done ? 'done' : s.id === now.id ? 'current' : 'todo'}`;
  });

  if (setHouse(pct)) pulseHouse();
  const level = houseLevel(pct);
  if (level !== shownLevel) {
    if (level > shownLevel) {
      const msg = t.stageMessages[stages[level].id];
      if (announce && msg) toast(msg);
    }
    shownLevel = level;
  }
}

export function getProgress() {
  return state;
}

/** Suma un aporte aprobado (fase 1: solo en esta sesión; fase 2: llega por webhook). */
export function addDonation(amountCOP: number) {
  render({ ...state, raised: state.raised + amountCOP, heroes: state.heroes + 1 });
}

/** Vista previa: mueve la casa entre 0 y 100%. */
function initDemoPanel() {
  const panel = $('[data-demo-panel]');
  // Visible mientras los pagos estén en modo demo, o con ?demo=1.
  if (!panel || (payments.mode !== 'demo' && !new URLSearchParams(location.search).has('demo'))) return;
  panel.hidden = false;
  const range = panel.querySelector<HTMLInputElement>('input')!;
  const out = panel.querySelector<HTMLOutputElement>('output')!;
  const base = state;
  range.addEventListener('input', () => {
    const pct = Number(range.value);
    out.value = `${pct}%`;
    render({ ...base, raised: Math.round((campaign.goal * pct) / 100) });
  });
}

/** Animación de entrada de bloques al hacer scroll. */
function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

initReveal();
initDemoPanel();
