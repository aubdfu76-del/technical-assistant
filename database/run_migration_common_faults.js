const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🔄 جاري إنشاء جداول الأعطال الشائعة المفقودة...');

        const sql = fs.readFileSync(path.join(__dirname, 'create_common_faults_tables.sql'), 'utf-8');

        await client.query(sql);

        console.log('✅ تم إنشاء الجداول بنجاح!');
        console.log('- common_faults');
        console.log('- fault_symptoms');
        console.log('- fault_causes');

    } catch (error) {
        console.error('❌ حدث خطأ أثناء إنشاء الجداول:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
