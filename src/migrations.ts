import { getPool } from './config/database';

export async function runMigrations() {
    try {
        console.log('🔄 Running database migrations...');
        const pool = getPool();

        // Migration 1: Add equipment_name column to vehicles
        await pool.query(`
            ALTER TABLE vehicles 
            ADD COLUMN IF NOT EXISTS equipment_name VARCHAR(200)
        `);
        console.log('✅ Migration 1: Added equipment_name column to vehicles');

        // Migration 2: Add image_url column to vehicles
        await pool.query(`
            ALTER TABLE vehicles 
            ADD COLUMN IF NOT EXISTS image_url TEXT
        `);
        console.log('✅ Migration 2: Added image_url column to vehicles');

        // Migration 3: Add vehicle_ids column to repair_tasks
        await pool.query(`
            ALTER TABLE repair_tasks 
            ADD COLUMN IF NOT EXISTS vehicle_ids INTEGER[]
        `);
        console.log('✅ Migration 3: Added vehicle_ids column to repair_tasks');

        // Migration 4: Add task_type column to repair_tasks
        await pool.query(`
            ALTER TABLE repair_tasks 
            ADD COLUMN IF NOT EXISTS task_type VARCHAR(50) DEFAULT 'repair'
        `);
        console.log('✅ Migration 4: Added task_type column to repair_tasks');

        // Migration 5: Add required_tools column to repair_tasks
        await pool.query(`
            ALTER TABLE repair_tasks 
            ADD COLUMN IF NOT EXISTS required_tools TEXT
        `);
        console.log('✅ Migration 5: Added required_tools column to repair_tasks');

        // Migration 6: Add technicians_count column to repair_tasks
        await pool.query(`
            ALTER TABLE repair_tasks 
            ADD COLUMN IF NOT EXISTS technicians_count INTEGER
        `);
        console.log('✅ Migration 6: Added technicians_count column to repair_tasks');

        console.log('✅ All migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration error:', error);
        // Don't throw - let the server start even if migrations fail
    }
}
