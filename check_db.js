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
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'diagnosis_items'
        `);
        console.log('Columns in diagnosis_items:');
        res.rows.forEach(row => console.log('- ' + row.column_name));

        const resMedia = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'diagnosis_media'
        `);
        console.log('\nColumns in diagnosis_media:');
        resMedia.rows.forEach(row => console.log('- ' + row.column_name));

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkColumns();
