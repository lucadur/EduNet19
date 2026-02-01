-- ===================================================================
-- PROFILE GALLERY SETUP - Bacheca Fotografica
-- ===================================================================

-- Create profile_gallery table
CREATE TABLE IF NOT EXISTS profile_gallery (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profile_gallery_user_id ON profile_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_gallery_created_at ON profile_gallery(created_at DESC);

-- Enable RLS
ALTER TABLE profile_gallery ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own gallery
CREATE POLICY "Users can view own gallery"
  ON profile_gallery
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view other users' galleries (public profiles)
CREATE POLICY "Users can view other galleries"
  ON profile_gallery
  FOR SELECT
  USING (true);

-- Users can insert their own photos
CREATE POLICY "Users can insert own photos"
  ON profile_gallery
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own photos
CREATE POLICY "Users can update own photos"
  ON profile_gallery
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
  ON profile_gallery
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for gallery photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-gallery', 'profile-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies

-- Anyone can view gallery photos (public bucket)
CREATE POLICY "Public gallery photos are viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-gallery');

-- Users can upload their own photos
CREATE POLICY "Users can upload own gallery photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-gallery' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own photos
CREATE POLICY "Users can update own gallery photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-gallery' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own photos
CREATE POLICY "Users can delete own gallery photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-gallery' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER profile_gallery_updated_at
  BEFORE UPDATE ON profile_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_gallery_updated_at();

-- Function to enforce max 20 photos per user
CREATE OR REPLACE FUNCTION check_gallery_photo_limit()
RETURNS TRIGGER AS $$
DECLARE
  photo_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO photo_count
  FROM profile_gallery
  WHERE user_id = NEW.user_id;

  IF photo_count >= 20 THEN
    RAISE EXCEPTION 'Maximum 20 photos allowed per user';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce photo limit
CREATE TRIGGER enforce_gallery_photo_limit
  BEFORE INSERT ON profile_gallery
  FOR EACH ROW
  EXECUTE FUNCTION check_gallery_photo_limit();

-- Comments
COMMENT ON TABLE profile_gallery IS 'Stores profile gallery photos for institutes (max 20 per user)';
COMMENT ON COLUMN profile_gallery.id IS 'Unique identifier for the photo';
COMMENT ON COLUMN profile_gallery.user_id IS 'User who uploaded the photo';
COMMENT ON COLUMN profile_gallery.photo_url IS 'Storage path to the photo';
COMMENT ON COLUMN profile_gallery.caption IS 'Optional caption for the photo';
COMMENT ON COLUMN profile_gallery.created_at IS 'When the photo was uploaded';
COMMENT ON COLUMN profile_gallery.updated_at IS 'When the photo was last updated';
