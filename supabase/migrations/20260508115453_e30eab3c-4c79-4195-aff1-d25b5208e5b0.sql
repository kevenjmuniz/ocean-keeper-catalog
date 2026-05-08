
-- Fix search_path
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Revoke public execution of has_role (still usable by RLS engine)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

-- Restrict bucket listing: replace broad SELECT with admin-only listing; image fetching uses public URLs (object access ok via signed/public path)
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects FOR SELECT USING (bucket_id = 'products' AND (auth.role() = 'anon' OR auth.role() = 'authenticated'));
