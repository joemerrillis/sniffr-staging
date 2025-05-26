-- weekday ENUM for client_walk_windows
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'weekday') THEN
    CREATE TYPE weekday AS ENUM ('0','1','2','3','4','5','6');
  END IF;
END
$$;

-- entitlement_type ENUM for scheduled_entitlements
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entitlement_type') THEN
    CREATE TYPE entitlement_type AS ENUM (
      'walk',
      'boarding',
      'daycare',
      'addon'
    );
  END IF;
END
$$;

-- client_walk_windows
CREATE TABLE IF NOT EXISTS client_walk_windows (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
  day_of_week     weekday     NOT NULL,
  window_start    TIME        NOT NULL,
  window_end      TIME        NOT NULL,
  effective_start DATE        NOT NULL,
  effective_end   DATE                NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_of_week, effective_start)
);

-- scheduled_entitlements
CREATE TABLE IF NOT EXISTS scheduled_entitlements (
  id               UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID             NOT NULL REFERENCES users(id)            ON DELETE CASCADE,
  dog_id           UUID             REFERENCES dogs(id)                       ON DELETE SET NULL,
  entitlement_date DATE             NOT NULL,
  service_type     entitlement_type NOT NULL,
  window_id        UUID             REFERENCES client_walk_windows(id)       ON DELETE SET NULL,  
  package_id       UUID             REFERENCES daycare_packages(id)           ON DELETE SET NULL,
  boarding_id      UUID             REFERENCES boardings(id)                  ON DELETE SET NULL,
  details          JSONB            NOT NULL DEFAULT '{}',
  is_booked        BOOLEAN          NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT now(),
  UNIQUE(
    user_id,
    dog_id,
    entitlement_date,
    service_type,
    window_id,
    package_id,
    boarding_id
  )
);
