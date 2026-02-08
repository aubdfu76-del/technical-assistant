import { getPool, initializePool } from './src/config/database';

async function checkLatestUser() {
    try {
        await initializePool();
        const pool = getPool();

        console.log('\n--- DATA START ---');
        const res = await pool.query("SELECT id, full_name, role, is_active, created_at::text FROM users ORDER BY created_at DESC LIMIT 5");

        console.log(JSON.stringify(res.rows, null, 2));
        console.log('--- DATA END ---\n');
    } catch (e) {
        console.error(e);
    }

    process.exit();
}

checkLatestUser();
