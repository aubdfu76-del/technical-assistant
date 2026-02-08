const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

async function checkData() {
    try {
        const dataRes = await pool.query("SELECT id, title, required_tools, safety_procedures, workshop_requirements, technicians_count FROM diagnosis_items ORDER BY id DESC LIMIT 5");
        console.log('Data with new columns:', JSON.stringify(dataRes.rows, null, 2));
        await pool.end();
    } catch (err) {
        console.error('Error checking data:', err);
        process.exit(1);
    }
}

checkData();
