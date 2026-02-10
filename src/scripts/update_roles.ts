
import { query, closePool } from '../config/database';

async function updateRoles() {
    try {
        console.log('🔄 Updating users role constraint...');

        // 1. Drop existing constraint
        await query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;');
        console.log('✅ Dropped existing users_role_check constraint');

        // 2. Add new constraint including 'trainer'
        await query(`ALTER TABLE users ADD CONSTRAINT users_role_check 
            CHECK (role IN ('admin', 'supervisor', 'technician', 'trainer'));`);
        console.log('✅ Added new users_role_check constraint with trainer role');

        console.log('🎉 Database updated successfully!');
    } catch (error) {
        console.error('❌ Failed to update database:', error);
    } finally {
        await closePool();
        process.exit(0);
    }
}

updateRoles();
