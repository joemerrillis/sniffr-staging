-- Assume you will create a pending_services table first (add table if not yet created)
CREATE TABLE IF NOT EXISTS pending_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_date DATE,
  service_type TEXT,
  walk_window_id UUID,
  boarding_request_id UUID,
  daycare_request_id UUID,
  request_id UUID,
  details JSONB NOT NULL DEFAULT '{}',
  is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Boardings → pending_services trigger function
DO $trg$
BEGIN
  IF to_regclass('public.boardings') IS NOT NULL THEN

    CREATE OR REPLACE FUNCTION fn_pending_from_boardings()
    RETURNS TRIGGER AS $fn$
    BEGIN
      INSERT INTO pending_services (
        id, user_id, service_date, service_type,
        walk_window_id, boarding_request_id, daycare_request_id,
        details, is_confirmed, created_at
      ) VALUES (
        gen_random_uuid(),
        NEW.user_id,
        NEW.start_date,
        'boarding',
        NULL, NEW.id, NULL,
        json_build_object('nights', NEW.end_date - NEW.start_date),
        FALSE,
        now()
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_pending_from_boardings ON boardings;
    CREATE TRIGGER trg_pending_from_boardings
      AFTER INSERT ON boardings
      FOR EACH ROW EXECUTE FUNCTION fn_pending_from_boardings();

  END IF;
END;
$trg$;

-- Daycare sessions → pending_services trigger function
DO $dtrg$
BEGIN
  IF to_regclass('public.daycare_sessions') IS NOT NULL THEN

    CREATE OR REPLACE FUNCTION fn_pending_from_daycare_sessions()
    RETURNS TRIGGER AS $fdt$
    BEGIN
      INSERT INTO pending_services (
        id, user_id, service_date, service_type,
        walk_window_id, boarding_request_id, daycare_request_id,
        details, is_confirmed, created_at
      ) VALUES (
        gen_random_uuid(),
        NEW.user_id,
        NEW.session_date,
        'daycare',
        NULL, NULL, NEW.id,
        json_build_object('hours', NEW.hours_requested),
        FALSE,
        now()
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN NEW;
    END;
    $fdt$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_pending_from_daycare_sessions ON daycare_sessions;
    CREATE TRIGGER trg_pending_from_daycare_sessions
      AFTER INSERT ON daycare_sessions
      FOR EACH ROW EXECUTE FUNCTION fn_pending_from_daycare_sessions();

  END IF;
END;
$dtrg$;
