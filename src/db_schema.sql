-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. Add trigger for updated_at on profiles
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- 4. Trigger to automatically create a profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Add user_id to reports table
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Make sure we have a bucket for avatars (optional, depends if you upload avatars)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Enable RLS for storage.objects if not already enabled (Supabase enables it by default)
-- Allow public read access to avatars
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload an avatar."
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'avatars' );

-- Allow authenticated users to update their avatars
CREATE POLICY "Users can update their avatar."
  ON storage.objects FOR UPDATE
  TO authenticated
  WITH CHECK ( bucket_id = 'avatars' );

-- ==========================================
-- DISASTER COORDINATION PLATFORM EXTENSIONS
-- ==========================================

-- 8. Disasters Table
CREATE TABLE IF NOT EXISTS public.disasters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  radius_km DOUBLE PRECISION,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.disasters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view disasters" ON public.disasters FOR SELECT USING (true);
CREATE POLICY "Auth users can insert disasters" ON public.disasters FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update disasters" ON public.disasters FOR UPDATE TO authenticated USING (true);

-- 9. Resources (Shelters & Depots)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  capacity INT,
  current_occupancy INT DEFAULT 0,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  contact_info TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Auth users can insert resources" ON public.resources FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update resources" ON public.resources FOR UPDATE TO authenticated USING (true);

-- 10. Requests & Offers
CREATE TABLE IF NOT EXISTS public.requests_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'Open',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  user_id UUID REFERENCES auth.users(id),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.requests_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view requests_offers" ON public.requests_offers FOR SELECT USING (true);
CREATE POLICY "Auth users can insert requests_offers" ON public.requests_offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own requests_offers" ON public.requests_offers FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 11. Volunteers
CREATE TABLE IF NOT EXISTS public.volunteers (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  skills TEXT[],
  availability TEXT DEFAULT 'Available',
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view volunteers" ON public.volunteers FOR SELECT USING (true);
CREATE POLICY "Users can insert own volunteer profile" ON public.volunteers FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own volunteer profile" ON public.volunteers FOR UPDATE TO authenticated USING (auth.uid() = id);
