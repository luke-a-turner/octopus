#!/usr/bin/env python3
"""
Database initialization script for Octopus project.
Creates the PostgreSQL database, tables, indexes, and user from schema.sql

Note: This script uses psycopg3 for synchronous database setup.
The main application uses SQLAlchemy with psycopg3 for async operations.
"""

import os
import sys

import psycopg
from dotenv import load_dotenv
from psycopg import sql

# Load environment variables from .env file
load_dotenv()


def get_db_config():
    """Get database configuration from environment variables or use defaults"""
    return {
        "host": os.environ.get("PGHOST", "localhost"),
        "port": os.environ.get("PGPORT", "5432"),
        "user": os.environ.get("PGUSER", "postgres"),
        "password": os.getenv("PGPASSWORD"),
    }


def database_exists(conn, db_name):
    """Check if database exists"""
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
        return cur.fetchone() is not None


def create_database(config, db_name):
    """Create the database if it doesn't exist"""
    print(f"Connecting to PostgreSQL server at {config['host']}:{config['port']}...")

    try:
        # Connect to postgres database to create octopus database
        with psycopg.connect(
            host=config["host"],
            port=config["port"],
            dbname="postgres",
            user=config["user"],
            autocommit=True,
        ) as conn:
            if database_exists(conn, db_name):
                print(f"Database '{db_name}' already exists.")
            else:
                print(f"Creating database '{db_name}'...")
                with conn.cursor() as cur:
                    # Use sql.Identifier for safe database name handling
                    cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name)))
                print(f"Database '{db_name}' created successfully.")

        return True

    except psycopg.Error as e:
        print(f"Error connecting to PostgreSQL: {e}")
        return False


def execute_schema(config, db_name, schema_file):
    """Execute the schema SQL file"""
    print(f"\nConnecting to database '{db_name}'...")

    try:
        # Connect to octopus database
        with psycopg.connect(
            host=config["host"],
            port=config["port"],
            dbname=db_name,
            user=config["user"],
            password=config["password"],
        ) as conn:
            # Read schema file
            script_dir = os.path.dirname(os.path.abspath(__file__))
            schema_path = os.path.join(script_dir, schema_file)

            if not os.path.exists(schema_path):
                print(f"Error: Schema file '{schema_path}' not found.")
                return False

            print(f"Reading schema from '{schema_file}'...")
            with open(schema_path) as f:
                sql_content = f.read()

            # Remove psql-specific commands that aren't needed
            # (database already created and we're already connected)
            lines = sql_content.split("\n")
            filtered_lines = []
            skip_until_connect = True

            for line in lines:
                # Skip everything until after the \c octopus command
                if skip_until_connect:
                    if line.strip().startswith("\\c octopus"):
                        skip_until_connect = False
                    continue

                # Skip \gexec commands
                if "\\gexec" in line:
                    continue

                filtered_lines.append(line)

            sql_to_execute = "\n".join(filtered_lines)

            print("Creating tables, indexes, and user...")

            # Execute the SQL
            with conn.cursor() as cur:
                cur.execute(sql_to_execute)

            conn.commit()
            print("Schema applied successfully!")

            # Verify tables were created
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                """
                )
                tables = cur.fetchall()

                if tables:
                    print("\nCreated tables:")
                    for table in tables:
                        print(f"  - {table[0]}")

                # Verify user was created
                cur.execute(
                    """
                    SELECT usename
                    FROM pg_catalog.pg_user
                    WHERE usename = 'octopus_rw'
                """
                )
                user = cur.fetchone()

                if user:
                    print("\nCreated user: octopus_rw")

        return True

    except psycopg.Error as e:
        print(f"Error executing schema: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False


def main():
    """Main function"""
    print("=" * 60)
    print("Octopus Database Initialization")
    print("=" * 60)

    db_name = "octopus"
    schema_file = "schema.sql"

    # Get database configuration
    config = get_db_config()

    print("\nConfiguration:")
    print(f"  Host: {config['host']}")
    print(f"  Port: {config['port']}")
    print(f"  User: {config['user']}")
    print(f"  Database: {db_name}")
    print(f"  Password: {config['password']}")

    # Create database
    if not create_database(config, db_name):
        print("\nDatabase initialization failed.")
        sys.exit(1)

    # Execute schema
    if not execute_schema(config, db_name, schema_file):
        print("\nSchema execution failed.")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("Database initialization completed successfully!")
    print("=" * 60)
    print("\nYou can now connect using:")
    print(f"  psql -h {config['host']} -d {db_name} -U octopus_rw")
    print("  Password: octopus_rw")
    print("\nConnection string:")
    print(f"  postgresql://octopus_rw:octopus_rw@{config['host']}:{config['port']}/{db_name}")


if __name__ == "__main__":
    main()
