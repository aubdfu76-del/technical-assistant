import { getPool, initializePool } from './src/config/database';

async function checkConstraints() {
    await initializePool();
    const pool = getPool();

    console.log('Checking constraints on users table...');
    const res = await pool.query(`
        SELECT conname, pg_get_constraintdef(c.oid)
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE conrelid = 'users'::regclass
    `);

    res.rows.forEach(r => {
        console.log(`${r.conname}: ${r.pg_get_constraintdef}`);
    });

    process.exit();
}

checkConstraints();
