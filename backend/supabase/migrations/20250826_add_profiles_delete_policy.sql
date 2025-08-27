-- Allow users to delete their own profile if policy doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can delete own profile'
  ) THEN
    CREATE POLICY "Users can delete own profile" ON profiles
      FOR DELETE USING (auth.uid() = id);
  END IF;
END $$;
