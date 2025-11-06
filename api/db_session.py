"""
Database session management for SQLAlchemy.
Handles async engine creation and session lifecycle.
"""

import logging
import os
from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from api.models import Base

logger = logging.getLogger(__name__)

# Global async engine and session maker
_async_engine = None
_async_session_maker = None


def get_database_url() -> str:
    """Construct database URL from environment variables"""
    host = os.environ.get("PGHOST", "localhost")
    port = os.environ.get("PGPORT", "5432")
    database = os.environ.get("PGDATABASE", "octopus")
    user = os.environ.get("PGUSER", "octopus_rw")
    password = os.environ.get("PGPASSWORD", "octopus_rw")

    return f"postgresql://{user}:{password}@{host}:{port}/{database}"


def get_engine():
    """Get or create the async SQLAlchemy engine"""
    global _async_engine

    if _async_engine is None:
        database_url = get_database_url()
        logger.info(f"Creating async SQLAlchemy engine for {database_url.split('@')[1]}")

        _async_engine = create_async_engine(
            database_url,
            echo=False,  # Set to True for SQL query logging
            pool_size=10,
            max_overflow=10,
            pool_pre_ping=True,  # Verify connections before using
        )

    return _async_engine


def get_session_maker() -> async_sessionmaker[AsyncSession]:
    """Get or create the async session maker"""
    global _async_session_maker

    if _async_session_maker is None:
        engine = get_engine()
        _async_session_maker = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )

    return _async_session_maker


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Async context manager for database sessions.
    Use this as a dependency in FastAPI endpoints.

    Usage:
        async with get_db_session() as session:
            # Use session here
            pass
    """
    session_maker = get_session_maker()
    async with session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables (for testing or first-time setup)"""
    engine = get_engine()
    async with engine.begin() as conn:
        # Create all tables defined in Base
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully")


async def close_db():
    """Close database engine and cleanup"""
    global _async_engine, _async_session_maker

    if _async_engine is not None:
        await _async_engine.dispose()
        _async_engine = None
        _async_session_maker = None
        logger.info("Database engine closed")
