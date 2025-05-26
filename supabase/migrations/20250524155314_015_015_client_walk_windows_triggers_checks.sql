-- Remove old unique and check constraints
ALTER TABLE client_walk_windows
  DROP CONSTRAINT IF EXISTS client_walk_windows_user_id_day_of_week_effective_start_key;

ALTER TABLE client_walk_windows
  DROP CONSTRAINT IF EXISTS chk_minimum_window_length;

-- Add check for 90 min minimum window
ALTER TABLE client_walk_windows
  ADD CONSTRAINT chk_minimum_window_length
    CHECK ((window_end - window_start) >= INTERVAL '90 minutes');

-- Function: disallow overlapping windows
CREATE OR REPLACE FUNCTION fn_no_overlap_client_windows()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM client_walk_windows w
    WHERE w.user_id     = NEW.user_id
      AND w.day_of_week = NEW.day_of_week
      AND w.id         <> NEW.id
      AND NEW.window_start < w.window_end
      AND w.window_start < NEW.window_end
      AND coalesce(NEW.effective_end, 'infinity'::date) >= w.effective_start
      AND coalesce(w.effective_end,    'infinity'::date) >= NEW.effective_start
  ) THEN
    RAISE EXCEPTION
      'Window (% → %) overlaps an existing window on the same day and date range',
      NEW.window_start, NEW.window_end
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger
DROP TRIGGER IF EXISTS trg_no_overlap_client_windows ON client_walk_windows;
CREATE TRIGGER trg_no_overlap_client_windows
BEFORE INSERT OR UPDATE ON client_walk_windows
FOR EACH ROW EXECUTE FUNCTION fn_no_overlap_client_windows();
