
-- ============ ENUM ============
CREATE TYPE public.app_role AS ENUM ('admin', 'hr', 'sales', 'support');

-- ============ COMPANIES ============
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  weekly_digest BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, company_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ DOCUMENTS ============
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  access_role TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ============ SECURITY DEFINER FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_company(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id
$$;

-- ============ TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTO-CREATE PROFILE + COMPANY ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  INSERT INTO public.companies (name, created_by)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
    NEW.id
  )
  RETURNING id INTO new_company_id;

  INSERT INTO public.profiles (id, first_name, last_name, email, company_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email,
    new_company_id
  );

  INSERT INTO public.user_roles (user_id, role, company_id)
  VALUES (NEW.id, 'admin', new_company_id);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- COMPANIES
CREATE POLICY "Users view own company" ON public.companies
  FOR SELECT TO authenticated
  USING (id = public.get_user_company(auth.uid()));

CREATE POLICY "Admins update own company" ON public.companies
  FOR UPDATE TO authenticated
  USING (id = public.get_user_company(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete own company" ON public.companies
  FOR DELETE TO authenticated
  USING (id = public.get_user_company(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- PROFILES
CREATE POLICY "Users view profiles in their company" ON public.profiles
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- USER_ROLES
CREATE POLICY "Users view roles in their company" ON public.user_roles
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Admins manage roles in their company" ON public.user_roles
  FOR ALL TO authenticated
  USING (company_id = public.get_user_company(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (company_id = public.get_user_company(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- DOCUMENTS
CREATE POLICY "Users view docs in their company" ON public.documents
  FOR SELECT TO authenticated
  USING (company_id = public.get_user_company(auth.uid()));

CREATE POLICY "Users upload docs to their company" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company(auth.uid()) AND uploaded_by = auth.uid());

CREATE POLICY "Users update own docs or admins update any" ON public.documents
  FOR UPDATE TO authenticated
  USING (company_id = public.get_user_company(auth.uid()) AND (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "Users delete own docs or admins delete any" ON public.documents
  FOR DELETE TO authenticated
  USING (company_id = public.get_user_company(auth.uid()) AND (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin')));

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users view docs from their company folder" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = public.get_user_company(auth.uid())::text
  );

CREATE POLICY "Users upload docs to their company folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = public.get_user_company(auth.uid())::text
  );

CREATE POLICY "Users delete docs from their company folder" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = public.get_user_company(auth.uid())::text
  );
