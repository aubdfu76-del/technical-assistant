
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'intelligent_tech_assistant',
    password: process.env.DB_PASSWORD || '1415',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function deleteTask(id) {
    const client = await pool.connect();
    try {
        console.log(`Attempting to delete task ${id}...`);
        await client.query('BEGIN');

        console.log('Deleting media...');
        await client.query('DELETE FROM repair_media WHERE task_id = $1', [id]);

        console.log('Deleting steps...');
        await client.query('DELETE FROM repair_steps WHERE task_id = $1', [id]);

        console.log('Deleting task...');
        const res = await client.query('DELETE FROM repair_tasks WHERE id = $1', [id]);

        console.log(`Deleted ${res.rowCount} tasks.`);

        await client.query('COMMIT');
        console.log('SUCCESS!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('FAILED:', err);
        console.error('Code:', err.code);
        console.error('Detail:', err.detail);
        console.error('Constraint:', err.constraint);
    } finally {
        client.release();
        await pool.end();
    }
}

// Ensure ID matches one that actually exists and user likely wants to delete (or just a test one)
// Using 16 from previous list
deleteTask(16);
