
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'intelligent_tech_assistant',
    password: process.env.DB_PASSWORD || '1415',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function listTasks() {
    try {
        const res = await pool.query('SELECT id, title FROM repair_tasks ORDER BY id DESC LIMIT 5');
        console.log("Recent Tasks:", res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

listTasks();
