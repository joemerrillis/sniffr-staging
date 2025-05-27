-- Add user_id to daycare_sessions
alter table daycare_sessions
  add column if not exists user_id uuid references users(id);

-- Optional: If you want to enforce presence
-- alter table daycare_sessions alter column user_id set not null;
