const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function testInsert() {
    try {
        console.log('Testing insert into maintenance_sections...');
        const key_id = 'custom_' + Date.now();
        const title = 'Test Section';
        const icon = 'Wrench';
        const color = '100,100,100';
        const description = 'Test Desc';

        const res = await pool.query(
            'INSERT INTO maintenance_sections (key_id, title, icon, color, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [key_id, title, icon, color, description]
        );
        console.log('Success:', res.rows[0]);
    } catch (err) {
        console.error('Insert Error:', err);
    } finally {
        await pool.end();
    }
}

testInsert();
