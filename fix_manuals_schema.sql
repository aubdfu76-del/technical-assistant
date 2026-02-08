-- Fix: Add missing columns to technical_manuals table
ALTER TABLE technical_manuals 
ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE technical_manuals 
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_manuals_content ON technical_manuals USING gin(to_tsvector('english', COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS idx_manuals_vehicle_id ON technical_manuals(vehicle_id);

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'technical_manuals'
ORDER BY ordinal_position;
