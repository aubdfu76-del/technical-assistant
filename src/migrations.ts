import { getPool } from './config/database';

export async function runMigrations() {
    try {
        console.log('🔄 Running database migrations...');
        const pool = getPool();

        // Migration 1: Add equipment_name column
        await pool.query(`
            ALTER TABLE vehicles 
            ADD COLUMN IF NOT EXISTS equipment_name VARCHAR(200)
        `);
        console.log('✅ Migration 1: Added equipment_name column');

        // Migration 2: Add image_url column
        await pool.query(`
            ALTER TABLE vehicles 
            ADD COLUMN IF NOT EXISTS image_url TEXT
        `);
        console.log('✅ Migration 2: Added image_url column');

        console.log('✅ All migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration error:', error);
        // Don't throw - let the server start even if migrations fail
    }
}
