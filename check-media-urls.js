const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function checkMediaUrls() {
    try {
        console.log('Checking repair_media URLs...');
        const res = await pool.query('SELECT id, url, media_type FROM repair_media ORDER BY id DESC LIMIT 5');
        console.log('Recent Media Items:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkMediaUrls();
