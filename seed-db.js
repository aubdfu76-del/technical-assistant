const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'intelligent_technical_assistant',
    password: '1415',
    port: 5432,
});

async function seed() {
    try {
        console.log('🌱 Starting database seeding...');

        await pool.query(`
      CREATE TABLE IF NOT EXISTS common_faults (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          category VARCHAR(100),
          recommended_system VARCHAR(100),
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fault_symptoms (
          id SERIAL PRIMARY KEY,
          fault_id INTEGER REFERENCES common_faults(id) ON DELETE CASCADE,
          description TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS fault_causes (
          id SERIAL PRIMARY KEY,
          fault_id INTEGER REFERENCES common_faults(id) ON DELETE CASCADE,
          description TEXT NOT NULL
      );
    `);

        // Check if data exists
        const countRes = await pool.query('SELECT COUNT(*) FROM common_faults');
        if (parseInt(countRes.rows[0].count) === 0) {
            console.log('📝 Inserting seed data...');
            const faultRes = await pool.query(`
        INSERT INTO common_faults (title, description, severity, category, recommended_system)
        VALUES 
        ('ضعف في عزم المحرك', 'نقص ملحوظ في قوة التسارع وزيادة في استهلاك الوقود', 'high', 'نظام المحرك', 'Engine System'),
        ('صوت صرير عند الفرملة', 'أصوات حادة عند الضغط على دواسة الفرامل', 'medium', 'نظام الفرامل', 'Braking System'),
        ('اهتزاز المقود على السرعات العالية', 'رجة واضحة في عجلة القيادة تتزايد مع السرعة', 'medium', 'نظام التعليق', 'Steering & Suspension')
        RETURNING id
      `);

            const faultIds = faultRes.rows.map(r => r.id);

            // Symptoms for fault 1
            await pool.query(`INSERT INTO fault_symptoms (fault_id, description) VALUES ($1, 'تقطيع في أداء المحرك'), ($1, 'خروج دخان أسود من العادم')`, [faultIds[0]]);
            // Causes for fault 1
            await pool.query(`INSERT INTO fault_causes (fault_id, description) VALUES ($1, 'انسداد في مرشح الوقود (Filter)'), ($1, 'تلف في البواجي (Spark Plugs)')`, [faultIds[0]]);

            console.log('✅ Seeding completed successfully!');
        } else {
            console.log('✅ Data already exists, skipping seed.');
        }
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
