const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:1415AaBb%401415@db.qlcjbymsrujhtxdejqyf.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function removeConstraint() {
    try {
        console.log('🛠️ Removing NOT NULL constraint from vehicle_id on production...');

        // 1. Check if column exists
        const checkRes = await pool.query(`
            SELECT is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'maintenance_sections' AND column_name = 'vehicle_id';
        `);

        if (checkRes.rows.length > 0) {
            console.log(`Column vehicle_id exists (Nullable: ${checkRes.rows[0].is_nullable})`);

            if (checkRes.rows[0].is_nullable === 'NO') {
                console.log('⚠️ Constraint exists. Removing it now...');
                await pool.query('ALTER TABLE maintenance_sections ALTER COLUMN vehicle_id DROP NOT NULL');
                console.log('✅ NOT NULL constraint removed from vehicle_id.');
            } else {
                console.log('ℹ️ Column is already nullable.');
            }
        } else {
            console.log('ℹ️ Column vehicle_id does not exist (Good).');
        }

        console.log('Done.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

removeConstraint();
