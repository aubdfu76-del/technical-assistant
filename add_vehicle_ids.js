
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'intelligent_tech_assistant',
    password: process.env.DB_PASSWORD || '1415',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function addVehicleColumns() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Adding vehicle_ids to maintenance_sections...');
        await client.query('ALTER TABLE maintenance_sections ADD COLUMN IF NOT EXISTS vehicle_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[];');

        console.log('Adding vehicle_ids to repair_tasks...');
        await client.query('ALTER TABLE repair_tasks ADD COLUMN IF NOT EXISTS vehicle_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[];');

        console.log('Adding vehicle_ids to diagnosis_systems...');
        await client.query('ALTER TABLE diagnosis_systems ADD COLUMN IF NOT EXISTS vehicle_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[];');

        console.log('Adding vehicle_ids to diagnosis_items...');
        await client.query('ALTER TABLE diagnosis_items ADD COLUMN IF NOT EXISTS vehicle_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[];');

        console.log('Adding vehicle_ids to common_faults...');
        await client.query('ALTER TABLE common_faults ADD COLUMN IF NOT EXISTS vehicle_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[];');

        await client.query('COMMIT');
        console.log('✅ Columns added successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to add columns:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

addVehicleColumns();
