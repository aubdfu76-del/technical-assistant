import { getPool, initializePool } from './src/config/database';

async function checkSchema() {
    await initializePool();
    const pool = getPool();

    console.log('Checking vehicles table...');
    const vehicles = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'vehicles'
    `);
    console.log(JSON.stringify(vehicles.rows, null, 2));

    process.exit();
}

checkSchema();
