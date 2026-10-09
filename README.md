# La SUPERCASA · Fundación Segundos de Vida

Landing de recaudación ($250.000.000 COP) para terminar la SUPERCASA, el albergue de los Super Calvitos en Bogotá.
Una sola página con scroll narrativo, la casa animada que avanza con el recaudo y un embudo de donación en 3 pasos.

## Cómo correrla

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # revisa el copy y genera /dist (sitio estático)
npm run preview
```

- `/?demo=1` muestra un control para ver la casa en todas sus etapas (0–100%).
- En modo `demo` (por defecto) los pagos se simulan con un modal: aprobado, pendiente, rechazado o error de red.

## Dónde se edita cada cosa

| Qué | Archivo |
|---|---|
| Meta, recaudado, héroes, etapas (umbral y % de presupuesto), piezas y montos, datos de la fundación | `src/config/campaign.ts` |
| Modo de pagos, tasa USD, montos mínimos, llaves Wompi/PayPal | `src/config/payments.ts` + `.env` |
| Todos los textos (guiones, botones, mensajes de error, mensajes para compartir) | `src/i18n/es.ts` |
| Artes oficiales (personajes, logo, dibujo de la casa) | `public/img/` + `src/config/characters.ts` |
| Colores y tipografía | `src/styles/global.css` (variables `:root`) |

`npm run build` falla si algún texto usa la palabra restringida del brief (§4.2).

## Arquitectura

```
src/
  config/          campaign.ts · payments.ts       ← datos editables
  i18n/es.ts       textos (en.ts tendrá la misma forma)
  components/
    sections/      Header, Hero, Story, Works, Donate, Thanks, Transparency, Footer
    house/         House.astro — la casa SVG que avanza cada 5% (data-at / data-until)
    characters/    Character.astro — artes oficiales de los Super Calvitos
    ui/            ProgressPanel, SpeechBubble, Toast, DemoPanel
  lib/
    progress.ts    % de avance, nivel de la casa, etapa actual
    format.ts      formato es-CO y conversión COP/USD
    payments/      contrato PaymentProvider + wompi.ts, paypal.ts, demo.ts
  scripts/         código del navegador: progress.ts, donation.ts, carnet.ts
  pages/           index, politica-de-datos, terminos
```

- **Estático** (Astro, sin framework de UI): ~13 KB de JS comprimido y SVG en línea, pensado para celulares de gama baja.
- **Casa por fases**: una ilustración cada 5 % (`public/img/casa/`, configuradas en `src/config/house.ts`), con fundido al cambiar de fase. Las especificaciones para el ilustrador están en `docs/brief-casa-fases.md`. Si falta una fase, se muestra la más cercana (y en modo demo, una etiqueta lo indica). Desde el 15 % la grúa y el andamio se mueven. Al cruzar una etapa (32 / 47 / 62 / 78 / 95 %) aparece además el mensaje de Calvito.
- **Donación**: región (Colombia → Wompi en COP · otro país → PayPal en USD), pieza o monto libre, única o Plan Padrino, datos con consentimiento (Ley 1581), confirmación con impacto y luego el checkout. Referencia `SC-{timestamp}-{monto}`.
- **Carnet de Héroe**: PNG 1080x1350 dibujado en `<canvas>`. Se puede descargar y compartir (Web Share API con archivo, o con enlaces para WhatsApp, X y Facebook, más el texto para Instagram copiado).

## Pendientes (datos de la fundación)

Todo lo marcado `PENDIENTE` en el código:

- [ ] Artes de los Super Calvitos en mayor resolución (ideal ≥ 800px, fondo transparente) y foto real de la obra
- [ ] Ilustraciones de la casa de 0 % a 45 % (`docs/brief-casa-fases.md`)
- [ ] Recaudado inicial y desglose real del presupuesto por etapa
- [ ] NIT, registro, correos de contacto y tesorería, redes sociales
- [ ] Textos legales: política de datos y términos de donación
- [ ] Tasa de referencia COP/USD
- [ ] Dominio definitivo (`astro.config.mjs`)

## Fase 2 (backend)

- Supabase: tablas `donations`, `campaign`, `subscribers`, `shares`. `lib/progress.ts` lee el recaudo en tiempo real.
- Edge Function que firma la integridad de Wompi (`/api/wompi/signature`) y webhook con verificación de firma.
- Plan Padrino: tokenización de Wompi y cobros recurrentes; suscripciones de PayPal.
- PayPal: implementar `lib/payments/paypal.ts` (o Stripe, con el mismo contrato).
- Panel de administración, emails (Resend/Brevo), carnet generado en el servidor, versión en inglés (`i18n/en.ts`).
