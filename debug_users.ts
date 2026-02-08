
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function debug() {
    try {
        console.log('--- UNITS ---');
        const units = await pool.query('SELECT id, name FROM units');
        console.table(units.rows);

        console.log('\n--- USERS with UNIT_ID ---');
        const users = await pool.query('SELECT id, employee_id, full_name, role, unit_id FROM users');
        console.table(users.rows);

        if (units.rows.length > 0) {
            const targetUnitId = units.rows[0].id;
            console.log(`\n--- FILTER TEST (unit_id=${targetUnitId}) ---`);
            const filtered = await pool.query('SELECT id, full_name FROM users WHERE unit_id = $1', [targetUnitId]);
            console.table(filtered.rows);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

debug();
