const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'intelligent_assistant',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function extractContentFromExistingManuals() {
    try {
        // Dynamic import for pdf-parse (ESM module)
        const pdfParse = (await import('pdf-parse')).default;

        console.log('🔍 Fetching existing manuals...');

        const result = await pool.query('SELECT id, title, file_path FROM technical_manuals WHERE content IS NULL OR content = \'\'');
        const manuals = result.rows;

        console.log(`📚 Found ${manuals.length} manuals without content`);

        for (const manual of manuals) {
            try {
                const filePath = path.join(__dirname, 'uploads', 'manuals', manual.file_path);

                if (!fs.existsSync(filePath)) {
                    console.log(`⚠️  File not found: ${manual.title}`);
                    continue;
                }

                console.log(`📄 Processing: ${manual.title}...`);

                const dataBuffer = fs.readFileSync(filePath);
                const pdfData = await pdfParse(dataBuffer);
                const content = pdfData.text;

                console.log(`   ✅ Extracted ${content.length} characters`);
                console.log(`   📝 Preview: ${content.substring(0, 100)}...`);

                await pool.query(
                    'UPDATE technical_manuals SET content = $1 WHERE id = $2',
                    [content, manual.id]
                );

                console.log(`   💾 Saved to database\n`);

            } catch (error) {
                console.error(`   ❌ Error processing ${manual.title}:`, error.message);
            }
        }

        console.log('✅ All done!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
}

extractContentFromExistingManuals();
