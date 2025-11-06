-- PostgreSQL Database Schema Script
-- Creates database and tables for tariff and consumption data

-- Create database if it doesn't exist
-- Note: This should be run while connected to the 'postgres' database
-- Example: psql -d postgres -f schema.sql
SELECT 'CREATE DATABASE octopus'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'octopus')\gexec

-- Connect to the octopus database for the remaining commands
\c octopus

-- Create tariff table
CREATE TABLE IF NOT EXISTS tariff (
    tariff_id SERIAL PRIMARY KEY,
    product VARCHAR(50) NOT NULL,
    tariff VARCHAR(50) NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    value_inc_vat NUMERIC NOT NULL
);

-- Create composite unique index on tariff table
CREATE UNIQUE INDEX IF NOT EXISTS idx_tariff_unique
ON tariff (product, tariff, valid_from);

-- Create consumption table
CREATE TABLE IF NOT EXISTS consumption (
    consumption_id SERIAL PRIMARY KEY,
    mpan VARCHAR(25) NOT NULL,
    serial_number VARCHAR(25) NOT NULL,
    interval_start TIMESTAMP NOT NULL,
    consumption NUMERIC NOT NULL
);

-- Create composite unique index on consumption table
CREATE UNIQUE INDEX IF NOT EXISTS idx_consumption_unique
ON consumption (mpan, serial_number, interval_start);

-- Optional: Add comments to document the tables
COMMENT ON TABLE tariff IS 'Stores tariff pricing information with product and validity dates';
COMMENT ON TABLE consumption IS 'Stores energy consumption data by meter point and time interval';

COMMENT ON COLUMN tariff.tariff_id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN tariff.product IS 'Product name';
COMMENT ON COLUMN tariff.tariff IS 'Tariff name';
COMMENT ON COLUMN tariff.valid_from IS 'Tariff validity start date';
COMMENT ON COLUMN tariff.value_inc_vat IS 'Tariff value including VAT';

COMMENT ON COLUMN consumption.consumption_id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN consumption.mpan IS 'Meter Point Administration Number';
COMMENT ON COLUMN consumption.serial_number IS 'Meter serial number';
COMMENT ON COLUMN consumption.interval_start IS 'Start time of consumption interval';
COMMENT ON COLUMN consumption.consumption IS 'Energy consumption value';

-- Create user with read/write permissions
-- Create user if it doesn't exist
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'octopus_rw') THEN
    CREATE USER octopus_rw WITH PASSWORD 'octopus_rw';
  END IF;
END
$$;

-- Grant connect privilege on database
GRANT CONNECT ON DATABASE octopus TO octopus_rw;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO octopus_rw;

-- Grant read/write permissions on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO octopus_rw;

-- Grant permissions on future tables (tables created after this script runs)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO octopus_rw;

-- Grant usage and select on all sequences (needed for SERIAL columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO octopus_rw;

-- Grant permissions on future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO octopus_rw;
