-- Fix profile_company_takeover: enforce company_id immutability with a trigger
DROP TRIGGER IF EXISTS prevent_profile_company_change_trigger ON public.profiles;
CREATE TRIGGER prevent_profile_company_change_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_company_change();

-- Fix subscription_write_bypass: remove the admin UPDATE policy so subscription
-- state can only be changed by the service-role PayPal edge functions (which bypass RLS).
DROP POLICY IF EXISTS "Admins update own company subscription" ON public.subscriptions;