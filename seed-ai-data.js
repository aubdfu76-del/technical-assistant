const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function seedAIData() {
    try {
        console.log('🌱 بدء إضافة بيانات تجريبية للمساعد الذكي...\n');

        // 1. إضافة كراسات فنية تجريبية
        console.log('📚 إضافة كراسات فنية...');
        await pool.query(`
            INSERT INTO technical_manuals (title, description, file_path, vehicle_type, uploaded_by, file_size, content)
            VALUES 
            ('دليل صيانة محرك الديزل', 'دليل شامل لصيانة محركات الديزل للشاحنات الثقيلة', 'demo-diesel-manual.pdf', 'شاحنة', 1, '2.5 MB', 
             'صيانة محرك الديزل: يجب فحص مستوى الزيت بشكل دوري. تغيير الفلاتر كل 10000 كم. فحص نظام التبريد. تنظيف فلتر الهواء. فحص حزام المروحة.'),
            
            ('دليل نظام الفرامل', 'إرشادات الصيانة والإصلاح لأنظمة الفرامل الهوائية', 'demo-brakes-manual.pdf', 'شاحنة', 1, '1.8 MB',
             'نظام الفرامل الهوائية: فحص ضغط الهواء يومياً. تفريغ خزان الهواء من الماء. فحص تيل الفرامل. فحص الخراطيم والوصلات. اختبار فرامل الطوارئ.'),
            
            ('دليل نظام التعليق', 'صيانة نظام التعليق والممتصات', 'demo-suspension-manual.pdf', 'حافلة', 1, '1.5 MB',
             'نظام التعليق: فحص الممتصات والسوست. فحص المفاصل والبوشات. ضبط زوايا العجلات. فحص نظام التوجيه. تشحيم النقاط المحددة.'),
            
            ('دليل النظام الكهربائي', 'صيانة وإصلاح الأنظمة الكهربائية', 'demo-electrical-manual.pdf', 'شاحنة', 1, '2.1 MB',
             'النظام الكهربائي: فحص البطارية والشحن. فحص المولد. فحص نظام الإضاءة. فحص الأسلاك والتوصيلات. اختبار المحرك الكهربائي للتشغيل.')
            ON CONFLICT DO NOTHING
        `);
        console.log('✅ تم إضافة 4 كراسات فنية\n');

        // 2. إضافة أعطال شائعة
        console.log('🔧 إضافة أعطال شائعة...');
        await pool.query(`
            INSERT INTO faults (title, description, severity, status, equipment_type_id, reported_by)
            VALUES 
            ('ارتفاع حرارة المحرك', 'المحرك يسخن بشكل غير طبيعي أثناء التشغيل. قد يكون السبب نقص سائل التبريد أو تلف المروحة', 'high', 'resolved', 1, 1),
            ('ضعف في الفرامل', 'استجابة الفرامل ضعيفة وتحتاج لمسافة أطول للتوقف. يجب فحص تيل الفرامل ونظام الهواء', 'critical', 'resolved', 1, 1),
            ('تسريب زيت المحرك', 'وجود بقع زيت تحت المركبة. يجب فحص الجوان والأختام', 'medium', 'resolved', 1, 1),
            ('صوت غير طبيعي من المحرك', 'صوت طرق أو صفير من المحرك. قد يكون بسبب حزام المروحة أو مشكلة في الصمامات', 'high', 'resolved', 1, 1)
            ON CONFLICT DO NOTHING
        `);
        console.log('✅ تم إضافة 4 أعطال شائعة\n');

        // 3. إضافة مركبات تجريبية
        console.log('🚛 إضافة مركبات تجريبية...');
        await pool.query(`
            INSERT INTO vehicles (plate_number, vehicle_type, status, last_maintenance)
            VALUES 
            ('أ ب ج 1234', 'شاحنة مرسيدس أكتروس', 'active', CURRENT_DATE - INTERVAL '15 days'),
            ('د هـ و 5678', 'حافلة فولفو', 'active', CURRENT_DATE - INTERVAL '20 days'),
            ('ز ح ط 9012', 'شاحنة سكانيا', 'maintenance', CURRENT_DATE - INTERVAL '5 days'),
            ('ي ك ل 3456', 'حافلة مرسيدس', 'active', CURRENT_DATE - INTERVAL '30 days')
            ON CONFLICT DO NOTHING
        `);
        console.log('✅ تم إضافة 4 مركبات\n');

        console.log('🎉 تم إضافة جميع البيانات التجريبية بنجاح!');
        console.log('\n📝 الآن يمكنك تجربة المساعد الذكي بأسئلة مثل:');
        console.log('   - "كيف أصلح ارتفاع حرارة المحرك؟"');
        console.log('   - "دليل صيانة الفرامل"');
        console.log('   - "مشكلة تسريب الزيت"');
        console.log('   - "صيانة المحرك"');

    } catch (error) {
        console.error('❌ خطأ:', error.message);
    } finally {
        await pool.end();
    }
}

seedAIData();
