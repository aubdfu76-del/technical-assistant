const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function checkTable() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'diagnosis_items'");
        console.log('Columns in diagnosis_items:', res.rows.map(r => r.column_name));

        const dataRes = await pool.query("SELECT id, title, required_tools FROM diagnosis_items ORDER BY id DESC LIMIT 5");
        console.log('Last 5 items:', dataRes.rows);

        await pool.end();
    } catch (err) {
        console.error('Error checking table:', err);
        process.exit(1);
    }
}

checkTable();
