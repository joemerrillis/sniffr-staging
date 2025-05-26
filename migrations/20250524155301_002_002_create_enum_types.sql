-- ENUM TYPES (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
    CREATE TYPE subscription_tier AS ENUM ('free','basic','pro','enterprise');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('platform_admin','tenant_admin','walker','client');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calendar_pref') THEN
    CREATE TYPE calendar_pref AS ENUM ('google','outlook','none');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkin_status') THEN
    CREATE TYPE checkin_status AS ENUM ('checkin','checkout','scheduled');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friend_status') THEN
    CREATE TYPE friend_status AS ENUM ('requested','accepted','blocked');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'walk_status') THEN
    CREATE TYPE walk_status AS ENUM ('scheduled','completed','canceled');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'boarding_status') THEN
    CREATE TYPE boarding_status AS ENUM ('scheduled','completed','canceled');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_type') THEN
    CREATE TYPE purchase_type AS ENUM ('walk','boarding','credit_pack');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_status') THEN
    CREATE TYPE purchase_status AS ENUM ('pending','paid','refunded');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calendar_provider') THEN
    CREATE TYPE calendar_provider AS ENUM ('google','outlook');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calendar_event_status') THEN
    CREATE TYPE calendar_event_status AS ENUM ('confirmed','canceled');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'push_provider') THEN
    CREATE TYPE push_provider AS ENUM ('fcm','apns','webpush');
  END IF;
END
$$;
