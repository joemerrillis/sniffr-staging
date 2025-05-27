-- Create meet_and_greets table for introductions between tenants and clients

create table if not exists meet_and_greets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references users(id),
  primary_tenant_id uuid references tenants(id),
  delegate_tenant_id uuid references tenants(id),
  status text not null, -- 'pending', 'scheduled', 'completed', 'cancelled'
  scheduled_for timestamptz,
  location text,
  notes text,
  created_at timestamptz not null default now()
);
