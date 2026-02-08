-- Add content column to technical_manuals table
ALTER TABLE technical_manuals 
ADD COLUMN IF NOT EXISTS content TEXT;

-- Create full-text search index on content
CREATE INDEX IF NOT EXISTS idx_manuals_content ON technical_manuals USING gin(to_tsvector('arabic', content));
