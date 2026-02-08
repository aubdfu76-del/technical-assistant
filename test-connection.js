// اختبار الاتصال بـ PostgreSQL
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
});

async function testConnection() {
    console.log('🔄 جاري الاتصال بـ PostgreSQL...\n');
    console.log('الإعدادات:');
    console.log('  Host:', process.env.DB_HOST || 'localhost');
    console.log('  Port:', process.env.DB_PORT || '5432');
    console.log('  Database:', process.env.DB_NAME || 'intelligent_technical_assistant');
    console.log('  User:', process.env.DB_USER || 'postgres');
    console.log('');

    try {
        const client = await pool.connect();
        console.log('✅ تم الاتصال بنجاح!\n');

        // عرض إصدار PostgreSQL
        const version = await client.query('SELECT version()');
        console.log('📊 إصدار PostgreSQL:');
        console.log(version.rows[0].version.split(',')[0]);
        console.log('');

        // عرض عدد الجداول
        const tables = await client.query(`
            SELECT COUNT(*) as table_count 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        `);
        console.log('📋 عدد الجداول:', tables.rows[0].table_count);
        console.log('');

        // عرض أسماء الجداول
        const tableNames = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        `);

        if (tableNames.rows.length > 0) {
            console.log('📝 الجداول الموجودة:');
            tableNames.rows.forEach(t => {
                console.log('  ✓', t.table_name);
            });
            console.log('');

            // عرض عدد السجلات
            const users = await client.query('SELECT COUNT(*) as count FROM users');
            console.log('👥 عدد المستخدمين:', users.rows[0].count);

            const vehicles = await client.query('SELECT COUNT(*) as count FROM vehicles');
            console.log('🚛 عدد المركبات:', vehicles.rows[0].count);

            const faults = await client.query('SELECT COUNT(*) as count FROM faults');
            console.log('⚠️  عدد الأعطال:', faults.rows[0].count);
        } else {
            console.log('⚠️  لا توجد جداول! قم بتنفيذ schema.sql أولاً.');
        }

        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('✅ الاتصال يعمل بشكل ممتاز!');
        console.log('═══════════════════════════════════════');

        client.release();
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('');
        console.error('═══════════════════════════════════════');
        console.error('❌ فشل الاتصال!');
        console.error('═══════════════════════════════════════');
        console.error('');
        console.error('الخطأ:', error.message);
        console.error('');
        console.error('الحلول المقترحة:');
        console.error('  1. تأكد من تشغيل PostgreSQL');
        console.error('  2. تحقق من كلمة المرور في ملف .env');
        console.error('  3. تأكد من وجود قاعدة البيانات:');
        console.error('     psql -U postgres -c "CREATE DATABASE intelligent_technical_assistant;"');
        console.error('  4. تأكد من تنفيذ ملف schema.sql:');
        console.error('     psql -U postgres -d intelligent_technical_assistant -f database/schema.sql');
        console.error('');
        await pool.end();
        process.exit(1);
    }
}

testConnection();
