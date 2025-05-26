-- Universal profiles
CREATE TABLE IF NOT EXISTS universal_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stats_blob  JSONB                         NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT                 NOT NULL,
  slug                 TEXT                 NOT NULL UNIQUE,
  custom_domain        TEXT,
  logo_url             TEXT,
  primary_color        TEXT,
  subscription_tier    subscription_tier    NOT NULL DEFAULT 'free',
  stripe_customer_id   TEXT,
  gusto_token          TEXT,
  use_time_blocks      BOOLEAN              NOT NULL DEFAULT TRUE,
  time_blocks_config   JSONB,
  features             JSONB               NOT NULL DEFAULT '{}',
  created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE SET NULL,
  email          TEXT     NOT NULL UNIQUE,
  name           TEXT     NOT NULL,
  role           user_role NOT NULL DEFAULT 'client',
  password_hash  TEXT     NOT NULL,
  calendar_pref  calendar_pref NOT NULL DEFAULT 'none',
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Domains
CREATE TABLE IF NOT EXISTS domains (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  domain      TEXT NOT NULL,
  verified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, domain)
);
