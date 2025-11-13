import os
from enum import StrEnum

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

PAGE_SIZE = 1500
SECONDS_IN_HOUR = 3600


class Url(StrEnum):
    GRAPHQL_API = "https://api.octopus.energy/v1/graphql/"
    REST_API = "https://api.octopus.energy/v1/"


class Tariff(StrEnum):
    SOUTH_EAST = "E-1R-AGILE-24-10-01-J"


class Product(StrEnum):
    AGILE_24_10_01 = "AGILE-24-10-01"


class Identifier(StrEnum):
    MPAN = os.getenv("MPAN", "")
    SERIAL_NUMBER = os.getenv("SERIAL_NUMBER", "")
    API_KEY = os.getenv("OCTOPUS_API_KEY", "")


class Field(StrEnum):
    CONSUMPTION = "consumption"
    INTERVAL_START = "interval_start"
    VALID_FROM = "valid_from"
    VALUE = "value_inc_vat"


class UsageGrouping(StrEnum):
    HALF_HOURLY = "HALF_HOURLY"
