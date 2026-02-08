const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function fixRole() {
    try {
        console.log('🔄 Fixing role for Supervisor...');

        // Update user ID 5 to be supervisor
        const res = await pool.query(`
            UPDATE users 
            SET role = 'supervisor'
            WHERE id = 5
            RETURNING id, employee_id, full_name, role;
        `);

        if (res.rowCount > 0) {
            console.log('✅ User role updated successfully:');
            console.log(res.rows[0]);
        } else {
            console.log('❌ Failed to find user with ID 5.');
        }

    } catch (err) {
        console.error('❌ Error updating database:', err);
    } finally {
        await pool.end();
    }
}

fixRole();
