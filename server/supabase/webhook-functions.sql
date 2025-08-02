-- Supabase Edge Function för att trigga vid nya skift
create or replace function notify_new_shift()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://your-backend.com/api/notify',
    headers := json_build_object('Content-Type', 'application/json'),
    body := json_build_object(
      'shift_id', NEW.id,
      'date', NEW.date,
      'team_id', NEW.team_id
    )::text
  );
  return NEW;
end;
$$ language plpgsql;

-- Lägg till trigger
create trigger on_new_shift
after insert on shifts
for each row execute procedure notify_new_shift();