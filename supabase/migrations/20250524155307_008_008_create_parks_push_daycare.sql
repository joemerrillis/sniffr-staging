-- Parks
CREATE TABLE IF NOT EXISTS parks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  location    GEOGRAPHY(POINT,4326) NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Park checkins
CREATE TABLE IF NOT EXISTS park_checkins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id       UUID REFERENCES parks(id) ON DELETE CASCADE,
  dog_id        UUID REFERENCES dogs(id) ON DELETE CASCADE,
  status        checkin_status NOT NULL DEFAULT 'checkin',
  timestamp     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Push tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  provider    push_provider NOT NULL,
  token       TEXT         NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider, token)
);

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  trigger     TEXT         NOT NULL,
  via_email   BOOLEAN      NOT NULL DEFAULT FALSE,
  via_sms     BOOLEAN      NOT NULL DEFAULT FALSE,
  via_push    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, trigger)
);

-- Legal templates
CREATE TABLE IF NOT EXISTS legal_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  type        TEXT     NOT NULL,
  content     TEXT     NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, type)
);

-- Daycare packages
CREATE TABLE IF NOT EXISTS daycare_packages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name           TEXT     NOT NULL,
  hours          INT      NOT NULL,
  price_per_day  NUMERIC  NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Daycare settings
CREATE TABLE IF NOT EXISTS daycare_settings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID REFERENCES tenants(id) ON DELETE CASCADE,
  dropoff_times             JSONB    NOT NULL DEFAULT '["07:30","08:00","08:30"]',
  penalty_rate_per_hour     NUMERIC  NOT NULL DEFAULT 20,
  penalty_increment_minutes INT      NOT NULL DEFAULT 1,
  created_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Daycare sessions
CREATE TABLE IF NOT EXISTS daycare_sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID REFERENCES tenants(id) ON DELETE CASCADE,
  dog_id               UUID REFERENCES dogs(id) ON DELETE CASCADE,
  package_id           UUID REFERENCES daycare_packages(id) ON DELETE SET NULL,
  dropoff_time         TIMESTAMP WITH TIME ZONE NOT NULL,
  expected_pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
  pickup_time          TIMESTAMP WITH TIME ZONE,
  penalty_amount       NUMERIC  NOT NULL DEFAULT 0,
  created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
