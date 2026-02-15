const { Pool } = require('pg');

// Production connection string from .env.production
const connectionString = 'postgresql://postgres:1415AaBb%401415@db.qlcjbymsrujhtxdejqyf.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase
});

async function applyFix() {
    try {
        console.log('🌍 Connecting to PRODUCTION database (Supabase)...');

        // 1. Check if column exists
        const checkRes = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'maintenance_sections' AND column_name = 'vehicle_ids';
        `);

        if (checkRes.rows.length === 0) {
            console.log('⚠️ Column vehicle_ids is missing. Adding it now...');
            await pool.query(`
                ALTER TABLE maintenance_sections 
                ADD COLUMN vehicle_ids INTEGER[];
            `);
            console.log('✅ Column vehicle_ids added successfully.');
        } else {
            console.log('ℹ️ Column vehicle_ids already exists.');
        }

        // 2. Verify schema
        console.log('🔍 Verifying schema...');
        const verifyRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'maintenance_sections';
        `);
        console.table(verifyRes.rows);

    } catch (err) {
        console.error('❌ Error applying fix to production:', err);
    } finally {
        await pool.end();
    }
}

applyFix();
