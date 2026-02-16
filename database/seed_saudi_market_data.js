const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function seedSaudiMarketData() {
    const client = await pool.connect();
    try {
        console.log('🇸🇦 بدء إضافة بيانات السوق السعودي...');

        await client.query('BEGIN');

        // ==========================================
        // 0. إنشاء الجداول المفقودة (إن وجدت)
        // ==========================================
        console.log('🛠️ التحقق من وجود الجداول المطلوبة...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS common_faults_sections (
                id SERIAL PRIMARY KEY,
                vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                section_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS common_faults_work_packages (
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
        `);
        console.log('✅ تم التحقق من الجداول');

        // ==========================================
        // 1. إضافة المركبات (Vehicles)
        // ==========================================
        console.log('🚛 إضافة مركبات (ايسوزو & هايلكس)...');

        // 1.1 Isuzu NPR
        let isuzuId;
        const isuzuCheck = await client.query("SELECT id FROM vehicles WHERE plate_number = 'KSA-2030'");
        if (isuzuCheck.rows.length > 0) {
            isuzuId = isuzuCheck.rows[0].id;
            console.log(`ℹ️ ايسوزو NPR موجودة مسبقاً (ID: ${isuzuId})`);
        } else {
            const isuzuRes = await client.query(`
                INSERT INTO vehicles (plate_number, equipment_name, vehicle_type, model, manufacturer, year, fuel_type, current_km, status, image_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            `, ['KSA-2030', 'دينا ايسوزو سطحة', 'شاحنة خفيفة', 'NPR 85', 'Isuzu', 2024, 'ديزل', 15000, 'active', 'https://example.com/isuzu-npr.jpg']);
            isuzuId = isuzuRes.rows[0].id;
            console.log(`✅ تمت إضافة ايسوزو NPR (ID: ${isuzuId})`);
        }

        // 1.2 Toyota Hilux
        let hiluxId;
        const hiluxCheck = await client.query("SELECT id FROM vehicles WHERE plate_number = 'KSA-2034'");
        if (hiluxCheck.rows.length > 0) {
            hiluxId = hiluxCheck.rows[0].id;
            console.log(`ℹ️ تويوتا هايلكس موجودة مسبقاً (ID: ${hiluxId})`);
        } else {
            const hiluxRes = await client.query(`
                INSERT INTO vehicles (plate_number, equipment_name, vehicle_type, model, manufacturer, year, fuel_type, current_km, status, image_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING id
            `, ['KSA-2034', 'هايلكس غمارتين دبل', 'بيك أب', 'Hilux 2.8L 4x4', 'Toyota', 2023, 'ديزل', 45000, 'active', 'https://example.com/hilux.jpg']);
            hiluxId = hiluxRes.rows[0].id;
            console.log(`✅ تمت إضافة تويوتا هايلكس (ID: ${hiluxId})`);
        }

        // ==========================================
        // 2. إضافة أنظمة التشخيص (Diagnosis Systems)
        // ==========================================
        console.log('🔍 إضافة أنظمة التشخيص...');

        const systemsData = [
            // Isuzu Systems
            { vid: isuzuId, name: 'نظام عادم الديزل (DPF/EGR)', icon: 'filter', desc: 'نظام معالجة انبعاثات العادم وفلتر البيئة' },
            { vid: isuzuId, name: 'نظام الحقن (Common Rail)', icon: 'engine', desc: 'نظام حقن الوقود الديزل المشترك' },
            { vid: isuzuId, name: 'نظام الفرامل (ABS/Exhaust)', icon: 'disc', desc: 'نظام الفرامل الهيدروليكي وفرامل العادم' },

            // Hilux Systems
            { vid: hiluxId, name: 'نظام الدفع الرباعي 4WD', icon: 'activity', desc: 'نظام الدفع الرباعي والدفرنس' },
            { vid: hiluxId, name: 'نظام التكييف والمناخ', icon: 'thermometer', desc: 'نظام التبريد والتدفئة للمقصورة' },
            { vid: hiluxId, name: 'نظام المحرك (GD Engine)', icon: 'cpu', desc: 'نظام إدارة محرك 1GD-FTV' }
        ];

        for (const sys of systemsData) {
            await client.query(`
                INSERT INTO diagnosis_systems (vehicle_ids, name, description, icon)
                VALUES ($1, $2, $3, $4)
            `, [[sys.vid], sys.name, sys.desc, sys.icon]);
        }
        console.log('✅ تمت إضافة الأنظمة');

        // ==========================================
        // 3. إضافة الأعطال الشائعة (Common Faults Knowledge Base)
        // ==========================================
        console.log('📚 إضافة محتوى الأعطال الشائعة...');

        // 3.1 Isuzu Common Faults Section
        const isuzuFaultsSection = await client.query(`
            INSERT INTO common_faults_sections (vehicle_id, title, description)
            VALUES ($1, $2, $3) RETURNING id
        `, [isuzuId, 'مشاكل نظام العادم والديزل', 'الأعطال الأكثر شيوعاً في شاحنات ايسوزو المتعلقة بالانبعاثات']);

        await client.query(`
            INSERT INTO common_faults_work_packages (section_id, title, content, estimated_time)
            VALUES 
            ($1, 'انسداد فلتر البيئة (DPF)', 'الأعراض:\n- إضاءة لمبة DPF في الطبلون.\n- ضعف عزم المحرك.\n- توقف السيارة عن العمل في الحالات الحرجة.\n\nالحل:\n1. إجراء عملية التجديد اليدوي (Manual Regeneration) من الزر الموجود بقمرة القيادة.\n2. إذا لم تنجح، يجب فك الفلتر وتنظيفه بمواد خاصة أو استبداله.\n3. التأكد من استخدام زيت محرك مخصص لمحركات الديزل الحديثة (Low SAPS).', '45 دقيقة'),
            ($1, 'تعطل صمام EGR', 'الأعراض:\n- دخان أسود كثيف.\n- تقطيع في المحرك.\n- زيادة استهلاك الوقود.\n\nالحل:\n- فك صمام EGR وتنظيفه من الكربون المتراكم.\n- فحص التوصيلات الكهربائية للصمام.\n- استبدال الصمام في حال تلف التروس الداخلية.', 'ساعة ونصف')
        `, [isuzuFaultsSection.rows[0].id]);

        // 3.2 Hilux Common Faults Section
        const hiluxFaultsSection = await client.query(`
            INSERT INTO common_faults_sections (vehicle_id, title, description)
            VALUES ($1, $2, $3) RETURNING id
        `, [hiluxId, 'أعطال ميكانيكية وكهربائية شائعة', 'مشاكل متكررة في تويوتا هايلكس']);

        await client.query(`
            INSERT INTO common_faults_work_packages (section_id, title, content, estimated_time)
            VALUES 
            ($1, 'صوت تكتكة في المحرك (البخاخات)', 'الأعراض:\n- صوت طرق حاد عند السلانسيه.\n- دخان أبيض عند التشغيل البارد.\n\nالسبب:\n- اتساخ أو تلف في بخاخات الديزل.\n\nالحل:\n1. استخدام منظف دورة الوقود الأصلي من تويوتا.\n2. معايرة البخاخات بالكمبيوتر.\n3. استبدال البخاخات التالفة (طقم كامل يفضل).', 'ساعتين'),
            ($1, 'لمبة سير التيمين (T-BELT)', 'تظهر هذه اللمبة كل 150,000 كم لتذكير السائق بتغيير سير التيمين.\n\nالإجراء:\n1. تغيير سير التيمين (Timing Belt).\n2. تغيير الشداد (Tensioner).\n3. إعادة ضبط عداد اللمبة من خلال الطبلون (Reset Procedure).', '30 دقيقة')
        `, [hiluxFaultsSection.rows[0].id]);

        console.log('✅ تم إضافة محتوى الأعطال الشائعة');

        // ==========================================
        // 4. إضافة مهام الصيانة (Maintenance Tasks)
        // ==========================================
        console.log('🛠️ إضافة مهام صيانة 5000 كم...');

        const maintenanceTasks = [
            { vid: isuzuId, title: 'صيانة دورية 5000 كم', desc: 'تغيير زيت المحرك (15W40)، فلتر زيت، تشحيم جميع نقاط التشحيم، فحص ضغط الإطارات، فحص مستوى سائل التبريد.' },
            { vid: hiluxId, title: 'صيانة دورية 5000 كم', desc: 'تغيير زيت وتصفية (5W30)، تشحيم عمود الكردان، تنظيف فلتر الهواء، فحص ماء المساحات والبطارية.' }
        ];

        for (const task of maintenanceTasks) {
            await client.query(`
                INSERT INTO maintenance_tasks (vehicle_id, task_type, title, description, status, priority, scheduled_date, estimated_hours)
                VALUES ($1, 'صيانة دورية', $2, $3, 'pending', 'normal', CURRENT_DATE + INTERVAL '1 day', 1.5)
            `, [task.vid, task.title, task.desc]);
        }
        console.log('✅ تم جدولة صيانة 5000 كم');

        await client.query('COMMIT');
        console.log('🎉 تمت العملية بنجاح كامل!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ حدث خطأ:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

seedSaudiMarketData();
