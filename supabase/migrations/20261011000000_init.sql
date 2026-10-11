-- LA SUPERCASA · Esquema inicial
-- Se aplica con `npm run db:migrate` (o pegándolo en el editor SQL de Supabase).
--
-- Seguridad: todas las tablas tienen RLS activado y NINGUNA política pública.
-- Solo el servidor de la landing (que se conecta con la cadena de conexión
-- privada, DATABASE_URL) puede leer y escribir. El navegador nunca habla con
-- la base de datos directamente.

create extension if not exists pgcrypto;

create type donation_status as enum ('pending', 'approved', 'declined', 'voided', 'error');
create type donation_frequency as enum ('once', 'monthly');
create type donation_source as enum ('wompi', 'paypal', 'manual', 'demo');
create type subscription_status as enum ('pending', 'active', 'past_due', 'cancelled', 'failed');

-- Plan Padrino: un aporte mensual con una fuente de pago guardada en Wompi.
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status subscription_status not null default 'pending',
  provider text not null default 'wompi',
  piece_id text not null,
  currency text not null default 'COP',
  amount_cop integer not null check (amount_cop > 0),
  -- monto cobrado cada mes en la moneda de la pasarela (pieza + comisión cubierta)
  charge_amount numeric(14, 2) not null check (charge_amount > 0),
  fee numeric(14, 2) not null default 0,
  donor_name text,
  donor_email text not null,
  donor_phone text,
  consent boolean not null,
  show_on_wall boolean not null default false,
  certificate jsonb,
  -- fuente de pago tokenizada en Wompi (nunca guardamos datos de tarjeta)
  payment_source_id text,
  payment_method text,
  card_brand text,
  card_last4 text,
  next_charge_on date,
  failed_attempts integer not null default 0,
  last_error text,
  cancel_token text not null unique default encode(gen_random_bytes(18), 'hex'),
  cancelled_at timestamptz
);

create index subscriptions_due_idx on subscriptions (next_charge_on) where status = 'active';

-- Cada aporte (único o un cobro mensual del Plan Padrino) es una fila.
create table donations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reference text not null unique,
  status donation_status not null default 'pending',
  source donation_source not null,
  frequency donation_frequency not null,
  subscription_id uuid references subscriptions (id) on delete set null,
  piece_id text not null,
  -- valor de la pieza en COP: es lo que suma al recaudo
  amount_cop integer not null check (amount_cop > 0),
  currency text not null,
  -- lo que se cobra en la moneda de la pasarela (pieza + comisión)
  charge_amount numeric(14, 2) not null check (charge_amount > 0),
  fee numeric(14, 2) not null default 0,
  donor_name text,
  donor_email text,
  donor_phone text,
  consent boolean not null,
  show_on_wall boolean not null default false,
  certificate jsonb,
  provider_transaction_id text,
  payment_method text,
  status_message text,
  approved_at timestamptz,
  -- aportes registrados a mano desde el panel (transferencias, efectivo)
  notes text,
  created_by text
);

create index donations_status_idx on donations (status, created_at desc);
create index donations_subscription_idx on donations (subscription_id);
create index donations_tx_idx on donations (provider_transaction_id);

-- Registro de todos los avisos (webhooks) recibidos, para auditoría.
create table payment_events (
  id bigserial primary key,
  received_at timestamptz not null default now(),
  provider text not null,
  event text,
  reference text,
  signature_valid boolean not null,
  payload jsonb not null
);

create index payment_events_reference_idx on payment_events (reference);

-- Recaudo público: suma de aportes aprobados y número de héroes (personas distintas).
create view campaign_progress as
select
  coalesce(sum(amount_cop), 0)::bigint as raised_cop,
  count(distinct coalesce(lower(donor_email), id::text))::integer as heroes,
  count(*)::integer as approved_donations
from donations
where status = 'approved';

-- Mantiene updated_at al día.
create function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger donations_touch before update on donations
  for each row execute function touch_updated_at();
create trigger subscriptions_touch before update on subscriptions
  for each row execute function touch_updated_at();

alter table subscriptions enable row level security;
alter table donations enable row level security;
alter table payment_events enable row level security;
