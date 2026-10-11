/**
 * Embudo de donación (brief §5 Sección 4 y §7.3):
 * A pieza → B frecuencia y datos → D impacto + "Confirmar con amor" → C checkout → resultado.
 */
import { pieces, type Piece } from '../config/campaign';
import { payments, regions, type Region } from '../config/payments';
import { formatCOP, formatMoney, formatUSD, formatUSDCents, copToUSD, usdToCOP, feeCover } from '../lib/format';
import { buildReference, providerFor, type DonationOrder, type Frequency } from '../lib/payments';
import { addDonation } from './progress';
import { drawCarnet, carnetBlob, type CarnetData } from './carnet';
import { track } from './analytics';
import t from '../i18n/es';

const d = t.donate;
const form = document.querySelector<HTMLFormElement>('[data-donate]');

if (form) init(form);
initShareSite();

/** "¿Hoy no puedes poner una pieza?": compartir la campaña sin donar. */
function initShareSite() {
  const wa = document.querySelector<HTMLAnchorElement>('[data-share-site="whatsapp"]');
  const copy = document.querySelector<HTMLButtonElement>('[data-share-site="copy"]');
  const status = document.querySelector<HTMLElement>('[data-share-site-status]');
  if (wa) {
    wa.href = `https://wa.me/?text=${encodeURIComponent(d.shareMessage(shareLink('whatsapp-sin-donar')))}`;
    wa.addEventListener('click', () => track('share', { method: 'whatsapp', donated: false }));
  }
  copy?.addEventListener('click', async () => {
    const link = shareLink('copiar-enlace');
    try {
      await navigator.clipboard.writeText(link);
      if (status) status.textContent = d.shareCopied;
    } catch {
      if (status) status.textContent = link;
    }
    track('share', { method: 'copy', donated: false });
  });
}

function init(form: HTMLFormElement) {
  const q = <T extends HTMLElement = HTMLElement>(sel: string) => form.querySelector<T>(sel)!;
  const qa = <T extends HTMLElement = HTMLElement>(sel: string) => [...form.querySelectorAll<T>(sel)];
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;

  let submitting = false;

  const region = () => (form.querySelector<HTMLInputElement>('input[name=region]:checked')?.value ?? 'co') as Region;
  const currency = () => regions[region()].currency;
  const piece = (): Piece => pieces.find((p) => p.id === form.querySelector<HTMLInputElement>('input[name=piece]:checked')?.value) ?? pieces.find((p) => p.recommended)!;
  const frequency = () => (form.querySelector<HTMLInputElement>('input[name=frequency]:checked')?.value ?? 'once') as Frequency;

  // ---------- Montos ----------
  function amounts(): { amountCOP: number; amount: number } | { error: string } {
    const p = piece();
    const cur = currency();
    if (p.amount !== null) {
      return { amountCOP: p.amount, amount: cur === 'COP' ? p.amount : copToUSD(p.amount) };
    }
    const raw = Number(field('custom').value.replace(/\D/g, ''));
    if (!raw) return { error: d.customEmpty };
    const min = payments.minAmount[cur];
    if (raw < min) return { error: d.customMin(formatMoney(min, cur)) };
    return cur === 'COP' ? { amountCOP: raw, amount: raw } : { amountCOP: usdToCOP(raw), amount: raw };
  }

  function updatePrices() {
    const cur = currency();
    qa('[data-price]').forEach((el) => {
      const cop = Number(el.dataset.price);
      el.querySelector('[data-price-main]')!.textContent = cur === 'COP' ? formatCOP(cop) : formatUSD(copToUSD(cop));
      el.querySelector('[data-price-alt]')!.textContent =
        cur === 'COP' ? `${d.approx} ${formatUSD(copToUSD(cop))}` : `${d.approx} ${formatCOP(cop)} COP`;
    });
    q('[data-custom-currency]').textContent = cur === 'COP' ? 'COP $' : 'USD $';
    field('custom').placeholder = cur === 'COP' ? '80.000' : '25';
  }

  const money = (value: number, cur: 'COP' | 'USD') => (cur === 'COP' ? formatCOP(value) : formatUSDCents(value));

  function fee(amount: number) {
    return field('coverFee').checked ? feeCover(amount, currency()) : 0;
  }

  /** Única / mensual: cambia las piezas visibles y selecciona la recomendada para ese modo. */
  function applyFrequency() {
    const monthly = frequency() === 'monthly';
    form.classList.toggle('is-monthly', monthly);
    const recommended = pieces.find((p) => (monthly ? p.recommendedMonthly : p.recommended));
    qa<HTMLLabelElement>('[data-piece]').forEach((label) => {
      label.style.order = label.dataset.piece === recommended?.id ? '-1' : '';
    });
    const current = piece();
    if (monthly && current.monthly === false) select(recommended?.id);
    else if (current.amount !== null) select(recommended?.id);
  }

  function select(id?: string) {
    const input = form.querySelector<HTMLInputElement>(`input[name=piece][value="${id}"]`);
    if (input) input.checked = true;
    toggleCustom();
  }

  function toggleCustom() {
    const isCustom = piece().amount === null;
    q('[data-custom]').hidden = !isCustom;
    if (isCustom) field('custom').focus();
    setError('custom', '');
  }

  // ---------- Errores ----------
  function setError(name: string, msg: string) {
    const el = form.querySelector<HTMLElement>(`[data-error="${name}"]`);
    if (el) el.textContent = msg;
    const input = field(name);
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  // ---------- Pasos ----------
  function showStep(step: string) {
    qa('[data-step]').forEach((el) => (el.hidden = el.dataset.step !== step));
    const n = step === 'result' ? 4 : Number(step);
    qa('[data-stepper-item]').forEach((li) => {
      const i = Number(li.dataset.stepperItem);
      li.classList.toggle('is-current', i === n);
      li.classList.toggle('is-done', i < n);
      if (i === n) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    const target = q(`[data-step="${step}"]`);
    form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  }

  function validateStep1() {
    const a = amounts();
    if ('error' in a) {
      setError('custom', a.error);
      field('custom').focus();
      return false;
    }
    setError('custom', '');
    return true;
  }

  function validateStep2() {
    let ok = true;
    const email = field('email');
    if (!email.value.trim() || !email.checkValidity()) {
      setError('email', d.fields.emailError);
      ok = false;
    } else setError('email', '');
    if (!field('consent').checked) {
      setError('consent', d.fields.consentError);
      ok = false;
    } else setError('consent', '');
    if (field('certificate').checked && !field('docNumber').value.trim()) {
      setError('docNumber', d.fields.docError);
      ok = false;
    } else setError('docNumber', '');
    if (!ok) form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    return ok;
  }

  function fillSummary() {
    const p = piece();
    const a = amounts();
    if ('error' in a) return;
    const cur = currency();
    const monthly = frequency() === 'monthly';
    q('[data-summary-piece]').textContent = `${p.icon} ${p.label}`;
    q('[data-summary-amount]').textContent =
      formatMoney(a.amount, cur) + (cur === 'USD' ? ` (${d.approx} ${formatCOP(a.amountCOP)})` : '') + (monthly ? ` · ${d.confirm.monthlySuffix}` : '');
    const list = q('[data-impact]');
    list.replaceChildren(
      ...[...p.impact, ...(monthly ? [d.frequency.monthlyHelp] : [])].map((txt) => {
        const li = document.createElement('li');
        li.textContent = txt;
        return li;
      }),
    );
    const provider = providerFor(region());
    q('[data-summary-provider]').textContent = provider.label;
    q('[data-summary-methods]').textContent = provider.methods;
    updateTotal();
  }

  function updateTotal() {
    const a = amounts();
    if ('error' in a) return;
    const cur = currency();
    q('[data-fee-text]').textContent = d.confirm.fee(money(feeCover(a.amount, cur), cur));
    q('[data-summary-total]').textContent =
      money(a.amount + fee(a.amount), cur) + (frequency() === 'monthly' ? ` ${d.frequency.monthlyPrice}` : '');
  }

  // ---------- Pago ----------
  async function pay() {
    if (submitting || !validateStep1() || !validateStep2()) return;
    const a = amounts();
    if ('error' in a) return;
    submitting = true;
    const btn = q<HTMLButtonElement>('[data-confirm]');
    btn.disabled = true;

    const certificate = field('certificate').checked
      ? {
          name: field('certName').value.trim() || field('name').value.trim(),
          docType: (form.elements.namedItem('docType') as HTMLSelectElement).value,
          docNumber: field('docNumber').value.trim(),
        }
      : undefined;
    const order: DonationOrder = {
      reference: buildReference(a.amountCOP),
      amountCOP: a.amountCOP,
      amount: a.amount,
      fee: fee(a.amount),
      certificate,
      currency: currency(),
      frequency: frequency(),
      pieceId: piece().id,
      donor: {
        name: field('name').value.trim(),
        email: field('email').value.trim(),
        phone: field('phone').value.trim(),
        consent: field('consent').checked,
        showOnWall: field('wall').checked,
      },
    };

    try {
      const result = await providerFor(region()).pay(order);
      handleResult(result.status, order);
    } catch {
      handleResult('error', order);
    } finally {
      submitting = false;
      btn.disabled = false;
    }
  }

  function handleResult(status: string, order: DonationOrder) {
    if (status === 'cancelled') return; // el usuario cerró el checkout: sigue en el paso 3

    const msg = q('[data-result-msg]');
    const retry = q('[data-retry]');
    retry.hidden = status === 'approved' || status === 'pending';

    const value = order.amount + order.fee;
    if (status === 'approved') {
      track('purchase', {
        transaction_id: order.reference,
        value,
        currency: order.currency,
        piece: order.pieceId,
        frequency: order.frequency,
      });
      msg.textContent = d.approved;
      showStep('result');
      // Fase 2: el recaudo real lo suma el webhook; aquí se refleja en la sesión.
      addDonation(order.amountCOP);
      if (order.donor.showOnWall) addToWall(order);
      showThanks(order);
      return;
    }
    if (status !== 'pending') track('payment_failed', { status, value, currency: order.currency });
    msg.textContent = status === 'pending' ? d.pending : status === 'declined' ? d.declined : d.networkError;
    showStep('result');
  }

  // ---------- Eventos ----------
  form.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.name === 'region') {
      updatePrices();
      field('custom').value = '';
    }
    if (target.name === 'piece') toggleCustom();
    if (target.name === 'frequency') applyFrequency();
    if (target.name === 'piece' || target.name === 'frequency') {
      track('select_piece', { piece: piece().id, frequency: frequency(), currency: currency() });
    }
    if (target.name === 'certificate') q('[data-certificate]').hidden = !target.checked;
    if (target.name === 'coverFee') updateTotal();
  });

  field('custom').addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    input.value = digits ? Number(digits).toLocaleString('es-CO') : '';
    if (digits) setError('custom', '');
  });

  form.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-next],[data-prev],[data-retry],[data-restart]');
    if (!el) return;
    if (el.dataset.next === '2' && validateStep1()) {
      track('add_info', { piece: piece().id, frequency: frequency() });
      showStep('2');
    } else if (el.dataset.next === '3' && validateStep2()) {
      fillSummary();
      showStep('3');
      const a = amounts();
      if (!('error' in a)) track('begin_checkout', { value: a.amount, currency: currency(), piece: piece().id });
    } else if (el.dataset.prev) showStep(el.dataset.prev);
    else if (el.hasAttribute('data-retry')) showStep('3');
    else if (el.hasAttribute('data-restart')) {
      form.reset();
      updatePrices();
      applyFrequency();
      q('[data-certificate]').hidden = true;
      showStep('1');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    pay();
  });

  updatePrices();
  applyFrequency();
}

// ---------- Muro de héroes ----------
function addToWall(order: DonationOrder) {
  const wall = document.querySelector('[data-wall]');
  if (!wall) return;
  document.querySelector('[data-wall-empty]')?.remove();
  const li = document.createElement('li');
  const strong = document.createElement('strong');
  strong.textContent = order.donor.name || t.thanks.anonymous;
  li.append(strong, ` · ${pieces.find((p) => p.id === order.pieceId)?.icon ?? '⭐'}`);
  wall.prepend(li);
}

// ---------- Gracias + carnet + compartir ----------
async function showThanks(order: DonationOrder) {
  const section = document.querySelector<HTMLElement>('[data-thanks]');
  if (!section) return;
  const p = pieces.find((x) => x.id === order.pieceId)!;
  const name = order.donor.name || t.thanks.anonymous;

  section.hidden = false;
  section.querySelector('[data-thanks-speech]')!.innerHTML = `<p>${t.thanks.speech(escapeHTML(p.phrase))}</p>`;

  const data: CarnetData = {
    name,
    piece: p.label,
    pieceIcon: p.icon,
    amount: formatMoney(order.amount, order.currency),
    monthly: order.frequency === 'monthly',
    date: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
    id: order.reference,
  };

  const canvas = section.querySelector<HTMLCanvasElement>('[data-carnet]')!;
  canvas.setAttribute('aria-label', t.thanks.carnetAlt(name, p.phrase));
  await drawCarnet(canvas, data);

  const download = section.querySelector<HTMLAnchorElement>('[data-carnet-download]')!;
  download.href = canvas.toDataURL('image/png');

  setupShare(section, p.phrase, canvas);
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function shareLink(medium: string) {
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set('utm_source', 'carnet');
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', 'supercasa');
  return url.toString();
}

function setupShare(section: HTMLElement, phrase: string, canvas: HTMLCanvasElement) {
  const nets: Record<string, string> = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(t.share.whatsapp(phrase, shareLink('whatsapp')))}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(t.share.x(phrase, shareLink('x')))}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink('facebook'))}`,
  };
  section.querySelectorAll<HTMLAnchorElement>('[data-share-net]').forEach((a) => {
    a.href = nets[a.dataset.shareNet!];
    a.onclick = () => track('share', { method: a.dataset.shareNet, donated: true });
  });

  const status = section.querySelector<HTMLElement>('[data-share-status]')!;
  const igText = t.share.instagram(shareLink('instagram'));
  const igBtn = section.querySelector<HTMLButtonElement>('[data-share-instagram]')!;
  igBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(igText);
      status.textContent = t.thanks.copied;
    } catch {
      status.textContent = igText;
    }
  };

  const native = section.querySelector<HTMLButtonElement>('[data-share-native]')!;
  carnetBlob(canvas).then((blob) => {
    if (!blob) return;
    const file = new File([blob], 'carnet-heroe-supercasa.png', { type: 'image/png' });
    if (!navigator.canShare?.({ files: [file] })) return;
    native.hidden = false;
    native.onclick = () =>
      navigator.share({ files: [file], text: t.share.whatsapp(phrase, shareLink('native')) }).catch(() => {});
  });
}

function escapeHTML(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
