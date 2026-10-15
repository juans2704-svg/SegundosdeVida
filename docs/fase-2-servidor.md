# Fase 2 · Servidor, base de datos y pagos

Guía para poner en marcha los pagos reales de la SUPERCASA: Wompi (donación única y Plan Padrino mensual), base de datos y panel.

## Estado actual (11 oct 2026)

- **Supabase:** proyecto `supercasa` (organización KavanahOrg, us-east-1). Esquema aplicado.
- **Vercel:** proyecto `supercasa` (equipo Spartanos), conectado al repositorio. Cada push publica.
- **Conexión:** la integración Supabase ↔ Vercel crea `POSTGRES_URL` (solo Producción); el servidor la usa si no hay `DATABASE_URL`.
- **Variables listas:** `POSTGRES_URL`, `PUBLIC_PAYMENTS_MODE=live`, `CRON_SECRET`.
- **PayPal (exterior, USD):** enlace de pago `https://www.paypal.com/ncp/payment/ULLP6VT522LW6` en `src/config/payments.ts` (o `PUBLIC_PAYPAL_LINK`). El aporte queda *pendiente* y el admin lo confirma en `/admin` con "✓ Llegó a PayPal" al verlo en la cuenta de PayPal; solo entonces suma al recaudo. Para confirmación automática haría falta la API de PayPal (Client ID + Secret y webhooks).
- **Faltan:** `ADMIN_PASSWORD`, `EDITOR_PASSWORD` (panel `/admin`) y las llaves de Wompi. Sin llaves, Producción muestra los pagos "en mantenimiento".
- **Protección de Vercel:** activa en las direcciones `*.vercel.app`; el público no las ve hasta conectar el dominio propio o cambiar *Deployment Protection* a "Only Preview Deployments".

## Cómo funciona

```
Navegador ──► /api/donations ─────► crea la donación "pendiente" y la firma
    │                                (el servidor calcula el monto: nadie puede alterarlo)
    ├──► Checkout de Wompi ───────► la persona paga (tarjeta, PSE, Nequi, Daviplata, efectivo)
    │
Wompi ─────► /api/wompi/webhook ──► aviso firmado: aprobada / rechazada
                                     → solo aquí la donación suma al recaudo
Navegador ──► /api/donations/:ref ► consulta el estado (y le pregunta a Wompi si sigue pendiente)

Plan Padrino:
Navegador ──► widget de Wompi (tokenizar tarjeta) ──► /api/subscriptions
              → guarda la fuente de pago en Wompi y cobra el primer mes
Cron diario ─► /api/cron/charge-subscriptions ──► cobra los planes que vencen ese día
              → 3 intentos con 3 días de diferencia; luego el plan se pausa
```

| Endpoint | Para qué |
|---|---|
| `GET /api/progress` | Recaudo, héroes y muro (la portada lo consulta cada minuto) |
| `POST /api/donations` | Crea una donación única y devuelve la firma para el checkout |
| `GET /api/donations/:referencia` | Estado de una donación (sin datos personales) |
| `POST /api/wompi/webhook` | Avisos de Wompi (verifica la firma) |
| `GET /api/wompi/transaction?id=` | Resultado al volver de PSE / Bancolombia |
| `POST /api/subscriptions` | Alta del Plan Padrino + primer cobro |
| `POST /api/subscriptions/cancel` | Cancelación con el enlace personal del padrino |
| `GET /api/cron/charge-subscriptions` | Cobros mensuales (requiere `CRON_SECRET`) |
| `/admin` | Panel: recaudo, donaciones, padrinos, aportes manuales y CSV |
| `/padrino/cancelar?t=…` | Página donde el padrino cancela su plan |
| `POST /api/dev/simulate` | Solo sin llaves de Wompi: simula resultados para probar |

## Modos

| Situación | Qué pasa |
|---|---|
| Sin `WOMPI_PRIVATE_KEY` | **Pruebas simuladas**: un recuadro deja elegir el resultado (aprobado, rechazado…) y el servidor lo procesa como un aviso real de Wompi. No se cobra nada. |
| Llaves `pub_test_` / `prv_test_` | **Sandbox de Wompi**: checkout real de Wompi con tarjetas de prueba. No se cobra nada. |
| Llaves `pub_prod_` / `prv_prod_` | **Producción**: cobros reales. |
| Sin `DATABASE_URL` | Los datos se guardan en memoria y se pierden al reiniciar (solo para desarrollo). |
| Sin servidor (sitio estático) | La página simula todo en el navegador, como la vista previa. |

Las donaciones de prueba quedan marcadas con origen `demo`. Antes del lanzamiento se borran con `npm run db:clear-demo`.

## Puesta en marcha

### 1. Base de datos (Supabase)
1. Crear un proyecto en [supabase.com](https://supabase.com), región **São Paulo** (la más cercana a Colombia).
2. Copiar la cadena de conexión: *Project Settings → Database → Connection string → Transaction pooler* (puerto **6543**).
3. Crear las tablas:
   ```bash
   DATABASE_URL="postgresql://…:6543/postgres" npm run db:migrate
   ```
   Otra opción es pegar `supabase/migrations/20261011000000_init.sql` en el editor SQL de Supabase.

Todas las tablas tienen seguridad por filas (RLS) activada y sin permisos públicos: solo el servidor puede leerlas y escribirlas.

### 2. Wompi
1. Crear la cuenta de comercio (Plan Avanzado) y completar la verificación.
2. En *Desarrolladores*, copiar las llaves de **pruebas**: pública, privada, secreto de integridad y secreto de eventos.
3. Configurar la **URL de eventos**: `https://<dominio>/api/wompi/webhook`.
4. Pedir a Wompi que habilite los **pagos recurrentes con fuentes de pago** (tokenización), necesarios para el Plan Padrino.

### 3. Publicación (Vercel)
1. Importar el repositorio en [vercel.com](https://vercel.com). Astro se detecta solo; el adaptador de Vercel se activa automáticamente.
2. Agregar las variables de `.env.example`:
   `WOMPI_*`, `DATABASE_URL`, `ADMIN_PASSWORD`, `EDITOR_PASSWORD`, `CRON_SECRET` (un texto largo al azar) y `PUBLIC_PAYMENTS_MODE=live`.
3. El cron de `vercel.json` cobra los planes todos los días a las 9:00 a. m. de Bogotá.
4. Conectar el dominio propio en *Settings → Domains* y actualizar `site` en `astro.config.mjs`.

Otra opción, en cualquier servidor con Node 20 o superior: `npm run build && npm start`, con un cron externo que llame al endpoint de cobros enviando `Authorization: Bearer <CRON_SECRET>`.

## Pruebas en el sandbox de Wompi (antes de producción)

Tarjetas y números de prueba de Wompi:

| Medio | Dato | Resultado |
|---|---|---|
| Tarjeta | `4242 4242 4242 4242` (cualquier fecha futura y CVC) | Aprobada |
| Tarjeta | `4111 1111 1111 1111` | Rechazada |
| Nequi | `3991111111` | Aprobada |
| Nequi | `3992222222` | Rechazada |
| PSE | Banco de pruebas | Permite elegir el resultado |

**Checklist:**
- [ ] Donación única con tarjeta aprobada: aparece "Aprobada" en `/admin` y sube el recaudo.
- [ ] Tarjeta rechazada: queda "Rechazada" y no suma.
- [ ] PSE: al volver del banco se muestra el resultado y el carnet.
- [ ] Llega el aviso al webhook (`payment_events` con `signature_valid = true`). **Verificar la firma de los avisos** con un aviso real.
- [ ] Plan Padrino con `4242…`: el plan queda "Activo", con próximo cobro el mes siguiente. **Verificar** que el widget en modo `tokenize` devuelve el token y que Wompi acepta la fuente de pago y el cobro recurrente (`src/server/wompi.ts`, `src/lib/payments/wompi.ts`).
- [ ] Cron: llamar a `/api/cron/charge-subscriptions` con la fecha del próximo cobro (o ajustar la fecha en la base) y comprobar el segundo cobro.
- [ ] Cancelar desde el enlace de `/admin` y comprobar que no se vuelve a cobrar.
- [ ] Aporte manual desde `/admin` suma al recaudo.
- [ ] Exportar el CSV.
- [ ] `npm run db:clear-demo` antes del lanzamiento.

## Desarrollo local

```bash
npm install
npm run dev                         # sin variables: pagos simulados y datos en memoria
npm test                            # pruebas automáticas
TEST_DATABASE_URL=postgres://… npm test   # incluye las pruebas contra PostgreSQL
```

## Pendiente para fases siguientes
- **Correos**: confirmación con comprobante, carnet y enlace de cancelación del Plan Padrino (Resend o Brevo). Mientras tanto, el enlace se copia desde `/admin`.
- **PayPal** para donantes del exterior. Hoy el servidor responde "disponible muy pronto" en producción.
- **Certificados de donación**: el formulario ya guarda los datos; falta definir el proceso con el contador.
