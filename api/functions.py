from datetime import datetime
from api.async_request import RestRequest
from api.constants import Url, Endpoint, Field
import polars as pl

async def get_tariff_data(start_datetime: datetime, end_datetime: datetime) -> pl.DataFrame:
    """ Get Octopus Energy Agile tariff data """
    urls = [f"{Url.REST_API}{Endpoint.STANDARD_UNIT_RATES}?page={i}" for i in range(1, 3)]
    data_batches = await RestRequest().fetch_lazy_async(urls)

    lazy_frames = [pl.DataFrame(batch["results"]).lazy() for batch in data_batches]

    return (
        pl.concat(lazy_frames)
            .with_columns(pl.col(Field.VALID_FROM).str.to_datetime("%Y-%m-%dT%H:%M:%SZ").alias(Field.VALID_FROM))
            .filter((pl.col(Field.VALID_FROM) > start_datetime) &
                    (pl.col(Field.VALID_FROM) < end_datetime))
            .select([Field.VALID_FROM, Field.VALUE])
            .collect()
    )
