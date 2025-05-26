-- client_walk_requests table
CREATE TABLE IF NOT EXISTS client_walk_requests (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  walk_date      DATE        NOT NULL,
  window_start   TIME        NOT NULL,
  window_end     TIME        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No-overlap trigger function
CREATE OR REPLACE FUNCTION fn_no_overlap_walk_requests()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM client_walk_requests r
     WHERE r.user_id      = NEW.user_id
       AND r.walk_date    = NEW.walk_date
       AND r.id          <> NEW.id
       AND NEW.window_start < r.window_end
       AND r.window_start < NEW.window_end
  ) THEN
    RAISE EXCEPTION 'Request (% → %) overlaps an existing request on %',
      NEW.window_start, NEW.window_end, NEW.walk_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_no_overlap_walk_requests ON client_walk_requests;
CREATE TRIGGER trg_no_overlap_walk_requests
BEFORE INSERT OR UPDATE ON client_walk_requests
FOR EACH ROW EXECUTE FUNCTION fn_no_overlap_walk_requests();

-- Minimum length check
ALTER TABLE client_walk_requests
  DROP CONSTRAINT IF EXISTS chk_minimum_request_length;
ALTER TABLE client_walk_requests
  ADD CONSTRAINT chk_minimum_request_length
    CHECK ((window_end - window_start) >= INTERVAL '90 minutes');
