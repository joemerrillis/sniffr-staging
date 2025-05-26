-- Dogs
CREATE TABLE IF NOT EXISTS dogs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID REFERENCES tenants(id) ON DELETE CASCADE,
  owner_id              UUID REFERENCES users(id) ON DELETE SET NULL,
  name                  TEXT NOT NULL,
  photo_url             TEXT,
  birthdate             DATE,
  universal_profile_id  UUID REFERENCES universal_profiles(id) ON DELETE SET NULL,
  created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Dog visibility
CREATE TABLE IF NOT EXISTS dog_visibility (
  dog_id     UUID PRIMARY KEY REFERENCES dogs(id) ON DELETE CASCADE,
  is_visible BOOLEAN  NOT NULL DEFAULT TRUE
);

-- Dog friends
CREATE TABLE IF NOT EXISTS dog_friends (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id         UUID REFERENCES dogs(id) ON DELETE CASCADE,
  friend_dog_id  UUID REFERENCES dogs(id) ON DELETE CASCADE,
  status         friend_status NOT NULL DEFAULT 'requested',
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (dog_id <> friend_dog_id),
  UNIQUE(dog_id, friend_dog_id)
);

-- Dog assignments
CREATE TABLE IF NOT EXISTS dog_assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id      UUID REFERENCES dogs(id) ON DELETE CASCADE,
  walker_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  start_date  DATE    NOT NULL,
  end_date    DATE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
