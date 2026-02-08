const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'intelligent_technical_assistant',
    password: process.env.DB_PASSWORD || '1415',
    port: 5432,
});

async function run() {
    try {
        const sql = fs.readFileSync(process.argv[2], 'utf8');
        console.log('Executing SQL:', sql);
        await pool.query(sql);
        console.log('Success');
    } catch (err) {
        console.error('Error', err);
    } finally {
        await pool.end();
    }
}

run();
