-- Drop old policies
DROP POLICY IF EXISTS select_own_pending   ON public.pending_services;
DROP POLICY IF EXISTS insert_own_pending   ON public.pending_services;
DROP POLICY IF EXISTS update_own_pending   ON public.pending_services;
DROP POLICY IF EXISTS delete_own_pending   ON public.pending_services;
DROP POLICY IF EXISTS "Enable read access for all users"      ON public.pending_services;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.pending_services;

-- Turn Row Level Security ON
ALTER TABLE public.pending_services ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY select_own_pending
  ON public.pending_services
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT policy
CREATE POLICY insert_own_pending
  ON public.pending_services
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy
CREATE POLICY update_own_pending
  ON public.pending_services
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE policy
CREATE POLICY delete_own_pending
  ON public.pending_services
  FOR DELETE
  USING (user_id = auth.uid());
