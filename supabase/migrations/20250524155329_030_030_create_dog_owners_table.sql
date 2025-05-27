-- Create dog_owners table for households and co-owners/editors/viewers
create table if not exists dog_owners (
  dog_id    uuid references dogs(id) on delete cascade,
  user_id   uuid references users(id) on delete cascade,
  role      text not null check (role in ('owner', 'editor', 'viewer')),
  added_at  timestamptz not null default now(),
  primary key (dog_id, user_id)
);
