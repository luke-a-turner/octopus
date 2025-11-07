import logging
from datetime import datetime
from enum import StrEnum
from math import ceil

import polars as pl

from api.async_request import RestRequest
from api.constants import PAGE_SIZE, SECONDS_IN_HOUR, Field
from api.database import (
    get_consumption_data_from_db,
    get_tariff_data_from_db,
    insert_consumption_data_to_db,
    insert_tariff_data_to_db,
)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class DataType(StrEnum):
    TARIFF = "tariff"
    CONSUMPTION = "consumption"


async def fetch_from_api(
    url: str,
    start_datetime: datetime,
    end_datetime: datetime,
    date_field: Field,
    value_field: Field,
) -> pl.DataFrame:
    """Fetch data from Octopus Energy API"""
    # number of half hour report intervals between start and end datetime
    number_data_points = ceil(
        ((end_datetime - start_datetime).total_seconds() / SECONDS_IN_HOUR) * 2
    )

    page_size = PAGE_SIZE if number_data_points > PAGE_SIZE else number_data_points
    pages_required = ceil(number_data_points / PAGE_SIZE)

    urls = [f"{url}?page_size={page_size}&page={i}" for i in range(1, (pages_required + 1))]
    logger.info(f"Fetching data from API: {len(urls)} requests")
    data_batches = await RestRequest().fetch_results(urls)

    lazy_frames = [
        pl.DataFrame(batch["results"]).lazy() for batch in data_batches if batch["results"]
    ]

    if not lazy_frames:
        return pl.DataFrame()

    logger.info(f"Created {len(lazy_frames)} dataframes from batches")
    logger.info(f"Filtering data for range {start_datetime} to {end_datetime} on {date_field}")

    df = (
        pl.concat(lazy_frames)
        .with_columns(pl.col(date_field).str.to_datetime("%Y-%m-%dT%H:%M:%SZ").alias(date_field))
        .filter((pl.col(date_field) >= start_datetime) & (pl.col(date_field) < end_datetime))
        .select([date_field, value_field])
        .collect()
    )
    logger.info(f"Filtered to {len(df)} records from API")
    return df


async def get_polars_dataframe(
    url: str,
    start_datetime: datetime,
    end_datetime: datetime,
    date_field: Field,
    value_field: Field,
    data_type: DataType,
) -> pl.DataFrame:
    """
    Get Octopus Energy data with database caching.

    Flow:
    1. Check if data exists in database
    2. If exists, return from database
    3. If not, fetch from API
    4. Save API response to database
    5. Return data
    """
    logger.info(f"Requesting {data_type} data from {start_datetime} to {end_datetime}")

    # Step 1: Check database first
    db_data = None
    if data_type == DataType.TARIFF:
        db_data = await get_tariff_data_from_db(start_datetime, end_datetime)
    elif data_type == DataType.CONSUMPTION:
        db_data = await get_consumption_data_from_db(start_datetime, end_datetime)

    if db_data is not None and not db_data.is_empty():
        logger.info(f"Data found in database, returning {len(db_data)} records")
        return db_data

    # Step 2: Data not in database, fetch from API
    logger.info("Data not in database, fetching from API")
    api_data = await fetch_from_api(url, start_datetime, end_datetime, date_field, value_field)

    if api_data.is_empty():
        logger.warning(f"No data returned from API for {start_datetime} to {end_datetime}")
        return api_data

    # Step 3: Save to database
    logger.info(f"Saving {len(api_data)} records to database")
    if data_type == DataType.TARIFF:
        await insert_tariff_data_to_db(api_data)
    elif data_type == DataType.CONSUMPTION:
        await insert_consumption_data_to_db(api_data)

    return api_data
