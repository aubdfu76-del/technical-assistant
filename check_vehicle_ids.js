
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function checkColumns() {
    try {
        const tables = ['repair_tasks', 'maintenance_sections', 'diagnosis_systems', 'common_faults'];

        for (const table of tables) {
            const res = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = 'vehicle_ids'
            `, [table]);

            if (res.rows.length > 0) {
                console.log(`✅ Table '${table}' has 'vehicle_ids' column (${res.rows[0].data_type}).`);
            } else {
                console.log(`❌ Table '${table}' DOES NOT have 'vehicle_ids' column.`);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkColumns();
