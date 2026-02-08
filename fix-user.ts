import { getPool, initializePool } from './src/config/database';
import { hashPassword } from './src/utils/password.util';

async function fixUser() {
    await initializePool();
    const pool = getPool();

    console.log('Searching for users named like "عبدالله"...');
    const nameRes = await pool.query("SELECT * FROM users WHERE full_name LIKE '%عبدالله%'");
    nameRes.rows.forEach(u => console.log(`Found: ${u.employee_id} - ${u.full_name} - Active: ${u.is_active}`));

    const targetId = '619865';
    console.log(`\nChecking specific ID: ${targetId}`);
    const idRes = await pool.query('SELECT * FROM users WHERE employee_id = $1', [targetId]);

    if (idRes.rows.length > 0) {
        const user = idRes.rows[0];
        console.log(`User found: ${user.full_name} (ID: ${user.id})`);

        // Reset password
        const newPass = '12345678';
        const hash = await hashPassword(newPass);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
        console.log(`✅ Password for ${targetId} reset to: ${newPass}`);

        // Fix name if it is literally "12345"
        if (user.full_name === '12345') {
            await pool.query("UPDATE users SET full_name = 'عبدالله احمد محمد' WHERE id = $1", [user.id]);
            console.log(`✅ Name corrected to: عبدالله احمد محمد`);
        }
    } else {
        console.log('❌ User 619865 not found!');
    }

    process.exit();
}

fixUser();
