-- ============================================
-- Repair Execution Module Tables
-- ============================================

-- Create repair_tasks table
CREATE TABLE IF NOT EXISTS repair_tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty VARCHAR(50) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    estimated_time VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create repair_steps table
CREATE TABLE IF NOT EXISTS repair_steps (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES repair_tasks(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    tool_required VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create repair_media table
CREATE TABLE IF NOT EXISTS repair_media (
    id SERIAL PRIMARY KEY,
    step_id INTEGER REFERENCES repair_steps(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    media_type VARCHAR(50) CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data
INSERT INTO repair_tasks (title, description, category, difficulty, estimated_time) VALUES
('فك وتركيب رأس المحرك FH16', 'خطوات فحص وفك رأس المحرك لشاحنة FH16 مع مراعاة عزم الربط', 'المحرك', 'hard', '4 ساعات'),
('تغيير فحمات الفرامل الأمامية', 'استبدال فحمات الفرامل طراز ديسك لجميع الشاحنات الكبيرة', 'الفرامل', 'medium', '45 دقيقة'),
('فحص حساس ضغط التربو', 'طريقة فحص وتنظيف حساس الضغط ومعايرة القراءات', 'الكهرباء', 'easy', '20 دقيقة');

-- Insert steps for the first task
INSERT INTO repair_steps (task_id, step_number, instruction, tool_required) VALUES
(1, 1, 'قم بتفريغ سائل التبريد من الراديتر والمحرك بالكامل', 'مفتاح 19 ملم، وعاء تفريغ'),
(1, 2, 'فك أنابيب الوقود عالية الضغط والوصلات الكهربائية للبخاخات', 'مفتاح عزم، مفك براغي'),
(1, 3, 'فك براغي رأس المحرك بالترتيب العكسي لترتيب الربط المعتمد', 'مفتاح عزم ثقيل، لقمة 24 ملم');

-- Insert steps for second task
INSERT INTO repair_steps (task_id, step_number, instruction, tool_required) VALUES
(2, 1, 'ارفع الشاحنة وقم بفك الإطار الأمامي', 'رافعة هيدروليكية، مسدس هواء'),
(2, 2, 'فك مسمار التثبيت الخاص بكاليبر الفرامل واسحب الفحمات القديمة', 'مفتاح ألن 12 ملم');
