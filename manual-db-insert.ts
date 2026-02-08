import { getPool, initializePool } from './src/config/database';
import { hashPassword } from './src/utils/password.util';

async function manualInsert() {
    try {
        await initializePool();
        const pool = getPool();

        console.log('Attempting manual insert...');
        const pass = await hashPassword('password123');

        await pool.query(
            `INSERT INTO users (employee_id, full_name, email, password_hash, role, phone, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            ['TECH_MANUAL_DB', 'Manual User', 'test@test.com', pass, 'technician', '123456', false]
        );

        console.log('✅ Insert successful');
    } catch (e) {
        console.error('❌ Insert failed:', e);
    }

    process.exit();
}

manualInsert();
