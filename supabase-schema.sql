-- 🔐 Google tokens tabell
create table google_tokens (
  id uuid primary key default uuid_generate_v4(),
  user_email text not null,
  user_name text,
  access_token text not null,
  refresh_token text,
  expires_at bigint,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 📅 Kalenderhändelser tabell
create table calendar_events (
  id uuid primary key default uuid_generate_v4(),
  google_event_id text unique not null,
  user_email text not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text,
  attendees jsonb default '[]',
  google_calendar_link text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 🏢 Skift/arbetspass tabell
create table shifts (
  id uuid primary key default uuid_generate_v4(),
  user_email text not null,
  title text not null,
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  location text,
  hourly_rate decimal(10,2),
  total_hours decimal(5,2),
  total_pay decimal(10,2),
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  google_event_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 🔔 Notifikationer tabell
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_email text not null,
  title text not null,
  body text not null,
  data jsonb default '{}',
  read boolean default false,
  sent_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- 👤 Användarprofiler tabell
create table user_profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  avatar_url text,
  default_hourly_rate decimal(10,2),
  default_location text,
  timezone text default 'Europe/Stockholm',
  notification_preferences jsonb default '{"email": true, "push": true, "calendar": true}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 💼 Arbetsgivare/klienter tabell
create table employers (
  id uuid primary key default uuid_generate_v4(),
  user_email text not null,
  name text not null,
  contact_email text,
  contact_phone text,
  address text,
  hourly_rate decimal(10,2),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 💰 Lön/betalningar tabell
create table payments (
  id uuid primary key default uuid_generate_v4(),
  user_email text not null,
  shift_id uuid references shifts(id),
  employer_id uuid references employers(id),
  amount decimal(10,2) not null,
  payment_date date,
  status text default 'pending' check (status in ('pending', 'paid', 'overdue')),
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 📊 Statistik/rapporter vy
create view shift_statistics as
select 
  user_email,
  date_trunc('month', start_time) as month,
  count(*) as total_shifts,
  sum(total_hours) as total_hours,
  sum(total_pay) as total_earnings,
  avg(hourly_rate) as avg_hourly_rate
from shifts 
where status = 'completed'
group by user_email, date_trunc('month', start_time);

-- Index för prestanda
create index idx_google_tokens_user_email on google_tokens(user_email);
create index idx_calendar_events_user_email on calendar_events(user_email);
create index idx_calendar_events_start_time on calendar_events(start_time);
create index idx_shifts_user_email on shifts(user_email);
create index idx_shifts_start_time on shifts(start_time);
create index idx_notifications_user_email on notifications(user_email);
create index idx_notifications_read on notifications(read);

-- RLS (Row Level Security) policies
alter table google_tokens enable row level security;
alter table calendar_events enable row level security;
alter table shifts enable row level security;
alter table notifications enable row level security;
alter table user_profiles enable row level security;
alter table employers enable row level security;
alter table payments enable row level security;

-- Policies för att användare endast kan se sina egna data
create policy "Users can view own tokens" on google_tokens for select using (user_email = current_user);
create policy "Users can insert own tokens" on google_tokens for insert with check (user_email = current_user);
create policy "Users can update own tokens" on google_tokens for update using (user_email = current_user);

create policy "Users can view own calendar events" on calendar_events for select using (user_email = current_user);
create policy "Users can insert own calendar events" on calendar_events for insert with check (user_email = current_user);
create policy "Users can update own calendar events" on calendar_events for update using (user_email = current_user);
create policy "Users can delete own calendar events" on calendar_events for delete using (user_email = current_user);

create policy "Users can view own shifts" on shifts for select using (user_email = current_user);
create policy "Users can insert own shifts" on shifts for insert with check (user_email = current_user);
create policy "Users can update own shifts" on shifts for update using (user_email = current_user);
create policy "Users can delete own shifts" on shifts for delete using (user_email = current_user);

-- Funktioner för automatisk uppdatering av updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

-- Triggers för updated_at
create trigger update_google_tokens_updated_at before update on google_tokens for each row execute procedure update_updated_at_column();
create trigger update_calendar_events_updated_at before update on calendar_events for each row execute procedure update_updated_at_column();
create trigger update_shifts_updated_at before update on shifts for each row execute procedure update_updated_at_column();
create trigger update_user_profiles_updated_at before update on user_profiles for each row execute procedure update_updated_at_column();
create trigger update_employers_updated_at before update on employers for each row execute procedure update_updated_at_column();
create trigger update_payments_updated_at before update on payments for each row execute procedure update_updated_at_column();