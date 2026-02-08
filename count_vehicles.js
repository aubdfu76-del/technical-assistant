
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function countVehicles() {
    try {
        const res = await pool.query('SELECT COUNT(*) FROM vehicles');
        console.log('Vehicle count:', res.rows[0].count);

        if (res.rows[0].count > 0) {
            const sample = await pool.query('SELECT id, plate_number, manufacturer, model FROM vehicles LIMIT 5');
            console.log('Sample vehicles:', sample.rows);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

countVehicles();
