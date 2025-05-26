-- More advanced RLS policies for tenant_admins and linked clients
DROP POLICY IF EXISTS select_own_pending ON public.pending_services;
CREATE POLICY select_own_pending
ON public.pending_services
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users tenant_admin
    JOIN tenant_clients tc ON tc.tenant_id = tenant_admin.tenant_id
    WHERE tenant_admin.id = auth.uid()
      AND tenant_admin.role = 'tenant_admin'
      AND tc.client_id = pending_services.user_id
  )
);

DROP POLICY IF EXISTS insert_own_pending ON public.pending_services;
CREATE POLICY insert_own_pending
ON public.pending_services
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users tenant_admin
    JOIN tenant_clients tc ON tc.tenant_id = tenant_admin.tenant_id
    WHERE tenant_admin.id = auth.uid()
      AND tenant_admin.role = 'tenant_admin'
      AND tc.client_id = pending_services.user_id
  )
);

DROP POLICY IF EXISTS update_own_pending ON public.pending_services;
CREATE POLICY update_own_pending
ON public.pending_services
FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users tenant_admin
    JOIN tenant_clients tc ON tc.tenant_id = tenant_admin.tenant_id
    WHERE tenant_admin.id = auth.uid()
      AND tenant_admin.role = 'tenant_admin'
      AND tc.client_id = pending_services.user_id
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users tenant_admin
    JOIN tenant_clients tc ON tc.tenant_id = tenant_admin.tenant_id
    WHERE tenant_admin.id = auth.uid()
      AND tenant_admin.role = 'tenant_admin'
      AND tc.client_id = pending_services.user_id
  )
);

DROP POLICY IF EXISTS delete_own_pending ON public.pending_services;
CREATE POLICY delete_own_pending
ON public.pending_services
FOR DELETE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM users tenant_admin
    JOIN tenant_clients tc ON tc.tenant_id = tenant_admin.tenant_id
    WHERE tenant_admin.id = auth.uid()
      AND tenant_admin.role = 'tenant_admin'
      AND tc.client_id = pending_services.user_id
  )
);
