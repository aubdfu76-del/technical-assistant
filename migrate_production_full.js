const { Pool } = require('pg');

const connectionString = 'postgresql://postgres:1415AaBb%401415@db.qlcjbymsrujhtxdejqyf.supabase.co:5432/postgres';

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function migrateProduction() {
    try {
        console.log('🌍 Connecting to PRODUCTION database (Supabase)...');

        const expectedColumns = [
            { name: 'key_id', type: 'VARCHAR(50)', unique: true, notNull: true },
            { name: 'icon', type: 'VARCHAR(50)', default: "'Wrench'" },
            { name: 'color', type: 'VARCHAR(20)', default: "'107, 114, 128'" },
            { name: 'vehicle_ids', type: 'INTEGER[]' }
        ];

        for (const col of expectedColumns) {
            // Check if column exists
            const res = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'maintenance_sections' AND column_name = $1;
            `, [col.name]);

            if (res.rows.length === 0) {
                console.log(`⚠️ Column '${col.name}' is missing. Adding it...`);
                let query = `ALTER TABLE maintenance_sections ADD COLUMN ${col.name} ${col.type}`;

                if (col.default) {
                    query += ` DEFAULT ${col.default}`;
                }

                await pool.query(query);
                console.log(`✅ Added column '${col.name}'`);

                // Add constraints separately if needed
                if (col.notNull) {
                    // Updating existing rows first to avoid constraints violation?
                    // But if key_id must be unique, we can't just set a default easily.
                    // For now, let's just make it NOT NULL after populating?
                    // Or let's make it nullable first, populate, then set NOT NULL.
                    // Actually, let's just add it as nullable for now to be safe with existing data.
                    // If we require unique key_id, we should populate it for existing rows.
                    console.log(`ℹ️ Column '${col.name}' added as nullable initially.`);
                }
            } else {
                console.log(`✅ Column '${col.name}' already exists.`);
            }
        }

        // Populate key_id for existing rows if NULL
        console.log('🔄 Populating missing key_id for existing rows...');
        const fixKeyIds = await pool.query(`
            UPDATE maintenance_sections 
            SET key_id = 'legacy_' || id 
            WHERE key_id IS NULL;
        `);
        console.log(`Updated ${fixKeyIds.rowCount} rows with generated key_id.`);

        console.log('Done.');

    } catch (err) {
        console.error('❌ Migration Error:', err);
    } finally {
        await pool.end();
    }
}

migrateProduction();
