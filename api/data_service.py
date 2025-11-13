import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
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


@dataclass
class DatabaseDataAvailability:
    complete: bool
    data: pl.DataFrame


class DataService:
    def __init__(
        self,
        url: str,
        start_datetime: datetime,
        end_datetime: datetime,
        date_field: Field,
        value_field: Field,
        data_type: DataType,
    ):
        self.url = url
        self.start_datetime = start_datetime
        self.end_datetime = end_datetime
        self.date_field = date_field
        self.value_field = value_field
        self.data_type = data_type

    def find_missing_intervals(
        self,
        existing_data: pl.DataFrame,
    ) -> list[tuple[datetime, datetime]]:
        """
        Find missing half-hour intervals in the existing data.
        Returns a list of (start, end) tuples representing continuous missing ranges.
        """
        expected_intervals = []
        current = self.start_datetime
        while current < self.end_datetime:
            expected_intervals.append(current)
            current += timedelta(minutes=30)

        if not expected_intervals:
            return []

        if existing_data.is_empty():
            return [(self.start_datetime, self.end_datetime)]

        existing_intervals = set(existing_data[self.date_field].to_list())
        missing_intervals = [dt for dt in expected_intervals if dt not in existing_intervals]

        if not missing_intervals:
            logger.info(f"{self.data_type}: No missing intervals found")
            return []

        missing_ranges = []
        if missing_intervals:
            range_start = missing_intervals[0]
            range_end = missing_intervals[0] + timedelta(minutes=30)

            for i in range(1, len(missing_intervals)):
                if missing_intervals[i] == range_end:
                    # consecutive interval, extend the range
                    range_end = missing_intervals[i] + timedelta(minutes=30)
                else:
                    # gap found, save current range and start new one
                    missing_ranges.append((range_start, range_end))
                    range_start = missing_intervals[i]
                    range_end = missing_intervals[i] + timedelta(minutes=30)

            missing_ranges.append((range_start, range_end))

        logger.info(
            f"{self.data_type}: Found {len(missing_intervals)} missing intervals "
            f"{self.data_type}: grouped into {len(missing_ranges)} ranges"
        )
        for start, end in missing_ranges:
            logger.info(f"{self.data_type} Missing range: {start} to {end}")

        return missing_ranges

    async def fetch_from_api(
        self, start_datetime: datetime | None = None, end_datetime: datetime | None = None
    ) -> pl.DataFrame:
        """Fetch data from Octopus Energy API"""
        # number of half hour report intervals between start and end datetime
        start_datetime = self.start_datetime if start_datetime is None else start_datetime
        end_datetime = self.end_datetime if end_datetime is None else end_datetime

        number_data_points = ceil(
            ((end_datetime - start_datetime).total_seconds() / SECONDS_IN_HOUR) * 2
        )

        page_size = PAGE_SIZE if number_data_points > PAGE_SIZE else number_data_points
        pages_required = ceil(number_data_points / PAGE_SIZE)

        urls = [
            f"{self.url}?period_from={start_datetime.strftime('%Y-%m-%dT%H:%MZ')}&period_to={end_datetime.strftime('%Y-%m-%dT%H:%MZ')}&page_size={page_size}&page={i}"
            for i in range(1, (pages_required + 1))
        ]
        logger.info(f"{self.data_type}: Fetching data from API: {len(urls)} requests")
        data_batches = await RestRequest().fetch_results(urls)

        lazy_frames = [
            pl.DataFrame(batch["results"]).lazy() for batch in data_batches if batch["results"]
        ]

        if not lazy_frames:
            return pl.DataFrame()

        logger.info(f"{self.data_type}: Created {len(lazy_frames)} dataframes from batches")
        logger.info(
            f"{self.data_type}: Filtering data for range {start_datetime} to {end_datetime} on {self.date_field}"
        )

        df = (
            pl.concat(lazy_frames)
            .with_columns(
                pl.col(self.date_field).str.to_datetime("%Y-%m-%dT%H:%M:%SZ").alias(self.date_field)
            )
            .filter(
                (pl.col(self.date_field) >= start_datetime)
                & (pl.col(self.date_field) < end_datetime)
            )
            .select([self.date_field, self.value_field])
            .collect()
        )
        logger.info(f"{self.data_type}: Filtered to {len(df)} records from API")
        return df

    async def get_database_data(self) -> pl.DataFrame:
        match self.data_type:
            case DataType.TARIFF:
                return await get_tariff_data_from_db(self.start_datetime, self.end_datetime)
            case DataType.CONSUMPTION:
                return await get_consumption_data_from_db(self.start_datetime, self.end_datetime)
            case _:
                return pl.DataFrame()

    async def get_missing_interval_data_from_api(
        self, missing_ranges: list[tuple[datetime, datetime]]
    ) -> list[pl.DataFrame]:
        missing_intervals_data = []
        for range_start, range_end in missing_ranges:
            missing_data = await self.fetch_from_api(range_start, range_end)
            if missing_data.is_empty():
                continue

            missing_intervals_data.append(missing_data)
            logger.info(f"{self.data_type}: Saving {len(missing_data)} missing records to database")

            match self.data_type:
                case DataType.TARIFF:
                    await insert_tariff_data_to_db(missing_data)
                case DataType.CONSUMPTION:
                    await insert_consumption_data_to_db(missing_data)
        return missing_intervals_data

    async def check_database_data_availability(
        self, db_data: pl.DataFrame
    ) -> DatabaseDataAvailability:
        if db_data.is_empty():
            return DatabaseDataAvailability(False, db_data)

        logger.info(f"{self.data_type}: Data found in database: {len(db_data)} records")

        missing_ranges = self.find_missing_intervals(db_data)

        if not missing_ranges:
            logger.info(f"{self.data_type}: All intervals present in database")
            return DatabaseDataAvailability(True, db_data)

        logger.info(f"{self.data_type}: Fetching {len(missing_ranges)} missing ranges from API")

        missing_intervals_data = await self.get_missing_interval_data_from_api(missing_ranges)

        if missing_intervals_data:
            data = pl.concat([db_data] + missing_intervals_data)
            data = data.sort(self.date_field)

            logger.info(f"{self.data_type} Combined data: {len(data)} total records")
            return DatabaseDataAvailability(True, data)

        logger.warning(f"{self.data_type} No data returned from API for missing ranges")
        return DatabaseDataAvailability(True, db_data)

    async def get_polars_dataframe(self) -> pl.DataFrame:
        """
        Get Octopus Energy data with database caching.

        Flow:
        1. Check if data exists in database
        2. If exists, check for missing intervals
        3. If missing intervals, fetch them from API
        4. Combine database and API data
        5. If no data in database, fetch all from API
        6. Save new API data to database
        7. Return combined data
        """
        logger.info(
            f"{self.data_type}: Requesting data from {self.start_datetime} to {self.end_datetime}"
        )

        # Step 1: Check database first
        data = await self.get_database_data()

        # Step 2: If data found in database, check for missing intervals.
        # If missing intervals present, fetch/insert from API if available
        data_availability = await self.check_database_data_availability(data)
        if data_availability.complete:
            return data_availability.data

        # Step 3: No data in database, fetch all from API
        logger.info(f"{self.data_type}: No data in database, fetching all from API")
        api_data = await self.fetch_from_api(self.start_datetime, self.end_datetime)

        if api_data.is_empty():
            logger.warning(
                f"{self.data_type}: No data returned from API for {self.start_datetime} to {self.end_datetime}"
            )
            return api_data

        # Step 4: Save to database
        logger.info(f"{self.data_type}: Saving {len(api_data)} records to database")

        match self.data_type:
            case DataType.TARIFF:
                await insert_tariff_data_to_db(api_data)
            case DataType.CONSUMPTION:
                await insert_consumption_data_to_db(api_data)

        return api_data
