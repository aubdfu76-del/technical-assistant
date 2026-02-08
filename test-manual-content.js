const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function testManualContent() {
    try {
        console.log('🔍 فحص محتوى الكراسات...\n');

        // Get all manuals with content
        const result = await pool.query(`
            SELECT id, title, vehicle_type, 
                   LENGTH(content) as content_length,
                   SUBSTRING(content, 1, 200) as content_preview
            FROM technical_manuals 
            WHERE content IS NOT NULL AND content != ''
            ORDER BY created_at DESC
        `);

        if (result.rows.length === 0) {
            console.log('❌ لا توجد كراسات تحتوي على محتوى');
            return;
        }

        console.log(`✅ تم العثور على ${result.rows.length} كراسة تحتوي على محتوى:\n`);

        result.rows.forEach((manual, index) => {
            console.log(`${index + 1}. ${manual.title}`);
            console.log(`   المركبة: ${manual.vehicle_type || 'عامة'}`);
            console.log(`   طول المحتوى: ${manual.content_length} حرف`);
            console.log(`   معاينة المحتوى:`);
            console.log(`   ${manual.content_preview}...`);
            console.log('');
        });

        // Test search with English keyword
        console.log('\n🔍 اختبار البحث بكلمة إنجليزية "engine"...');
        const searchResult = await pool.query(`
            SELECT title, vehicle_type
            FROM technical_manuals
            WHERE content ILIKE '%engine%'
        `);

        if (searchResult.rows.length > 0) {
            console.log(`✅ تم العثور على ${searchResult.rows.length} كراسة تحتوي على "engine"`);
            searchResult.rows.forEach(m => {
                console.log(`   - ${m.title}`);
            });
        } else {
            console.log('❌ لم يتم العثور على نتائج');
        }

        // Test search with Arabic keyword
        console.log('\n🔍 اختبار البحث بكلمة عربية "محرك"...');
        const searchResult2 = await pool.query(`
            SELECT title, vehicle_type
            FROM technical_manuals
            WHERE content ILIKE '%محرك%'
        `);

        if (searchResult2.rows.length > 0) {
            console.log(`✅ تم العثور على ${searchResult2.rows.length} كراسة تحتوي على "محرك"`);
            searchResult2.rows.forEach(m => {
                console.log(`   - ${m.title}`);
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

testManualContent();
