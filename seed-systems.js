const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'intelligent_technical_assistant',
    password: '1415',
    port: 5432,
});

async function seedSystems() {
    try {
        console.log('🌱 Adding illustrative diagnosis systems...');

        // Create tables if not exists (redundant but safe)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS diagnosis_systems (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          icon VARCHAR(50),
          description TEXT
      );

      CREATE TABLE IF NOT EXISTS diagnosis_items (
          id SERIAL PRIMARY KEY,
          system_id INTEGER REFERENCES diagnosis_systems(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          estimated_time VARCHAR(50),
          work_package_content TEXT -- Steps in JSON or Markdown
      );

      CREATE TABLE IF NOT EXISTS diagnosis_media (
          id SERIAL PRIMARY KEY,
          item_id INTEGER REFERENCES diagnosis_items(id) ON DELETE CASCADE,
          type VARCHAR(20), -- 'image', 'video'
          url TEXT,
          thumbnail_url TEXT
      );
    `);

        // Check if data exists
        const countRes = await pool.query('SELECT COUNT(*) FROM diagnosis_systems');
        if (parseInt(countRes.rows[0].count) === 0) {
            console.log('📝 Inserting systems data...');

            const systems = [
                ['نظام الديزل', 'Fuel', 'فحص شامل لنظام الحقن، الضغط، وفلترة الوقود في محركات الديزل.'],
                ['نظام الهيدروليك', 'Droplet', 'تحليل أداء الطرمبات، السلندرات، وصمامات التحكم الهيدروليكية.'],
                ['نظام الكهرباء', 'Zap', 'فحص البطاريات، المولدات، والظفيرة الكهربائية وحساسات التحكم.'],
                ['نظام التبريد', 'Thermometer', 'مراقبة أداء الرديتر، طرمبة الماء، وحساسات الحرارة.']
            ];

            for (const sys of systems) {
                const sysRes = await pool.query(
                    'INSERT INTO diagnosis_systems (name, icon, description) VALUES ($1, $2, $3) RETURNING id',
                    sys
                );
                const sysId = sysRes.rows[0].id;

                if (sys[0] === 'نظام الديزل') {
                    const itemRes = await pool.query(`
            INSERT INTO diagnosis_items (system_id, title, description, estimated_time, work_package_content)
            VALUES ($1, 'فحص ضغط طرمبة الديزل', 'قياس ضغط الوقود الخارج من الطرمبة للتأكد من كفاءتها.', '30 دقيقة', 
            '1. قم بفك لي ضغط الوقود.\\n2. ركب ساعة القياس.\\n3. قم بتشغيل المحرك وقراءة الضغط.\\n4. قارن النتائج مع كتيب المصنع.')
            RETURNING id
          `, [sysId]);

                    await pool.query(`INSERT INTO diagnosis_media (item_id, type, url) VALUES ($1, 'image', 'https://example.com/diesel-pump-test.jpg')`, [itemRes.rows[0].id]);
                }

                if (sys[0] === 'نظام الهيدروليك') {
                    await pool.query(`
            INSERT INTO diagnosis_items (system_id, title, description, estimated_time, work_package_content)
            VALUES ($1, 'قياس سرعة استجابة السلندرات', 'التأكد من عدم وجود تسريب داخلي في بساتن الهيدروليك.', '45 دقيقة', 
            '1. ارفع الذراع لأعلى نقطة.\\n2. راقب سرعة النزول التلقائي.\\n3. افحص صمامات الأمان.')
          `, [sysId]);
                }
            }

            console.log('✅ Systems seeding completed successfully!');
        } else {
            console.log('✅ Systems data already exists, skipping seed.');
        }
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
    } finally {
        await pool.end();
    }
}

seedSystems();
