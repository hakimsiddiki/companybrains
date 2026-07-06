-- RLS policies on documents and user_roles call these SECURITY DEFINER helpers.
-- PostgreSQL requires the querying role to have EXECUTE on functions referenced in
-- policies, otherwise the whole query fails with "permission denied for function".
-- Grant EXECUTE to authenticated (signed-in users) only. Do NOT grant to anon.
GRANT EXECUTE ON FUNCTION public.get_user_company(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;