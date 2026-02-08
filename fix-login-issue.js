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

const SALT_ROUNDS = 10;
const NEW_PASSWORD = '12345678';

async function fixLogin() {
    try {
        console.log('🔄 Fixing login issue for Supervisor...');

        // 1. Hash the new password
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);

        // 2. Update the user
        // We target the supervisor user (ID 5 from previous list)
        // We set their employee_id to 'ADMIN0011' and update password
        const res = await pool.query(`
            UPDATE users 
            SET employee_id = 'ADMIN0011', 
                password_hash = $1,
                full_name = 'المشرف العام'
            WHERE id = 5
            RETURNING id, employee_id, full_name, role;
        `, [hashedPassword]);

        if (res.rowCount > 0) {
            console.log('✅ User updated successfully:');
            console.log(res.rows[0]);
            console.log('\n🔑 New Login Credentials:');
            console.log('   Employee ID: ADMIN0011');
            console.log('   Password:    ' + NEW_PASSWORD);
        } else {
            console.log('❌ Failed to find user with ID 5 to update.');
        }

    } catch (err) {
        console.error('❌ Error updating database:', err);
    } finally {
        await pool.end();
    }
}

fixLogin();
