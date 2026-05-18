-- Migration script to update violations table with missing fields
-- Run this if you need to update an existing database

-- Add missing vehicle_type column if not exists
ALTER TABLE violations ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50) DEFAULT 'UNKNOWN';

-- Add missing location column if not exists
ALTER TABLE violations ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);
CREATE INDEX IF NOT EXISTS idx_violations_violation_type ON violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_violations_created_at ON violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_violations_vehicle_plate ON violations(vehicle_plate);

-- Add constraints for better data integrity
ALTER TABLE violations ADD CONSTRAINT check_status 
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')) 
    NOT VALID;

-- Add user audit fields if needed
ALTER TABLE violations ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(100);
ALTER TABLE violations ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE violations ADD COLUMN IF NOT EXISTS notes TEXT;

-- Commit
COMMIT;
