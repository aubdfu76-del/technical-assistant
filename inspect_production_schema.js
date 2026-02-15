const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:1415AaBb%401415@db.qlcjbymsrujhtxdejqyf.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function inspectSchema() {
    try {
        console.log('🔍 Inspecting maintenance_sections schema on production...');

        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'maintenance_sections'
            ORDER BY ordinal_position;
        `);
        console.table(res.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

inspectSchema();
