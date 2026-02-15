const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function addColumn() {
    try {
        console.log('Adding vehicle_ids column to maintenance_sections table...');

        // Add column if not exists
        await pool.query(`
            ALTER TABLE maintenance_sections 
            ADD COLUMN IF NOT EXISTS vehicle_ids INTEGER[];
        `);

        console.log('✅ Column vehicle_ids added (or already existed).');

        // Check columns to confirm
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'maintenance_sections';
        `);
        console.table(res.rows);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
        process.exit();
    }
}

addColumn();
