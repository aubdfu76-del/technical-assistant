const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function listRepairTasks() {
    try {
        const res = await pool.query('SELECT id, title FROM repair_tasks ORDER BY id DESC LIMIT 5');
        console.log('Found tasks:', res.rows);

        if (res.rows.length > 0) {
            const taskId = res.rows[0].id;
            console.log(`\nTesting with Task ID: ${taskId}`);

            // 1. Add Media
            console.log('Adding test image...');
            const insertRes = await pool.query(`
                INSERT INTO repair_media (task_id, media_type, url) 
                VALUES ($1, 'image', 'https://via.placeholder.com/300') 
                RETURNING *
            `, [taskId]);
            console.log('Inserted Media:', insertRes.rows[0]);

            // 2. Fetch Media (Simulate getRepairTaskDetails query)
            console.log('\nFetching task media (step_id IS NULL check)...');
            const fetchRes = await pool.query('SELECT * FROM repair_media WHERE task_id = $1 AND step_id IS NULL', [taskId]);
            console.log('Fetched Media Rows:', fetchRes.rows);

            if (fetchRes.rows.length > 0) {
                console.log('✅ SUCCESS: Media was added and retrieved successfully.');
            } else {
                console.log('❌ FAILURE: Media was added but NOT retrieved with the current query.');

                // Debug: Check if step_id is actually null
                const debugRes = await pool.query('SELECT * FROM repair_media WHERE task_id = $1', [taskId]);
                console.log('All media for this task:', debugRes.rows);
            }
        } else {
            console.log('No repair tasks found to test with.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

listRepairTasks();
