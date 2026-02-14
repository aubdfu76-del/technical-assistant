// Test Supabase Database Connection
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const { Pool } = pg;

const testConnection = async () => {
    console.log('🔄 Testing Supabase connection...\n');

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        // Test connection
        const client = await pool.connect();
        console.log('✅ Connected to Supabase successfully!\n');

        // Test query - get all tables
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);

        console.log('📊 Tables in database:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Test admin user
        const userResult = await client.query(
            "SELECT id, employee_id, full_name, role FROM users WHERE employee_id = 'ADMIN001'"
        );

        if (userResult.rows.length > 0) {
            console.log('\n✅ Admin user found:');
            console.log('   ID:', userResult.rows[0].id);
            console.log('   Employee ID:', userResult.rows[0].employee_id);
            console.log('   Name:', userResult.rows[0].full_name);
            console.log('   Role:', userResult.rows[0].role);
        } else {
            console.log('\n⚠️ Admin user not found');
        }

        client.release();
        await pool.end();

        console.log('\n✅ Connection test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('\nDetails:', error);
        await pool.end();
        process.exit(1);
    }
};

testConnection();
