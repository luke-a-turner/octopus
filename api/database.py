"""
Database module for PostgreSQL operations using SQLAlchemy ORM.
Handles async database queries for tariff and consumption data.
"""

import logging
from datetime import datetime

import polars as pl
from sqlalchemy import and_, select
from sqlalchemy.dialects.postgresql import insert

from api.constants import Field, Identifier, Product, Tariff
from api.db_session import get_session_maker
from api.models import Consumption
from api.models import Tariff as TariffModel

logger = logging.getLogger(__name__)


async def get_tariff_data_from_db(
    start_datetime: datetime,
    end_datetime: datetime,
    product: str = Product.AGILE_24_10_01,
    tariff: str = Tariff.SOUTH_EAST,
) -> pl.DataFrame | None:
    """
    Query tariff data from database for the given time range using SQLAlchemy.
    Returns None if no data found.
    """
    try:
        session_maker = get_session_maker()
        async with session_maker() as session:
            # Build query using SQLAlchemy select
            stmt = (
                select(TariffModel.valid_from, TariffModel.value_inc_vat)
                .where(
                    and_(
                        TariffModel.product == product,
                        TariffModel.tariff == tariff,
                        TariffModel.valid_from >= start_datetime,
                        TariffModel.valid_from < end_datetime,
                    )
                )
                .order_by(TariffModel.valid_from)
            )

            result = await session.execute(stmt)
            rows = result.all()

            if not rows:
                logger.info(f"No tariff data in DB for {start_datetime} to {end_datetime}")
                return None

            # Convert to dictionaries for polars
            data = [
                {Field.VALID_FROM: row.valid_from, Field.VALUE: float(row.value_inc_vat)}
                for row in rows
            ]
            df = pl.DataFrame(data)
            logger.info(
                f"Retrieved {len(df)} tariff records from database "
                f"for {start_datetime} to {end_datetime}"
            )
            return df

    except Exception as e:
        logger.error(f"Error querying tariff data from database: {e}")
        return None


async def get_consumption_data_from_db(
    start_datetime: datetime,
    end_datetime: datetime,
    mpan: str = Identifier.MPAN,
    serial_number: str = Identifier.SERIAL_NUMBER,
) -> pl.DataFrame | None:
    """
    Query consumption data from database for the given time range using SQLAlchemy.
    Returns None if no data found.
    """
    try:
        session_maker = get_session_maker()
        async with session_maker() as session:
            # Build query using SQLAlchemy select
            stmt = (
                select(Consumption.interval_start, Consumption.consumption)
                .where(
                    and_(
                        Consumption.mpan == mpan,
                        Consumption.serial_number == serial_number,
                        Consumption.interval_start >= start_datetime,
                        Consumption.interval_start < end_datetime,
                    )
                )
                .order_by(Consumption.interval_start)
            )

            result = await session.execute(stmt)
            rows = result.all()

            if not rows:
                logger.info(f"No consumption data in DB for {start_datetime} to {end_datetime}")
                return None

            # Convert to dictionaries for polars
            data = [
                {
                    Field.INTERVAL_START: row.interval_start,
                    Field.CONSUMPTION: float(row.consumption),
                }
                for row in rows
            ]
            df = pl.DataFrame(data)
            logger.info(
                f"Retrieved {len(df)} consumption records from database "
                f"for {start_datetime} to {end_datetime}"
            )
            return df

    except Exception as e:
        logger.error(f"Error querying consumption data from database: {e}")
        return None


async def insert_tariff_data_to_db(
    df: pl.DataFrame,
    product: str = Product.AGILE_24_10_01,
    tariff: str = Tariff.SOUTH_EAST,
) -> bool:
    """
    Insert tariff data into database using SQLAlchemy.
    Uses INSERT ... ON CONFLICT DO NOTHING to avoid duplicates.
    Returns True if successful.
    """
    if df.is_empty():
        logger.info("No tariff data to insert")
        return True

    try:
        session_maker = get_session_maker()
        async with session_maker() as session:
            # Prepare data for batch insert
            records = [
                {
                    "product": product,
                    "tariff": tariff,
                    "valid_from": row[Field.VALID_FROM],
                    "value_inc_vat": row[Field.VALUE],
                }
                for row in df.to_dicts()
            ]

            # Use PostgreSQL INSERT ... ON CONFLICT DO NOTHING
            stmt = insert(TariffModel).values(records)
            stmt = stmt.on_conflict_do_nothing(index_elements=["product", "tariff", "valid_from"])

            await session.execute(stmt)
            await session.commit()

            logger.info(f"Inserted {len(records)} tariff records to database")
            return True

    except Exception as e:
        logger.error(f"Error inserting tariff data to database: {e}")
        return False


async def insert_consumption_data_to_db(
    df: pl.DataFrame,
    mpan: str = Identifier.MPAN,
    serial_number: str = Identifier.SERIAL_NUMBER,
) -> bool:
    """
    Insert consumption data into database using SQLAlchemy.
    Uses INSERT ... ON CONFLICT DO NOTHING to avoid duplicates.
    Returns True if successful.
    """
    if df.is_empty():
        logger.info("No consumption data to insert")
        return True

    try:
        session_maker = get_session_maker()
        async with session_maker() as session:
            # Prepare data for batch insert
            records = [
                {
                    "mpan": mpan,
                    "serial_number": serial_number,
                    "interval_start": row[Field.INTERVAL_START],
                    "consumption": row[Field.CONSUMPTION],
                }
                for row in df.to_dicts()
            ]

            # Use PostgreSQL INSERT ... ON CONFLICT DO NOTHING
            stmt = insert(Consumption).values(records)
            stmt = stmt.on_conflict_do_nothing(
                index_elements=["mpan", "serial_number", "interval_start"]
            )

            await session.execute(stmt)
            await session.commit()

            logger.info(f"Inserted {len(records)} consumption records to database")
            return True

    except Exception as e:
        logger.error(f"Error inserting consumption data to database: {e}")
        return False
