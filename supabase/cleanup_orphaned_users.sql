-- Cleanup orphaned users (users without a valid tenant)
DELETE FROM public.user_roles WHERE tenant_id NOT IN (SELECT id FROM public.tenants);
DELETE FROM public.profiles WHERE tenant_id NOT IN (SELECT id FROM public.tenants) AND tenant_id IS NOT NULL;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM public.user_roles)
      AND id NOT IN (SELECT id FROM public.profiles WHERE tenant_id IS NULL)
  LOOP
    DELETE FROM auth.users WHERE id = r.id;
  END LOOP;
  RAISE NOTICE 'Orphaned users cleaned';
END $$;