-- Boardings
CREATE TABLE IF NOT EXISTS boardings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  dog_id         UUID REFERENCES dogs(id) ON DELETE CASCADE,
  drop_off_day   DATE    NOT NULL,
  drop_off_block TEXT    NOT NULL,
  drop_off_time  TIME,
  pick_up_day    DATE    NOT NULL,
  pick_up_block  TEXT    NOT NULL,
  pick_up_time   TIME,
  price          NUMERIC NOT NULL,
  status         boarding_status NOT NULL DEFAULT 'scheduled',
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Walk credits
CREATE TABLE IF NOT EXISTS walk_credits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  walk_count      INTEGER NOT NULL DEFAULT 0,
  boarding_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
