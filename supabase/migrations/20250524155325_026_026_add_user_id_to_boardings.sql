-- Add user_id to boardings
alter table boardings
  add column if not exists user_id uuid references users(id);

-- Optional: If you want to enforce presence
-- alter table boardings alter column user_id set not null;
