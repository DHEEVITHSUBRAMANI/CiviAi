/*
# Storage policies for complaints bucket

## Overview
Creates storage bucket policies allowing authenticated users to upload complaint images
and public read access for viewing images.

## Security
- Public read access (images are civic complaint evidence, viewable by all)
- Authenticated users can upload (must be signed in to file a complaint)
- Users can delete their own uploads (simplified: authenticated can delete)
*/

DROP POLICY IF EXISTS "complaints_bucket_read_public" ON storage.objects;
CREATE POLICY "complaints_bucket_read_public" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'complaints');

DROP POLICY IF EXISTS "complaints_bucket_insert_auth" ON storage.objects;
CREATE POLICY "complaints_bucket_insert_auth" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'complaints');

DROP POLICY IF EXISTS "complaints_bucket_update_auth" ON storage.objects;
CREATE POLICY "complaints_bucket_update_auth" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'complaints') WITH CHECK (bucket_id = 'complaints');

DROP POLICY IF EXISTS "complaints_bucket_delete_auth" ON storage.objects;
CREATE POLICY "complaints_bucket_delete_auth" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'complaints');
