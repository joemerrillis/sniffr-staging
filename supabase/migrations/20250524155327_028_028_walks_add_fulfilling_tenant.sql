-- Add tenant_id columns to origin tables if not already present

alter table client_walk_windows
  add column if not exists tenant_id uuid references tenants(id);

alter table client_walk_requests
  add column if not exists tenant_id uuid references tenants(id);

alter table boardings
  add column if not exists tenant_id uuid references tenants(id);

alter table daycare_sessions
  add column if not exists tenant_id uuid references tenants(id);

-- RLS: Only allow clients to interact with their own records
-- and tenants to interact with windows assigned to them

-- For client_walk_windows
alter table client_walk_windows enable row level security;

create policy client_can_view_own_windows
  on client_walk_windows for select
  using (user_id = auth.uid());

create policy tenant_can_view_assigned_windows
  on client_walk_windows for select
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- For client_walk_requests
alter table client_walk_requests enable row level security;

create policy client_can_view_own_requests
  on client_walk_requests for select
  using (user_id = auth.uid());

create policy tenant_can_view_assigned_requests
  on client_walk_requests for select
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- For boardings
alter table boardings enable row level security;

create policy client_can_view_own_boardings
  on boardings for select
  using (user_id = auth.uid());

create policy tenant_can_view_assigned_boardings
  on boardings for select
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));

-- For daycare_sessions
alter table daycare_sessions enable row level security;

create policy client_can_view_own_daycare_sessions
  on daycare_sessions for select
  using (user_id = auth.uid());

create policy tenant_can_view_assigned_daycare_sessions
  on daycare_sessions for select
  using (tenant_id in (
    select tenant_id from users where id = auth.uid()
  ));
