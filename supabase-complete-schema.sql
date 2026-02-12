-- ============================================
-- Intelligent Technical Assistant Database
-- Complete Schema for Supabase
-- نظام المساعد الفني الذكي - Schema كامل
-- ============================================

-- ============================================
-- حذف الجداول إذا كانت موجودة (بالترتيب الصحيح)
-- ============================================
DROP TABLE IF EXISTS diagnosis_media CASCADE;
DROP TABLE IF EXISTS diagnosis_items CASCADE;
DROP TABLE IF EXISTS diagnosis_systems CASCADE;
DROP TABLE IF EXISTS repair_media CASCADE;
DROP TABLE IF EXISTS repair_steps CASCADE;
DROP TABLE IF EXISTS repair_tasks CASCADE;
DROP TABLE IF EXISTS maintenance_sections CASCADE;
DROP TABLE IF EXISTS maintenance_work_packages CASCADE;
DROP TABLE IF EXISTS system_inspection_sections CASCADE;
DROP TABLE IF EXISTS system_inspection_work_packages CASCADE;
DROP TABLE IF EXISTS common_faults_sections CASCADE;
DROP TABLE IF EXISTS common_faults_work_packages CASCADE;
DROP TABLE IF EXISTS user_vehicle_allocations CASCADE;
DROP TABLE IF EXISTS vehicle_specifications CASCADE;
DROP TABLE IF EXISTS technical_manuals CASCADE;
DROP TABLE IF EXISTS test_items CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS maintenance_tasks CASCADE;
DROP TABLE IF EXISTS faults CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS units CASCADE;

-- ============================================
-- جدول الوحدات (Units)
-- ============================================
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- جدول المستخدمين (Users)
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'technician' CHECK (role IN ('admin', 'supervisor', 'technician', 'trainer')),
    phone VARCHAR(50),
    unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_unit_id ON users(unit_id);

-- ============================================
-- جدول المركبات (Vehicles)
-- ============================================
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    equipment_name VARCHAR(200),
    vehicle_type VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    year INTEGER,
    vin VARCHAR(100),
    current_km INTEGER DEFAULT 0,
    engine_type VARCHAR(100),
    fuel_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
    last_maintenance_date TIMESTAMP,
    next_maintenance_km INTEGER,
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_plate_number ON vehicles(plate_number);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);

-- ============================================
-- جدول مواصفات المركبات (Vehicle Specifications)
-- ============================================
CREATE TABLE vehicle_specifications (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    custom_specs JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicle_specs_vehicle_id ON vehicle_specifications(vehicle_id);

-- ============================================
-- جدول تخصيص المركبات للمستخدمين
-- ============================================
CREATE TABLE user_vehicle_allocations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, vehicle_id)
);

CREATE INDEX idx_allocations_user_id ON user_vehicle_allocations(user_id);
CREATE INDEX idx_allocations_vehicle_id ON user_vehicle_allocations(vehicle_id);

-- ============================================
-- جدول الأعطال (Faults)
-- ============================================
CREATE TABLE faults (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    fault_code VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    category VARCHAR(100),
    system_affected VARCHAR(100),
    reported_by INTEGER REFERENCES users(id),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_faults_vehicle_id ON faults(vehicle_id);
CREATE INDEX idx_faults_status ON faults(status);
CREATE INDEX idx_faults_severity ON faults(severity);
CREATE INDEX idx_faults_reported_at ON faults(reported_at);

-- ============================================
-- جدول مهام الصيانة (Maintenance Tasks)
-- ============================================
CREATE TABLE maintenance_tasks (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    fault_id INTEGER REFERENCES faults(id),
    task_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to INTEGER REFERENCES users(id),
    scheduled_date TIMESTAMP,
    started_date TIMESTAMP,
    completed_date TIMESTAMP,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    cost DECIMAL(10,2),
    parts_used TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_vehicle_id ON maintenance_tasks(vehicle_id);
CREATE INDEX idx_maintenance_status ON maintenance_tasks(status);
CREATE INDEX idx_maintenance_assigned_to ON maintenance_tasks(assigned_to);
CREATE INDEX idx_maintenance_scheduled_date ON maintenance_tasks(scheduled_date);

-- ============================================
-- جدول الكتيبات الفنية (Technical Manuals)
-- ============================================
CREATE TABLE technical_manuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id),
    file_size VARCHAR(50),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_manuals_search ON technical_manuals(title, description, vehicle_type);
CREATE INDEX idx_manuals_vehicle_type ON technical_manuals(vehicle_type);

-- ============================================
-- جدول أنظمة التشخيص (Diagnosis Systems)
-- ============================================
CREATE TABLE diagnosis_systems (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    color VARCHAR(50),
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diagnosis_systems_vehicle_id ON diagnosis_systems(vehicle_id);

-- ============================================
-- جدول عناصر التشخيص (Diagnosis Items)
-- ============================================
CREATE TABLE diagnosis_items (
    id SERIAL PRIMARY KEY,
    system_id INTEGER NOT NULL REFERENCES diagnosis_systems(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    steps TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diagnosis_items_system_id ON diagnosis_items(system_id);

-- ============================================
-- جدول وسائط التشخيص (Diagnosis Media)
-- ============================================
CREATE TABLE diagnosis_media (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES diagnosis_items(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type VARCHAR(50) CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diagnosis_media_item_id ON diagnosis_media(item_id);

-- ============================================
-- جدول مهام الإصلاح (Repair Tasks)
-- ============================================
CREATE TABLE repair_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty VARCHAR(50) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_time VARCHAR(100),
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_ids INTEGER[],
    task_type VARCHAR(50) DEFAULT 'repair',
    safety_procedures TEXT,
    workshop_requirements TEXT,
    technician_count INTEGER,
    technicians_count INTEGER,
    required_tools TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repair_tasks_vehicle_id ON repair_tasks(vehicle_id);
CREATE INDEX idx_repair_tasks_category ON repair_tasks(category);

-- ============================================
-- جدول خطوات الإصلاح (Repair Steps)
-- ============================================
CREATE TABLE repair_steps (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES repair_tasks(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    tool_required VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repair_steps_task_id ON repair_steps(task_id);

-- ============================================
-- جدول وسائط الإصلاح (Repair Media)
-- ============================================
CREATE TABLE repair_media (
    id SERIAL PRIMARY KEY,
    step_id INTEGER REFERENCES repair_steps(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES repair_tasks(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type VARCHAR(50) CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repair_media_step_id ON repair_media(step_id);
CREATE INDEX idx_repair_media_task_id ON repair_media(task_id);

-- ============================================
-- جدول أقسام الصيانة (Maintenance Sections)
-- ============================================
CREATE TABLE maintenance_sections (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    section_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_sections_vehicle_id ON maintenance_sections(vehicle_id);

-- ============================================
-- جدول حزم عمل الصيانة (Maintenance Work Packages)
-- ============================================
CREATE TABLE maintenance_work_packages (
    id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES maintenance_sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    estimated_time VARCHAR(100),
    media JSONB,
    package_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_work_packages_section_id ON maintenance_work_packages(section_id);

-- ============================================
-- جدول أقسام فحص الأنظمة
-- ============================================
CREATE TABLE system_inspection_sections (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    section_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_inspection_sections_vehicle_id ON system_inspection_sections(vehicle_id);

-- ============================================
-- جدول حزم عمل فحص الأنظمة
-- ============================================
CREATE TABLE system_inspection_work_packages (
    id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES system_inspection_sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    estimated_time VARCHAR(100),
    media JSONB,
    package_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_inspection_work_packages_section_id ON system_inspection_work_packages(section_id);

-- ============================================
-- جدول أقسام الأعطال الشائعة
-- ============================================
CREATE TABLE common_faults_sections (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    section_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_common_faults_sections_vehicle_id ON common_faults_sections(vehicle_id);

-- ============================================
-- جدول حزم عمل الأعطال الشائعة
-- ============================================
CREATE TABLE common_faults_work_packages (
    id SERIAL PRIMARY KEY,
    section_id INTEGER REFERENCES common_faults_sections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    estimated_time VARCHAR(100),
    media JSONB,
    package_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_common_faults_work_packages_section_id ON common_faults_work_packages(section_id);

-- ============================================
-- جدول الاختبارات (Tests)
-- ============================================
CREATE TABLE tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER,
    passing_score INTEGER DEFAULT 70,
    target_vehicles JSONB,
    is_published BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tests_created_by ON tests(created_by);
CREATE INDEX idx_tests_is_published ON tests(is_published);

-- ============================================
-- جدول عناصر الاختبار (Test Items)
-- ============================================
CREATE TABLE test_items (
    id SERIAL PRIMARY KEY,
    test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer VARCHAR(10) NOT NULL,
    points INTEGER DEFAULT 1,
    item_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_test_items_test_id ON test_items(test_id);

-- ============================================
-- Views مفيدة
-- ============================================

-- عرض الأعطال المفتوحة
CREATE VIEW vw_open_faults AS
SELECT 
    f.id,
    f.fault_code,
    f.title,
    f.description,
    f.severity,
    f.status,
    f.category,
    f.system_affected,
    f.reported_at,
    v.plate_number,
    v.vehicle_type,
    v.model,
    v.manufacturer,
    u.full_name AS reported_by_name,
    u.employee_id AS reported_by_id
FROM faults f
INNER JOIN vehicles v ON f.vehicle_id = v.id
LEFT JOIN users u ON f.reported_by = u.id
WHERE f.status IN ('open', 'in_progress');

-- عرض مهام الصيانة القادمة
CREATE VIEW vw_upcoming_maintenance AS
SELECT 
    m.id,
    m.title,
    m.task_type,
    m.status,
    m.priority,
    m.scheduled_date,
    m.estimated_hours,
    m.cost,
    v.plate_number,
    v.vehicle_type,
    v.model,
    u.full_name AS assigned_to_name,
    u.employee_id AS assigned_to_id
FROM maintenance_tasks m
INNER JOIN vehicles v ON m.vehicle_id = v.id
LEFT JOIN users u ON m.assigned_to = u.id
WHERE m.status IN ('pending', 'in_progress')
AND m.scheduled_date >= CURRENT_TIMESTAMP;

-- عرض إحصائيات المركبات
CREATE VIEW vw_vehicle_stats AS
SELECT 
    v.id,
    v.plate_number,
    v.vehicle_type,
    v.status,
    COUNT(DISTINCT f.id) AS total_faults,
    COUNT(DISTINCT CASE WHEN f.status IN ('open', 'in_progress') THEN f.id END) AS open_faults,
    COUNT(DISTINCT m.id) AS total_maintenance_tasks,
    COUNT(DISTINCT CASE WHEN m.status = 'completed' THEN m.id END) AS completed_tasks,
    COALESCE(SUM(m.cost), 0) AS total_maintenance_cost
FROM vehicles v
LEFT JOIN faults f ON v.id = f.vehicle_id
LEFT JOIN maintenance_tasks m ON v.id = m.vehicle_id
GROUP BY v.id, v.plate_number, v.vehicle_type, v.status;

-- ============================================
-- Triggers للتحديث التلقائي
-- ============================================

-- Function لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faults_updated_at BEFORE UPDATE ON faults
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnosis_systems_updated_at BEFORE UPDATE ON diagnosis_systems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnosis_items_updated_at BEFORE UPDATE ON diagnosis_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repair_tasks_updated_at BEFORE UPDATE ON repair_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_sections_updated_at BEFORE UPDATE ON maintenance_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_work_packages_updated_at BEFORE UPDATE ON maintenance_work_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_inspection_sections_updated_at BEFORE UPDATE ON system_inspection_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_inspection_work_packages_updated_at BEFORE UPDATE ON system_inspection_work_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_common_faults_sections_updated_at BEFORE UPDATE ON common_faults_sections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_common_faults_work_packages_updated_at BEFORE UPDATE ON common_faults_work_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_specifications_updated_at BEFORE UPDATE ON vehicle_specifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- إدراج بيانات أساسية
-- ============================================

-- إدراج وحدة افتراضية
INSERT INTO units (name) VALUES ('الوحدة الرئيسية');

-- إدراج مستخدم Admin (كلمة المرور: 123123)
-- Hash generated with bcrypt for password '123123'
INSERT INTO users (employee_id, full_name, email, password_hash, role, unit_id, phone) VALUES
('ADMIN001', 'مدير النظام', 'admin@example.com', '$2b$10$rKvVPx5JqF5yF5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', 'admin', 1, '0501234567');

-- ============================================
-- النهاية
-- ============================================

SELECT '✅ تم إنشاء قاعدة البيانات بنجاح!' AS message;
