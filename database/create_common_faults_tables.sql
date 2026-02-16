-- Create common_faults table
CREATE TABLE IF NOT EXISTS common_faults (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(50) DEFAULT 'medium',
    category VARCHAR(100),
    recommended_system VARCHAR(100),
    created_by INTEGER REFERENCES users(id),
    vehicle_ids INTEGER[], -- Array of vehicle IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create fault_symptoms table
CREATE TABLE IF NOT EXISTS fault_symptoms (
    id SERIAL PRIMARY KEY,
    fault_id INTEGER REFERENCES common_faults(id) ON DELETE CASCADE,
    description TEXT NOT NULL
);

-- Create fault_causes table
CREATE TABLE IF NOT EXISTS fault_causes (
    id SERIAL PRIMARY KEY,
    fault_id INTEGER REFERENCES common_faults(id) ON DELETE CASCADE,
    description TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_common_faults_vehicle_ids ON common_faults USING GIN(vehicle_ids);
CREATE INDEX IF NOT EXISTS idx_fault_symptoms_fault_id ON fault_symptoms(fault_id);
CREATE INDEX IF NOT EXISTS idx_fault_causes_fault_id ON fault_causes(fault_id);
