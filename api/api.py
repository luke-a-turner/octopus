from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.async_request import RestRequest, GraphqlRequest
from api.constants import Identifier, Field
from api.functions import get_tariff_data
import polars as pl
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI()


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins like ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/tariff-data-today")
async def get_tariff_data_today():
    """ Get Octopus Energy Agile tariff data for today """
    today = datetime.today()
    start_of_day = datetime(today.year, today.month, today.day)
    end_of_day = datetime(today.year, today.month, today.day, 23, 59, 59)

    df = await get_tariff_data(start_of_day, end_of_day)
    return df.to_dicts()


@app.get("/tariff-data-today-and-tomorrow")
async def get_tariff_today_and_tomorrow():
    """ Get Octopus Energy Agile tariff data from start of day onwards """
    today = datetime.today()
    start_of_day = datetime(today.year, today.month, today.day)
    end_of_day = datetime(today.year, today.month, today.day + 1, 23, 59, 59)

    df = await get_tariff_data(start_of_day, end_of_day)
    return df.to_dicts()


@app.get("/smart-meter-usage-historic")
async def get_smart_meter_usage_historic():
    """Get Octopus Energy smart meter energy usage """
    # todo: pass date to the endpoint
    # todo: cache results

    logger.info(f"Fetching smart meter usage for MPAN: {Identifier.MPAN}, Serial: {Identifier.SERIAL_NUMBER}")

    urls = [f"https://api.octopus.energy/v1/electricity-meter-points/{Identifier.MPAN}/meters/{Identifier.SERIAL_NUMBER}/consumption/?page={i}" for i in range(1, 3)]
    data_batches = await RestRequest().fetch_lazy_async(urls)

    lazy_frames = [pl.DataFrame(batch["results"]).lazy() for batch in data_batches]
    logger.info(f"Created {len(lazy_frames)} dataframes from batches")

    today = datetime.today()
    start_of_day = datetime(today.year, today.month, 2)
    logger.info(f"Filtering data from start of day: {start_of_day}")

    df = (pl.concat(lazy_frames)
              .with_columns(pl.col(Field.INTERVAL_START).str.to_datetime("%Y-%m-%dT%H:%M:%SZ").alias(Field.INTERVAL_START_DATE))
              .filter(pl.col(Field.INTERVAL_START_DATE) > start_of_day)
              .select([Field.INTERVAL_START, Field.CONSUMPTION])
              .collect())

    logger.info(f"Filtered to {len(df)} records for today")
    logger.info(f"Total consumption today: {df[Field.CONSUMPTION].sum():.3f} kWh")

    return df.to_dicts()


@app.get("/smart-meter-usage-live")
async def get_smart_meter_usage_live():
    """ Get live Octopus Energy smart meter usage using graphql (requires home mini) """
    logger.info(f"Fetching smart meter usage for MPAN: {Identifier.MPAN}, Serial: {Identifier.SERIAL_NUMBER}")

    service = await GraphqlRequest.create()
    data = await service.fetch_live_usage('1234')

    df = pl.DataFrame(data["results"]).lazy()
    logger.info(f"Created dataframe with {len(df)} results")

    today = datetime.today()
    start_of_day = datetime(today.year, today.month, 2)
    logger.info(f"Filtering data from start of day: {start_of_day}")

    df = (df.with_columns(pl.col(Field.INTERVAL_START).str.to_datetime("%Y-%m-%dT%H:%M:%SZ").alias(Field.INTERVAL_START_DATE))
            .filter(pl.col(Field.INTERVAL_START_DATE) > start_of_day)
            .select([Field.INTERVAL_START, Field.CONSUMPTION])
            .collect()
          )

    logger.info(f"Filtered to {len(df)} records")
    logger.info(f"Total consumption today: {df[Field.CONSUMPTION].sum():.3f} kWh")

    return df.to_dicts()
