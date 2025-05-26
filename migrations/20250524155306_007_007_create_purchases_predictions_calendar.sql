-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  type           purchase_type   NOT NULL,
  amount         NUMERIC         NOT NULL,
  status         purchase_status NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Walk predictions
CREATE TABLE IF NOT EXISTS walk_predictions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id            UUID REFERENCES users(id) ON DELETE SET NULL,
  week_start         DATE    NOT NULL,
  recommended_walks  JSONB,
  confirmed          BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Calendar connections
CREATE TABLE IF NOT EXISTS calendar_connections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  provider       calendar_provider NOT NULL,
  access_token   TEXT               NOT NULL,
  refresh_token  TEXT               NOT NULL,
  last_synced    TIMESTAMP WITH TIME ZONE,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  service_type       TEXT      NOT NULL,
  walk_id            UUID REFERENCES walks(id) ON DELETE SET NULL,
  boarding_id        UUID REFERENCES boardings(id) ON DELETE SET NULL,
  calendar_event_id  TEXT      NOT NULL UNIQUE,
  status             calendar_event_status NOT NULL DEFAULT 'confirmed',
  created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
