-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Companies table (om den inte redan finns)
create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp default now()
);

-- Departments table (om den inte redan finns)
create table if not exists departments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  name text not null,
  created_at timestamp default now()
);

-- Shift teams table (om den inte redan finns)
create table if not exists shift_teams (
  id uuid primary key default uuid_generate_v4(),
  department_id uuid references departments(id),
  name text not null,
  created_at timestamp default now()
);

-- Users table (om den inte redan finns)
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  avatar_url text,
  company_id uuid references companies(id),
  department_id uuid references departments(id),
  created_at timestamp default now()
);

-- Gruppchatt
create table if not exists chat_groups (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  department_id uuid references departments(id),
  shift_team_id uuid references shift_teams(id),
  name text not null,
  created_at timestamp default now()
);

-- Gruppmedlemmar
create table if not exists chat_group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references chat_groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  is_online boolean default false,
  joined_at timestamp default now(),
  unique(group_id, user_id)
);

-- Meddelanden
create table if not exists chat_messages (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references chat_groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  content text not null,
  type text default 'text', -- text, image, file, form
  form_type text, -- extra_work, shift_handover, breakdown
  metadata jsonb,
  created_at timestamp default now()
);

-- Privata meddelanden
create table if not exists private_messages (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references users(id) on delete cascade,
  to_user_id uuid references users(id) on delete cascade,
  content text not null,
  related_message_id uuid references chat_messages(id),
  read_at timestamp,
  created_at timestamp default now()
);

-- Privata chattar (för att gruppera privata meddelanden)
create table if not exists private_chats (
  id uuid primary key default uuid_generate_v4(),
  user1_id uuid references users(id) on delete cascade,
  user2_id uuid references users(id) on delete cascade,
  last_message_at timestamp default now(),
  created_at timestamp default now(),
  unique(user1_id, user2_id)
);

-- Indexes för prestanda
create index if not exists idx_chat_messages_group_created on chat_messages(group_id, created_at desc);
create index if not exists idx_chat_messages_user on chat_messages(user_id);
create index if not exists idx_chat_group_members_group on chat_group_members(group_id);
create index if not exists idx_chat_group_members_user on chat_group_members(user_id);
create index if not exists idx_private_messages_to_user on private_messages(to_user_id, created_at desc);
create index if not exists idx_private_messages_from_user on private_messages(from_user_id, created_at desc);

-- Row Level Security (RLS) policies
alter table chat_groups enable row level security;
alter table chat_group_members enable row level security;
alter table chat_messages enable row level security;
alter table private_messages enable row level security;
alter table private_chats enable row level security;

-- Policies för chat_groups
create policy "Users can view groups they are members of" on chat_groups
  for select using (
    id in (
      select group_id from chat_group_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can create groups" on chat_groups
  for insert with check (true);

-- Policies för chat_group_members
create policy "Users can view group members for groups they belong to" on chat_group_members
  for select using (
    group_id in (
      select group_id from chat_group_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can join groups" on chat_group_members
  for insert with check (true);

create policy "Users can update their own membership status" on chat_group_members
  for update using (user_id = auth.uid());

-- Policies för chat_messages
create policy "Users can view messages in groups they belong to" on chat_messages
  for select using (
    group_id in (
      select group_id from chat_group_members 
      where user_id = auth.uid()
    )
  );

create policy "Users can send messages to groups they belong to" on chat_messages
  for insert with check (
    group_id in (
      select group_id from chat_group_members 
      where user_id = auth.uid()
    )
  );

-- Policies för private_messages
create policy "Users can view their private messages" on private_messages
  for select using (
    from_user_id = auth.uid() or to_user_id = auth.uid()
  );

create policy "Users can send private messages" on private_messages
  for insert with check (from_user_id = auth.uid());

create policy "Users can update read status of messages to them" on private_messages
  for update using (to_user_id = auth.uid());

-- Policies för private_chats
create policy "Users can view their private chats" on private_chats
  for select using (
    user1_id = auth.uid() or user2_id = auth.uid()
  );

create policy "Users can create private chats" on private_chats
  for insert with check (
    user1_id = auth.uid() or user2_id = auth.uid()
  );

-- Funktioner för att hantera privata chattar
create or replace function get_or_create_private_chat(other_user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  chat_id uuid;
  current_user_id uuid := auth.uid();
begin
  -- Försök hitta befintlig chatt
  select id into chat_id
  from private_chats
  where (user1_id = current_user_id and user2_id = other_user_id)
     or (user1_id = other_user_id and user2_id = current_user_id);
  
  -- Om ingen chatt finns, skapa en ny
  if chat_id is null then
    insert into private_chats (user1_id, user2_id)
    values (
      least(current_user_id, other_user_id),
      greatest(current_user_id, other_user_id)
    )
    returning id into chat_id;
  end if;
  
  return chat_id;
end;
$$;

-- Trigger för att uppdatera last_message_at i private_chats
create or replace function update_private_chat_timestamp()
returns trigger
language plpgsql
as $$
begin
  update private_chats
  set last_message_at = now()
  where (user1_id = NEW.from_user_id and user2_id = NEW.to_user_id)
     or (user1_id = NEW.to_user_id and user2_id = NEW.from_user_id);
  
  return NEW;
end;
$$;

create trigger private_message_timestamp_trigger
  after insert on private_messages
  for each row execute function update_private_chat_timestamp();

-- Exempel data (valfritt)
insert into companies (name) values 
  ('Volvo Cars'),
  ('SSAB'),
  ('SKF')
on conflict do nothing;

insert into departments (company_id, name) 
select c.id, d.name
from companies c
cross join (values 
  ('Produktion'),
  ('Underhåll'),
  ('Kvalitet'),
  ('Logistik')
) as d(name)
on conflict do nothing;

insert into shift_teams (department_id, name)
select d.id, t.name
from departments d
cross join (values 
  ('Dagskift A'),
  ('Dagskift B'),
  ('Kvällskift'),
  ('Nattskift')
) as t(name)
on conflict do nothing;