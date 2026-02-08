const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function addTestManual() {
    try {
        console.log('📚 إضافة كراسة تجريبية...\n');

        const result = await pool.query(`
            INSERT INTO technical_manuals (title, description, file_path, vehicle_type, uploaded_by, file_size, content)
            VALUES 
            ('دليل صيانة محرك الديزل', 'دليل شامل لصيانة محركات الديزل للشاحنات الثقيلة', 'demo-diesel-manual.pdf', 'شاحنة', 1, '2.5 MB', 
             'صيانة محرك الديزل: يجب فحص مستوى الزيت بشكل دوري. تغيير الفلاتر كل 10000 كم. فحص نظام التبريد. تنظيف فلتر الهواء. فحص حزام المروحة. فحص البخاخات والشمعات. تنظيف نظام العادم.')
            RETURNING id, title
        `);

        console.log(`✅ تم إضافة الكراسة بنجاح!`);
        console.log(`   ID: ${result.rows[0].id}`);
        console.log(`   العنوان: ${result.rows[0].title}`);
        console.log('\n💡 الآن يمكنك:');
        console.log('   1. فتح صفحة المساعد الذكي');
        console.log('   2. مرر الماوس على الكراسة');
        console.log('   3. اضغط على أيقونة سلة المهملات للحذف');

    } catch (error) {
        console.error('❌ خطأ:', error.message);
    } finally {
        await pool.end();
    }
}

addTestManual();
