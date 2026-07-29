/*
# Fix Security Issues

## Issues addressed

### 1. Function Search Path Mutable — `public.update_updated_at`
`update_updated_at()` was created without `SET search_path = public`, which means
a malicious role could manipulate `search_path` to shadow system functions used
inside the trigger. Fixed by recreating the function with `SET search_path = public`.

### 2. Public Bucket Allows Listing — `complaints`
The storage policy `complaints_bucket_read_public` used `USING (true)` with
`TO anon, authenticated`, which allows any client to call
`storage.objects` SELECT and enumerate all files in the bucket.
Object URLs work without any SELECT policy on `storage.objects`; public bucket
access is controlled by the bucket's `public` flag.
Fixed by tightening the SELECT policy so only authenticated users can query
object metadata, while unauthenticated visitors can still fetch objects by URL.

### 3 & 4. Public/Authenticated Can Execute SECURITY DEFINER `handle_new_user`
`handle_new_user()` is a SECURITY DEFINER trigger function that runs as the
function owner (superuser). It should only be invoked by the trigger on
`auth.users`, never called directly via `/rest/v1/rpc/`. Exposing it over RPC
means any anon or authenticated request can invoke it with arbitrary arguments.
Fixed by revoking EXECUTE from both `anon` and `authenticated` roles.
The trigger itself fires as the session user that caused the INSERT on auth.users
(Supabase's internal service role), so revoking public EXECUTE does not affect
normal sign-up flow.

## Changes

### Functions modified
- `public.update_updated_at` — recreated with `SET search_path = public` to pin
  the search path and prevent search-path injection.
- `public.handle_new_user` — EXECUTE revoked from `anon` and `authenticated`.
  The trigger continues to fire normally because triggers bypass role-level
  EXECUTE permissions.

### Storage policies modified
- `complaints_bucket_read_public` — replaced with a narrower policy that
  restricts direct object-metadata queries to `authenticated` users only.
  Public CDN-style URL access (the only thing most clients need) is unaffected.
*/

-- ============================================================
-- 1. Fix mutable search_path on update_updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Fix mutable search_path on handle_new_user (was already
--    SECURITY DEFINER but lacked a pinned search_path)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, phone, department, address)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- 3 & 4. Revoke public RPC access to handle_new_user
--         Triggers fire regardless of EXECUTE grants, so
--         revoking this does NOT break sign-up.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ============================================================
-- 5. Narrow the storage SELECT policy so anon cannot list
--    files in the complaints bucket.
--    Authenticated users can still query object metadata;
--    public URL access bypasses storage.objects entirely.
-- ============================================================
DROP POLICY IF EXISTS "complaints_bucket_read_public" ON storage.objects;

CREATE POLICY "complaints_bucket_select_authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'complaints');
