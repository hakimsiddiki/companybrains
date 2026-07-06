-- 1) Lock down SECURITY DEFINER trigger functions so they cannot be called directly
--    via the API by anonymous or signed-in users. They still fire as triggers.
REVOKE ALL ON FUNCTION public.create_trial_subscription() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_trial_subscription() FROM anon;
REVOKE ALL ON FUNCTION public.create_trial_subscription() FROM authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

-- 2) This is an authenticated-only B2B app. Anonymous users should have no access
--    to any application table (RLS already blocks rows, this removes discoverability
--    entirely and satisfies the anon GraphQL exposure check).
REVOKE ALL ON TABLE public.companies FROM anon;
REVOKE ALL ON TABLE public.documents FROM anon;
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.subscriptions FROM anon;
REVOKE ALL ON TABLE public.user_roles FROM anon;

-- 3) The app uses the REST/client SDK, not the GraphQL API. Disable GraphQL so
--    no tables are reflected/discoverable through the GraphQL schema for any role.
DROP EXTENSION IF EXISTS pg_graphql CASCADE;