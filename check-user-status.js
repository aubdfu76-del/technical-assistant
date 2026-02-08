const { getPool, initializePool } = require('./src/config/database');
const { comparePassword } = require('./src/utils/password.util');

async function debugUser() {
    await initializePool();
    const pool = getPool();

    const employeeId = '619865';
    console.log(`Checking user: ${employeeId}`);

    try {
        const res = await pool.query('SELECT * FROM users WHERE employee_id = $1', [employeeId]);
        if (res.rows.length === 0) {
            console.log('User NOT found in database.');
        } else {
            const user = res.rows[0];
            console.log('User found:');
            console.log(`- ID: ${user.id}`);
            console.log(`- Full Name: ${user.full_name}`);
            console.log(`- Role: ${user.role}`);
            console.log(`- Is Active: ${user.is_active}`);
            console.log(`- Password Hash: ${user.password_hash.substring(0, 20)}...`);
        }
    } catch (err) {
        console.error('Error querying database:', err);
    }

    process.exit();
}

debugUser();
