-- Cascade delete function
CREATE OR REPLACE FUNCTION fn_pending_services_cascade_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.request_id IS NOT NULL THEN
    DELETE FROM client_walk_requests
     WHERE id = OLD.request_id;

  ELSIF OLD.boarding_request_id IS NOT NULL THEN
    DELETE FROM boardings
     WHERE id = OLD.boarding_request_id;

  ELSIF OLD.daycare_request_id IS NOT NULL THEN
    DELETE FROM daycare_sessions
     WHERE id = OLD.daycare_request_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger before deletes on pending_services
DROP TRIGGER IF EXISTS trg_pending_services_cascade_delete
  ON pending_services;

CREATE TRIGGER trg_pending_services_cascade_delete
BEFORE DELETE ON pending_services
FOR EACH ROW
EXECUTE FUNCTION fn_pending_services_cascade_delete();
