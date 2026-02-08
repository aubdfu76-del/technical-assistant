const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function addOrderColumn() {
    try {
        console.log('Checking if order_index column exists...');
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'repair_media' AND column_name = 'order_index'
        `);

        if (res.rows.length === 0) {
            console.log('Adding order_index column...');
            await pool.query('ALTER TABLE repair_media ADD COLUMN order_index INTEGER DEFAULT 0');
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

addOrderColumn();
