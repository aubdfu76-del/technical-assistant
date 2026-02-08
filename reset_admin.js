
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function resetAdmin() {
    try {
        const hash = await bcrypt.hash('password123', 10);
        const res = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE employee_id = $2 RETURNING id, full_name',
            [hash, 'ADMIN0011']
        );
        if (res.rows.length > 0) {
            console.log('✅ Admin password reset to "password123"');
        } else {
            console.log('❌ Admin user not found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

resetAdmin();
