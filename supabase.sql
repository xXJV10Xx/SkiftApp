create table if not exists shift_schedules (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  department text not null,
  team text not null,
  date date not null,
  shift text not null, -- t.ex. F, E, N
  shift_time text not null, -- t.ex. 06:00-14:00
  source text default 'skiftschema.se',
  created_at timestamptz default now()
);

create index if not exists idx_company on shift_schedules(company);
create index if not exists idx_team on shift_schedules(team);