const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function quickCheck() {
    try {
        // Check all manuals
        const result = await pool.query(`
            SELECT id, title, vehicle_type, 
                   LENGTH(content) as len,
                   SUBSTRING(content, 1, 100) as preview
            FROM technical_manuals
            ORDER BY created_at DESC
        `);

        console.log(`\n📚 عدد الكراسات: ${result.rows.length}\n`);

        result.rows.forEach((m, i) => {
            console.log(`${i + 1}. ${m.title}`);
            console.log(`   المركبة: ${m.vehicle_type || 'عامة'}`);
            console.log(`   المحتوى: ${m.len} حرف`);
            if (m.len > 0) {
                console.log(`   معاينة: ${m.preview}...`);
            }
            console.log('');
        });

    } catch (error) {
        console.error('خطأ:', error.message);
    } finally {
        await pool.end();
    }
}

quickCheck();
