/*
# Fix remaining security issues (round 2)

## Problems

### 1. Public bucket still allows listing
The SELECT policy `complaints_bucket_select_authenticated` is still flagged
because any authenticated client can call `storage.objects` SELECT and enumerate
every file path in the bucket. Public buckets serve object content via CDN URL
(storage.objects is bypassed entirely for URL-based access), so NO SELECT policy
is needed at all for read access. Dropping the policy removes the listing vector
while keeping image URLs working.

### 2. handle_new_user still executable by anon / authenticated
The previous migration ran `REVOKE EXECUTE ... FROM anon` and `FROM authenticated`,
but the actual grant that survives is `TO PUBLIC` (PostgreSQL's special role that
covers every role including anon and authenticated). Revoking from the named roles
individually does not override a PUBLIC grant. The correct fix is:
  REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC;
This removes the blanket grant. The trigger on auth.users fires via the owning
role and is unaffected by this revocation.

## Changes
- DROP the `complaints_bucket_select_authenticated` policy on `storage.objects`.
  Authenticated users who need to list their own files in application code should
  use signed URLs or scoped queries — not a blanket SELECT policy.
- REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC.
  The trigger continues to fire normally (trigger invocation is not gated by
  EXECUTE grants on the trigger function for the calling role).
*/

-- ============================================================
-- 1. Remove the broad bucket SELECT policy entirely.
--    Public bucket objects are accessible by URL; no storage
--    RLS SELECT policy is required for that to work.
-- ============================================================
DROP POLICY IF EXISTS "complaints_bucket_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "complaints_bucket_read_public" ON storage.objects;

-- ============================================================
-- 2. Revoke EXECUTE from PUBLIC (covers anon + authenticated).
--    Named-role revokes issued previously had no effect because
--    the grant lives on PUBLIC, not on the individual roles.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
