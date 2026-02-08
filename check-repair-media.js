const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function checkRepairMedia() {
    try {
        console.log('Checking repair_media table columns...');
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'repair_media'
        `);
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));

        console.log('\nChecking sample data...');
        const data = await pool.query('SELECT * FROM repair_media LIMIT 5');
        console.log(data.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkRepairMedia();
