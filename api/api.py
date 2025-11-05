import logging
from datetime import datetime, timedelta

import polars as pl
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api.async_request import GraphqlRequest
from api.cache import async_cache, clear_cache, get_cache_info
from api.constants import Endpoint, Field, Identifier, Url
from api.functions import get_data

logger = logging.getLogger(__name__)

app = FastAPI()


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"
    ],  # In production, replace with specific origins like ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TariffData(BaseModel):
    valid_from: datetime
    value_inc_vat: float


class ConsumptionData(BaseModel):
    interval_start: datetime
    consumption: float


@app.get("/tariff-data-today")
@async_cache
async def get_tariff_data_today() -> list[TariffData]:
    """Get agile tariff data for today (cached for 1 hour)"""
    today = datetime.today()
    start_datetime = datetime(today.year, today.month, today.day)
    end_datetime = datetime(today.year, today.month, today.day, 23, 59, 59)

    df = await get_data(
        f"{Url.REST_API}{Endpoint.STANDARD_UNIT_RATES}",
        start_datetime,
        end_datetime,
        Field.VALID_FROM,
        Field.VALUE,
    )
    return df.to_dicts()


@app.get("/tariff-data-today-and-tomorrow")
@async_cache
async def get_tariff_today_and_tomorrow() -> list[TariffData]:
    """Get agile tariff data from start of day onwards (cached for 1 hour)"""
    today = datetime.today()
    start_datetime = datetime(today.year, today.month, today.day)

    tomorrow = start_datetime + timedelta(days=1)
    end_datetime = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 23, 59, 59)

    df = await get_data(
        f"{Url.REST_API}{Endpoint.STANDARD_UNIT_RATES}",
        start_datetime,
        end_datetime,
        Field.VALID_FROM,
        Field.VALUE,
    )
    return df.to_dicts()


@app.get("/smart-meter-usage-historic")
@async_cache
async def get_smart_meter_usage_historic(
    start_datetime: datetime, end_datetime: datetime
) -> list[ConsumptionData]:
    """Get historic smart meter energy usage (cached for 1 hour)"""
    url = f"https://api.octopus.energy/v1/electricity-meter-points/{Identifier.MPAN}/meters/{Identifier.SERIAL_NUMBER}/consumption/"
    df = await get_data(url, start_datetime, end_datetime, Field.INTERVAL_START, Field.CONSUMPTION)
    return df.to_dicts()


@app.get("/smart-meter-usage-live")
async def get_smart_meter_usage_live() -> list[ConsumptionData]:
    """Get live Octopus Energy smart meter usage using graphql (requires home mini) - NOT CACHED"""
    service = await GraphqlRequest.create()
    data = await service.fetch_live_usage("1234")

    df = pl.DataFrame(data["results"]).lazy()

    today = datetime.today()
    start_of_day = datetime(today.year, today.month, 2)

    df = (
        df.with_columns(
            pl.col(Field.INTERVAL_START)
            .str.to_datetime("%Y-%m-%dT%H:%M:%SZ")
            .alias(Field.INTERVAL_START_DATE)
        )
        .filter(pl.col(Field.INTERVAL_START_DATE) > start_of_day)
        .select([Field.INTERVAL_START, Field.CONSUMPTION])
        .collect()
    )

    return df.to_dicts()


@app.post("/cache/clear")
async def clear_cache_endpoint():
    """Clear all cached data"""
    clear_cache()
    logger.info("Cache cleared via API endpoint")
    return {"message": "Cache cleared successfully"}


@app.get("/cache/info")
async def cache_info_endpoint():
    """Get information about the current cache state"""
    info = get_cache_info()
    logger.info(f"Cache info requested: {info['size']} items cached")
    return info
