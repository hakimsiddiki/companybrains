
-- 1) Scope has_role to the user's own company
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND ur.company_id = p.company_id
  )
$$;

-- 2) Restrict role management: admins can manage non-admin roles within their company only
DROP POLICY IF EXISTS "Admins manage roles in their company" ON public.user_roles;

CREATE POLICY "Admins view roles in their company"
ON public.user_roles FOR SELECT TO authenticated
USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Admins insert non-admin roles in their company"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  company_id = public.get_user_company(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'admin'::app_role
  AND public.get_user_company(user_id) = public.get_user_company(auth.uid())
);

CREATE POLICY "Admins update non-admin roles in their company"
ON public.user_roles FOR UPDATE TO authenticated
USING (
  company_id = public.get_user_company(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'admin'::app_role
)
WITH CHECK (
  company_id = public.get_user_company(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'admin'::app_role
  AND public.get_user_company(user_id) = public.get_user_company(auth.uid())
);

CREATE POLICY "Admins delete non-admin roles in their company"
ON public.user_roles FOR DELETE TO authenticated
USING (
  company_id = public.get_user_company(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
  AND role <> 'admin'::app_role
);

-- 3) Enforce documents.access_role at the database level
DROP POLICY IF EXISTS "Users view docs in their company" ON public.documents;
DROP POLICY IF EXISTS "Users upload docs to their company" ON public.documents;
DROP POLICY IF EXISTS "Users update own docs or admins update any" ON public.documents;

CREATE POLICY "Users view docs by role in their company"
ON public.documents FOR SELECT TO authenticated
USING (
  company_id = public.get_user_company(auth.uid())
  AND (
    access_role = 'all'
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      access_role IN ('hr','sales','support')
      AND public.has_role(auth.uid(), access_role::app_role)
    )
  )
);

CREATE POLICY "Users upload docs to their company with allowed role"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (
  company_id = public.get_user_company(auth.uid())
  AND uploaded_by = auth.uid()
  AND (
    access_role = 'all'
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      access_role IN ('hr','sales','support')
      AND public.has_role(auth.uid(), access_role::app_role)
    )
  )
);

CREATE POLICY "Users update own docs with allowed role or admins any"
ON public.documents FOR UPDATE TO authenticated
USING (
  company_id = public.get_user_company(auth.uid())
  AND (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
)
WITH CHECK (
  company_id = public.get_user_company(auth.uid())
  AND (
    access_role = 'all'
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      access_role IN ('hr','sales','support')
      AND public.has_role(auth.uid(), access_role::app_role)
    )
  )
);
