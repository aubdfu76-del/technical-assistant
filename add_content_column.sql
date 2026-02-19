-- Add content column to technical_manuals table for storing extracted PDF text
ALTER TABLE technical_manuals ADD COLUMN IF NOT EXISTS content TEXT;

-- Create a text search index for better content searching
CREATE INDEX IF NOT EXISTS idx_manuals_content_search ON technical_manuals USING gin(to_tsvector('simple', COALESCE(content, '')));
