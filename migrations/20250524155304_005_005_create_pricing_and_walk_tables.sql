-- Walk pricing tiers
CREATE TABLE IF NOT EXISTS walk_pricing_tiers (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  min_minutes    INT  NOT NULL,
  max_minutes    INT  NOT NULL,
  price_per_walk NUMERIC NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, min_minutes, max_minutes)
);

-- Boarding pricing tiers
CREATE TABLE IF NOT EXISTS boarding_pricing_tiers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  min_nights      INT  NOT NULL,
  max_nights      INT  NOT NULL,
  price_per_day   NUMERIC NOT NULL,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, min_nights, max_nights)
);

-- Walks
CREATE TABLE IF NOT EXISTS walks (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID REFERENCES tenants(id) ON DELETE CASCADE,
  dog_id                 UUID REFERENCES dogs(id) ON DELETE CASCADE,
  walker_id              UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_at           TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes       INTEGER               NOT NULL,
  block_label            TEXT,
  status                 walk_status           NOT NULL DEFAULT 'scheduled',
  rescheduled_by_client  BOOLEAN               NOT NULL DEFAULT FALSE,
  rescheduled_at         TIMESTAMP WITH TIME ZONE,
  requested_date         DATE,
  requested_block_label  TEXT,
  created_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Walk reports
CREATE TABLE IF NOT EXISTS walk_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id          UUID REFERENCES walks(id) ON DELETE CASCADE UNIQUE,
  notes            TEXT,
  photos           JSONB,
  mood             TEXT,
  cuteness_score   INTEGER,
  reactivity_score INTEGER,
  park_behavior    TEXT,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Walk metrics
CREATE TABLE IF NOT EXISTS walk_metrics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id          UUID REFERENCES walks(id) ON DELETE CASCADE UNIQUE,
  distance_miles   NUMERIC,
  step_count       INTEGER,
  duration_minutes INTEGER,
  temperature      NUMERIC,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
