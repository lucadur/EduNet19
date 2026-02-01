-- ===================================================================
-- ADD IMAGE COLUMNS TO INSTITUTE_POSTS TABLE
-- Aggiunge colonne per gestire immagini singole e gallerie
-- ===================================================================

-- Add image_url column for single image (main/thumbnail)
ALTER TABLE institute_posts
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add images_urls column for image galleries (array of URLs)
ALTER TABLE institute_posts
ADD COLUMN IF NOT EXISTS images_urls TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN institute_posts.image_url IS 'URL of the main/thumbnail image for the post';
COMMENT ON COLUMN institute_posts.images_urls IS 'Array of image URLs for gallery posts';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_institute_posts_image_url 
ON institute_posts(image_url) 
WHERE image_url IS NOT NULL;

-- Verify columns were added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'institute_posts'
  AND column_name IN ('image_url', 'images_urls')
ORDER BY column_name;
