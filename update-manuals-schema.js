const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function updateManualsSchema() {
    try {
        console.log('🔧 تحديث جدول الكراسات الفنية...\n');

        // Add vehicle_id column if it doesn't exist
        await pool.query(`
            ALTER TABLE technical_manuals 
            ADD COLUMN IF NOT EXISTS vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL
        `);

        console.log('✅ تم إضافة عمود vehicle_id بنجاح');
        console.log('📝 الآن يمكن ربط كل كراسة بمركبة محددة\n');

    } catch (error) {
        console.error('❌ خطأ:', error.message);
    } finally {
        await pool.end();
    }
}

updateManualsSchema();
