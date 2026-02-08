// ============================================
// Update User Passwords in Database
// This script updates all user passwords with proper bcrypt hashes
// ============================================

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'password123';

const users = [
    { employee_id: 'ADMIN001', name: 'مدير النظام' },
    { employee_id: 'SUPER001', name: 'المشرف الأول' },
    { employee_id: 'TECH001', name: 'فني الصيانة الأول' },
    { employee_id: 'TECH002', name: 'فني الصيانة الثاني' }
];

async function updatePasswords() {
    try {
        console.log('🔐 بدء تحديث كلمات المرور...\n');
        console.log('كلمة المرور الافتراضية:', DEFAULT_PASSWORD);
        console.log('عدد المستخدمين:', users.length);
        console.log('\n' + '='.repeat(60) + '\n');

        // Connect to database
        const client = await pool.connect();
        console.log('✅ تم الاتصال بقاعدة البيانات\n');

        let successCount = 0;
        let errorCount = 0;

        // Update each user
        for (const user of users) {
            try {
                // Generate hash
                const hash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

                // Update in database
                const result = await client.query(
                    'UPDATE users SET password_hash = $1 WHERE employee_id = $2 RETURNING employee_id, full_name',
                    [hash, user.employee_id]
                );

                if (result.rowCount > 0) {
                    console.log(`✅ ${user.name} (${user.employee_id})`);
                    console.log(`   Hash: ${hash.substring(0, 30)}...`);
                    successCount++;
                } else {
                    console.log(`❌ ${user.name} (${user.employee_id}) - لم يتم العثور على المستخدم`);
                    errorCount++;
                }
                console.log('');
            } catch (error) {
                console.error(`❌ خطأ في تحديث ${user.name}:`, error.message);
                errorCount++;
                console.log('');
            }
        }

        console.log('='.repeat(60));
        console.log('\n📊 النتائج:');
        console.log(`   ✅ نجح: ${successCount}`);
        console.log(`   ❌ فشل: ${errorCount}`);
        console.log(`   📝 المجموع: ${users.length}`);

        // Verify updates
        console.log('\n' + '='.repeat(60));
        console.log('\n🔍 التحقق من التحديثات:\n');

        const verifyResult = await client.query(`
            SELECT 
                employee_id, 
                full_name, 
                role,
                LEFT(password_hash, 30) as hash_preview,
                is_active
            FROM users
            ORDER BY id
        `);

        console.log('المستخدمون في قاعدة البيانات:');
        verifyResult.rows.forEach(row => {
            console.log(`\n  ${row.full_name} (${row.employee_id})`);
            console.log(`  الدور: ${row.role}`);
            console.log(`  نشط: ${row.is_active ? 'نعم' : 'لا'}`);
            console.log(`  Hash: ${row.hash_preview}...`);
        });

        client.release();
        console.log('\n' + '='.repeat(60));
        console.log('\n✅ تم تحديث كلمات المرور بنجاح!');
        console.log('\n💡 يمكنك الآن تسجيل الدخول باستخدام:');
        console.log('   Employee ID: ADMIN001');
        console.log('   Password: password123\n');

    } catch (error) {
        console.error('\n❌ خطأ:', error);
    } finally {
        await pool.end();
    }
}

// Run the update
updatePasswords();
