
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'maintenance_db',
    password: process.env.DB_PASSWORD || 'root',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function run() {
    try {
        const sql = fs.readFileSync('create_manuals_table.sql', 'utf8');
        console.log('Executing SQL...');
        await pool.query(sql);
        console.log('Success! Table created.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

run();
