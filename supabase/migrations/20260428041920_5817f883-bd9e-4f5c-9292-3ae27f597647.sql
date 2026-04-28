-- Restrict SECURITY DEFINER helpers from being called via RPC
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_company(uuid) FROM anon, authenticated, public;

-- Tighten profile visibility to the user's own profile only (prevents email leakage to coworkers)
DROP POLICY IF EXISTS "Users view profiles in their company" ON public.profiles;
CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Add storage UPDATE policy for documents bucket (mirror INSERT scoping)
CREATE POLICY "Users update files in their company folder"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = public.get_user_company(auth.uid())::text
)
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = public.get_user_company(auth.uid())::text
);
