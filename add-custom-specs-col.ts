
import { getPool } from './src/config/database';

const addCustomSpecsColumn = async () => {
    const pool = getPool();
    try {
        console.log('Checking for custom_specs column...');

        // Check if column exists
        const checkColumn = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='vehicle_specifications' AND column_name='custom_specs';
        `);

        if (checkColumn.rows.length === 0) {
            console.log('Adding custom_specs column...');
            await pool.query(`
                ALTER TABLE vehicle_specifications 
                ADD COLUMN custom_specs JSONB DEFAULT '[]'::jsonb;
            `);
            console.log('✅ custom_specs column added successfully.');
        } else {
            console.log('ℹ️ custom_specs column already exists.');
        }

    } catch (error) {
        console.error('❌ Error updating schema:', error);
    } finally {
        await pool.end();
    }
};

addCustomSpecsColumn();
