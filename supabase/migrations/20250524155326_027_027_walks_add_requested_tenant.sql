-- Enable RLS for walk_delegations and meet_and_greets

alter table walk_delegations enable row level security;
alter table meet_and_greets enable row level security;

-- Only tenants or clients involved can see delegations
create policy if not exists can_view_own_delegations
  on walk_delegations for select
  using (
    client_id = auth.uid()
    or original_tenant_id in (select tenant_id from users where id = auth.uid())
    or delegate_tenant_id in (select tenant_id from users where id = auth.uid())
  );

-- Only involved parties can view meet and greets
create policy if not exists can_view_own_meet_and_greets
  on meet_and_greets for select
  using (
    client_id = auth.uid()
    or primary_tenant_id in (select tenant_id from users where id = auth.uid())
    or delegate_tenant_id in (select tenant_id from users where id = auth.uid())
  );
