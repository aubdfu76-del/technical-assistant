const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

// Mock login or manual token generation if needed, but for now let's testing DB functions or API if possible.
// Since we can't easily get a token for axios without login, let's test the QUERY logic directly first (Unit Test style).
// Actually, let's try to hit the API if we can simulate a token, or just verify the DB state modifications manually.

async function testBackendLogic() {
    try {
        console.log('🧪 Testing Backend Logic for Media...');

        // 1. Create a dummy media item directly in DB
        const insertRes = await pool.query(`
            INSERT INTO repair_media (task_id, media_type, url, order_index)
            VALUES (5, 'image', 'test-delete.jpg', 999)
            RETURNING *
        `);
        const mediaId = insertRes.rows[0].id;
        console.log(`✅ Created dummy media ID: ${mediaId}`);

        // 2. Test "Reorder" Query Logic
        console.log('🔄 Testing Reorder Logic...');
        await pool.query('UPDATE repair_media SET order_index = $1 WHERE id = $2', [888, mediaId]);
        const checkReorder = await pool.query('SELECT order_index FROM repair_media WHERE id = $1', [mediaId]);

        if (checkReorder.rows[0].order_index === 888) {
            console.log('✅ Reorder Query Works');
        } else {
            console.error('❌ Reorder Query Failed');
        }

        // 3. Test "Delete" Query Logic
        console.log('🗑️ Testing Delete Logic...');
        await pool.query('DELETE FROM repair_media WHERE id = $1', [mediaId]);
        const checkDelete = await pool.query('SELECT * FROM repair_media WHERE id = $1', [mediaId]);

        if (checkDelete.rows.length === 0) {
            console.log('✅ Delete Query Works');
        } else {
            console.error('❌ Delete Query Failed');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

testBackendLogic();
