# La SUPERCASA · Fundación Segundos de Vida

Landing de recaudación ($250.000.000 COP) para terminar la SUPERCASA, el albergue de los Super Calvitos en Bogotá.
Una sola página con scroll narrativo, la casa animada que avanza con el recaudo y un embudo de donación en 3 pasos.

## Cómo correrla

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # revisa el copy y genera /dist
npm start          # servidor Node con la página y la API
npm test           # pruebas automáticas
```

- `/?demo=1` muestra un control para ver la casa en todas sus etapas (0–100%).
- En modo `demo` (por defecto) los pagos se simulan con un modal: aprobado, pendiente, rechazado o error de red.

## Dónde se edita cada cosa

| Qué | Archivo |
|---|---|
| Meta, recaudado, héroes, etapas (umbral y % de presupuesto), piezas y montos, datos de la fundación | `src/config/campaign.ts` |
| Modo de pagos, tasa USD, montos mínimos, comisiones, llaves Wompi/PayPal | `src/config/payments.ts` + `.env` |
| Fecha límite, monto desde el que se muestra lo recaudado, donación igualada | `src/config/campaign.ts` (`deadline`, `showRaisedFrom`, `matching`) |
| GA4 y Meta Pixel | `.env` (`PUBLIC_GA4_ID`, `PUBLIC_META_PIXEL_ID`) — ver `src/config/analytics.ts` |
| Todos los textos (guiones, botones, mensajes de error, mensajes para compartir) | `src/i18n/es.ts` |
| Artes oficiales (personajes, logo, dibujo de la casa) | `public/img/` + `src/config/characters.ts` (los recortes sin fondo están en `public/img/calvitos/`) |
| Colores y tipografía | `src/styles/global.css` (variables `:root`) |

`npm run build` falla si algún texto usa la palabra restringida del brief (§4.2).

## Arquitectura

```
src/
  config/          campaign.ts · payments.ts       ← datos editables
  i18n/es.ts       textos (en.ts tendrá la misma forma)
  components/
    sections/      Header, Hero, Story, Works, Donate, Thanks, Transparency, Footer
    house/         HouseFrames.astro — la casa ilustrada por fases (una imagen cada 5 %)
    characters/    Character.astro — artes oficiales de los Super Calvitos
    ui/            ProgressPanel, SpeechBubble, Toast, DemoPanel
  lib/
    progress.ts    % de avance, nivel de la casa, etapa actual
    format.ts      formato es-CO y conversión COP/USD
    payments/      contrato PaymentProvider + wompi.ts, paypal.ts, demo.ts
  scripts/         código del navegador: progress.ts, donation.ts, carnet.ts
  pages/           index, politica-de-datos, terminos
```

- **Estático + servidor** (Astro, sin framework de UI): la página se sirve estática desde CDN y solo `/api`, `/admin` y `/padrino` corren en el servidor.
- **Casa por fases**: una ilustración cada 5 % (`public/img/casa/`, configuradas en `src/config/house.ts`), con fundido al cambiar de fase. Las especificaciones para el ilustrador están en `docs/brief-casa-fases.md`. Las 21 fases (0 a 100 %) están alineadas entre sí. Al cruzar una etapa (32 / 47 / 62 / 78 / 95 %) aparece además el mensaje de Calvito.
- **Donación**: región (Colombia → Wompi en COP · otro país → PayPal en USD), pieza o monto libre, única o Plan Padrino, datos con consentimiento (Ley 1581), confirmación con impacto y luego el checkout. Referencia `SC-{timestamp}-{monto}`.
- **Conversión**: botón principal en la primera pantalla, la donación justo después de la portada y barra fija "Pon tu pieza" en celular. La portada muestra la cuenta regresiva al 30 de noviembre y la próxima pieza de la casa con lo que falta (cada 5 % = $12.500.000). Mientras lo recaudado sea menor a `showRaisedFrom`, se muestra "La campaña acaba de arrancar" en vez de "$0".
- **Formulario**: única o Plan Padrino desde el primer paso (con pieza recomendada propia), opción de cubrir la comisión (marcada por defecto), certificado de donación para persona o empresa, franja de confianza y "¿Hoy no puedes? Comparte".
- **Medición**: eventos `view_donate`, `select_piece`, `add_info`, `begin_checkout`, `purchase`, `payment_failed` y `share` en GA4 y Meta Pixel (`src/scripts/analytics.ts`), cargados solo después de aceptar el aviso de cookies.
- **Carnet de Héroe**: PNG 1080x1350 dibujado en `<canvas>`. Se puede descargar y compartir (Web Share API con archivo, o con enlaces para WhatsApp, X y Facebook, más el texto para Instagram copiado).

## Pendientes (datos de la fundación)

Todo lo marcado `PENDIENTE` en el código:

- [ ] Artes de los Super Calvitos en mayor resolución (ideal ≥ 800px, fondo transparente) y foto real de la obra
- [ ] Recaudado inicial y desglose real del presupuesto por etapa
- [x] NIT, régimen, registro, dirección, correo y teléfono (certificado de Cámara de Comercio y RUT)
- [x] Redes sociales (Instagram, Facebook, TikTok, YouTube, Spotify)
- [ ] Correo de tesorería (si es distinto)
- [ ] Textos legales: política de datos y términos de donación
- [ ] Tasa de referencia COP/USD
- [ ] Dominio definitivo (`astro.config.mjs`)
- [ ] WhatsApp de la campaña (`foundation.whatsapp`): activa el botón de WhatsApp para empresas
- [ ] IDs de GA4 y Meta Pixel
- [x] Tarifa de Wompi (2,65 % + $700 + IVA)
- [ ] Tarifa real de PayPal

## Fase 2: servidor y pagos

Ya implementado en modo de pruebas. La guía completa de puesta en marcha (Supabase, Wompi, Vercel y la checklist del sandbox) está en [`docs/fase-2-servidor.md`](docs/fase-2-servidor.md).

- **Base de datos**: PostgreSQL / Supabase (`supabase/migrations/`, `npm run db:migrate`).
- **Servidor**: endpoints en `src/pages/api/`, lógica en `src/server/`. El monto lo calcula el servidor (`src/lib/pricing.ts`) y una donación solo se aprueba cuando Wompi lo confirma.
- **Plan Padrino**: tarjeta tokenizada por Wompi, primer cobro inmediato y cobros mensuales con un cron diario (`vercel.json`). Hace 3 reintentos y luego pausa el plan; el padrino puede cancelarlo.
- **Panel** `/admin` (roles admin y editor): recaudo, donaciones, padrinos, aportes manuales y exportación CSV.
- **Pruebas**: `npm test` (con `TEST_DATABASE_URL` también contra PostgreSQL).

Pendiente: correos de confirmación, PayPal y proceso de certificados.
