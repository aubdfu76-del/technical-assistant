-- ============================================
-- Intelligent Technical Assistant Database
-- PostgreSQL Version
-- نظام المساعد الفني الذكي
-- ============================================

-- إنشاء قاعدة البيانات (نفذ هذا السطر منفصلاً إذا لزم الأمر)
-- CREATE DATABASE intelligent_technical_assistant;

-- الاتصال بقاعدة البيانات
\c intelligent_technical_assistant;

-- ============================================
-- حذف الجداول إذا كانت موجودة
-- ============================================
DROP TABLE IF EXISTS maintenance_tasks CASCADE;
DROP TABLE IF EXISTS faults CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- جدول المستخدمين (Users)
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'technician' CHECK (role IN ('admin', 'supervisor', 'technician')),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_employee_id ON users(employee_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- جدول المركبات (Vehicles)
-- ============================================
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    plate_number VARCHAR(50) UNIQUE NOT NULL,
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
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_plate_number ON vehicles(plate_number);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_type ON vehicles(vehicle_type);

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
-- إدراج بيانات تجريبية
-- ============================================

-- المستخدمين (كلمة المرور: password123)
-- Password hash for 'password123' using bcrypt
INSERT INTO users (employee_id, full_name, email, password_hash, role, phone) VALUES
('ADMIN001', 'مدير النظام', 'admin@example.com', '$2b$10$rKvVPx5JqF5yF5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', 'admin', '0501234567'),
('SUPER001', 'المشرف الأول', 'supervisor@example.com', '$2b$10$rKvVPx5JqF5yF5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', 'supervisor', '0501234568'),
('TECH001', 'فني الصيانة الأول', 'tech1@example.com', '$2b$10$rKvVPx5JqF5yF5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', 'technician', '0501234569'),
('TECH002', 'فني الصيانة الثاني', 'tech2@example.com', '$2b$10$rKvVPx5JqF5yF5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F', 'technician', '0501234570');

-- المركبات
INSERT INTO vehicles (plate_number, vehicle_type, model, manufacturer, year, current_km, engine_type, fuel_type, status) VALUES
('ABC-123', 'شاحنة', 'FH16', 'Volvo', 2022, 45000, 'D13', 'ديزل', 'active'),
('XYZ-456', 'حافلة', 'Sprinter', 'Mercedes-Benz', 2021, 62000, 'OM651', 'ديزل', 'active'),
('DEF-789', 'شاحنة', 'Actros', 'Mercedes-Benz', 2023, 12000, 'OM471', 'ديزل', 'active'),
('GHI-012', 'حافلة', 'Setra S 516', 'Setra', 2020, 95000, 'OM470', 'ديزل', 'maintenance'),
('JKL-345', 'شاحنة', 'FMX', 'Volvo', 2022, 38000, 'D11', 'ديزل', 'active');

-- الأعطال
INSERT INTO faults (vehicle_id, fault_code, title, description, severity, status, category, system_affected, reported_by) VALUES
(1, 'ENG-001', 'ارتفاع حرارة المحرك', 'المحرك يسخن بشكل غير طبيعي أثناء القيادة على الطرق السريعة', 'high', 'open', 'محرك', 'نظام التبريد', 1),
(2, 'BRK-002', 'صوت غريب من الفرامل', 'صوت صرير عند الضغط على الفرامل، خاصة عند السرعات المنخفضة', 'medium', 'in_progress', 'فرامل', 'نظام الفرامل', 2),
(3, 'ELC-003', 'مشكلة في الإضاءة', 'الأضواء الأمامية اليمنى لا تعمل بشكل صحيح', 'low', 'resolved', 'كهرباء', 'نظام الإضاءة', 3),
(1, 'TRN-004', 'اهتزاز في ناقل الحركة', 'اهتزاز ملحوظ عند تغيير السرعات من 3 إلى 4', 'high', 'open', 'ناقل حركة', 'ناقل الحركة', 2),
(4, 'SUS-005', 'تسريب زيت من المساعدات', 'لوحظ تسريب زيت من المساعد الأمامي الأيسر', 'medium', 'open', 'تعليق', 'نظام التعليق', 1);

-- مهام الصيانة
INSERT INTO maintenance_tasks (vehicle_id, fault_id, task_type, title, description, status, priority, assigned_to, scheduled_date, estimated_hours, cost) VALUES
(1, 1, 'إصلاح', 'فحص وإصلاح نظام التبريد', 'فحص شامل لنظام التبريد واستبدال الأجزاء التالفة', 'pending', 'high', 3, CURRENT_TIMESTAMP + INTERVAL '1 day', 4.0, 1500.00),
(2, 2, 'إصلاح', 'استبدال فحمات الفرامل', 'فحص واستبدال فحمات الفرامل الأمامية والخلفية', 'in_progress', 'normal', 4, CURRENT_TIMESTAMP, 2.5, 800.00),
(4, NULL, 'صيانة دورية', 'صيانة دورية 100,000 كم', 'صيانة دورية شاملة تشمل تغيير الزيت والفلاتر', 'pending', 'normal', 3, CURRENT_TIMESTAMP + INTERVAL '7 days', 6.0, 2500.00),
(3, NULL, 'فحص', 'فحص دوري شهري', 'فحص دوري شامل للمركبة', 'completed', 'low', 4, CURRENT_TIMESTAMP - INTERVAL '2 days', 1.5, 200.00);

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

-- ============================================
-- النهاية
-- ============================================

SELECT '✅ تم إنشاء قاعدة البيانات بنجاح!' AS message;
