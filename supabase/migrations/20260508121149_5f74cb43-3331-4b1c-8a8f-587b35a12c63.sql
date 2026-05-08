GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

INSERT INTO public.user_roles (user_id, role)
VALUES ('0eea79e5-76f2-450b-97dd-f3dd0f98a593', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;