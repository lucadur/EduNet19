-- ===================================================================
-- FIX SECURITY WARNINGS - Gallery Functions
-- ===================================================================

-- Fix: update_profile_gallery_updated_at
DROP FUNCTION IF EXISTS update_profile_gallery_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_profile_gallery_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix: check_gallery_photo_limit
DROP FUNCTION IF EXISTS check_gallery_photo_limit() CASCADE;

CREATE OR REPLACE FUNCTION check_gallery_photo_limit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
$$;

-- Fix: create_match_weights_for_user (if exists)
DROP FUNCTION IF EXISTS create_match_weights_for_user(UUID) CASCADE;

CREATE OR REPLACE FUNCTION create_match_weights_for_user(p_user_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_match_weights (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Fix: create_match_weights_on_profile
DROP FUNCTION IF EXISTS create_match_weights_on_profile() CASCADE;

CREATE OR REPLACE FUNCTION create_match_weights_on_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_match_weights (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix: init_user_match_weights
DROP FUNCTION IF EXISTS init_user_match_weights() CASCADE;

CREATE OR REPLACE FUNCTION init_user_match_weights()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_match_weights (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate triggers for gallery
DROP TRIGGER IF EXISTS profile_gallery_updated_at ON profile_gallery;
CREATE TRIGGER profile_gallery_updated_at
  BEFORE UPDATE ON profile_gallery
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_gallery_updated_at();

DROP TRIGGER IF EXISTS enforce_gallery_photo_limit ON profile_gallery;
CREATE TRIGGER enforce_gallery_photo_limit
  BEFORE INSERT ON profile_gallery
  FOR EACH ROW
  EXECUTE FUNCTION check_gallery_photo_limit();

-- Recreate triggers for match weights (if tables exist)
DO $$
BEGIN
  -- Check if user_profiles table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    -- Drop and recreate trigger
    DROP TRIGGER IF EXISTS init_match_weights_on_profile_create ON user_profiles;
    CREATE TRIGGER init_match_weights_on_profile_create
      AFTER INSERT ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION create_match_weights_on_profile();
  END IF;
END $$;

-- Comments
COMMENT ON FUNCTION update_profile_gallery_updated_at() IS 'Updates updated_at timestamp - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION check_gallery_photo_limit() IS 'Enforces 20 photo limit - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION create_match_weights_for_user(UUID) IS 'Creates match weights for user - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION create_match_weights_on_profile() IS 'Trigger to create match weights - SECURITY DEFINER with fixed search_path';
COMMENT ON FUNCTION init_user_match_weights() IS 'Initializes match weights - SECURITY DEFINER with fixed search_path';
