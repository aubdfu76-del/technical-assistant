const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function testUpdate() {
    try {
        console.log('Testing update for item 1...');
        const res = await pool.query(
            `UPDATE diagnosis_items 
       SET safety_procedures = $1, workshop_requirements = $2, technicians_count = $3
       WHERE id = $4 RETURNING *`,
            ['إجراء سلامة تجريبي', 'متطلب ورشة تجريبي', 2, 1]
        );
        console.log('Update result:', JSON.stringify(res.rows[0], null, 2));
        await pool.end();
    } catch (err) {
        console.error('Update failed:', err);
        process.exit(1);
    }
}

testUpdate();
