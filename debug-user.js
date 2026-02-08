const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function checkUser(employeeId) {
    try {
        console.log(`Checking user with employee_id: ${employeeId}`);
        const res = await pool.query(`
            SELECT id, employee_id, full_name, role, is_active, password_hash
            FROM users 
            WHERE employee_id = $1
        `, [employeeId]);

        if (res.rows.length === 0) {
            console.log('User not found.');
        } else {
            console.log('User found:', res.rows[0]);
        }
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

checkUser('ADMIN0011');
