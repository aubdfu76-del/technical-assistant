const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:1415AaBb%401415@db.qlcjbymsrujhtxdejqyf.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function verifyInsert() {
    try {
        console.log('🧪 Verifying INSERT into maintenance_sections on PRODUCTION...');

        const key_id = 'test_' + Date.now();
        const title = 'Direct Insert Test';
        const description = 'Testing if column vehicle_ids works';
        const vehicle_ids = [10, 20]; // Arbitrary IDs to test array storage

        // 1. Attempt standard insert
        try {
            const res = await pool.query(
                `INSERT INTO maintenance_sections 
                 (key_id, title, icon, color, description, vehicle_ids) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING *`,
                [key_id, title, 'Wrench', '100,100,100', description, vehicle_ids]
            );
            console.log('✅ INSERT SUCCESSFUL!');
            console.log('Inserted Row:', res.rows[0]);

            // 2. Clean up
            await pool.query('DELETE FROM maintenance_sections WHERE id = $1', [res.rows[0].id]);
            console.log('✅ CLEANUP SUCCESSFUL');

        } catch (insertErr) {
            console.error('❌ INSERT FAILED:', insertErr.message);
            if (insertErr.detail) console.error('Detail:', insertErr.detail);
            if (insertErr.code) console.error('Code:', insertErr.code);
        }

    } catch (err) {
        console.error('General Error:', err);
    } finally {
        await pool.end();
    }
}

verifyInsert();
