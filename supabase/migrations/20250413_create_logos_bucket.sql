
-- Create a bucket for logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Create a very permissive policy to allow storing and retrieving logos
CREATE POLICY "Allow public access to logos" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Allow authenticated users to upload logos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' AND
  auth.role() IN ('authenticated', 'service_role')
);

CREATE POLICY "Allow users to update their own logos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' AND
  auth.uid() = owner
);

CREATE POLICY "Allow users to delete their own logos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' AND
  auth.uid() = owner
);
