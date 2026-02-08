const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function listUsers() {
    try {
        console.log(`Listing all users...`);
        const res = await pool.query(`
            SELECT id, employee_id, full_name, role, is_active
            FROM users 
            ORDER BY employee_id
        `);

        console.log(`Found ${res.rows.length} users:`);
        res.rows.forEach(user => {
            console.log(`- ${user.employee_id}: ${user.full_name} (${user.role}) [Active: ${user.is_active}]`);
        });
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

listUsers();
