
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'intelligent_tech_assistant',
    password: process.env.DB_PASSWORD || '1415',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkTableConstraints(tableName) {
    try {
        console.log(`\n--- Constraints for ${tableName} ---`);
        const res = await pool.query(`
            SELECT
                tc.constraint_name, 
                tc.constraint_type, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.table_name = $1;
        `, [tableName]);

        if (res.rows.length === 0) {
            console.log("No constraints found or table does not exist.");
        } else {
            res.rows.forEach(row => {
                console.log(`${row.constraint_name} (${row.constraint_type}): ${row.column_name} references ${row.foreign_table_name}.${row.foreign_column_name}`);
            });
        }

        // Also check if any other table references THIS table
        console.log(`\n--- Tables referencing ${tableName} ---`);
        const refRes = await pool.query(`
            SELECT
                tc.table_name, 
                kcu.column_name, 
                tc.constraint_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE ccu.table_name = $1;
        `, [tableName]);

        if (refRes.rows.length === 0) {
            console.log("No other tables reference this table.");
        } else {
            refRes.rows.forEach(row => {
                console.log(`Table '${row.table_name}' references this via column '${row.column_name}' (Constraint: ${row.constraint_name})`);
            });
        }


    } catch (err) {
        console.error("Error checking constraints:", err);
    }
}

async function run() {
    await checkTableConstraints('repair_tasks');
    await checkTableConstraints('maintenance_sections');
    await pool.end();
}

run();
