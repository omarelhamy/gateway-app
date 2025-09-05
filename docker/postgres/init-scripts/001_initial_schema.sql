-- Gateway Manager Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Initial database schema creation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE gateway_status AS ENUM ('active', 'inactive', 'decommissioned');
CREATE TYPE device_status AS ENUM ('online', 'offline', 'maintenance');

-- Create gateways table
CREATE TABLE gateways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    ipv4_address VARCHAR(15) NOT NULL UNIQUE,
    status gateway_status NOT NULL DEFAULT 'active',
    location VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create device_types table
CREATE TABLE device_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create peripheral_devices table
CREATE TABLE peripheral_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid BIGINT NOT NULL UNIQUE,
    vendor VARCHAR(100) NOT NULL,
    status device_status NOT NULL DEFAULT 'offline',
    gateway_id UUID,
    device_type_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign key constraints
    CONSTRAINT fk_peripheral_devices_gateway 
        FOREIGN KEY (gateway_id) 
        REFERENCES gateways(id) 
        ON DELETE SET NULL,
    
    CONSTRAINT fk_peripheral_devices_device_type 
        FOREIGN KEY (device_type_id) 
        REFERENCES device_types(id) 
        ON DELETE SET NULL
);

-- Create gateway_logs table
CREATE TABLE gateway_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    CONSTRAINT fk_gateway_logs_gateway 
        FOREIGN KEY (gateway_id) 
        REFERENCES gateways(id) 
        ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_gateways_serial_number ON gateways(serial_number);
CREATE INDEX idx_gateways_ipv4_address ON gateways(ipv4_address);
CREATE INDEX idx_gateways_status ON gateways(status);
CREATE INDEX idx_gateways_created_at ON gateways(created_at);

CREATE INDEX idx_peripheral_devices_uid ON peripheral_devices(uid);
CREATE INDEX idx_peripheral_devices_gateway_id ON peripheral_devices(gateway_id);
CREATE INDEX idx_peripheral_devices_status ON peripheral_devices(status);
CREATE INDEX idx_peripheral_devices_created_at ON peripheral_devices(created_at);

CREATE INDEX idx_gateway_logs_gateway_id ON gateway_logs(gateway_id);
CREATE INDEX idx_gateway_logs_action ON gateway_logs(action);
CREATE INDEX idx_gateway_logs_created_at ON gateway_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for gateways table
CREATE TRIGGER update_gateways_updated_at 
    BEFORE UPDATE ON gateways 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default device types
INSERT INTO device_types (name, description) VALUES
    ('Sensor', 'IoT sensor device'),
    ('Actuator', 'IoT actuator device'),
    ('Controller', 'IoT controller device'),
    ('Gateway', 'IoT gateway device'),
    ('Router', 'Network router device');
