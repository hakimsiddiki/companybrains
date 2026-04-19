
The user reports two issues:
1. **Buttons not working** — likely the Login/Signup forms don't actually authenticate, the "Save changes" / "Update password" / "Invite team member" / "Delete Workspace" buttons in Settings do nothing, and PDF upload doesn't actually read content.
2. **Reset all demo data** — Admin page still has hardcoded query stats (1,284 queries, 32 users, weekly chart data, top questions, top documents). Settings page has hardcoded team members (Sarah, Mike, Emily), profile (John Smith, john@acme.com), and company name "Acme Inc.". Sidebar shows "John Smith / Admin" and "Acme Corporation".

Since this is a real SaaS product (auth, multi-tenant data, document RAG), buttons can't truly "work" without a backend. I'll wire up Lovable Cloud so signup/login/upload/settings all function for real, and at the same time strip every piece of mock/demo data so the app starts empty.

## Plan

### 1. Enable Lovable Cloud (backend)
Provision auth + database + storage so buttons have something to call.

### 2. Database schema
- `profiles` (id → auth.users, first_name, last_name, email, company_id, role)
- `companies` (id, name, industry, created_by)
- `documents` (id, company_id, name, type, size_bytes, storage_path, status, access_role, uploaded_by)
- `app_role` enum (admin, hr, sales, support) + `user_roles` table + `has_role()` security definer function
- RLS policies: users only see their own company's data
- Trigger: auto-create profile + company on signup; assign admin role to creator
- Storage bucket `documents` (private) with RLS by company_id

### 3. Wire up auth (fix Login/Signup buttons)
- Signup form: collect first name, last name, company name, email, password → `supabase.auth.signUp` with metadata; create company + profile via trigger; redirect to /dashboard
- Login form: `supabase.auth.signInWithPassword` → redirect to /dashboard
- Add `useAuth` hook + `ProtectedRoute` wrapper around /dashboard, /documents, /admin, /settings
- Sidebar logout actually calls `supabase.auth.signOut()`

### 4. Fix Documents upload (real)
- Replace simulated setTimeout with: upload file to `documents` storage bucket, insert row into `documents` table with status `ready`
- Load documents from DB on mount, filter by current user's company
- Delete actually removes from storage + DB
- Download generates signed URL
- (Note: actual PDF text extraction + RAG chat is a separate large task — the upload itself will work and persist; chat answering from PDFs would need an edge function with text extraction + AI)

### 5. Strip ALL demo data
- **Sidebar (DashboardLayout)**: replace "John Smith / Admin / Acme Corporation" with real values from profile + company
- **Admin page**: remove `queryData`, `userActivityData`, `topQuestions`, `topDocuments`, hardcoded stats. Show real counts from DB (documents, users) and "No data yet" placeholders for charts/lists until real activity exists
- **Settings → Profile**: load real first/last/email from profile (no John Smith defaults)
- **Settings → Company**: load real company name from DB (no "Acme Inc.")
- **Settings → Access**: load real team members from `profiles` table (remove Sarah/Mike/Emily). Wire "Invite team member" button (basic email invite stub or disable with "coming soon")
- **Settings → Save buttons**: actually update DB
- **Landing page**: remove the "Join hundreds of companies" line since it's untrue for a fresh app

### 6. Wire small dead buttons
- "Update password" → `supabase.auth.updateUser({ password })`
- "Save changes" (profile/company) → update profiles/companies tables
- "Delete Workspace" → confirmation dialog + delete
- Notification toggles → persist to profile

### Files to change
- New: `src/integrations/supabase/client.ts` (auto), `src/hooks/useAuth.tsx`, `src/components/ProtectedRoute.tsx`
- Modify: `Login.tsx`, `Signup.tsx`, `Documents.tsx`, `Admin.tsx`, `Settings.tsx`, `DashboardLayout.tsx`, `App.tsx`, `Landing.tsx`
- Migration: tables, enum, RLS, trigger, storage bucket

### Out of scope (will mention but not build now)
- Real PDF text extraction + Pinecone-style vector search + AI chat answering from documents — this needs an edge function with AI integration and is a separate larger build. After this plan, the Chat page will still say "I don't have that information" until that's done.

