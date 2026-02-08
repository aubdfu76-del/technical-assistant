const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'intelligent_assistant',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function addContentColumn() {
    try {
        console.log('Adding content column to technical_manuals...');

        await pool.query(`
            ALTER TABLE technical_manuals 
            ADD COLUMN IF NOT EXISTS content TEXT
        `);

        console.log('✅ Content column added successfully!');

        console.log('Creating full-text search index...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_manuals_content 
            ON technical_manuals 
            USING gin(to_tsvector('english', COALESCE(content, '')))
        `);

        console.log('✅ Index created successfully!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

addContentColumn();
