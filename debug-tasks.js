const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function checkTaskTypes() {
    try {
        console.log('--- Checking Task Types ---');
        const res = await pool.query('SELECT id, title, task_type FROM repair_tasks ORDER BY id DESC LIMIT 10');
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkTaskTypes();
