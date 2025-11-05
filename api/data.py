import logging
from datetime import datetime
from math import ceil

import polars as pl

from api.async_request import RestRequest
from api.constants import PAGE_SIZE, SECONDS_IN_HOUR, Field

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def get_data(
    url: str,
    start_datetime: datetime,
    end_datetime: datetime,
    date_field: Field,
    value_field: Field,
) -> pl.DataFrame:
    """Get Octopus Energy data"""
    # number of half hour report intervals between start and end datetime
    number_data_points = ceil(
        ((end_datetime - start_datetime).total_seconds() / SECONDS_IN_HOUR) * 2
    )
    pages_required = ceil(number_data_points / PAGE_SIZE)

    urls = [f"{url}?page_size={PAGE_SIZE}&page={i}" for i in range(1, (pages_required + 1))]
    data_batches = await RestRequest().fetch_results(urls)

    lazy_frames = [pl.DataFrame(batch["results"]).lazy() for batch in data_batches]
    logger.info(f"Created {len(lazy_frames)} dataframes from batches")

    logger.info(f"Filtering data for range {start_datetime} to {end_datetime} on {date_field}")
    df = (
        pl.concat(lazy_frames)
        .with_columns(pl.col(date_field).str.to_datetime("%Y-%m-%dT%H:%M:%SZ").alias(date_field))
        .filter((pl.col(date_field) > start_datetime) & (pl.col(date_field) < end_datetime))
        .select([date_field, value_field])
        .collect()
    )
    logger.info(f"Filtered to {len(df)} records")
    return df
