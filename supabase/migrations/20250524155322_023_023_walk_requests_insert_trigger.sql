-- Insert trigger for client_walk_requests → pending_services
CREATE OR REPLACE FUNCTION fn_pending_from_walk_requests()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pending_services (
    id,
    user_id,
    service_date,
    service_type,
    walk_window_id,
    boarding_request_id,
    daycare_request_id,
    request_id,
    details,
    is_confirmed,
    created_at
  ) VALUES (
    gen_random_uuid(),
    NEW.user_id,
    NEW.walk_date,
    'walk',
    NULL,
    NULL,
    NULL,
    NEW.id,
    json_build_object(
      'start', NEW.window_start,
      'end', NEW.window_end
    ),
    FALSE,
    now()
  )
  ON CONFLICT (request_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pending_from_walk_requests ON client_walk_requests;

CREATE TRIGGER trg_pending_from_walk_requests
AFTER INSERT ON client_walk_requests
FOR EACH ROW EXECUTE FUNCTION fn_pending_from_walk_requests();

CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_services_request_id
ON pending_services (request_id);
