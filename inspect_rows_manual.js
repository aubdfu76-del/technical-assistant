const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:1415AaBb%401415@db.qlcjbymsrujhtxdejqyf.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function inspectManual() {
    try {
        console.log('🔍 Inspecting schema manually...');

        const res = await pool.query(`
            SELECT ordinal_position, column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'maintenance_sections'
            ORDER BY ordinal_position;
        `);

        // Print each row explicitly
        res.rows.forEach(row => {
            console.log(`Column ${row.ordinal_position}: ${row.column_name} (${row.data_type}) [Nullable: ${row.is_nullable}]`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

inspectManual();
