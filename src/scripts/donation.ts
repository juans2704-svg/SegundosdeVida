/**
 * Embudo de donación (brief §5 Sección 4 y §7.3):
 * A pieza → B frecuencia y datos → D impacto + "Confirmar con amor" → C checkout → resultado.
 */
import { pieces, type Piece } from '../config/campaign';
import { payments, regions, type Region } from '../config/payments';
import { formatCOP, formatMoney, formatUSD, copToUSD, usdToCOP } from '../lib/format';
import { buildReference, providerFor, type DonationOrder, type Frequency } from '../lib/payments';
import { addDonation } from './progress';
import { drawCarnet, carnetBlob, type CarnetData } from './carnet';
import t from '../i18n/es';

const d = t.donate;
const form = document.querySelector<HTMLFormElement>('[data-donate]');

if (form) init(form);

function init(form: HTMLFormElement) {
  const q = <T extends HTMLElement = HTMLElement>(sel: string) => form.querySelector<T>(sel)!;
  const qa = <T extends HTMLElement = HTMLElement>(sel: string) => [...form.querySelectorAll<T>(sel)];
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;

  let submitting = false;

  const region = () => (form.querySelector<HTMLInputElement>('input[name=region]:checked')?.value ?? 'co') as Region;
  const currency = () => regions[region()].currency;
  const piece = (): Piece => pieces.find((p) => p.id === form.querySelector<HTMLInputElement>('input[name=piece]:checked')?.value) ?? pieces[2];
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
  }

  // ---------- Pago ----------
  async function pay() {
    if (submitting || !validateStep1() || !validateStep2()) return;
    const a = amounts();
    if ('error' in a) return;
    submitting = true;
    const btn = q<HTMLButtonElement>('[data-confirm]');
    btn.disabled = true;

    const order: DonationOrder = {
      reference: buildReference(a.amountCOP),
      amountCOP: a.amountCOP,
      amount: a.amount,
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

    if (status === 'approved') {
      msg.textContent = d.approved;
      showStep('result');
      // Fase 2: el recaudo real lo suma el webhook; aquí se refleja en la sesión.
      addDonation(order.amountCOP);
      if (order.donor.showOnWall) addToWall(order);
      showThanks(order);
      return;
    }
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
    if (el.dataset.next === '2' && validateStep1()) showStep('2');
    else if (el.dataset.next === '3' && validateStep2()) {
      fillSummary();
      showStep('3');
    } else if (el.dataset.prev) showStep(el.dataset.prev);
    else if (el.hasAttribute('data-retry')) showStep('3');
    else if (el.hasAttribute('data-restart')) {
      form.reset();
      updatePrices();
      toggleCustom();
      showStep('1');
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    pay();
  });

  updatePrices();
  toggleCustom();
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
