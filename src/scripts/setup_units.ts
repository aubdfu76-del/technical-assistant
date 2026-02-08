import { getPool } from '../config/database';

const setupUnits = async () => {
    const pool = getPool();
    try {
        console.log('🔄 Setting up Units table...');

        // Create units table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS units (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ Units table created (or exists).');

        // Add unit_id to users table
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='unit_id') THEN 
                    ALTER TABLE users ADD COLUMN unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL; 
                END IF; 
            END $$;
        `);
        console.log('✅ Users table updated with unit_id.');

    } catch (error) {
        console.error('❌ Setup failed:', error);
    } finally {
        process.exit(); // Close process
    }
};

setupUnits();
