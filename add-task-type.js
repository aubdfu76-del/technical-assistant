const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function addTypeColumn() {
    try {
        console.log('Checking if task_type column exists...');
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'repair_tasks' AND column_name = 'task_type'
        `);

        if (res.rows.length === 0) {
            console.log('Adding task_type column...');
            await pool.query("ALTER TABLE repair_tasks ADD COLUMN task_type VARCHAR(50) DEFAULT 'repair'");
            // Set existing rows to 'repair' just in case
            await pool.query("UPDATE repair_tasks SET task_type = 'repair' WHERE task_type IS NULL");
            console.log('✅ Column added successfully.');
        } else {
            console.log('ℹ️ Column already exists.');
        }
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

addTypeColumn();
