-- Allow anonymous read of active sellers (id, name, phone) for the public catalog quote button.
CREATE POLICY "Public read active sellers"
  ON public.sellers
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

GRANT SELECT ON public.sellers TO anon;