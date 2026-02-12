const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addMissingColumns() {
    try {
        console.log('🔄 Adding missing columns to vehicles table...');

        // إضافة equipment_name
        await pool.query(`
            ALTER TABLE vehicles 
            ADD COLUMN IF NOT EXISTS equipment_name VARCHAR(200)
        `);
        console.log('✅ Added equipment_name column');

        // إضافة image_url
        await pool.query(`
            ALTER TABLE vehicles 
            ADD COLUMN IF NOT EXISTS image_url TEXT
        `);
        console.log('✅ Added image_url column');

        // التحقق من النتيجة
        const result = await pool.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'vehicles' 
            ORDER BY ordinal_position
        `);

        console.log('\n📊 Current vehicles table structure:');
        result.rows.forEach(row => {
            const length = row.character_maximum_length ? `(${row.character_maximum_length})` : '';
            console.log(`  - ${row.column_name}: ${row.data_type}${length}`);
        });

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

addMissingColumns();
