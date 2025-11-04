from enum import StrEnum
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Url(StrEnum):
    GRAPHQL_API = "https://api.octopus.energy/v1/graphql/"
    REST_API = "https://api.octopus.energy/v1/"


class Endpoint(StrEnum):
    STANDARD_UNIT_RATES = "products/AGILE-24-10-01/electricity-tariffs/E-1R-AGILE-24-10-01-J/standard-unit-rates/"


class Identifier(StrEnum):
    MPAN = os.getenv("MPAN")
    SERIAL_NUMBER = os.getenv("SERIAL_NUMBER")
    API_KEY = os.getenv("OCTOPUS_API_KEY")


class Field(StrEnum):
    CONSUMPTION = "consumption"
    INTERVAL_START = "interval_start"
    INTERVAL_START_DATE = "interval_start_dt"
    VALID_FROM = "valid_from"
    VALUE = "value_inc_vat"


class UsageGrouping(StrEnum):
    HALF_HOURLY = "HALF_HOURLY"
