const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:1415AaBb%401415@db.qlcjbymsrujhtxdejqyf.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function debugProduction() {
    try {
        console.log('Debugging Production...');

        // 1. Check vehicles table schema
        console.log('\n--- Vehicles Table Schema ---');
        const vehicles = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'vehicles';
        `);
        console.table(vehicles.rows);

        // 2. Check users to see roles
        console.log('\n--- Users (First 5) ---');
        const users = await pool.query('SELECT id, username, role FROM users LIMIT 5');
        console.table(users.rows);

        // 3. Check duplicate key_id possibility? 
        // 4. Try to insert a dummy section manually to see if it throws
        console.log('\n--- Attempting Test Insert ---');
        const key_id = 'test_' + Date.now();
        const title = 'Debug Section';
        // Note: passing vehicle_ids as array of integers
        const vehicle_ids = [1];

        // We'll try to insert. If it fails, we catch the specific error.
        try {
            await pool.query(
                'INSERT INTO maintenance_sections (key_id, title, icon, color, description, vehicle_ids) VALUES ($1, $2, $3, $4, $5, $6)',
                [key_id, title, 'TestIcon', '0,0,0', 'Debug Description', vehicle_ids]
            );
            console.log('✅ Insert Successful!');

            // Clean up
            await pool.query('DELETE FROM maintenance_sections WHERE key_id = $1', [key_id]);
            console.log('✅ Test Cleaned Up');

        } catch (insertErr) {
            console.error('❌ Insert FAILED:', insertErr.message);
            if (insertErr.detail) console.error('Detail:', insertErr.detail);
        }

    } catch (err) {
        console.error('General Error:', err);
    } finally {
        await pool.end();
    }
}

debugProduction();
