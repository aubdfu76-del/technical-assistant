const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function checkTables() {
    try {
        // Check technical_manuals
        const manuals = await pool.query('SELECT COUNT(*) FROM technical_manuals');
        console.log(`📚 عدد الكراسات الفنية: ${manuals.rows[0].count}`);

        // Check faults
        const faults = await pool.query('SELECT COUNT(*) FROM faults');
        console.log(`🔧 عدد الأعطال: ${faults.rows[0].count}`);

        // Check vehicles
        const vehicles = await pool.query('SELECT COUNT(*) FROM vehicles');
        console.log(`🚛 عدد المركبات: ${vehicles.rows[0].count}`);

        // Show sample manual
        const sampleManual = await pool.query('SELECT title, content FROM technical_manuals LIMIT 1');
        if (sampleManual.rows.length > 0) {
            console.log(`\n✅ مثال على كراسة: ${sampleManual.rows[0].title}`);
            console.log(`   المحتوى: ${sampleManual.rows[0].content?.substring(0, 100)}...`);
        }

    } catch (error) {
        console.error('❌ خطأ:', error.message);
    } finally {
        await pool.end();
    }
}

checkTables();
