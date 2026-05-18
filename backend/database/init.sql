CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'officer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    plate_number VARCHAR(20) PRIMARY KEY,
    owner_name VARCHAR(100),
    vehicle_model VARCHAR(50),
    phone_number VARCHAR(15)
);

CREATE TABLE IF NOT EXISTS violations (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(100),
    vehicle_plate VARCHAR(20), -- Can be NULL if not recognized yet
    violation_type VARCHAR(50) NOT NULL, -- 'NO_HELMET', 'TRIPLE_RIDING', 'OVERSPEEDING'
    timestamp TIMESTAMP NOT NULL,
    location VARCHAR(100),
    confidence_score FLOAT,
    speed_kmph FLOAT,
    evidence_image_path VARCHAR(255),
    vehicle_type VARCHAR(50) DEFAULT 'UNKNOWN', -- 'CAR', 'MOTORCYCLE', 'TRUCK', 'BUS'
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);
CREATE INDEX IF NOT EXISTS idx_violations_violation_type ON violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_violations_vehicle_type ON violations(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_violations_created_at ON violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_violations_vehicle_plate ON violations(vehicle_plate);

CREATE TABLE IF NOT EXISTS challans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_id INTEGER REFERENCES violations(id),
    amount DECIMAL(10, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pdf_path VARCHAR(255)
);
