-- Create walk_delegations table for tenant handoff/approval chains

create table if not exists walk_delegations (
  id uuid primary key default gen_random_uuid(),
  walk_window_id uuid references client_walk_windows(id),
  original_tenant_id uuid references tenants(id),
  delegate_tenant_id uuid references tenants(id),
  client_id uuid references users(id),
  status text not null, -- e.g. 'proposed', 'client_approval_pending', 'active', 'rejected'
  proposed_by uuid references tenants(id), -- Who initiated the delegation
  proposed_at timestamptz not null default now(),
  accepted_by_delegate timestamptz,
  approved_by_client timestamptz,
  meet_and_greet_required boolean not null default false,
  meet_and_greet_id uuid references meet_and_greets(id),
  notes text
);
