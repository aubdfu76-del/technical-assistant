const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:1415AaBb%401415@db.qlcjbymsrujhtxdejqyf.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function inspectSchemaFull() {
    try {
        console.log('🔍 Inspecting schema...');

        const res = await pool.query(`
            SELECT ordinal_position, column_name, data_type, is_nullable
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

inspectSchemaFull();
