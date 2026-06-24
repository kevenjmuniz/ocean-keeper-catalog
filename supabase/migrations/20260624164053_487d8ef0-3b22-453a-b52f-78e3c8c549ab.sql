
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Recreate triggers to point at the relocated function
DROP TRIGGER IF EXISTS products_updated ON public.products;
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION private.tg_set_updated_at();

DROP TRIGGER IF EXISTS categories_updated ON public.categories;
CREATE TRIGGER categories_updated BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION private.tg_set_updated_at();

DROP TRIGGER IF EXISTS set_sellers_updated_at ON public.sellers;
CREATE TRIGGER set_sellers_updated_at BEFORE UPDATE ON public.sellers
  FOR EACH ROW EXECUTE FUNCTION private.tg_set_updated_at();

-- banners
DROP POLICY IF EXISTS "Admins write banners" ON public.banners;
CREATE POLICY "Admins write banners" ON public.banners FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Public read active banners" ON public.banners;
CREATE POLICY "Public read active banners" ON public.banners FOR SELECT
  USING ((is_active = true) OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- categories
DROP POLICY IF EXISTS "Admins write categories" ON public.categories;
CREATE POLICY "Admins write categories" ON public.categories FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- products
DROP POLICY IF EXISTS "Admins write products" ON public.products;
CREATE POLICY "Admins write products" ON public.products FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Public read active products" ON public.products;
CREATE POLICY "Public read active products" ON public.products FOR SELECT
  USING ((is_active = true) OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- sellers — remove public exposure of phone numbers
DROP POLICY IF EXISTS "Admins write sellers" ON public.sellers;
CREATE POLICY "Admins write sellers" ON public.sellers FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Public read active sellers" ON public.sellers;
CREATE POLICY "Admins read sellers" ON public.sellers FOR SELECT
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
REVOKE SELECT ON public.sellers FROM anon;

-- user_roles
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- storage.objects
DROP POLICY IF EXISTS "Admins upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete product images" ON storage.objects;

CREATE POLICY "Admins upload product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'products' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'products' AND private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'products' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'products' AND private.has_role(auth.uid(), 'admin'::public.app_role));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.tg_set_updated_at();
