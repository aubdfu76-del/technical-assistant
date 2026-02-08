// ============================================
// Script to Generate Proper Password Hashes
// ============================================

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const password = 'password123';

async function generateHashes() {
    console.log('🔐 Generating password hashes...\n');
    
    const users = [
        { id: 'ADMIN001', name: 'مدير النظام' },
        { id: 'SUPER001', name: 'المشرف الأول' },
        { id: 'TECH001', name: 'فني الصيانة الأول' },
        { id: 'TECH002', name: 'فني الصيانة الثاني' }
    ];

    console.log('Password:', password);
    console.log('Salt Rounds:', SALT_ROUNDS);
    console.log('\n' + '='.repeat(80) + '\n');

    for (const user of users) {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        console.log(`${user.name} (${user.id}):`);
        console.log(`Hash: ${hash}`);
        console.log('\nSQL Update:');
        console.log(`UPDATE users SET password_hash = '${hash}' WHERE employee_id = '${user.id}';`);
        console.log('\n' + '-'.repeat(80) + '\n');
    }

    // Generate complete SQL script
    console.log('\n' + '='.repeat(80));
    console.log('📝 Complete SQL Script:');
    console.log('='.repeat(80) + '\n');

    console.log('-- Update all user passwords');
    console.log('-- Password: password123\n');

    for (const user of users) {
        const hash = await bcrypt.hash(password, SALT_ROUNDS);
        console.log(`UPDATE users SET password_hash = '${hash}' WHERE employee_id = '${user.id}';`);
    }

    console.log('\n-- Verify update');
    console.log('SELECT employee_id, full_name, role, LEFT(password_hash, 20) as hash_preview FROM users;');
    
    console.log('\n✅ Done! Copy the SQL commands above and run them in PostgreSQL.\n');
}

generateHashes().catch(console.error);
