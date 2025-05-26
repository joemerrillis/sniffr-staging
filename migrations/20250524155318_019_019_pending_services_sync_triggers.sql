-- Walk-requests → pending_services (update & delete)
CREATE OR REPLACE FUNCTION fn_pending_sync_walk_requests()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    UPDATE pending_services
    SET
      service_date = NEW.walk_date,
      details = json_build_object(
        'length_minutes',
        extract(epoch FROM (NEW.window_end - NEW.window_start)) / 60
      )
    WHERE request_id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM pending_services
    WHERE request_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pending_sync_walk_requests ON client_walk_requests;
CREATE TRIGGER trg_pending_sync_walk_requests
AFTER UPDATE OR DELETE ON client_walk_requests
FOR EACH ROW EXECUTE FUNCTION fn_pending_sync_walk_requests();

-- Boardings → pending_services (update & delete)
CREATE OR REPLACE FUNCTION fn_pending_sync_boardings()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    UPDATE pending_services
    SET
      service_date = NEW.start_date,
      details = json_build_object(
        'nights',
        NEW.end_date - NEW.start_date
      )
    WHERE boarding_request_id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM pending_services
    WHERE boarding_request_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pending_sync_boardings ON boardings;
CREATE TRIGGER trg_pending_sync_boardings
AFTER UPDATE OR DELETE ON boardings
FOR EACH ROW EXECUTE FUNCTION fn_pending_sync_boardings();

-- Daycare sessions → pending_services (update & delete)
CREATE OR REPLACE FUNCTION fn_pending_sync_daycare_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    UPDATE pending_services
    SET
      service_date = NEW.dropoff_time::date,
      details = json_build_object(
        'hours',
        EXTRACT(EPOCH FROM (NEW.expected_pickup_time - NEW.dropoff_time)) / 3600
      )
    WHERE daycare_request_id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM pending_services
    WHERE daycare_request_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pending_sync_daycare_sessions ON daycare_sessions;
CREATE TRIGGER trg_pending_sync_daycare_sessions
AFTER UPDATE OR DELETE ON daycare_sessions
FOR EACH ROW EXECUTE FUNCTION fn_pending_sync_daycare_sessions();
