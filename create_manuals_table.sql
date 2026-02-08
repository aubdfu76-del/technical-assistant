
CREATE TABLE IF NOT EXISTS technical_manuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id), 
    file_size VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_manuals_search ON technical_manuals(title, description, vehicle_type);
