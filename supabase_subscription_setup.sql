-- Skapa subscriptions-tabell för att hantera användarabonnemang
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  is_active boolean not null default false,
  plan text check (plan in ('monthly', 'semiannual', 'annual')),
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Skapa index för snabbare queries
create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_subscriptions_stripe_customer_id on subscriptions(stripe_customer_id);
create index idx_subscriptions_is_active on subscriptions(is_active);

-- Skapa RLS (Row Level Security) policies
alter table subscriptions enable row level security;

-- Policy: Användare kan bara se sina egna prenumerationer
create policy "Users can view own subscriptions" on subscriptions
  for select using (auth.uid() = user_id);

-- Policy: Användare kan bara uppdatera sina egna prenumerationer
create policy "Users can update own subscriptions" on subscriptions
  for update using (auth.uid() = user_id);

-- Policy: Endast autentiserade användare kan skapa prenumerationer
create policy "Authenticated users can create subscriptions" on subscriptions
  for insert with check (auth.uid() = user_id);

-- Skapa trigger för att uppdatera updated_at automatiskt
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_updated_at_column();

-- Lägg till kommentarer för dokumentation
comment on table subscriptions is 'Hanterar användarabonnemang och Stripe-integration';
comment on column subscriptions.plan is 'Abonnemangstyp: monthly, semiannual, annual';
comment on column subscriptions.is_active is 'Om abonnemanget är aktivt';
comment on column subscriptions.stripe_customer_id is 'Stripe Customer ID';
comment on column subscriptions.stripe_subscription_id is 'Stripe Subscription ID';
comment on column subscriptions.trial_ends_at is 'När provperioden slutar';