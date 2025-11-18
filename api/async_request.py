import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Self

import aiohttp

from api.constants import Identifier, Url, UsageGrouping

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@dataclass
class Token:
    value: str
    expiry: datetime
    refreshValue: str
    refreshExpiry: datetime


class RestRequest:
    async def fetch_results(self, urls: list[str]) -> list[dict[str, Any]]:
        """Fetch multiple API requests asynchronously"""
        auth = aiohttp.BasicAuth(Identifier.API_KEY, "")

        async with aiohttp.ClientSession(auth=auth) as session:
            results = await asyncio.gather(*[self.fetch_page(session, url) for url in urls])
            return results

    async def fetch_page(self, session: aiohttp.ClientSession, url: str) -> Any:
        async with session.get(url) as response:
            logger.info(f"Fetching data from {url}")
            return await response.json()


class GraphqlRequest:
    async def __init__(self):
        self.token: Token | None = None

    @classmethod
    async def create(cls) -> Self:
        self = cls()  # func-returns-value: ignore
        self.token = await self._set_token()
        return self

    @staticmethod
    async def _set_token() -> Token:
        try:
            auth = aiohttp.BasicAuth(Identifier.API_KEY, "")

            async with aiohttp.ClientSession(auth=auth) as session:
                query = """
                    mutation krakenTokenAuthentication($api: String!) {
                    obtainKrakenToken(input: {APIKey: $api}) {
                        token
                        expiresIn
                        refreshToken
                        refreshExpiresIn
                    }
                }
                """
                variables = {"api": Identifier.API_KEY}
                async with session.post(
                    Url.GRAPHQL_API, json={"query": query, "variables": variables}
                ) as response:
                    json = await response.json()
        except Exception as err:
            logger.error(f"Error: {err}")
            json = {}

        return Token(
            json.get("data", {}).get("obtainKrakenToken", {}).get("token"),
            json.get("data", {}).get("obtainKrakenToken", {}).get("expiresIn"),
            json.get("data", {}).get("obtainKrakenToken", {}).get("refreshToken"),
            json.get("data", {}).get("obtainKrakenToken", {}).get("refreshExpiresIn"),
        )

    async def fetch_live_usage(self, account_number: str) -> Any:
        """Fetch multiple API endpoints asynchronously"""
        if self.token is None:
            return {}

        headers = {"Authorization": self.token.value}
        async with aiohttp.ClientSession(headers=headers) as session:
            try:
                query = f"""
                    smartMeterTelemetry(
                    deviceId: "00-11-22-33-44-55-66-77"
                    grouping: {UsageGrouping.HALF_HOURLY}
                        start: "2023-10-05T00:00Z"
                        end: "2023-10-06T00:00Z"
                    ) {{
                    readAt
                        consumptionDelta
                    demand
                    }}
                """

                variables = {"input": account_number}
                async with session.post(
                    Url.GRAPHQL_API,
                    json={"query": query, "variables": variables, "operationName": "getData"},
                ) as response:
                    return await response.json()
            except Exception as err:
                logger.error(f"Error: {err}")
                return {}
