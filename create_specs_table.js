const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'intelligent_technical_assistant',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS vehicle_specifications (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE UNIQUE,
    length DECIMAL(10, 2),
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    gross_weight DECIMAL(10, 2),
    payload_capacity DECIMAL(10, 2),
    power_hp INTEGER,
    torque_nm INTEGER,
    engine_displacement DECIMAL(10, 2),
    transmission_type VARCHAR(50),
    fuel_tank_capacity DECIMAL(10, 2),
    oil_capacity DECIMAL(10, 2),
    tire_size VARCHAR(50),
    tire_pressure_psi VARCHAR(50),
    battery_voltage VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_vehicle_specs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_vehicle_specs_updated_at ON vehicle_specifications;

CREATE TRIGGER update_vehicle_specs_updated_at
    BEFORE UPDATE ON vehicle_specifications
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_specs_updated_at();

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'technician';
`;

async function createSpecsTable() {
    try {
        console.log('Connecting to database...');
        await pool.query(createTableQuery);
        console.log('✅ vehicle_specifications table created successfully');
    } catch (err) {
        console.error('❌ Error creating table:', err);
    } finally {
        await pool.end();
    }
}

createSpecsTable();
