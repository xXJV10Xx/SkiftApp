-- Skapar tabeller för skiftschema.se-data

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  name text not null
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id) on delete cascade,
  name text not null
);

create table shifts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  date date not null,
  shift_type text not null,  -- F, E, N, L
  start_time time,
  end_time time
);