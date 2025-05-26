-- employees
CREATE TABLE IF NOT EXISTS employees (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id)   ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- client_walkers
CREATE TABLE IF NOT EXISTS client_walkers (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID        NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  employee_id  UUID        NOT NULL REFERENCES employees(id)     ON DELETE CASCADE,
  met_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, employee_id)
);

-- tenant_clients
CREATE TABLE IF NOT EXISTS tenant_clients (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id)       ON DELETE CASCADE,
  client_id    UUID        NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  met_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted     BOOLEAN     NOT NULL DEFAULT FALSE,
  accepted_at  TIMESTAMPTZ,
  UNIQUE(tenant_id, client_id)
);
