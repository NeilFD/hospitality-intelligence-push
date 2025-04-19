
-- Create profiles bucket if it doesn't exist
DO $$
BEGIN
    -- Check if the bucket already exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'profiles'
    ) THEN
        -- Create the bucket
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('profiles', 'profiles', true);
        
        -- Create policy to allow public read access
        INSERT INTO storage.policies (name, definition, owner, for_buckets, for_types)
        VALUES (
            'Public Read Access for profiles bucket',
            '(bucket_id = ''profiles''::text)',
            'authenticated',
            ARRAY['profiles'],
            ARRAY['read']
        );
        
        -- Create policy to allow authenticated users to upload files
        INSERT INTO storage.policies (name, definition, owner, for_buckets, for_types)
        VALUES (
            'Authenticated users can upload to profiles bucket',
            '(bucket_id = ''profiles''::text AND auth.role() = ''authenticated''::text)',
            'authenticated',
            ARRAY['profiles'],
            ARRAY['upload', 'update']
        );
    END IF;
END $$;
