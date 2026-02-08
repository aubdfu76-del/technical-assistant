import { getPool, initializePool } from './src/config/database';

async function updateSchema() {
    try {
        await initializePool();
        const pool = getPool();

        console.log('🔄 Updating database schema for Trainer role...');

        // 1. Update users role check constraint
        console.log('1. Updating role constraint...');
        await pool.query(`
            ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
            ALTER TABLE users ADD CONSTRAINT users_role_check 
            CHECK (role IN ('admin', 'supervisor', 'technician', 'trainer'));
        `);

        // 2. Create user_vehicle_allocations table
        console.log('2. Creating user_vehicle_allocations table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_vehicle_allocations (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, vehicle_id)
            );
        `);

        console.log('✅ Schema updated successfully!');
    } catch (e) {
        console.error('❌ Schema update failed:', e);
    }

    process.exit();
}

updateSchema();
