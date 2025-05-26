-- Boardings: notes & proposed dropoff/pickup
ALTER TABLE boardings
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS proposed_drop_off_time TIME,
  ADD COLUMN IF NOT EXISTS proposed_pick_up_time  TIME,
  ADD COLUMN IF NOT EXISTS proposed_changes JSONB;

-- Daycare sessions: notes, proposed times
ALTER TABLE daycare_sessions
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS proposed_dropoff_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS proposed_pickup_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS proposed_changes JSONB;
