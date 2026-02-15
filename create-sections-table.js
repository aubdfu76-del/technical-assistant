const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1415',
});

async function createSectionsTable() {
    try {
        console.log('Creating maintenance_sections table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS maintenance_sections (
                id SERIAL PRIMARY KEY,
                key_id VARCHAR(50) UNIQUE NOT NULL,
                title VARCHAR(100) NOT NULL,
                icon VARCHAR(50) NOT NULL,
                color VARCHAR(20) NOT NULL,
                description TEXT,
                vehicle_ids INTEGER[],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert defaults if empty
        const count = await pool.query('SELECT COUNT(*) FROM maintenance_sections');
        if (parseInt(count.rows[0].count) === 0) {
            console.log('Inserting default sections...');
            const defaults = [
                { id: 'oils', title: 'الزيوت والسوائل', icon: 'Droplets', color: '16, 185, 129', desc: 'تغيير زيت المحرك، القير، الفرامل' },
                { id: 'filters', title: 'الفلاتر والمرشحات', icon: 'Filter', color: '245, 158, 11', desc: 'فلاتر الهواء، الزيت، الوقود، المكيف' },
                { id: 'brakes', title: 'نظام الفرامل', icon: 'Disc', color: '239, 68, 68', desc: 'فحمات، هوبات، تغيير زيت الفرامل' },
                { id: 'engine', title: 'ميكانيكا المحرك', icon: 'Activity', color: '59, 130, 246', desc: 'سيور، بواجي، طرمبات، صيانة عامة' },
                { id: 'tires', title: 'الإطارات والتعليق', icon: 'Circle', color: '168, 85, 247', desc: 'تبديل إطارات، ترصيص، مساعدات' },
                { id: 'electric', title: 'الكهرباء والبطارية', icon: 'Zap', color: '234, 179, 8', desc: 'بطارية، دينامو، أنوار، فيوزات' },
                { id: 'cooling', title: 'نظام التبريد', icon: 'Thermometer', color: '6, 182, 212', desc: 'رديتر، خراطيم، ماء، مراوح' },
                { id: 'other', title: 'صيانة عامة', icon: 'Wrench', color: '107, 114, 128', desc: 'فحص دوري، تشحيم، وخدمات أخرى' }
            ];

            for (const s of defaults) {
                await pool.query(
                    'INSERT INTO maintenance_sections (key_id, title, icon, color, description) VALUES ($1, $2, $3, $4, $5)',
                    [s.id, s.title, s.icon, s.color, s.desc]
                );
            }
        }
        console.log('✅ Table maintenance_sections ready.');
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

createSectionsTable();
