-- dog_memories
CREATE TABLE IF NOT EXISTS dog_memories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id        UUID REFERENCES dogs(id) ON DELETE CASCADE,
  uploader_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  image_url     TEXT     NOT NULL,
  auto_caption  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- dog_interactions
CREATE TABLE IF NOT EXISTS dog_interactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  park_id       UUID REFERENCES parks(id) ON DELETE CASCADE,
  dog_a_id      UUID REFERENCES dogs(id) ON DELETE CASCADE,
  dog_b_id      UUID REFERENCES dogs(id) ON DELETE CASCADE,
  owner_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  memory_id     UUID REFERENCES dog_memories(id) ON DELETE SET NULL,
  notes         TEXT,
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- friend_suggestions
CREATE TABLE IF NOT EXISTS friend_suggestions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id           UUID REFERENCES dogs(id) ON DELETE CASCADE,
  suggested_dog_id UUID REFERENCES dogs(id) ON DELETE CASCADE,
  score            NUMERIC      NOT NULL,
  snippet          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- walker_recommendations
CREATE TABLE IF NOT EXISTS walker_recommendations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  walker_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  via_voice  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tracking_devices
CREATE TABLE IF NOT EXISTS tracking_devices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id            UUID REFERENCES dogs(id) ON DELETE CASCADE,
  provider          TEXT     NOT NULL,
  device_identifier TEXT     NOT NULL UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- device_location_pings
CREATE TABLE IF NOT EXISTS device_location_pings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  UUID REFERENCES tracking_devices(id) ON DELETE CASCADE,
  latitude   NUMERIC NOT NULL,
  longitude  NUMERIC NOT NULL,
  pinged_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- walker_reviews
CREATE TABLE IF NOT EXISTS walker_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walker_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  dog_id      UUID REFERENCES dogs(id) ON DELETE SET NULL,
  rating      INT     NOT NULL,
  comments    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- walker_specialty_stats
CREATE TABLE IF NOT EXISTS walker_specialty_stats (
  walker_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stats     JSONB    NOT NULL
);
