import { getPool, initializePool } from './src/config/database';

async function cleanupTestUsers() {
    await initializePool();
    const pool = getPool();

    console.log('Cleaning up test users...');
    const res = await pool.query("DELETE FROM users WHERE employee_id LIKE 'TECH_TEST%' OR full_name LIKE '123456%' OR full_name LIKE '12%'");
    console.log(`Deleted ${res.rowCount} test users.`);

    process.exit();
}

cleanupTestUsers();
