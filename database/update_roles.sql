-- ============================================
-- إضافة دور 'trainer' إلى قائمة الأدوار المسموح بها في جدول المستخدمين
-- ============================================

-- 1. إزالة القيد القديم (CHECK constraint)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. إضافة القيد الجديد ليشمل 'trainer'
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'supervisor', 'technician', 'trainer'));

-- ============================================
-- النهاية
-- ============================================

SELECT '✅ تم تحديث قيود الأدوار (Roles) بنجاح!' AS message;
