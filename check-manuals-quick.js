const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function checkManuals() {
    try {
        console.log('🔍 فحص الكراسات الفنية...\n');

        const result = await pool.query(`
            SELECT 
                id, 
                title, 
                vehicle_type,
                vehicle_id,
                LENGTH(content) as content_length,
                SUBSTRING(content, 1, 500) as content_preview
            FROM technical_manuals 
            ORDER BY created_at DESC
        `);

        if (result.rows.length === 0) {
            console.log('❌ لا توجد كراسات في قاعدة البيانات');
            return;
        }

        console.log(`✅ تم العثور على ${result.rows.length} كراسة:\n`);

        result.rows.forEach((manual, index) => {
            console.log(`${index + 1}. ${manual.title}`);
            console.log(`   المركبة: ${manual.vehicle_type || 'عامة'}`);
            console.log(`   ID المركبة: ${manual.vehicle_id || 'لا يوجد'}`);
            console.log(`   طول المحتوى: ${manual.content_length || 0} حرف`);

            if (manual.content_length > 0) {
                console.log(`   ✅ يحتوي على محتوى`);
                console.log(`   معاينة: ${manual.content_preview.substring(0, 150)}...`);
            } else {
                console.log(`   ❌ لا يحتوي على محتوى (فارغ)`);
            }
            console.log('');
        });

        // Test search
        console.log('\n🔍 اختبار البحث بكلمة "engine"...');
        const searchResult = await pool.query(`
            SELECT id, title, 
                   SUBSTRING(content, 1, 200) as snippet
            FROM technical_manuals
            WHERE content ILIKE '%engine%'
        `);

        if (searchResult.rows.length > 0) {
            console.log(`✅ تم العثور على ${searchResult.rows.length} كراسة تحتوي على "engine":`);
            searchResult.rows.forEach(m => {
                console.log(`\n   📄 ${m.title}`);
                console.log(`   المحتوى: ${m.snippet}...`);
            });
        } else {
            console.log('❌ لم يتم العثور على نتائج');
        }

    } catch (error) {
        console.error('❌ خطأ:', error.message);
    } finally {
        await pool.end();
    }
}

checkManuals();
