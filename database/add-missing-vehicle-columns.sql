-- إضافة الحقول المفقودة إلى جدول vehicles
-- Add missing columns to vehicles table

-- إضافة equipment_name
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS equipment_name VARCHAR(200);

-- إضافة image_url
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- التحقق من النتيجة
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
AND column_name IN ('equipment_name', 'image_url');
