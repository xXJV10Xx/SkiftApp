-- Tabell för företag
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  created_at timestamp default now()
);

-- Tabell för skiftlag
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  name text not null,
  created_at timestamp default now()
);

-- Tabell för skift per dag
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id),
  date date not null,
  shift_type text not null, -- F, E, N, L
  time_range text,          -- T.ex. 06–14
  created_at timestamp default now()
);