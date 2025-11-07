# Database Setup

This directory contains the PostgreSQL database schema for the Octopus project.

## Files

- `schema.sql`: Database schema definition with tables and indexes
- `init_db.py`: Python script to initialize the database using schema.sql

## Tables

### tariff
Stores tariff pricing information with composite unique constraint on (product, tariff, valid_from)

| Column | Type | Description |
|--------|------|-------------|
| tariff_id | SERIAL | Auto-incrementing primary key |
| product | VARCHAR(50) | Product name (NOT NULL) |
| tariff | VARCHAR(50) | Tariff name (NOT NULL) |
| valid_from | TIMESTAMP | Tariff validity start date (NOT NULL) |
| value_inc_vat | NUMERIC | Tariff value including VAT (NOT NULL) |

### consumption
Stores energy consumption data with composite unique constraint on (mpan, serial_number, interval_start)

| Column | Type | Description |
|--------|------|-------------|
| consumption_id | SERIAL | Auto-incrementing primary key |
| mpan | VARCHAR(25) | Meter Point Administration Number (NOT NULL) |
| serial_number | VARCHAR(25) | Meter serial number (NOT NULL) |
| interval_start | TIMESTAMP | Start time of consumption interval (NOT NULL) |
| consumption | NUMERIC | Energy consumption value (NOT NULL) |

## Database User

The schema script automatically creates a PostgreSQL user with read/write permissions:

- **Username**: `octopus_rw`
- **Password**: `octopus_rw`
- **Permissions**: SELECT, INSERT, UPDATE, DELETE on all tables and sequences in the public schema

**Security Note**: The default password should be changed in production environments.

## Setup Instructions

The schema script automatically creates the `octopus` database if it doesn't exist, then creates the tables, indexes, and user.

### Option 1: Using Python initialization script (Recommended)

The easiest way to initialize the database is using the provided Python script:

```bash
# Install dependencies (choose one method)
# Using Poetry (recommended if you're using the project's other dependencies)
poetry install

# Or using pip directly (install psycopg-binary for the setup script)
pip install psycopg-binary

# Run the initialization script
python db/init_db.py
```

The script will:
- Create the `octopus` database if it doesn't exist
- Create all tables and indexes
- Create the `octopus_rw` user with appropriate permissions
- Display connection information when complete

**Note:** The initialization script uses `psycopg3` for setup. The main application uses `SQLAlchemy` (async) with `psycopg3` driver for database operations.

**Environment variables** (optional):
```bash
export PGHOST=localhost        # Default: localhost
export PGPORT=5432            # Default: 5432
export PGUSER=postgres        # Default: postgres
export PGPASSWORD=your_password
```

### Option 2: Using psql command line
```bash
# Run the schema script (connects to postgres database, creates octopus database, then creates tables)
psql -d postgres -f db/schema.sql
```

### Option 3: Using environment variables
```bash
# Set your database connection details
export PGHOST=localhost
export PGPORT=5432
export PGUSER=your_username
export PGPASSWORD=your_password

# Run the schema script (must connect to postgres database first)
psql -d postgres -f db/schema.sql
```

### Option 3: Manual database creation
```bash
# If you prefer to create the database separately
createdb octopus

# Then run the schema script
psql -d octopus -f db/schema.sql
```

### Option 4: Using Python (psycopg3)
```python
import psycopg
from psycopg import sql

# First, connect to postgres database to create octopus database
with psycopg.connect(
    host="localhost",
    dbname="postgres",
    user="your_username",
    password="your_password",
    autocommit=True
) as conn:
    with conn.cursor() as cur:
        # Check if database exists
        cur.execute("SELECT 1 FROM pg_database WHERE datname='octopus'")
        if not cur.fetchone():
            cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier("octopus")))

# Now connect to octopus database and create tables
with psycopg.connect(
    host="localhost",
    dbname="octopus",
    user="your_username",
    password="your_password"
) as conn:
    with open('db/schema.sql', 'r') as f:
        sql_content = f.read()
        # Skip the database creation parts
        sql_parts = sql_content.split('\\c octopus')[1] if '\\c octopus' in sql_content else sql_content

    with conn.cursor() as cur:
        cur.execute(sql_parts)

    conn.commit()
```

## Connecting to the Database

After running the schema script, you can connect to the database using the `octopus_rw` user:

### Using psql
```bash
psql -h localhost -d octopus -U octopus_rw
# Password: octopus_rw
```

### Using Python (psycopg3)
```python
import psycopg

with psycopg.connect(
    host="localhost",
    dbname="octopus",
    user="octopus_rw",
    password="octopus_rw"
) as conn:
    # Example: Insert data into tariff table
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO tariff (product, tariff, valid_from, value_inc_vat)
            VALUES (%s, %s, %s, %s)
        """, ('AGILE-24-04-03', 'E-1R-AGILE-24-04-03-A', '2024-04-03 00:00:00', 15.5))

    conn.commit()
```

### Connection String
```
postgresql://octopus_rw:octopus_rw@localhost:5432/octopus
```
