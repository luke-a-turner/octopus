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

# Or using pip directly (install psycopg2-binary for the setup script)
pip install psycopg2-binary

# Run the initialization script
python db/init_db.py
```

The script will:
- Create the `octopus` database if it doesn't exist
- Create all tables and indexes
- Create the `octopus_rw` user with appropriate permissions
- Display connection information when complete

**Note:** The initialization script uses `psycopg2` for setup. The main application uses `SQLAlchemy` (async) with `asyncpg` driver for database operations.

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

### Option 4: Using Python (psycopg2)
```python
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# First, connect to postgres database to create octopus database
conn = psycopg2.connect(
    host="localhost",
    database="postgres",
    user="your_username",
    password="your_password"
)
conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)

with conn.cursor() as cur:
    # Check if database exists
    cur.execute("SELECT 1 FROM pg_database WHERE datname='octopus'")
    if not cur.fetchone():
        cur.execute("CREATE DATABASE octopus")

conn.close()

# Now connect to octopus database and create tables
conn = psycopg2.connect(
    host="localhost",
    database="octopus",
    user="your_username",
    password="your_password"
)

with open('db/schema.sql', 'r') as f:
    sql = f.read()
    # Skip the database creation parts
    sql_parts = sql.split('\\c octopus')[1] if '\\c octopus' in sql else sql

with conn.cursor() as cur:
    cur.execute(sql_parts)

conn.commit()
conn.close()
```

## Connecting to the Database

After running the schema script, you can connect to the database using the `octopus_rw` user:

### Using psql
```bash
psql -h localhost -d octopus -U octopus_rw
# Password: octopus_rw
```

### Using Python (psycopg2)
```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="octopus",
    user="octopus_rw",
    password="octopus_rw"
)

# Example: Insert data into tariff table
with conn.cursor() as cur:
    cur.execute("""
        INSERT INTO tariff (product, tariff, valid_from, value_inc_vat)
        VALUES (%s, %s, %s, %s)
    """, ('AGILE-24-04-03', 'E-1R-AGILE-24-04-03-A', '2024-04-03 00:00:00', 15.5))

conn.commit()
conn.close()
```

### Connection String
```
postgresql://octopus_rw:octopus_rw@localhost:5432/octopus
```
